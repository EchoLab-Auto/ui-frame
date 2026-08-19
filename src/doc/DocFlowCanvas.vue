<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import NeumorphismCanvas from '@/components/NeumorphismCanvas/NeumorphismCanvas.vue'
import { layoutProDocFlow } from './flow-layout'
import type { ProDocFlowGraph } from './types.js'

export interface DocFlowCanvasProps {
  /** 已解析的流程图（解析职责在调用方：flow-parser / flow-graph） */
  graph: ProDocFlowGraph
  /** 画布高度（CSS 值） */
  height?: string
  /** 是否显示点阵网格 */
  showGrid?: boolean
  /** 是否可拖拽编辑节点位置（松手时触发 nodeMove，由宿主持久化） */
  editable?: boolean
}

const props = withDefaults(defineProps<DocFlowCanvasProps>(), {
  height: '480px',
  showGrid: true,
  editable: false,
})

const emit = defineEmits<{
  /** 点击带文档链接的节点 */
  (e: 'navigate', path: string): void
  /** 拖拽松手：节点新坐标（画布 px，左上角） */
  (e: 'nodeMove', payload: { id: string; x: number; y: number }): void
}>()

const canvasRef = ref<InstanceType<typeof NeumorphismCanvas>>()

/** 拖拽预览中的节点位置（每帧全量重排代价极低：O(V+E)，边自动跟随） */
const dragPreview = ref<{ id: string; x: number; y: number } | null>(null)

const layout = computed(() => {
  const preview = dragPreview.value
  if (!preview) return layoutProDocFlow(props.graph)
  const nodes = props.graph.nodes.map(n =>
    n.id === preview.id ? { ...n, x: preview.x, y: preview.y } : n
  )
  return layoutProDocFlow({ ...props.graph, nodes })
})

/** 布局坐标 + 图节点信息合并（避免模板中重复 find） */
const layoutNodes = computed(() => {
  const info = new Map(props.graph.nodes.map(n => [n.id, n]))
  return [...layout.value.nodes.values()].map(p => ({
    ...p,
    shape: info.get(p.id)?.shape ?? 'rect',
    docPath: info.get(p.id)?.docPath,
    label: info.get(p.id)?.label ?? p.id,
  }))
})

const labeledEdges = computed(() => layout.value.edges.filter(e => e.label))

// 图形变化后重新适配视野。Canvas 以 ResizeObserver 异步测量自然尺寸，
// 仅 nextTick 时测量可能未就绪（fit 读到 0 尺寸静默失效）——
// 顺延到下一帧再 fit，确保 RO 已回写测量值
watch(
  layout,
  () => {
    nextTick(() => {
      requestAnimationFrame(() => canvasRef.value?.fit())
    })
  },
  { immediate: true }
)

function onNodeClick(docPath?: string): void {
  if (suppressClick) {
    suppressClick = false
    return
  }
  if (docPath) emit('navigate', docPath)
}

// ==========================================
// 节点拖拽（editable 时可用；阈值区分点击与拖拽，rAF 节流）
// ==========================================
const flowEl = ref<HTMLElement | null>(null)
const dragNode = ref<{
  id: string
  startClientX: number
  startClientY: number
  lastClientX: number
  lastClientY: number
  scale: number
  baseX: number
  baseY: number
  moved: boolean
  raf: number
} | null>(null)
let suppressClick = false

function onNodePointerdown(event: PointerEvent, node: { id: string; x: number; y: number }): void {
  if (!props.editable || event.button !== 0) return
  const rect = flowEl.value?.getBoundingClientRect()
  const scale = rect && layout.value.width > 0 ? rect.width / layout.value.width : 1
  dragNode.value = {
    id: node.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    scale: scale || 1,
    baseX: node.x,
    baseY: node.y,
    moved: false,
    raf: 0,
  }
  window.addEventListener('pointermove', onNodeDragMove)
  window.addEventListener('pointerup', onNodeDragEnd)
  window.addEventListener('pointercancel', onNodeDragEnd)
}

