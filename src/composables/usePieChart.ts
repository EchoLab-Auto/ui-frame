import { computed, type Ref, type ComputedRef } from 'vue'
import { useChart, type ChartMargin, type TooltipState } from './useChart'
import type { ChartDataPoint } from './useChart'

export type { ChartDataPoint, ChartMargin, TooltipState }

// ==========================================
// Pie Chart Types
// ==========================================

export interface UsePieChartOptions {
  containerRef: Ref<HTMLElement | null>
  data: Ref<ChartDataPoint[]> | ComputedRef<ChartDataPoint[]>
  margin?: ChartMargin
  showTooltip?: boolean
  showLegend?: boolean
  animate?: boolean
  innerRadius?: number
  outerRadius?: number
  padAngle?: number
  startAngle?: number
  labelPosition?: 'inside' | 'outside' | 'none'
  roundedCorners?: boolean
  colorPalette?: string[]
}

export interface PieArc {
  path: string
  centroidX: number
  centroidY: number
  startAngle: number
  endAngle: number
  color: string
  label: string
  value: number
  percentage: number
  index: number
  isFocused: boolean
  labelX?: number
  labelY?: number
  labelAnchor?: 'start' | 'end'
}

// ==========================================
// usePieChart — Pie chart logic (Layer 2)
// ==========================================

