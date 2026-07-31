import { ref, computed, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export interface ChartInteractionSeries {
  name: string
  color?: string
  data: { value: number }[]
}

export interface ChartTooltipRow {
  name: string
  value: number
  color: string
}

export interface ChartTooltipState {
  visible: boolean
  x: number
  y: number
  content: string
  dataIndex: number
  seriesIndex: number
}

export interface UseChartInteractionOptions {
  /** 图表容器（读取 rect 定位 tooltip） */
  containerRef: Ref<HTMLElement | null>
  /** 是否启用交互（通常为 resolvedShowTooltip） */
  enabled: Ref<boolean>
  /** 绘图区左边距（坐标换算） */
  marginLeft: ComputedRef<number>
  /** 绘图区宽度（越界判定） */
  plotWidth: ComputedRef<number>
  /** 数据点 x 坐标序列（首个系列） */
  dataPointXs: ComputedRef<number[]>
  /** x 轴标签（tooltip 标题） */
  xAxisLabels: ComputedRef<string[]>
  /** 系列数据 */
  series: ComputedRef<ChartInteractionSeries[]>
  /** 调色板（系列色兜底） */
  palette: ComputedRef<string[]>
  /** 共享 tooltip 状态（来自 useChart） */
  tooltip: Ref<ChartTooltipState>
  /** 隐藏 tooltip（来自 useChart） */
  hideTooltip: () => void
}

export interface UseChartInteractionReturn {
  /** 十字线 x 坐标（null = 未悬停） */
  crosshairX: Ref<number | null>
  /** 最近数据点索引（-1 = 无） */
  nearestIndex: Ref<number>
  /** 是否悬停于绘图区 */
  isHovering: Ref<boolean>
  /** 结构化 tooltip 内容（模板插值渲染，杜绝 XSS） */
  tooltipData: Ref<{ header: string; rows: ChartTooltipRow[] } | null>
  /** tooltip 定位样式（相对容器） */
  tooltipStyle: ComputedRef<Record<string, string>>
  /** 容器 rect 快照（mousemove 时刷新，避免每次 tooltip 更新强制 reflow） */
  containerRect: Ref<{ left: number; top: number }>
  /** mousemove 处理（rAF 合帧） */
  onBodyMouseMove: (event: MouseEvent) => void
  /** mouseleave 处理 */
  onBodyMouseLeave: () => void
}

/**
 * 图表悬停交互（十字线/最近点/tooltip 载荷）—— rAF 合帧的 mousemove
 * 处理、最近索引扫描与结构化 tooltip 构建。组件层只绑定事件与渲染。
 */
export function useChartInteraction(opts: UseChartInteractionOptions): UseChartInteractionReturn {
  const {
    containerRef,
    enabled,
    marginLeft,
    plotWidth,
    dataPointXs,
    xAxisLabels,
    series,
    palette,
    tooltip,
    hideTooltip,
  } = opts

  const containerRect = ref({ left: 0, top: 0 })
  const tooltipData = ref<{ header: string; rows: ChartTooltipRow[] } | null>(null)

  const tooltipStyle = computed(() => {
    const style: Record<string, string> = {}
    if (!containerRef.value) {
      style.display = 'none'
      return style
    }
    style.left = `${tooltip.value.x - containerRect.value.left + 12}px`
    style.top = `${tooltip.value.y - containerRect.value.top - 8}px`
    return style
  })

  const crosshairX = ref<number | null>(null)
  const nearestIndex = ref<number>(-1)
  const isHovering = ref(false)

  function findNearestIndex(svgX: number): number {
    const xs = dataPointXs.value
    if (xs.length === 0) return -1
    let nearest = 0
    let minDist = Math.abs(svgX - xs[0])
    for (let i = 1; i < xs.length; i++) {
      const dist = Math.abs(svgX - xs[i])
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }
    return nearest
  }

  // Coalesce high-frequency mousemove events into a single calculation per
  // animation frame to avoid per-move reflow + O(n) scans.
  let pendingFrame: number | null = null
  let lastMoveEvent: MouseEvent | null = null

  function processMouseMove(event: MouseEvent): void {
    if (!containerRef.value || !enabled.value) return
    const rect = containerRef.value.getBoundingClientRect()
    containerRect.value = { left: rect.left, top: rect.top }
    const svgX = event.clientX - rect.left - marginLeft.value

    if (svgX < 0 || svgX > plotWidth.value) {
      clearHover()
      return
    }

    const idx = findNearestIndex(svgX)
    if (idx < 0) return

    isHovering.value = true
    nearestIndex.value = idx
    crosshairX.value = dataPointXs.value[idx] ?? svgX

    // Build a structured tooltip payload rendered via template interpolation.
    const header = xAxisLabels.value[idx] ?? `#${idx + 1}`
    const rows: ChartTooltipRow[] = []
    for (let si = 0; si < series.value.length; si++) {
      const s = series.value[si]
      const d = s.data[idx]
      if (d) {
        rows.push({
          name: s.name,
          value: d.value,
          color: s.color ?? palette.value[si % palette.value.length],
        })
      }
    }
    tooltipData.value = { header, rows }
    tooltip.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: '',
      dataIndex: idx,
      seriesIndex: 0,
    }
  }

  function clearHover() {
    crosshairX.value = null
    nearestIndex.value = -1
    isHovering.value = false
    tooltipData.value = null
    hideTooltip()
  }

  function onBodyMouseMove(event: MouseEvent): void {
    if (!enabled.value) return
    lastMoveEvent = event
    if (pendingFrame !== null) return
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null
      if (lastMoveEvent) processMouseMove(lastMoveEvent)
    })
  }

  function onBodyMouseLeave(): void {
    if (pendingFrame !== null) {
      cancelAnimationFrame(pendingFrame)
      pendingFrame = null
    }
    lastMoveEvent = null
    clearHover()
  }

  onBeforeUnmount(() => {
    if (pendingFrame !== null) {
      cancelAnimationFrame(pendingFrame)
      pendingFrame = null
    }
  })

  return {
    crosshairX,
    nearestIndex,
    isHovering,
    tooltipData,
    tooltipStyle,
    containerRect,
    onBodyMouseMove,
    onBodyMouseLeave,
  }
}

export default useChartInteraction
