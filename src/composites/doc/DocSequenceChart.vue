<script setup lang="ts">
/**
 * 原生时序图（Mermaid `sequenceDiagram` 的渲染端）——**图表，不是画布**。
 *
 * 与 `DocFlowCanvas` 的分工：流程图是"可缩放/可拖拽的探索视图"，所以它有视口；
 * 时序图是"按顺序读一遍的叙事"，缩放/平移对它没有意义——读者要的是**整张图在
 * 正文宽度里一次看全**。所以：
 *
 * - 宽度跟随容器（`useContainerWidth`），参与者列按可用宽度均分；
 * - 高度由内容决定（消息多则图高），不设固定视口；
 * - 没有缩放控件、没有网格——它是一张图，不是一个工作区。
 *
 * 文字是 DOM（要跟随主题字号与字体栈），SVG 只画线：生命线 / 消息 / 激活条 / 分组框。
 */
import { computed, ref } from 'vue'
import { generateId } from '@/utils'
import type { SequenceGraph, SequenceMessage } from './mermaid-sequence'
import { useContainerWidth } from './useContainerWidth'

export interface DocSequenceChartProps {
  graph: SequenceGraph
  /** 图例标题（可选，渲染在图上方） */
  title?: string
}

const props = defineProps<DocSequenceChartProps>()

/** 三个 marker 的 id 必须实例唯一：全局 id 冲突时先卸载的图会把后者的箭头带走。 */
const markerId = generateId('nm-seq')

// ── 几何常量（像素值放 TS：它们是布局求解的输入，不是设计 token）──
const PAD_X = 24
const HEAD_H = 40
const HEAD_TOP = 12
const ROW_MESSAGE = 34
const ROW_SELF = 52
const ROW_NOTE = 46
const BLOCK_INSET = 26
const BOTTOM_TAIL = 28
const COL_MIN_W = 104
const COL_GAP = 32
const COL_MAX_W = 220
const ACT_W = 10
const STAGE_MIN_W = 360
const FONT_PX = 13

const stageRef = ref<HTMLElement | null>(null)
const { width: containerWidth } = useContainerWidth(stageRef, { minWidth: STAGE_MIN_W })

/** 文本宽度估算（中日韩按 1em、西文按 0.55em；只求"不挤"，不求精确排版）。 */
function estimateWidth(text: string, fontSize = FONT_PX): number {
  let width = 0
  for (const ch of text) {
    width += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? fontSize : fontSize * 0.55
  }
  return width
}

interface SeqColumn {
  id: string
  label: string
  actor: boolean
  x: number
  width: number
}

interface SeqMessageRow {
  key: number
  message: SequenceMessage
  path: string
  labelX: number
  labelY: number
}

interface SeqNoteBox {
  key: number
  label: string
  x: number
  y: number
  w: number
  h: number
}

interface SeqFrame {
  key: number
  label: string
  y: number
  h: number
  splits: { label: string; y: number }[]
}

interface SeqActivation {
  key: string
  x: number
  y: number
  h: number
}