export function usePieChart(options: UsePieChartOptions) {
  const {
    containerRef,
    data,
    margin,
    showTooltip,
    showLegend,
    animate,
    innerRadius = 0,
    outerRadius: outerRadiusOpt,
    padAngle = 0.02,
    startAngle = -90,
    labelPosition = 'outside',
    roundedCorners = false,
    colorPalette,
  } = options

  // We wrap the flat data into a single series for useChart
  const wrappedSeries = computed(() => [
    {
      name: 'pie',
      data: data.value,
    },
  ])

  const chart = useChart({
    containerRef,
    series: wrappedSeries,
    margin,
    showTooltip,
    showLegend,
    animate,
  })

  const resolvedInnerRadius = computed(
    () => chart.resolveProp(innerRadius, chart.config.value.chart?.pie?.innerRadius, 0) as number
  )

  const resolvedLabelPosition = computed(
    () =>
      chart.resolveProp(labelPosition, chart.config.value.chart?.pie?.labelPosition, 'outside') as
        | 'inside'
        | 'outside'
        | 'none'
  )

  const resolvedRoundedCorners = computed(
    () =>
      chart.resolveProp(
        roundedCorners,
        chart.config.value.chart?.pie?.roundedCorners,
        false
      ) as boolean
  )

  const resolvedStartAngle = computed(() => startAngle * (Math.PI / 180)) // convert degrees to radians

  // ---- Custom palette support ----
  const effectivePalette = computed(() =>
    colorPalette && colorPalette.length > 0 ? colorPalette : chart.palette.value
  )

  // ---- Total ----
  const total = computed(() =>
    data.value.reduce((sum: number, d: ChartDataPoint) => sum + Math.abs(d.value), 0)
  )

  // ---- Calculate outer radius ----
  const outerRadius = computed(() => {
    if (outerRadiusOpt !== undefined) return outerRadiusOpt
    const plotW = chart.plotSize.value.width
    const plotH = chart.plotSize.value.height
    return Math.min(plotW, plotH) / 2
  })

  // ---- Generate arcs ----
  const arcs = computed<PieArc[]>(() => {
    const result: PieArc[] = []
    if (total.value === 0) return result

    const cx = chart.plotSize.value.width / 2
    const cy = chart.plotSize.value.height / 2
    const r = Math.max(0, outerRadius.value)
    const ir = resolvedInnerRadius.value
    const pad = data.value.length > 1 ? padAngle : 0

    let currentAngle = resolvedStartAngle.value

    for (let i = 0; i < data.value.length; i++) {
      const d = data.value[i]
      const percentage = total.value > 0 ? d.value / total.value : 0
      const arcAngle = percentage * Math.PI * 2 - pad

      const startA = currentAngle
      const endA = currentAngle + Math.max(0, arcAngle)

      const path = describeArc(cx, cy, r, ir, startA, endA, resolvedRoundedCorners.value)

      // Centroid (mid-angle at mid-radius)
      const midAngle = startA + arcAngle / 2
      const midRadius = (r + ir) / 2
      const centroidX = cx + midRadius * Math.cos(midAngle)
      const centroidY = cy + midRadius * Math.sin(midAngle)

      // Label position
      let labelX: number | undefined
      let labelY: number | undefined
      let labelAnchor: 'start' | 'end' = 'start'

      if (resolvedLabelPosition.value === 'outside') {
        const labelRadius = r + 20
        labelX = cx + labelRadius * Math.cos(midAngle)
        labelY = cy + labelRadius * Math.sin(midAngle)
        labelAnchor = Math.cos(midAngle) >= 0 ? 'start' : 'end'
      }

      result.push({
        path,
        centroidX,
        centroidY,
        startAngle: startA,
        endAngle: endA,
        color: d.color ?? effectivePalette.value[i % effectivePalette.value.length],
        label: d.label ?? '',
        value: d.value,
        percentage: Math.round(percentage * 1000) / 10,
        index: i,
        isFocused: chart.focusedIndex.value === i,
        labelX,
        labelY,
        labelAnchor,
      })

      currentAngle = endA + pad
    }

    return result
  })

  // ---- Find arc at position ----
  function findArcAtPosition(svgX: number, svgY: number): PieArc | null {
    const cx = chart.plotSize.value.width / 2
    const cy = chart.plotSize.value.height / 2
    const dx = svgX - cx
    const dy = svgY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    const r = outerRadius.value
    const ir = resolvedInnerRadius.value

    if (dist < ir || dist > r) return null

    let angle = Math.atan2(dy, dx)
    if (angle < 0) angle += Math.PI * 2

    for (const arc of arcs.value) {
      let startA = arc.startAngle % (Math.PI * 2)
      let endA = arc.endAngle % (Math.PI * 2)
      if (startA < 0) startA += Math.PI * 2
      if (endA < 0) endA += Math.PI * 2

      if (startA <= endA) {
        if (angle >= startA && angle <= endA) return arc
      } else {
        // Wraps around 0
        if (angle >= startA || angle <= endA) return arc
      }
    }

    return null
  }

  return {
    ...chart,
    arcs,
    total,
    outerRadius,
    resolvedInnerRadius,
    resolvedLabelPosition,
    findArcAtPosition,
    effectivePalette,
  }
}

export type UsePieChartReturn = ReturnType<typeof usePieChart>

// ==========================================
// SVG Arc path helpers
// ==========================================

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
  rounded: boolean
): string {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  if (innerR <= 0) {
    // Standard pie (no hole)
    const start = polarToCartesian(cx, cy, outerR, startAngle)
    const end = polarToCartesian(cx, cy, outerR, endAngle)

    if (rounded) {
      return [
        `M${cx},${cy}`,
        `L${start.x},${start.y}`,
        `A${outerR},${outerR} 0 ${largeArc} 1 ${end.x},${end.y}`,
        'Z',
      ].join(' ')
    }

    return [
      `M${cx},${cy}`,
      `L${start.x},${start.y}`,
      `A${outerR},${outerR} 0 ${largeArc} 1 ${end.x},${end.y}`,
      'Z',
    ].join(' ')
  }

  // Donut (has inner hole)
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle)
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle)
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle)
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle)

  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${outerR},${outerR} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerStart.x},${innerStart.y}`,
    `A${innerR},${innerR} 0 ${largeArc} 0 ${innerEnd.x},${innerEnd.y}`,
    'Z',
  ].join(' ')
}