function onNodeDragMove(event: PointerEvent): void {
  const d = dragNode.value
  if (!d) return
  d.lastClientX = event.clientX
  d.lastClientY = event.clientY
  if (!d.raf) d.raf = requestAnimationFrame(applyNodeDrag)
}

function applyNodeDrag(): void {
  const d = dragNode.value
  if (!d) return
  d.raf = 0
  const dx = (d.lastClientX - d.startClientX) / d.scale
  const dy = (d.lastClientY - d.startClientY) / d.scale
  if (!d.moved && Math.hypot(dx, dy) < 3) return
  d.moved = true
  dragPreview.value = {
    id: d.id,
    x: Math.round(d.baseX + dx),
    y: Math.round(d.baseY + dy),
  }
}

function onNodeDragEnd(): void {
  window.removeEventListener('pointermove', onNodeDragMove)
  window.removeEventListener('pointerup', onNodeDragEnd)
  window.removeEventListener('pointercancel', onNodeDragEnd)
  const d = dragNode.value
  dragNode.value = null
  if (d?.raf) cancelAnimationFrame(d.raf)
  const preview = dragPreview.value
  dragPreview.value = null
  if (!d?.moved || !preview) return
  suppressClick = true
  emit('nodeMove', { id: d.id, x: preview.x, y: preview.y })
}

function onNodeKeydown(event: KeyboardEvent, docPath?: string): void {
  if (!docPath) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('navigate', docPath)
  }
}
</script>

<template>
  <div class="nm-flow-canvas">
    <NeumorphismCanvas
      ref="canvasRef"
      width="100%"
      :height="height"
      :show-grid="showGrid"
      grid-variant="dots"
      show-fit
      :min-zoom="0.25"
      :max-zoom="3"
    >
      <div
        ref="flowEl"
        class="nm-flow"
        :class="{ 'nm-flow--editable': editable }"
        :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
      >
        <!-- 边层（SVG，不接收指针事件，点击穿透到画布/节点） -->
        <svg
          class="nm-flow__edges"
          :width="layout.width"
          :height="layout.height"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="nm-flow-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" />
            </marker>
          </defs>
          <path
            v-for="(e, i) in layout.edges"
            :key="i"
            :d="e.path"
            class="nm-flow__edge"
            :class="{ 'nm-flow__edge--back': e.isBackEdge }"
            marker-end="url(#nm-flow-arrow)"
          />
        </svg>

        <!-- 边标签（HTML 便于使用主题 token） -->
        <div
          v-for="(e, i) in labeledEdges"
          :key="`label-${i}`"
          class="nm-flow__edge-label"
          :style="{ left: `${e.labelPos.x}px`, top: `${e.labelPos.y}px` }"
        >
          {{ e.label }}
        </div>

        <!-- 节点层：外层负责定位/交互/投影，内层负责形状与填充
             （菱形 clip-path 必须与 drop-shadow 分层 —— 同层时 clip 会把投影一并裁掉） -->
        <div
          v-for="n in layoutNodes"
          :key="n.id"
          class="nm-flow__node"
          :class="[`nm-flow__node--${n.shape}`, { 'nm-flow__node--link': n.docPath }]"
          :style="{
            left: `${n.x}px`,
            top: `${n.y}px`,
            width: `${n.w}px`,
            height: `${n.h}px`,
          }"
          :role="n.docPath ? 'link' : undefined"
          :tabindex="n.docPath ? 0 : undefined"
          :aria-label="n.docPath ? `${n.label}（跳转到文档）` : n.label"
          data-nm-no-pan
          @pointerdown="onNodePointerdown($event, n)"
          @click="onNodeClick(n.docPath)"
          @keydown="onNodeKeydown($event, n.docPath)"
        >
          <div class="nm-flow__node-inner">
            <span class="nm-flow__node-text">{{ n.label }}</span>
            <span v-if="n.docPath" class="nm-flow__node-link-icon" aria-hidden="true">↗</span>
          </div>
        </div>
      </div>
    </NeumorphismCanvas>
  </div>
