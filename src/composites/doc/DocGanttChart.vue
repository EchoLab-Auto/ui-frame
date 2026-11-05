<script setup lang="ts">
/**
 * 原生甘特图（Mermaid `gantt` 的渲染端）——**图表，不是画布**。
 *
 * 与 `DocFlowCanvas` 的分工：甘特图的价值是"一眼看清重叠与总长"，缩放会破坏
 * 这个比较（不同缩放比例下的条长不再可比）。所以：
 *
 * - 时间轴铺满容器宽度（`useContainerWidth`），条形长度由毫秒比例直接换算；
 * - 高度由内容决定（任务多则图高），不设固定视口；
 * - 没有缩放控件、没有网格——它是一张图，不是一个工作区。
 */
import { computed, ref } from 'vue'
import { formatGanttTick, type GanttGraph, type GanttTask } from './mermaid-gantt'
import { useContainerWidth } from './useContainerWidth'

export interface DocGanttChartProps {
  graph: GanttGraph
}

const props = defineProps<DocGanttChartProps>()

// ── 几何常量 ──
const PAD_X = 12
const AXIS_H = 32
const ROW_TASK = 30
const ROW_SECTION = 26
const LEFT_MIN_W = 120
const LEFT_MAX_W = 220
const AXIS_MIN_W = 260
const STAGE_MIN_W = 400
const FONT_PX = 13
const DAY = 86_400_000

const stageRef = ref<HTMLElement | null>(null)
const { width: containerWidth } = useContainerWidth(stageRef, { minWidth: STAGE_MIN_W })

function estimateWidth(text: string, fontSize = FONT_PX): number {
  let width = 0
  for (const ch of text) {
    width += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? fontSize : fontSize * 0.55
  }
  return width
}

/** 刻度步长：按总跨度选"人一眼能读懂"的单位，避免 90 个日刻度挤成一团。 */
function chooseStep(spanMs: number): { stepMs: number; align: 'hour' | 'day' | 'week' | 'month' } {
  if (spanMs <= 2 * DAY) return { stepMs: 6 * 3_600_000, align: 'hour' }
  if (spanMs <= 21 * DAY) return { stepMs: DAY, align: 'day' }
  if (spanMs <= 120 * DAY) return { stepMs: 7 * DAY, align: 'week' }
  return { stepMs: 30 * DAY, align: 'month' }
}

function alignDown(ms: number, align: 'hour' | 'day' | 'week' | 'month'): number {
  const d = new Date(ms)
  switch (align) {
    case 'hour':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())
    case 'day':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    case 'week': {
      const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      // 对齐到周一（UTC）：周一 = getUTCDay() 1
      return dayStart - ((d.getUTCDay() + 6) % 7) * DAY
    }
    case 'month':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  }
}

interface GanttBar {
  task: GanttTask
  x: number
  w: number
  y: number
  h: number
  milestone: boolean
}

interface GanttSectionRow {
  name: string
  y: number
  tasks: { task: GanttTask; y: number }[]
}

