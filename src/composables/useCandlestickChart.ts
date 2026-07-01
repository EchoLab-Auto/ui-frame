import { computed, type Ref, type ComputedRef } from 'vue'
import { useChart, type ChartMargin, type TooltipState } from './useChart'
import type { OhlcDataPoint } from './useChart'

export type { OhlcDataPoint, ChartMargin, TooltipState }

// ==========================================
// Candlestick Chart Types
// ==========================================

export interface UseCandlestickChartOptions {
  containerRef: Ref<HTMLElement | null>
  data: Ref<OhlcDataPoint[]> | ComputedRef<OhlcDataPoint[]>
  margin?: ChartMargin
  showTooltip?: boolean
  showVolume?: boolean
  showMA?: boolean
  maPeriods?: number[]
  upColor?: string
  downColor?: string
  showGrid?: boolean
  showAxis?: boolean
  animate?: boolean
}

export interface CandleRect {
  x: number
  y: number
  width: number
  height: number
  color: string
  wickX: number
  wickY1: number
  wickY2: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  date: string
  isUp: boolean
  index: number
  isFocused: boolean
}

export interface VolumeBar {
  x: number
  y: number
  width: number
  height: number
  color: string
  volume: number
  index: number
}

export interface MALine {
  path: string
  color: string
  period: number
  name: string
}

interface Vec2 {
  x: number
  y: number
}

// ==========================================
// useCandlestickChart — Stock chart logic
// ==========================================