const layout = computed(() => {
  const actors = props.graph.actors
  const available = containerWidth.value

  // 列宽：先看"能均分多少"，再夹到 [COL_MIN_W, COL_MAX_W]。
  // 少量参与者 → 列宽封顶，图不虚胖；多参与者 → 落到 COL_MIN_W 并横向滚动。
  const count = Math.max(1, actors.length)
  const even = (available - PAD_X * 2 - COL_GAP * (count - 1)) / count
  const colWidth = Math.min(COL_MAX_W, Math.max(COL_MIN_W, Math.round(even)))
  const step = colWidth + COL_GAP

  const columns: SeqColumn[] = actors.map((actor, index) => ({
    id: actor.id,
    label: actor.label,
    actor: actor.kind === 'actor',
    x: PAD_X + colWidth / 2 + index * step,
    width: colWidth,
  }))
  const columnOf = new Map(columns.map(column => [column.id, column]))
  // 内容比容器宽时让舞台变宽（外层横向滚动），而不是把列压扁
  const width = Math.max(
    available,
    PAD_X * 2 + colWidth + Math.max(0, actors.length - 1) * step,
    colWidth + PAD_X * 2
  )

  const messages: SeqMessageRow[] = []
  const notes: SeqNoteBox[] = []
  const frames: SeqFrame[] = []
  const activations: SeqActivation[] = []
  /** 未闭合的激活：作者忘了 deactivate 时延伸到图底，而不是丢掉这段区间。 */
  const openActivations = new Map<string, number[]>()
  const frameStack: SeqFrame[] = []

  let cursor = HEAD_TOP + HEAD_H + BLOCK_INSET

  props.graph.items.forEach((item, index) => {
    switch (item.kind) {
      case 'message': {
        const h = item.self ? ROW_SELF : ROW_MESSAGE
        const from = columnOf.get(item.from)
        const to = columnOf.get(item.to)
        const midY = cursor + h / 2
        if (from && to) {
          if (item.self) {
            // 自消息：右出 → 下行 → 回左。零长箭头会被读成"没有这条消息"。
            const bulge = from.x + 40
            messages.push({
              key: index,
              message: item,
              path: `M ${from.x + 6},${midY - 11} L ${bulge},${midY - 11} L ${bulge},${midY + 11} L ${from.x + 6},${midY + 11}`,
              labelX: from.x + 52,
              labelY: midY - 8,
            })
          } else {
            messages.push({
              key: index,
              message: item,
              path: `M ${from.x},${midY} L ${to.x},${midY}`,
              labelX: (from.x + to.x) / 2,
              labelY: midY - 17,
            })
          }
        }
        cursor += h
        break
      }
      case 'note': {
        const anchors = item.actors
          .map(id => columnOf.get(id)?.x)
          .filter((x): x is number => x !== undefined)
        if (anchors.length > 0) {
          const boxW = Math.max(120, Math.min(240, estimateWidth(item.label) + 28))
          const first = anchors[0]
          const last = anchors[anchors.length - 1]
          let boxX = (first + last) / 2 - boxW / 2
          if (item.placement === 'left of') boxX = first - boxW - 12
          if (item.placement === 'right of') boxX = last + 12
          notes.push({
            key: index,
            label: item.label,
            // 备注框不越出舞台左右边界（左侧 note 撞墙会看不清）
            x: Math.min(Math.max(PAD_X / 3, boxX), Math.max(PAD_X / 3, width - boxW - PAD_X / 3)),
            y: cursor,
            w: boxW,
            h: ROW_NOTE - 10,
          })
        }
        cursor += ROW_NOTE
        break
      }
      case 'block': {
        const frame: SeqFrame = {
          key: index,
          label: item.label || item.block,
          y: cursor - 4,
          h: 0,
          splits: [],
        }
        frames.push(frame)
        frameStack.push(frame)
        break
      }
      case 'block-split': {
        const open = frameStack[frameStack.length - 1]
        if (open) open.splits.push({ label: item.label, y: cursor })
        break
      }
      case 'block-end': {
        const open = frameStack.pop()
        if (open) open.h = cursor - open.y - 4
        break
      }
      case 'activate': {
        const stack = openActivations.get(item.actor) ?? []
        stack.push(cursor)
        openActivations.set(item.actor, stack)
        break
      }
      case 'deactivate': {
        const stack = openActivations.get(item.actor) ?? []
        const start = stack.pop()
        const column = columnOf.get(item.actor)
        if (start !== undefined && column) {
          activations.push({
            key: `${item.actor}-${start}`,
            x: column.x - ACT_W / 2,
            y: start,
            h: Math.max(14, cursor - start),
          })
        }
        break
      }
    }
  })

  const lifelineBottom = cursor + 4
  for (const [actor, stack] of openActivations) {
    const column = columnOf.get(actor)
    for (const start of stack) {
      if (column) {
        activations.push({
          key: `${actor}-${start}-open`,
          x: column.x - ACT_W / 2,
          y: start,
          h: Math.max(14, lifelineBottom - start),
        })
      }
    }
  }

  return {
    columns,
    messages,
    notes,
    frames,
    activations,
    width,
    height: cursor + BOTTOM_TAIL,
    headY: HEAD_TOP,
    lifelineTop: HEAD_TOP + HEAD_H,
    lifelineBottom,
    scrollable: width > available,
  }
})