const layout = computed(() => {
  const graph = props.graph
  const available = containerWidth.value
  const allTasks = graph.sections.flatMap(section => section.tasks)

  // 左列宽：任务名宽度封顶，剩下的全留给时间轴（时间轴才是信息所在）
  const labelWidth = allTasks.reduce((max, task) => Math.max(max, estimateWidth(task.label)), 0)
  const leftWidth = Math.min(LEFT_MAX_W, Math.max(LEFT_MIN_W, Math.round(labelWidth + 40)))

  // 时间窗口：两端各留 2% 余量，零跨度（全是里程碑）时退化成一天窗口
  const rawSpan = graph.endMs - graph.startMs
  const span = rawSpan > 0 ? rawSpan : DAY
  const viewStart = graph.startMs - span * 0.02
  const viewEnd = (rawSpan > 0 ? graph.endMs : graph.startMs + DAY) + span * 0.02
  const viewSpan = Math.max(1, viewEnd - viewStart)

  const axisWidth = Math.max(AXIS_MIN_W, available - leftWidth - PAD_X)
  const timeToX = (ms: number) => leftWidth + ((ms - viewStart) / viewSpan) * axisWidth

  const rows: GanttSectionRow[] = []
  const bars: GanttBar[] = []
  let cursor = AXIS_H + 2

  for (const section of graph.sections) {
    const sectionRow: GanttSectionRow = { name: section.name, y: cursor, tasks: [] }
    rows.push(sectionRow)
    cursor += ROW_SECTION

    for (const task of section.tasks) {
      sectionRow.tasks.push({ task, y: cursor })
      const x = timeToX(task.startMs)
      const milestone = task.status === 'milestone' || task.endMs === task.startMs
      // 普通任务至少 6px：1 天的任务在季度视图里会缩成一条看不见的线
      const w = Math.max(milestone ? 14 : 6, timeToX(task.endMs) - x)
      bars.push({
        task,
        x: milestone ? x - 7 : x,
        w: milestone ? 14 : w,
        y: cursor,
        h: ROW_TASK,
        milestone,
      })
      cursor += ROW_TASK
    }
  }

  // 依赖线（`after`）：源条右端 → 目标条左端，L 形绕行
  const byId = new Map(bars.map(bar => [bar.task.id, bar]))
  const deps: { key: string; path: string }[] = []
  for (const bar of bars) {
    if (!bar.task.after) continue
    const from = byId.get(bar.task.after)
    if (!from) continue
    const x1 = from.milestone ? from.x + 7 : from.x + from.w
    const y1 = from.y + from.h / 2
    const x2 = bar.milestone ? bar.x + 7 : bar.x
    const y2 = bar.y + bar.h / 2
    const mid = x1 + 8
    deps.push({
      key: `${from.task.id}->${bar.task.id}`,
      path:
        x2 >= mid
          ? `M ${x1},${y1} L ${mid},${y1} L ${mid},${y2} L ${x2},${y2}`
          : `M ${x1},${y1} L ${x1 + 4},${y1} L ${x1 + 4},${y2 - 6} L ${x2 - 6},${y2 - 6} L ${x2 - 6},${y2} L ${x2},${y2}`,
    })
  }

  // 刻度
  const { stepMs, align } = chooseStep(viewSpan)
  const ticks: { x: number; label: string }[] = []
  for (let t = alignDown(viewStart, align); t <= viewEnd && ticks.length < 200; t += stepMs) {
    const x = timeToX(t)
    if (x < leftWidth - 1) continue
    ticks.push({ x, label: formatGanttTick(t, graph.axisFormat) })
  }

  const now = Date.now()
  const todayX = now >= viewStart && now <= viewEnd ? timeToX(now) : undefined

  return {
    leftWidth,
    ticks,
    rows,
    bars,
    deps,
    todayX,
    width: leftWidth + axisWidth + PAD_X,
    height: cursor + 12,
    axisY: AXIS_H,
    gridTop: AXIS_H,
    gridBottom: cursor - 2,
  }
})

function statusClass(task: GanttTask): string {
  return `nm-gantt__bar--${task.status}`
}
</script>

<template>
  <figure class="nm-gantt" :class="{ 'nm-gantt--titled': Boolean(graph.title) }">
    <figcaption v-if="graph.title" class="nm-gantt__title">{{ graph.title }}</figcaption>

    <div ref="stageRef" class="nm-gantt__scroll">
      <div
        class="nm-gantt__stage"
        :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
      >
        <svg class="nm-gantt__svg" :width="layout.width" :height="layout.height" aria-hidden="true">
          <line
            v-for="(tick, index) in layout.ticks"
            :key="`grid-${index}`"
            class="nm-gantt__grid"
            :x1="tick.x"
            :y1="layout.gridTop"
            :x2="tick.x"
            :y2="layout.gridBottom"
          />
          <line
            class="nm-gantt__axis"
            :x1="layout.leftWidth"
            :y1="layout.axisY"
            :x2="layout.width - PAD_X"
            :y2="layout.axisY"
          />
          <line
            v-if="layout.todayX !== undefined"
            class="nm-gantt__today"
            :x1="layout.todayX"
            :y1="layout.gridTop"
            :x2="layout.todayX"
            :y2="layout.gridBottom"
          />
          <path v-for="dep in layout.deps" :key="dep.key" class="nm-gantt__dep" :d="dep.path" />
        </svg>

        <!-- 刻度文字 -->
        <div
          v-for="(tick, index) in layout.ticks"
          :key="`tick-${index}`"
          class="nm-gantt__tick"
          :style="{ left: `${tick.x}px`, top: '8px' }"
        >
          {{ tick.label }}
        </div>

        <!-- 行：section 标题 + 任务名 -->
        <!-- key 用 row.y（cursor 单调递增，全局唯一）：不引入 v-for 的 index 变量，
             否则 vite-plugin-dts 的类型检查会误报 TS6133（模板作用域未被识别） -->
        <template v-for="row in layout.rows" :key="`row-${row.y}`">
          <div
            v-if="row.name"
            class="nm-gantt__section"
            :style="{ left: '4px', top: `${row.y}px`, width: `${layout.leftWidth - 8}px` }"
          >
            {{ row.name }}
          </div>
          <div
            v-for="entry in row.tasks"
            :key="`task-${entry.task.id}`"
            class="nm-gantt__task-label"
            :style="{
              left: '12px',
              top: `${entry.y}px`,
              width: `${layout.leftWidth - 18}px`,
              height: `${ROW_TASK}px`,
            }"
          >
            {{ entry.task.label }}
          </div>
        </template>

        <!-- 条形 / 里程碑 -->
        <div
          v-for="bar in layout.bars"
          :key="`bar-${bar.task.id}`"
          class="nm-gantt__bar"
          :class="[statusClass(bar.task), { 'nm-gantt__bar--milestone': bar.milestone }]"
          :style="{
            left: `${bar.x}px`,
            top: `${bar.y + 5}px`,
            width: `${bar.w}px`,
            height: `${bar.h - 10}px`,
          }"
        ></div>

        <!-- 里程碑标签在菱形右侧 -->
        <template v-for="bar in layout.bars" :key="`bar-label-${bar.task.id}`">
          <div
            v-if="bar.milestone"
            class="nm-gantt__milestone-label"
            :style="{ left: `${bar.x + 16}px`, top: `${bar.y + bar.h / 2}px` }"
          >
            {{ bar.task.label }}
          </div>
        </template>
      </div>
    </div>
  </figure>