export function useCandlestickChart(options: UseCandlestickChartOptions) {
  const {
    containerRef,
    data,
    margin,
    showTooltip,
    showVolume = true,
    showMA = true,
    maPeriods,
    upColor,
    downColor,
    animate,
  } = options

  // Wrap OHLC data into a ChartSeries-compatible structure for useChart
  const wrappedSeries = computed(() => [
    {
      name: 'price',
      data: data.value.map(d => ({
        label: d.date,
        value: d.close,
      })),
    },
  ])

  const chart = useChart({
    containerRef,
    series: wrappedSeries,
    margin,
    showTooltip,
    showLegend: false,
    animate,
  })

  // ---- Resolve colors ----
  const resolvedUpColor = computed(
    () =>
      chart.resolveProp(upColor, chart.config.value.chart?.candlestick?.upColor, undefined) ??
      'var(--nm-chart-up-color)'
  )

  const resolvedDownColor = computed(
    () =>
      chart.resolveProp(downColor, chart.config.value.chart?.candlestick?.downColor, undefined) ??
      'var(--nm-chart-down-color)'
  )

  const resolvedShowVolume = computed(() => showVolume)
  const resolvedShowMA = computed(() => showMA)
  const resolvedMaPeriods = computed(
    () => maPeriods ?? chart.config.value.chart?.candlestick?.maPeriods ?? [5, 10, 20]
  )
  const resolvedBodyWidthRatio = computed(
    () => chart.config.value.chart?.candlestick?.bodyWidthRatio ?? 0.6
  )

  // ---- Split plot into price + volume areas ----
  const priceAreaHeight = computed(() => {
    if (!resolvedShowVolume.value) return chart.plotSize.value.height
    return chart.plotSize.value.height * 0.72
  })

  const volumeAreaHeight = computed(() => {
    if (!resolvedShowVolume.value) return 0
    return chart.plotSize.value.height * 0.28
  })

  const volumeAreaTop = computed(() => chart.plotSize.value.height - volumeAreaHeight.value)

  // ---- Price range ----
  const priceMin = computed(() => {
    let min = Infinity
    for (const d of data.value) {
      if (d.low < min) min = d.low
    }
    return min === Infinity ? 0 : min
  })

  const priceMax = computed(() => {
    let max = -Infinity
    for (const d of data.value) {
      if (d.high > max) max = d.high
    }
    return max === -Infinity ? 100 : max
  })

  const priceRange = computed(() => priceMax.value - priceMin.value || 1)

  // ---- Volume range ----
  const volumeMax = computed(() => {
    let max = 0
    for (const d of data.value) {
      if (d.volume && d.volume > max) max = d.volume
    }
    return max || 1
  })

  // ---- Coordinate conversion ----
  function priceToY(price: number): number {
    return (
      priceAreaHeight.value - ((price - priceMin.value) / priceRange.value) * priceAreaHeight.value
    )
  }

  function volumeToY(vol: number): number {
    return volumeAreaHeight.value - (vol / volumeMax.value) * volumeAreaHeight.value
  }

  // ---- Candle layout ----
  const candles = computed<CandleRect[]>(() => {
    const result: CandleRect[] = []
    const count = data.value.length
    if (count === 0) return result

    const plotW = chart.plotSize.value.width
    const groupWidth = plotW / count
    const bodyWidth = Math.max(1, groupWidth * resolvedBodyWidthRatio.value)
    const halfBody = bodyWidth / 2

    for (let i = 0; i < count; i++) {
      const d = data.value[i]
      const centerX = i * groupWidth + groupWidth / 2
      const isUp = d.close >= d.open
      const color = isUp ? resolvedUpColor.value : resolvedDownColor.value
      const openY = priceToY(d.open)
      const closeY = priceToY(d.close)
      const highY = priceToY(d.high)
      const lowY = priceToY(d.low)
      const bodyTop = Math.min(openY, closeY)
      const bodyH = Math.max(1, Math.abs(closeY - openY))

      result.push({
        x: centerX - halfBody,
        y: bodyTop,
        width: bodyWidth,
        height: bodyH,
        color,
        wickX: centerX,
        wickY1: highY,
        wickY2: lowY,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume ?? 0,
        date: d.date,
        isUp,
        index: i,
        isFocused: chart.focusedIndex.value === i,
      })
    }

    return result
  })

  // ---- Volume bars ----
  const volumeBars = computed<VolumeBar[]>(() => {
    const result: VolumeBar[] = []
    if (!resolvedShowVolume.value) return result

    const count = data.value.length
    if (count === 0) return result

    const plotW = chart.plotSize.value.width
    const groupWidth = plotW / count
    const barW = Math.max(1, groupWidth * resolvedBodyWidthRatio.value)
    const halfW = barW / 2

    for (let i = 0; i < count; i++) {
      const d = data.value[i]
      const centerX = i * groupWidth + groupWidth / 2
      const isUp = d.close >= d.open
      const volH = Math.max(0, volumeToY(d.volume ?? 0))
      const barH = Math.max(1, volumeAreaHeight.value - volH)

      result.push({
        x: centerX - halfW,
        y: volumeAreaTop.value + volH,
        width: barW,
        height: barH,
        color: isUp ? resolvedUpColor.value : resolvedDownColor.value,
        volume: d.volume ?? 0,
        index: i,
      })
    }

    return result
  })

  // ---- MA (Moving Average) lines ----
  const maLines = computed<MALine[]>(() => {
    const result: MALine[] = []
    if (!resolvedShowMA.value) return result

    const periods = resolvedMaPeriods.value
    const closes = data.value.map(d => d.close)

    const maColors: Record<number, string> = {
      5: 'var(--nm-chart-ma-color-5)',
      10: 'var(--nm-chart-ma-color-10)',
      20: 'var(--nm-chart-ma-color-20)',
      60: 'var(--nm-chart-ma-color-60)',
    }

    const count = data.value.length
    if (count === 0) return result

    const plotW = chart.plotSize.value.width
    const groupWidth = plotW / count

    for (const period of periods) {
      const maValues = calcSMA(closes, period)
      const pts: Vec2[] = []

      for (let i = 0; i < count; i++) {
        const val = maValues[i]
        if (val == null || isNaN(val)) continue
        const x = count > 1 ? i * groupWidth + groupWidth / 2 : plotW / 2
        const y = priceToY(val)
        pts.push({ x, y })
      }

      if (pts.length < 2) continue

      result.push({
        path: buildSmoothPath(pts),
        color: maColors[period] ?? 'var(--nm-chart-ma-color-5)',
        period,
        name: `MA${period}`,
      })
    }

    return result
  })

  // ---- Y-axis ticks (price) ----
  const yAxisTicks = computed(() => chart.niceTicks(priceMin.value, priceMax.value))

  const yAxisLabels = computed(() => yAxisTicks.value.map(v => chart.formatValue(v)))

  // ---- Y-axis ticks (volume) ----
  const volumeYAxisTicks = computed(() => chart.niceTicks(0, volumeMax.value, 3))

  const volumeYAxisLabels = computed(() => volumeYAxisTicks.value.map(v => chart.formatValue(v)))

  // ---- Grid lines (price area only) ----
  const gridLines = computed(() => yAxisTicks.value)

  // ---- X-axis labels (date) with smart sampling ----
  const xAxisLabels = computed(() => {
    const count = data.value.length
    if (count === 0) return []

    // Smart sampling: show ~6-8 labels
    const maxLabels = 8
    const step = Math.max(1, Math.ceil(count / maxLabels))

    const labels: { label: string; x: number }[] = []
    const plotW = chart.plotSize.value.width
    const groupWidth = plotW / count

    for (let i = 0; i < count; i += step) {
      labels.push({
        label: formatDate(data.value[i].date),
        x: i * groupWidth + groupWidth / 2,
      })
    }

    // Always include last label if not already included
    const lastIdx = count - 1
    if (lastIdx % step !== 0 && lastIdx > 0) {
      labels.push({
        label: formatDate(data.value[lastIdx].date),
        x: lastIdx * groupWidth + groupWidth / 2,
      })
    }

    return labels
  })

  // ---- Find data at position ----
  function findDataAtPosition(
    svgX: number,
    svgY: number
  ): (CandleRect & { type: 'candle' }) | (VolumeBar & { type: 'volume' }) | null {
    // Check candles first
    for (const c of candles.value) {
      if (svgX >= c.x && svgX <= c.x + c.width && svgY >= c.y && svgY <= c.y + c.height) {
        return { ...c, type: 'candle' }
      }
    }

    // Check volume bars
    for (const v of volumeBars.value) {
      if (svgX >= v.x && svgX <= v.x + v.width && svgY >= v.y && svgY <= v.y + v.height) {
        return { ...v, type: 'volume' }
      }
    }

    return null
  }

  return {
    ...chart,
    candles,
    volumeBars,
    maLines,
    xAxisLabels,
    yAxisLabels,
    yAxisTicks,
    volumeYAxisLabels,
    volumeYAxisTicks,
    gridLines,
    priceAreaHeight,
    volumeAreaHeight,
    volumeAreaTop,
    priceMin,
    priceMax,
    volumeMax,
    resolvedUpColor,
    resolvedDownColor,
    resolvedShowVolume,
    resolvedShowMA,
    resolvedMaPeriods,
    findDataAtPosition,
    priceToY,
  }
}

