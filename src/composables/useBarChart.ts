import { computed, type Ref, type ComputedRef } from 'vue'
import { useChart, type ChartMargin, type TooltipState } from './useChart'
import type { ChartSeries, ChartDataPoint } from './useChart'

export type { ChartSeries, ChartDataPoint, ChartMargin, TooltipState }

// ==========================================
// Bar Chart Types
// ==========================================

export interface UseBarChartOptions {
  containerRef: Ref<HTMLElement | null>
  series: Ref<ChartSeries[]> | ComputedRef<ChartSeries[]>
  margin?: ChartMargin
  showTooltip?: boolean
  showLegend?: boolean
  animate?: boolean
  orientation?: 'vertical' | 'horizontal'
  barGap?: number
  stacked?: boolean
  yMin?: number
  yMax?: number
}

export interface BarRect {
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
  value: number
  dataIndex: number
  seriesIndex: number
  isFocused: boolean
}

// ==========================================
// useBarChart — Bar chart logic (Layer 2)
// ==========================================

export function useBarChart(options: UseBarChartOptions) {
  const {
    containerRef,
    series,
    margin,
    showTooltip,
    showLegend,
    animate,
    orientation = 'vertical',
    barGap = 0.2,
    stacked = false,
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

  const resolvedOrientation = computed(
    () =>
      chart.resolveProp(orientation, chart.config.value.chart?.bar?.orientation, 'vertical') as
        | 'vertical'
        | 'horizontal'
  )

  const resolvedStacked = computed(
    () => chart.resolveProp(stacked, chart.config.value.chart?.bar?.stacked, false) as boolean
  )

  const resolvedBarGap = computed(
    () => chart.resolveProp(barGap, chart.config.value.chart?.bar?.barGap, 0.2) as number
  )

  // ---- Data range ----
  const dataMin = computed(() => {
    if (resolvedStacked.value) {
      let min = 0
      const allLabels = series.value[0]?.data.map(d => d.label ?? '') ?? []
      for (let i = 0; i < allLabels.length; i++) {
        let sumNeg = 0
        for (const s of series.value) {
          if (s.data[i] && s.data[i].value < 0) sumNeg += s.data[i].value
        }
        min = Math.min(min, sumNeg)
      }
      return min
    }
    let min = 0
    for (const s of series.value) {
      for (const d of s.data) {
        min = Math.min(min, d.value)
      }
    }
    return min
  })

  const dataMax = computed(() => {
    if (resolvedStacked.value) {
      let max = 0
      const allLabels = series.value[0]?.data.map(d => d.label ?? '') ?? []
      for (let i = 0; i < allLabels.length; i++) {
        let sumPos = 0
        for (const s of series.value) {
          if (s.data[i] && s.data[i].value > 0) sumPos += s.data[i].value
        }
        max = Math.max(max, sumPos)
      }
      return max
    }
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

  // ---- X-axis labels (category labels) ----
  const xAxisLabels = computed(() => {
    if (series.value.length === 0) return []
    return series.value[0].data.map(d => d.label ?? '')
  })

  // ---- Y-axis ticks and labels ----
  const yAxisTicks = computed(() => chart.niceTicks(yMin.value, yMax.value))

  const yAxisLabels = computed(() => yAxisTicks.value.map(v => chart.formatValue(v)))

  // ---- Grid lines ----
  const gridLines = computed(() => yAxisTicks.value)

  // ---- Bar layout calculation ----
  const bars = computed<BarRect[]>(() => {
    const result: BarRect[] = []
    const plotW = chart.plotSize.value.width
    const plotH = chart.plotSize.value.height
    const yRange = yMax.value - yMin.value || 1

    if (plotW <= 0 || plotH <= 0) return result
    if (series.value.length === 0) return result

    const categoryCount = series.value[0].data.length
    if (categoryCount === 0) return result

    const isHorizontal = resolvedOrientation.value === 'horizontal'
    const isStacked = resolvedStacked.value

    // In horizontal mode we swap the plot dimensions for layout calculation
    const mainSize = isHorizontal ? plotH : plotW
    const valueSize = isHorizontal ? plotW : plotH

    const groupWidth = mainSize / categoryCount
    const barCount = isStacked ? 1 : series.value.length
    const gapSize = groupWidth * resolvedBarGap.value
    const barsTotalWidth = groupWidth - gapSize
    const barWidth = Math.max(1, barsTotalWidth / barCount)

    if (isStacked) {
      // Stacked bars
      for (let ci = 0; ci < categoryCount; ci++) {
        let posY = 0
        let negY = 0

        for (let si = 0; si < series.value.length; si++) {
          const s = series.value[si]
          const point = s.data[ci]
          if (!point) continue
          const val = point.value

          const barHeight = (Math.abs(val) / yRange) * valueSize
          const groupX = ci * groupWidth + gapSize / 2

          if (val >= 0) {
            const yFromBottom = ((posY + val - yMin.value) / yRange) * valueSize
            if (isHorizontal) {
              result.push({
                x: ((posY - yMin.value) / yRange) * valueSize,
                y: groupX,
                width: (val / yRange) * valueSize,
                height: barWidth,
                color: s.color ?? chart.palette.value[si % chart.palette.value.length],
                label: point.label ?? '',
                value: val,
                dataIndex: ci,
                seriesIndex: si,
                isFocused: chart.focusedIndex.value === ci,
              })
            } else {
              result.push({
                x: groupX,
                y: plotH - yFromBottom,
                width: barWidth,
                height: barHeight,
                color: s.color ?? chart.palette.value[si % chart.palette.value.length],
                label: point.label ?? '',
                value: val,
                dataIndex: ci,
                seriesIndex: si,
                isFocused: chart.focusedIndex.value === ci,
              })
            }
            posY += val
          } else {
            if (isHorizontal) {
              result.push({
                x: ((negY - yMin.value) / yRange) * valueSize,
                y: groupX,
                width: barHeight,
                height: barWidth,
                color: s.color ?? chart.palette.value[si % chart.palette.value.length],
                label: point.label ?? '',
                value: val,
                dataIndex: ci,
                seriesIndex: si,
                isFocused: chart.focusedIndex.value === ci,
              })
            } else {
              const yFromBottom = ((negY - yMin.value) / yRange) * valueSize
              result.push({
                x: groupX,
                y: plotH - yFromBottom,
                width: barWidth,
                height: barHeight,
                color: s.color ?? chart.palette.value[si % chart.palette.value.length],
                label: point.label ?? '',
                value: val,
                dataIndex: ci,
                seriesIndex: si,
                isFocused: chart.focusedIndex.value === ci,
              })
            }
            negY += val
          }
        }
      }
    } else {
      // Grouped bars
      for (let ci = 0; ci < categoryCount; ci++) {
        for (let si = 0; si < series.value.length; si++) {
          const s = series.value[si]
          const point = s.data[ci]
          if (!point) continue
          const val = point.value

          const barHeight = ((val - yMin.value) / yRange) * valueSize
          const groupX = ci * groupWidth + gapSize / 2 + si * barWidth

          if (isHorizontal) {
            const xStart = (-yMin.value / yRange) * valueSize
            result.push({
              x: val >= 0 ? xStart : xStart + barHeight,
              y: groupX,
              width: Math.abs(barHeight),
              height: barWidth,
              color: s.color ?? chart.palette.value[si % chart.palette.value.length],
              label: point.label ?? '',
              value: val,
              dataIndex: ci,
              seriesIndex: si,
              isFocused: chart.focusedIndex.value === ci,
            })
          } else {
            result.push({
              x: groupX,
              y: plotH - barHeight,
              width: barWidth,
              height: Math.abs(barHeight),
              color: s.color ?? chart.palette.value[si % chart.palette.value.length],
              label: point.label ?? '',
              value: val,
              dataIndex: ci,
              seriesIndex: si,
              isFocused: chart.focusedIndex.value === ci,
            })
          }
        }
      }
    }

    return result
  })

  // ---- Position-based data lookup ----
  function findDataAtPosition(svgX: number, svgY: number): TooltipState | null {
    for (const bar of bars.value) {
      if (
        svgX >= bar.x &&
        svgX <= bar.x + bar.width &&
        svgY >= bar.y &&
        svgY <= bar.y + bar.height
      ) {
        const s = series.value[bar.seriesIndex]
        return {
          visible: true,
          x: svgX,
          y: svgY,
          content: `${s?.name ?? ''}: ${bar.label} ${bar.value}`,
          dataIndex: bar.dataIndex,
          seriesIndex: bar.seriesIndex,
        }
      }
    }
    return null
  }

  return {
    ...chart,
    bars,
    xAxisLabels,
    yAxisLabels,
    yAxisTicks,
    gridLines,
    findDataAtPosition,
    resolvedOrientation,
    resolvedStacked,
  }
}

export type UseBarChartReturn = ReturnType<typeof useBarChart>
