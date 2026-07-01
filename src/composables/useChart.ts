import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type Ref,
  type ComputedRef,
} from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'

// ==========================================
// Shared Chart Types
// ==========================================

export interface ChartDataPoint {
  label?: string
  value: number
  color?: string
  [key: string]: unknown
}

/** OHLC (Open/High/Low/Close) data point for candlestick charts */
export interface OhlcDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  [key: string]: unknown
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
}

export interface ChartMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: string
  dataIndex: number
  seriesIndex: number
}

export interface UseChartOptions {
  /** Ref to the chart container element */
  containerRef: Ref<HTMLElement | null>
  /** Data series */
  series: Ref<ChartSeries[]> | ComputedRef<ChartSeries[]>
  /** Margin around the plot area (default: { top: 24, right: 24, bottom: 40, left: 48 }) */
  margin?: ChartMargin
  /** Show tooltip on hover (default: true) */
  showTooltip?: boolean
  /** Show legend (passed through to component) */
  showLegend?: boolean
  /** Enable animations (default: true) */
  animate?: boolean
}

const DEFAULT_MARGIN: ChartMargin = { top: 24, right: 24, bottom: 40, left: 48 }

const DEFAULT_COLOR_VARS = [
  '--nm-chart-color-1',
  '--nm-chart-color-2',
  '--nm-chart-color-3',
  '--nm-chart-color-4',
  '--nm-chart-color-5',
  '--nm-chart-color-6',
]

// ==========================================
// useChart — Shared chart composable (Layer 1)
// ==========================================

export function useChart(options: UseChartOptions) {
  const { containerRef, series, margin } = options

  const { config, resolveProp } = useNeumorphismSetup()

  // ---- Container size tracking ----
  const containerSize = ref<{ width: number; height: number }>({
    width: 400,
    height: 300,
  })

  let resizeObserver: ResizeObserver | null = null

  function readContainerSize(): void {
    if (!containerRef.value) return
    const el = containerRef.value
    // Use clientWidth/Height (padding-box) and subtract padding to get
    // content-box — matching ResizeObserver's contentRect behavior.
    const cs = getComputedStyle(el)
    const pl = parseFloat(cs.paddingLeft) || 0
    const pr = parseFloat(cs.paddingRight) || 0
    const pt = parseFloat(cs.paddingTop) || 0
    const pb = parseFloat(cs.paddingBottom) || 0
    const w = el.clientWidth - pl - pr
    const h = el.clientHeight - pt - pb
    if (w > 0 && h > 0) {
      containerSize.value = { width: w, height: h }
    }
  }

  onMounted(() => {
    // Read initial size immediately after DOM layout completes
    nextTick(() => {
      readContainerSize()
    })

    // Observe future size changes
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0]
        if (!entry) return
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          containerSize.value = { width, height }
        }
      })
      resizeObserver.observe(containerRef.value)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  // ---- Plot size (container minus margins) ----
  const resolvedMargin = computed<ChartMargin>(() => margin ?? DEFAULT_MARGIN)

  const plotSize = computed(() => ({
    width: Math.max(
      0,
      containerSize.value.width - resolvedMargin.value.left - resolvedMargin.value.right
    ),
    height: Math.max(
      0,
      containerSize.value.height - resolvedMargin.value.top - resolvedMargin.value.bottom
    ),
  }))

  // ---- Palette from CSS custom properties ----
  const palette = computed<string[]>(() => {
    const styles = getComputedStyle(document.documentElement)
    return DEFAULT_COLOR_VARS.map(varName => styles.getPropertyValue(varName).trim()).filter(
      Boolean
    )
  })

  // ---- Tooltip state ----
  const tooltip = ref<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    dataIndex: -1,
    seriesIndex: -1,
  })

  function showTooltipFn(
    dataIndex: number,
    seriesIndex: number,
    clientX: number,
    clientY: number
  ): void {
    const s = series.value[seriesIndex]
    if (!s) return
    const point = s.data[dataIndex]
    if (!point) return
    const label = point.label ?? ''
    const value = point.value
    const name = s.name

    tooltip.value = {
      visible: true,
      x: clientX,
      y: clientY,
      content: `${name}: ${label ? label + ' ' : ''}${value}`,
      dataIndex,
      seriesIndex,
    }
  }

  function hideTooltip(): void {
    tooltip.value = {
      visible: false,
      x: 0,
      y: 0,
      content: '',
      dataIndex: -1,
      seriesIndex: -1,
    }
  }

  // ---- Keyboard navigation ----
  const focusedIndex = ref(-1)
  const totalDataPoints = computed(() => {
    const s = series.value
    if (!s || s.length === 0) return 0
    return Math.max(...s.map(sr => sr.data.length))
  })

  function setFocusedIndex(index: number): void {
    if (totalDataPoints.value === 0) {
      focusedIndex.value = -1
      return
    }
    focusedIndex.value = Math.max(0, Math.min(index, totalDataPoints.value - 1))
  }

  function handleChartKeydown(event: KeyboardEvent): void {
    const total = totalDataPoints.value
    if (total === 0) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        setFocusedIndex(focusedIndex.value <= 0 ? total - 1 : focusedIndex.value - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        setFocusedIndex(focusedIndex.value >= total - 1 ? 0 : focusedIndex.value + 1)
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(total - 1)
        break
    }
  }

  // ---- prefers-reduced-motion ----
  const reducedMotion = ref(false)

  function checkReducedMotion(): void {
    reducedMotion.value =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  let motionQuery: MediaQueryList | null = null

  onMounted(() => {
    checkReducedMotion()
    if (typeof window !== 'undefined') {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      motionQuery.addEventListener('change', checkReducedMotion)
    }
  })

  onBeforeUnmount(() => {
    if (motionQuery) {
      motionQuery.removeEventListener('change', checkReducedMotion)
    }
  })

  // ---- Nice number algorithm for axis ticks ----
  function niceNum(range: number, round: boolean): number {
    const safeRange = Math.max(range, 1e-10)
    const exponent = Math.floor(Math.log10(safeRange))
    const fraction = safeRange / Math.pow(10, exponent)
    let nice: number
    if (round) {
      if (fraction < 1.5) nice = 1
      else if (fraction < 3) nice = 2
      else if (fraction < 7) nice = 5
      else nice = 10
    } else {
      if (fraction <= 1) nice = 1
      else if (fraction <= 2) nice = 2
      else if (fraction <= 5) nice = 5
      else nice = 10
    }
    return nice * Math.pow(10, exponent)
  }

  function niceTicks(min: number, max: number, maxTicks: number = 5): number[] {
    const range = niceNum(max - min, false)
    const step = niceNum(range / (maxTicks - 1), true)
    const niceMin = Math.floor(min / step) * step
    const niceMax = Math.ceil(max / step) * step

    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
      ticks.push(Math.round(v * 1e10) / 1e10)
    }
    return ticks
  }

  // ---- Label formatting ----
  function formatValue(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
    return String(value)
  }

  return {
    containerSize,
    plotSize,
    palette,
    tooltip,
    focusedIndex,
    totalDataPoints,
    setFocusedIndex,
    handleChartKeydown,
    reducedMotion,
    resolvedMargin,
    config,
    resolveProp,
    showTooltip: showTooltipFn,
    hideTooltip,
    niceTicks,
    formatValue,
  }
}

export type UseChartReturn = ReturnType<typeof useChart>