</template>

<style scoped lang="scss">
// 外框/内边距属于宿主（MarkdownRenderer 的 `.mermaid-diagram[data-mermaid-state='done']`）：
// 三张图共用一个框，独立使用时也只是一张干净的图。
.nm-gantt {
  margin: 0;
}

.nm-gantt__title {
  margin-bottom: var(--nm-spacing-sm);
  font-size: var(--nm-font-sm);
  font-weight: var(--nm-font-weight-semibold);
  color: var(--nm-text-secondary);
}

.nm-gantt__scroll {
  width: 100%;
  overflow: hidden;
}

.nm-gantt__stage {
  position: relative;
}

.nm-gantt__svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.nm-gantt__grid {
  stroke: var(--nm-border-subtle);
  stroke-width: 1;
  opacity: 0.55;
}

.nm-gantt__axis {
  stroke: var(--nm-text-secondary);
  stroke-width: 1.2;
  opacity: 0.45;
}

.nm-gantt__today {
  stroke: var(--nm-primary-color);
  stroke-width: 1.6;
  stroke-dasharray: 6 4;
  opacity: 0.75;
}

.nm-gantt__dep {
  fill: none;
  stroke: var(--nm-text-secondary);
  stroke-width: 1.2;
  stroke-dasharray: 4 3;
  opacity: 0.65;
}

.nm-gantt__tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-secondary);
  white-space: nowrap;
  pointer-events: none;
}

.nm-gantt__section {
  position: absolute;
  display: flex;
  align-items: center;
  font-size: var(--nm-font-xs);
  font-weight: var(--nm-font-weight-semibold);
  color: var(--nm-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.nm-gantt__task-label {
  position: absolute;
  display: flex;
  align-items: center;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nm-gantt__bar {
  position: absolute;
  box-sizing: border-box;
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-raised);
  border: 1px solid var(--nm-border-subtle);
  box-shadow:
    1px 1px 3px var(--nm-shadow-dark),
    -1px -1px 3px var(--nm-shadow-light);

  // 已完成：压暗，"已划掉"的语义不靠颜色靠明度
  &--done {
    opacity: 0.5;
  }

  // 进行中：主色实心，焦点落在"现在正在干什么"
  &--active {
    background-color: var(--nm-primary-color);
    border-color: var(--nm-primary-dark);
  }

  // 关键路径：错误色描边，不填充——填充会把"时长"这个信息盖掉
  &--crit {
    border-color: var(--nm-color-error);
    border-width: 2px;
  }

  &--milestone {
    width: 14px;
    border-radius: var(--nm-border-radius-xs);
    transform: rotate(45deg);
    background-color: var(--nm-primary-color);
    border-color: var(--nm-primary-dark);
  }
}

.nm-gantt__milestone-label {
  position: absolute;
  transform: translateY(-50%);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-secondary);
  white-space: nowrap;
  pointer-events: none;
}
</style>