/** 端点形状与线型正交：marker 只管端点，虚线由 class 负责。 */
function markerFor(item: SequenceMessage): string | undefined {
  switch (item.arrow) {
    case 'solid-arrow':
    case 'dashed-arrow':
      return `url(#${markerId}-arrow)`
    case 'solid-open':
    case 'dashed-open':
      return `url(#${markerId}-open)`
    case 'solid-cross':
    case 'dashed-cross':
      return `url(#${markerId}-cross)`
    default:
      return undefined
  }
}

function isDashed(item: SequenceMessage): boolean {
  return item.arrow.startsWith('dashed')
}
</script>

<template>
  <figure class="nm-seq">
    <figcaption v-if="title" class="nm-seq__title">{{ title }}</figcaption>

    <div ref="stageRef" class="nm-seq__scroll" :class="{ 'nm-seq__scroll--x': layout.scrollable }">
      <div
        class="nm-seq__stage"
        :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
      >
        <svg class="nm-seq__svg" :width="layout.width" :height="layout.height" aria-hidden="true">
          <defs>
            <marker
              :id="`${markerId}-arrow`"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path class="nm-seq__marker-fill" d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
            <marker
              :id="`${markerId}-open`"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path class="nm-seq__marker-open" d="M 0 0 L 10 5 L 0 10" />
            </marker>
            <marker
              :id="`${markerId}-cross`"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path class="nm-seq__marker-cross" d="M 0 0 L 10 10 M 10 0 L 0 10" />
            </marker>
          </defs>

          <!-- 生命线 -->
          <line
            v-for="column in layout.columns"
            :key="`life-${column.id}`"
            class="nm-seq__lifeline"
            :x1="column.x"
            :y1="layout.lifelineTop"
            :x2="column.x"
            :y2="layout.lifelineBottom"
          />

          <!-- 分组框（先画框，消息压在上面） -->
          <g v-for="frame in layout.frames" :key="`frame-${frame.key}`">
            <rect
              class="nm-seq__frame"
              x="6"
              :y="frame.y"
              :width="layout.width - 12"
              :height="frame.h"
              rx="8"
            />
            <path
              class="nm-seq__frame-tab"
              :d="`M 6,${frame.y + 10} a 8,8 0 0 1 8,-8 l 132,0 l 0,20 l -132,0 a 8,8 0 0 1 -8,-8 z`"
            />
            <line
              v-for="(split, index) in frame.splits"
              :key="`split-${frame.key}-${index}`"
              class="nm-seq__frame-split"
              x1="6"
              :y1="split.y"
              :x2="layout.width - 6"
              :y2="split.y"
            />
          </g>

          <!-- 消息 -->
          <path
            v-for="row in layout.messages"
            :key="`msg-${row.key}`"
            class="nm-seq__message"
            :class="{ 'nm-seq__message--dashed': isDashed(row.message) }"
            :d="row.path"
            :marker-end="markerFor(row.message)"
          />

          <!-- 激活条 -->
          <rect
            v-for="activation in layout.activations"
            :key="`act-${activation.key}`"
            class="nm-seq__activation"
            :x="activation.x"
            :y="activation.y"
            :width="ACT_W"
            :height="activation.h"
            rx="3"
          />
        </svg>

        <!-- 参与者头 -->
        <div
          v-for="column in layout.columns"
          :key="`head-${column.id}`"
          class="nm-seq__head"
          :class="{ 'nm-seq__head--actor': column.actor }"
          :style="{
            left: `${column.x - column.width / 2}px`,
            top: `${layout.headY}px`,
            width: `${column.width}px`,
            height: `${HEAD_H}px`,
          }"
        >
          {{ column.label }}
        </div>

        <!-- 分组标签与分隔线标签 -->
        <template v-for="frame in layout.frames" :key="`flabel-${frame.key}`">
          <div class="nm-seq__frame-label" :style="{ left: '20px', top: `${frame.y + 4}px` }">
            {{ frame.label }}
          </div>
          <div
            v-for="(split, index) in frame.splits"
            :key="`slabel-${frame.key}-${index}`"
            class="nm-seq__split-label"
            :style="{ left: '20px', top: `${split.y + 2}px` }"
          >
            [{{ split.label }}]
          </div>
        </template>

        <!-- 消息文本 -->
        <div
          v-for="row in layout.messages.filter(r => r.message.label)"
          :key="`mlabel-${row.key}`"
          class="nm-seq__message-label"
          :class="{ 'nm-seq__message-label--self': row.message.self }"
          :style="{ left: `${row.labelX}px`, top: `${row.labelY}px` }"
        >
          <span v-if="row.message.number" class="nm-seq__number">{{ row.message.number }}</span>
          {{ row.message.label }}
        </div>

        <!-- 备注 -->
        <div
          v-for="note in layout.notes"
          :key="`note-${note.key}`"
          class="nm-seq__note"
          :style="{
            left: `${note.x}px`,
            top: `${note.y + 2}px`,
            width: `${note.w}px`,
            height: `${note.h}px`,
          }"
        >
          {{ note.label }}
        </div>
      </div>
    </div>
  </figure>