</template>

<style scoped lang="scss">
.nm-flow-canvas {
  width: 100%;
}

.nm-flow {
  position: relative;
}

// 可编辑：节点可拖拽（拖拽时禁用悬停上浮与过渡，保证跟手）
.nm-flow--editable {
  .nm-flow__node {
    cursor: grab;
    touch-action: none;

    &:active {
      cursor: grabbing;
    }
  }
}

// ==========================================
// 边
// ==========================================
.nm-flow__edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.nm-flow__edge {
  fill: none;
  stroke: var(--nm-text-secondary);
  stroke-width: 1.6;
  opacity: 0.75;

  &--back {
    stroke-dasharray: 6 4;
    opacity: 0.55;
  }
}

#nm-flow-arrow path {
  fill: var(--nm-text-secondary);
}

.nm-flow__edge-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-secondary);
  background-color: var(--nm-surface-color);
  padding: 1px 8px;
  border-radius: var(--nm-border-radius-full);
  box-shadow:
    2px 2px 5px var(--nm-shadow-dark),
    -2px -2px 5px var(--nm-shadow-light);
  white-space: nowrap;
  pointer-events: none;
}

// ==========================================
// 节点（外层：定位/交互/投影；内层：形状/填充/浮雕）
// ==========================================
.nm-flow__node {
  position: absolute;
  color: var(--nm-text-primary);
  font-size: var(--nm-font-sm);
  font-weight: 500;
  text-align: center;
  user-select: none;
  cursor: default;
  transition:
    filter 0.25s ease,
    transform 0.25s ease;

  &--link {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: 2px solid var(--nm-primary-color);
      outline-offset: 2px;
    }
  }

  // 菱形：clip-path 在内层裁形，外层 drop-shadow 才能跟随裁后轮廓 ——
  // 同层时 clip-path 会把 drop-shadow 一并裁掉（渲染顺序 filter → clip）
  &--diamond {
    filter: drop-shadow(4px 4px 8px var(--nm-shadow-dark))
      drop-shadow(-4px -4px 8px var(--nm-shadow-light));

    &.nm-flow__node--link {
      filter: drop-shadow(4px 4px 8px var(--nm-shadow-dark))
        drop-shadow(-4px -4px 8px var(--nm-shadow-light))
        drop-shadow(0 0 6px color-mix(in srgb, var(--nm-primary-color) 35%, transparent));
    }

    .nm-flow__node-text {
      max-width: 62%;
    }
  }
}

.nm-flow__node-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 16px;
  box-sizing: border-box;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  box-shadow:
    4px 4px 8px var(--nm-shadow-dark),
    -4px -4px 8px var(--nm-shadow-light);
  transition: box-shadow 0.25s ease;

  .nm-flow__node--rounded & {
    border-radius: var(--nm-border-radius-lg);
  }

  .nm-flow__node--stadium & {
    border-radius: var(--nm-border-radius-full);
  }

  .nm-flow__node--diamond & {
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    border-radius: 0;
    box-shadow: none;
  }

  .nm-flow__node--link & {
    box-shadow:
      4px 4px 8px var(--nm-shadow-dark),
      -4px -4px 8px var(--nm-shadow-light),
      inset 3px 0 0 var(--nm-primary-color);
  }

  .nm-flow__node--link:hover & {
    box-shadow:
      6px 6px 12px var(--nm-shadow-dark),
      -6px -6px 12px var(--nm-shadow-light),
      inset 3px 0 0 var(--nm-primary-color),
      0 0 12px color-mix(in srgb, var(--nm-primary-color) 20%, transparent);
  }

  .nm-flow__node--diamond.nm-flow__node--link & {
    box-shadow: none;
  }
}

.nm-flow__node-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.nm-flow__node-link-icon {
  flex-shrink: 0;
  font-size: var(--nm-font-xs);
  color: var(--nm-primary-color);
}

@media (prefers-reduced-motion: reduce) {
  .nm-flow__node {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