export type UseCandlestickChartReturn = ReturnType<typeof useCandlestickChart>

// ==========================================
// SMA (Simple Moving Average)
// ==========================================

function calcSMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  let sum = 0

  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) {
      sum -= values[i - period]
    }
    if (i >= period - 1) {
      result.push(sum / period)
    } else {
      result.push(null as unknown as number)
    }
  }

  return result
}

// ==========================================
// Date formatting
// ==========================================

function formatDate(dateStr: string): string {
  // Return short form: "01-15" for "2024-01-15", or the label as-is
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`
  }
  return dateStr
}

// ==========================================
// Smooth SVG path (adapted from useLineChart)
// ==========================================

function catmullRomToBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, tension: number = 0.5): string {
  const t = tension
  const d = 1 / 6
  const cp1x = p1.x + (p2.x - p0.x) * t * d
  const cp1y = p1.y + (p2.y - p0.y) * t * d
  const cp2x = p2.x - (p3.x - p1.x) * t * d
  const cp2y = p2.y - (p3.y - p1.y) * t * d
  return `${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
}

function buildSmoothPath(pts: Vec2[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`

  let d = `M${pts[0].x},${pts[0].y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const bez = catmullRomToBezier(p0, p1, p2, p3, 0.5)
    if (i === 0) {
      d += ` L${p1.x},${p1.y} C${bez}`
    } else {
      d += ` C${bez}`
    }
  }

  return d
}