</template>

<style scoped lang="scss">
// 外框/内边距属于宿主（MarkdownRenderer 的 `.mermaid-diagram[data-mermaid-state='done']`）：
// 三张图共用一个框，独立使用时也只是一张干净的图。
.nm-seq {
  margin: 0;
}

.nm-seq__title {
  margin-bottom: var(--nm-spacing-sm);
  font-size: var(--nm-font-sm);
  font-weight: var(--nm-font-weight-semibold);
  color: var(--nm-text-secondary);
}

.nm-seq__scroll {
  width: 100%;
  overflow: hidden;

  // 列数过多时横向滚动：宁可滚动，也不把文字压成竖排
  &--x {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }
}

.nm-seq__stage {
  position: relative;
  margin: 0 auto;
}

.nm-seq__svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.nm-seq__lifeline {
  stroke: var(--nm-text-secondary);
  stroke-width: 1.2;
  stroke-dasharray: 5 5;
  opacity: 0.45;
}

.nm-seq__message {
  fill: none;
  stroke: var(--nm-text-primary);
  stroke-width: 1.5;

  &--dashed {
    stroke-dasharray: 6 4;
  }
}

.nm-seq__marker-fill {
  fill: var(--nm-text-primary);
}

.nm-seq__marker-open {
  fill: none;
  stroke: var(--nm-text-primary);
  stroke-width: 1.6;
}

.nm-seq__marker-cross {
  fill: none;
  stroke: var(--nm-text-primary);
  stroke-width: 1.8;
}

.nm-seq__activation {
  fill: var(--nm-surface-raised);
  stroke: var(--nm-border-subtle);
  stroke-width: 1;
}

.nm-seq__frame {
  fill: none;
  stroke: var(--nm-border-subtle);
  stroke-width: 1.2;
  stroke-dasharray: 8 6;
}

.nm-seq__frame-tab {
  fill: var(--nm-surface-raised);
  stroke: var(--nm-border-subtle);
  stroke-width: 1;
}

.nm-seq__frame-split {
  stroke: var(--nm-border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.nm-seq__frame-label,
.nm-seq__split-label {
  position: absolute;
  font-size: var(--nm-font-xs);
  color: var(--nm-text-secondary);
  font-weight: var(--nm-font-weight-semibold);
  pointer-events: none;
}

.nm-seq__head {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--nm-spacing-12);
  box-sizing: border-box;
  font-size: var(--nm-font-sm);
  font-weight: var(--nm-font-weight-semibold);
  color: var(--nm-text-primary);
  background-color: var(--nm-surface-raised);
  border-radius: var(--nm-border-radius-md);
  box-shadow:
    2px 2px 5px var(--nm-shadow-dark),
    -2px -2px 5px var(--nm-shadow-light);

  &--actor {
    border-bottom: 2px solid var(--nm-primary-color);
  }
}

.nm-seq__message-label {
  position: absolute;
  transform: translate(-50%, 0);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-primary);
  white-space: nowrap;
  pointer-events: none;

  &--self {
    transform: translate(0, 0);
  }
}

.nm-seq__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  margin-right: var(--nm-spacing-xs);
  padding: 0 var(--nm-spacing-2xs);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-on-primary);
  background-color: var(--nm-primary-color);
  border-radius: var(--nm-border-radius-full);
}

.nm-seq__note {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 var(--nm-spacing-12);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-primary);
  background-color: var(--nm-surface-raised);
  border-left: 3px solid var(--nm-primary-color);
  border-radius: var(--nm-border-radius-sm);
  overflow: hidden;
}
</style>
