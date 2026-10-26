<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

interface FlowNode {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  /** 圆角 = 起止端点，矩形 = 处理步骤（菱形节点也用矩形画，避免模板里再算多边形） */
  type: 'rounded' | 'rect' | 'diamond'
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

// ---- 配置台状态 ----
const canvasZoom = ref(1)
const canvasShowGrid = ref(true)
const canvasGridVariant = ref<'dots' | 'lines'>('dots')
const canvasGridSize = ref(20)
const canvasMinZoom = ref(0.25)
const canvasMaxZoom = ref(3)
const canvasHeight = ref(480)

const gridVariantOptions = [
  { label: '点状', value: 'dots' },
  { label: '线条', value: 'lines' },
]

// ---- 流程图示例数据（原卡片那张图的节点 / 连线，坐标即画布坐标） ----
const flowNodes: FlowNode[] = [
  { id: 'start', x: 180, y: 30, w: 100, h: 36, label: '开始', type: 'rounded' },
  { id: 'check', x: 180, y: 110, w: 100, h: 60, label: '条件判断?', type: 'diamond' },
  { id: 'action1', x: 50, y: 220, w: 120, h: 36, label: '处理分支 A', type: 'rect' },
  { id: 'action2', x: 260, y: 220, w: 120, h: 36, label: '处理分支 B', type: 'rect' },
  { id: 'merge', x: 180, y: 310, w: 100, h: 36, label: '合并', type: 'rect' },
  { id: 'end', x: 180, y: 400, w: 100, h: 36, label: '结束', type: 'rounded' },
]

const flowEdges: FlowEdge[] = [
  { from: 'start', to: 'check' },
  { from: 'check', to: 'action1', label: '是' },
  { from: 'check', to: 'action2', label: '否' },
  { from: 'action1', to: 'merge' },
  { from: 'action2', to: 'merge' },
  { from: 'merge', to: 'end' },
]

/** 按 id 取节点：模板里每条边都查两次，抽出来省得写一长串流程 */
function nodeOf(id: string): FlowNode {
  return flowNodes.find(node => node.id === id)!
}

/** 贝塞尔连线：从源节点底边中点垂到目标节点顶边中点，控制点取同一水平中线 */
function calcEdgePath(from: FlowNode, to: FlowNode, _label?: string) {
  const x1 = from.x + from.w / 2
  const y1 = from.y + from.h
  const x2 = to.x + to.w / 2
  const y2 = to.y
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

/**
 * 边标签锚点：两节点横向中心的中点再右移 14px，落在连线外侧、不压线。
 * 预先算好（flowEdges 是静态数据），免得模板里每条边重复 find 四次。
 */
const flowEdgeLabels = flowEdges
  .filter(edge => edge.label)
  .map(edge => {
    const from = nodeOf(edge.from)
    const to = nodeOf(edge.to)
    return {
      key: `${edge.from}-${edge.to}`,
      label: edge.label as string,
      x: (from.x + from.w / 2 + to.x + to.w / 2) / 2 + 14,
      y: (from.y + from.h + to.y) / 2,
    }
  })

function reset() {
  canvasZoom.value = 1
  canvasShowGrid.value = true
  canvasGridVariant.value = 'dots'
  canvasGridSize.value = 20
  canvasMinZoom.value = 0.25
  canvasMaxZoom.value = 3
  canvasHeight.value = 480
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="zoom"', `height="${canvasHeight.value}px"`]
  if (!canvasShowGrid.value) attrs.push(':show-grid="false"')
  if (canvasGridVariant.value !== 'dots') attrs.push(`grid-variant="${canvasGridVariant.value}"`)
  if (canvasGridSize.value !== 20) attrs.push(`:grid-size="${canvasGridSize.value}"`)
  if (canvasMinZoom.value !== 0.1) attrs.push(`:min-zoom="${canvasMinZoom.value}"`)
  if (canvasMaxZoom.value !== 5) attrs.push(`:max-zoom="${canvasMaxZoom.value}"`)
  const open = `<NeumorphismCanvas ${attrs.join(' ')}>`
  const body = `
  <!-- 画布内容：任意 SVG / HTML；拖拽平移、Ctrl/⌘+滚轮缩放、方向键平移、+/-/0 缩放由组件接管 -->
  <svg width="440" height="460">…</svg>
</NeumorphismCanvas>`
  return `${open}${body}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">SVG 流程图示例（拖拽平移、Ctrl/⌘+滚轮缩放，方向键平移，+/-/0 缩放）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <div style="width: 100%">
        <div class="demo-row" style="margin-bottom: 10px">
          <NeumorphismButton size="small" @click="canvasShowGrid = !canvasShowGrid">
            {{ canvasShowGrid ? '隐藏网格' : '显示网格' }}
          </NeumorphismButton>
          <NeumorphismButton
            size="small"
            @click="canvasGridVariant = canvasGridVariant === 'dots' ? 'lines' : 'dots'"
          >
            {{ canvasGridVariant === 'dots' ? '线条网格' : '点状网格' }}
          </NeumorphismButton>
          <NeumorphismButton size="small" @click="canvasZoom = 1">重置缩放</NeumorphismButton>
        </div>

        <NeumorphismCanvas
          v-model="canvasZoom"
          :show-grid="canvasShowGrid"
          :grid-variant="canvasGridVariant"
          :grid-size="canvasGridSize"
          :min-zoom="canvasMinZoom"
          :max-zoom="canvasMaxZoom"
          :height="`${canvasHeight}px`"
        >
          <!-- Simple SVG flowchart rendered inside canvas -->
          <svg :width="440" :height="460" style="display: block">
            <!-- Edges -->
            <path
              v-for="edge in flowEdges"
              :key="`${edge.from}-${edge.to}`"
              :d="calcEdgePath(nodeOf(edge.from), nodeOf(edge.to), edge.label)"
              fill="none"
              stroke="var(--nm-text-secondary)"
              stroke-width="1.5"
              marker-end="url(#arrowhead)"
            />
            <!-- Edge labels -->
            <text
              v-for="edge in flowEdgeLabels"
              :key="`label-${edge.key}`"
              :x="edge.x"
              :y="edge.y"
              fill="var(--nm-primary-color)"
              font-size="11"
            >
              {{ edge.label }}
            </text>

            <!-- Arrow marker -->
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="var(--nm-text-secondary)" />
              </marker>
            </defs>

            <!-- Nodes -->
            <g v-for="node in flowNodes" :key="node.id">
              <rect
                :x="node.x"
                :y="node.y"
                :width="node.w"
                :height="node.h"
                :rx="node.type === 'rounded' ? 18 : 8"
                fill="var(--nm-surface-raised)"
                stroke="var(--nm-primary-color)"
                stroke-width="2"
                filter="url(#nm-shadow)"
              />
              <text
                :x="node.x + node.w / 2"
                :y="node.y + node.h / 2"
                text-anchor="middle"
                dominant-baseline="central"
                fill="var(--nm-text-primary)"
                font-size="12"
              >
                {{ node.label }}
              </text>
            </g>

            <!-- Drop shadow filter -->
            <filter id="nm-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="var(--nm-shadow-dark)" />
            </filter>
          </svg>
        </NeumorphismCanvas>
      </div>

      <template #spec>
        zoom=<b>{{ Math.round(canvasZoom * 100) }}%</b> · grid=<b>{{ canvasShowGrid }}</b> ·
        variant=<b>{{ canvasGridVariant }}</b> · gridSize=<b>{{ canvasGridSize }}px</b> · zoom
        区间=<b>{{ canvasMinZoom }}–{{ canvasMaxZoom }}</b>
      </template>

      <template #hint>
        滚轮缩放要按住 <kbd>Ctrl</kbd>/<kbd>⌘</kbd>（否则留给页面滚动）；画布聚焦后方向键平移、
        <kbd>+</kbd>/<kbd>-</kbd> 缩放、<kbd>0</kbd> 回到 100%。网格是以画布坐标画在内容底下的，
        缩放时它会跟着内容一起放大缩小。
      </template>

      <template #config>
        <DemoField label="网格">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="canvasShowGrid" size="small" />
            <span>showGrid</span>
          </label>
        </DemoField>

        <DemoField label="网格样式">
          <NeumorphismSegmented
            v-model="canvasGridVariant"
            :options="gridVariantOptions"
            size="small"
          />
        </DemoField>

        <DemoField label="格距" :value="`${canvasGridSize}px`" grow>
          <NeumorphismSlider v-model="canvasGridSize" :min="10" :max="48" :step="2" size="small" />
        </DemoField>

        <!-- 两条滑块各自只覆盖 1 的一侧：minZoom ≤ 1 ≤ maxZoom，天然不会配出空的缩放区间 -->
        <DemoField label="最小缩放" :value="`${canvasMinZoom}`" grow>
          <NeumorphismSlider
            v-model="canvasMinZoom"
            :min="0.1"
            :max="1"
            :step="0.05"
            size="small"
          />
        </DemoField>

        <DemoField label="最大缩放" :value="`${canvasMaxZoom}`" grow>
          <NeumorphismSlider v-model="canvasMaxZoom" :min="1" :max="5" :step="0.25" size="small" />
        </DemoField>

        <DemoField label="高度" :value="`${canvasHeight}px`" grow>
          <NeumorphismSlider v-model="canvasHeight" :min="240" :max="640" :step="20" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="canvasZoom = 1">
            重置缩放
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
