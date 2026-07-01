import { computed, type Ref, type ComputedRef } from 'vue'
import { useChart, type ChartMargin, type TooltipState } from './useChart'
import type { ChartSeries, ChartDataPoint } from './useChart'

export type { ChartSeries, ChartDataPoint, ChartMargin, TooltipState }

// ==========================================
// Line Chart Types
// ==========================================

export interface UseLineChartOptions {
  containerRef: Ref<HTMLElement | null>
  series: Ref<ChartSeries[]> | ComputedRef<ChartSeries[]>
  margin?: ChartMargin
  showTooltip?: boolean
  showLegend?: boolean
  animate?: boolean
  curve?: 'linear' | 'smooth' | 'step'
  area?: boolean
  areaOpacity?: number
  showPoints?: boolean
  pointSize?: number
  lineWidth?: number
  yMin?: number
  yMax?: number
}

export interface LineSeries {
  path: string
  areaPath?: string
  color: string
  name: string
  seriesIndex: number
}

export interface ChartPoint {
  cx: number
  cy: number
  color: string
  value: number
  dataIndex: number
  seriesIndex: number
  isFocused: boolean
}

// ==========================================
// Catmull-Rom to cubic Bezier conversion
// ==========================================

interface Vec2 {
  x: number
  y: number
}

function catmullRomToBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, tension: number = 0.5): string {
  const t = tension
  const d = 1 / 6

  const cp1x = p1.x + (p2.x - p0.x) * t * d
  const cp1y = p1.y + (p2.y - p0.y) * t * d
  const cp2x = p2.x - (p3.x - p1.x) * t * d
  const cp2y = p2.y - (p3.y - p1.y) * t * d

  return `${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
}

// ==========================================
// useLineChart — Line chart logic (Layer 2)
// ==========================================

export function useLineChart(options: UseLineChartOptions) {
  const {
    containerRef,
    series,
    margin,
    showTooltip,
    showLegend,
    animate,
    curve = 'smooth',
    area = false,
    areaOpacity = 0.1,
    showPoints = true,
    pointSize = 6,
    lineWidth = 2.5,
    yMin: yMinOpt,
    yMax: yMaxOpt,
  } = options

  const chart = useChart({
    containerRef,
    series,
    margin,
    showTooltip,
    showLegend,
    animate,
  })

  const resolvedCurve = computed(
    () =>
      chart.resolveProp(curve, chart.config.value.chart?.line?.curve, 'smooth') as
        | 'linear'
        | 'smooth'
        | 'step'
  )

  const resolvedShowPoints = computed(
    () => chart.resolveProp(showPoints, chart.config.value.chart?.line?.showPoints, true) as boolean
  )

  const resolvedLineWidth = computed(
    () => chart.resolveProp(lineWidth, chart.config.value.chart?.line?.lineWidth, 2.5) as number
  )

  const resolvedArea = computed(
    () => chart.resolveProp(area, chart.config.value.chart?.line?.area, false) as boolean
  )

  // ---- Data range ----
  const dataMin = computed(() => {
    let min = 0
    for (const s of series.value) {
      for (const d of s.data) {
        min = Math.min(min, d.value)
      }
    }
    return min
  })

  const dataMax = computed(() => {
    let max = 0
    for (const s of series.value) {
      for (const d of s.data) {
        max = Math.max(max, d.value)
      }
    }
    return max
  })

  const yMin = computed(() => yMinOpt ?? dataMin.value)
  const yMax = computed(() => yMaxOpt ?? dataMax.value)

  // ---- X-axis labels ----
  const xAxisLabels = computed(() => {
    if (series.value.length === 0) return []
    return series.value[0].data.map(d => d.label ?? '')
  })

  // ---- Y-axis ticks ----
  const yAxisTicks = computed(() => chart.niceTicks(yMin.value, yMax.value))

  const yAxisLabels = computed(() => yAxisTicks.value.map(v => chart.formatValue(v)))

  const gridLines = computed(() => yAxisTicks.value)

  // ---- Calculate point coordinates for each data point ----
  const pointsBySeries = computed(() => {
    const result: Vec2[][] = []
    const plotW = chart.plotSize.value.width
    const plotH = chart.plotSize.value.height
    const yRange = yMax.value - yMin.value || 1

    for (const s of series.value) {
      const pts: Vec2[] = []
      const count = s.data.length
      if (count === 0) {
        result.push(pts)
        continue
      }

      const xStep = count > 1 ? plotW / (count - 1) : plotW / 2

      for (let i = 0; i < count; i++) {
        const x = count > 1 ? i * xStep : plotW / 2
        const y = plotH - ((s.data[i].value - yMin.value) / yRange) * plotH
        pts.push({ x, y })
      }
      result.push(pts)
    }
    return result
  })

  // ---- Generate SVG paths ----
  const lines = computed<LineSeries[]>(() => {
    const result: LineSeries[] = []
    const plotH = chart.plotSize.value.height

    pointsBySeries.value.forEach((pts, si) => {
      if (pts.length === 0) return
      const s = series.value[si]
      const color = s.color ?? chart.palette.value[si % chart.palette.value.length]
      const pathData = buildPath(pts, resolvedCurve.value)
      const areaPathData = resolvedArea.value
        ? buildAreaPath(pts, plotH, resolvedCurve.value)
        : undefined

      result.push({
        path: pathData,
        areaPath: areaPathData,
        color,
        name: s.name,
        seriesIndex: si,
      })
    })

    return result
  })

  // ---- Visible data points ----
  const points = computed<ChartPoint[]>(() => {
    const result: ChartPoint[] = []
    pointsBySeries.value.forEach((pts, si) => {
      const s = series.value[si]
      if (!s) return
      const color = s.color ?? chart.palette.value[si % chart.palette.value.length]
      pts.forEach((pt, di) => {
        result.push({
          cx: pt.x,
          cy: pt.y,
          color,
          value: s.data[di]?.value ?? 0,
          dataIndex: di,
          seriesIndex: si,
          isFocused: chart.focusedIndex.value === di,
        })
      })
    })
    return result
  })

  // ---- Find data at position ----
  function findDataAtPosition(svgX: number, svgY: number): TooltipState | null {
    const threshold = 12
    for (const pt of points.value) {
      const dx = pt.cx - svgX
      const dy = pt.cy - svgY
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        const s = series.value[pt.seriesIndex]
        const d = s?.data[pt.dataIndex]
        return {
          visible: true,
          x: svgX,
          y: svgY,
          content: `${s?.name ?? ''}: ${d?.label ?? ''} ${pt.value}`,
          dataIndex: pt.dataIndex,
          seriesIndex: pt.seriesIndex,
        }
      }
    }
    return null
  }

  return {
    ...chart,
    lines,
    points,
    xAxisLabels,
    yAxisLabels,
    yAxisTicks,
    gridLines,
    findDataAtPosition,
    resolvedCurve,
    resolvedShowPoints,
    resolvedLineWidth,
    resolvedArea,
    resolvedAreaOpacity: areaOpacity,
    resolvedPointSize: pointSize,
  }
}

export type UseLineChartReturn = ReturnType<typeof useLineChart>

// ==========================================
// Path generation helpers
// ==========================================

function buildPath(pts: Vec2[], curve: string): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`

  switch (curve) {
    case 'linear':
      return buildLinearPath(pts)
    case 'step':
      return buildStepPath(pts)
    case 'smooth':
    default:
      return buildSmoothPath(pts)
  }
}

function buildLinearPath(pts: Vec2[]): string {
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x},${pts[i].y}`
  }
  return d
}

function buildStepPath(pts: Vec2[]): string {
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i - 1].x + pts[i].x) / 2
    d += ` L${midX},${pts[i - 1].y} L${midX},${pts[i].y} L${pts[i].x},${pts[i].y}`
  }
  return d
}

function buildSmoothPath(pts: Vec2[]): string {
  if (pts.length === 2) {
    return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`
  }

  let d = `M${pts[0].x},${pts[0].y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]

    const bez = catmullRomToBezier(p0, p1, p2, p3, 0.5)

    if (i === 0) {
      // First segment: line to first point, then curve to second
      d += ` L${p1.x},${p1.y} C${bez}`
    } else {
      d += ` C${bez}`
    }
  }

  return d
}

function buildAreaPath(pts: Vec2[], plotHeight: number, curve: string): string {
  if (pts.length === 0) return ''
  const linePath = buildPath(pts, curve)
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `${linePath} L${last.x},${plotHeight} L${first.x},${plotHeight} Z`
}
