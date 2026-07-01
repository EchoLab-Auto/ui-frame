<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLineChart } from '@/composables/useLineChart'
import type { ChartSeries } from '@/composables/useLineChart'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'

export interface NeumorphismChartLineProps {
  series?: ChartSeries[]
  width?: string | number
  height?: string | number
  curve?: 'linear' | 'smooth' | 'step'
  area?: boolean
  areaOpacity?: number
  showPoints?: boolean
  pointSize?: number
  lineWidth?: number
  showTooltip?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showAxis?: boolean
  animate?: boolean
  yMin?: number
  yMax?: number
  title?: string
}

const props = withDefaults(defineProps<NeumorphismChartLineProps>(), {
  series: () => [],
  width: '100%',
  height: '300px',
  curve: 'smooth',
  area: false,
  areaOpacity: 0.1,
  showPoints: true,
  pointSize: 6,
  lineWidth: 2.5,
  showTooltip: true,
  showLegend: true,
  showGrid: true,
  showAxis: true,
  animate: true,
})

const emit = defineEmits<{
  (e: 'point-click', payload: { index: number; seriesIndex: number; value: number }): void
}>()

const { t } = useLocale()
const containerRef = ref<HTMLElement | null>(null)
const instanceId = generateId('nm-line')

const {
  lines,
  points,
  xAxisLabels,
  yAxisLabels,
  yAxisTicks,
  gridLines,
  plotSize,
  resolvedMargin,
  palette,
  tooltip,
  reducedMotion,
  hideTooltip,
  handleChartKeydown,
  resolvedShowPoints,
  resolvedLineWidth,
  resolvedArea,
  resolvedPointSize,
} = useLineChart({
  containerRef,
  series: computed(() => props.series),
  curve: props.curve,
  area: props.area,
  areaOpacity: props.areaOpacity,
  showPoints: props.showPoints,
  pointSize: props.pointSize,
  lineWidth: props.lineWidth,
  showTooltip: props.showTooltip,
  showLegend: props.showLegend,
  animate: props.animate,
  yMin: props.yMin,
  yMax: props.yMax,
})

const svgWidth = computed(
  () => plotSize.value.width + resolvedMargin.value.left + resolvedMargin.value.right
)
const svgHeight = computed(
  () => plotSize.value.height + resolvedMargin.value.top + resolvedMargin.value.bottom
)

const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const ariaLabel = computed(() => {
  const names = props.series.map(s => s.name).join(', ')
  return `Line chart: ${names}`
})

const shouldAnimate = computed(() => props.animate && !reducedMotion.value)

const tooltipStyle = computed(() => {
  if (!containerRef.value) return { display: 'none' }
  const rect = containerRef.value.getBoundingClientRect()
  return {
    left: `${tooltip.value.x - rect.left + 12}px`,
    top: `${tooltip.value.y - rect.top - 8}px`,
  }
})

// ---- Crosshair / hover tracking ----
const crosshairX = ref<number | null>(null)
const nearestIndex = ref<number>(-1)
const isHovering = ref(false)

/** X positions of data points from the first series */
const dataPointXs = computed(() => {
  const xs: number[] = []
  for (const pt of points.value) {
    if (pt.seriesIndex === 0) xs.push(pt.cx)
  }
  return xs
})

/** Y values at the nearest index for each series */
const nearestPoints = computed(() => {
  if (nearestIndex.value < 0) return []
  return props.series.map((s, si) => {
    const pt = points.value.find(p => p.dataIndex === nearestIndex.value && p.seriesIndex === si)
    return {
      cx: pt?.cx ?? 0,
      cy: pt?.cy ?? 0,
      color: s.color ?? palette.value[si % palette.value.length],
      name: s.name,
      value: s.data[nearestIndex.value]?.value ?? 0,
    }
  })
})

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

function onBodyMouseMove(event: MouseEvent): void {
  if (!containerRef.value || !props.showTooltip) return
  const rect = containerRef.value.getBoundingClientRect()
  const svgX = event.clientX - rect.left - resolvedMargin.value.left

  if (svgX < 0 || svgX > plotSize.value.width) {
    crosshairX.value = null
    nearestIndex.value = -1
    isHovering.value = false
    hideTooltip()
    return
  }

  const idx = findNearestIndex(svgX)
  if (idx < 0) return

  isHovering.value = true
  nearestIndex.value = idx
  crosshairX.value = dataPointXs.value[idx] ?? svgX

  // Build rich tooltip content
  const dateLabel = xAxisLabels.value[idx] ?? `#${idx + 1}`
  const parts: string[] = []
  for (let si = 0; si < props.series.length; si++) {
    const s = props.series[si]
    const d = s.data[idx]
    if (d) {
      const color = s.color ?? palette.value[si % palette.value.length]
      parts.push(
        `<span class="nm-chart__tooltip-row">` +
          `<span class="nm-chart__tooltip-dot" style="background:${color}"></span>` +
          `${s.name}: <strong>${d.value}</strong>` +
          `</span>`
      )
    }
  }

  tooltip.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    content: `<div class="nm-chart__tooltip-header">${dateLabel}</div>${parts.join('')}`,
    dataIndex: idx,
    seriesIndex: 0,
  }
}

function onBodyMouseLeave(): void {
  crosshairX.value = null
  nearestIndex.value = -1
  isHovering.value = false
  hideTooltip()
}

function onPointClick(pt: { dataIndex: number; seriesIndex: number; value: number }): void {
  emit('point-click', {
    index: pt.dataIndex,
    seriesIndex: pt.seriesIndex,
    value: pt.value,
  })
}
</script>

<template>
  <div :class="['nm-chart', 'nm-chart--line']" :style="containerStyle">
    <div v-if="title || $slots.title" class="nm-chart__header">
      <span v-if="title" class="nm-chart__title">{{ title }}</span>
      <slot name="title" />
    </div>

    <div
      ref="containerRef"
      class="nm-chart__body"
      :class="{ 'nm-chart__body--hovering': isHovering }"
      role="img"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="handleChartKeydown"
      @mousemove="onBodyMouseMove"
      @mouseleave="onBodyMouseLeave"
    >
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="nm-chart__svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath :id="`nm-plot-clip-line-${instanceId}`">
            <rect
              :x="resolvedMargin.left - 20"
              :y="resolvedMargin.top - 20"
              :width="plotSize.width + 40"
              :height="plotSize.height + 40"
            />
          </clipPath>
          <!-- Area fill gradients -->
          <linearGradient
            v-for="(line, li) in lines"
            :id="`nm-area-grad-${instanceId}-${li}`"
            :key="'grad' + li"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" :stop-color="line.color" stop-opacity="0.18" />
            <stop offset="100%" :stop-color="line.color" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        <g v-if="showGrid" :clip-path="`url(#nm-plot-clip-line-${instanceId})`">
          <line
            v-for="(tick, i) in gridLines"
            :key="'g' + i"
            :x1="resolvedMargin.left"
            :y1="
              resolvedMargin.top +
              plotSize.height -
              ((tick - yAxisTicks[0]) / (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                plotSize.height
            "
            :x2="resolvedMargin.left + plotSize.width"
            :y2="
              resolvedMargin.top +
              plotSize.height -
              ((tick - yAxisTicks[0]) / (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                plotSize.height
            "
            stroke="var(--nm-chart-grid-color)"
            stroke-width="0.5"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Y-axis -->
        <g v-if="showAxis">
          <line
            :x1="resolvedMargin.left"
            :y1="resolvedMargin.top"
            :x2="resolvedMargin.left"
            :y2="resolvedMargin.top + plotSize.height"
            stroke="var(--nm-chart-axis-color)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <text
            v-for="(label, i) in yAxisLabels"
            :key="'y' + i"
            :x="resolvedMargin.left - 8"
            :y="
              resolvedMargin.top +
              plotSize.height -
              ((yAxisTicks[i] - yAxisTicks[0]) /
                (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                plotSize.height
            "
            text-anchor="end"
            dominant-baseline="middle"
            fill="var(--nm-chart-label-color)"
            font-size="11"
            class="nm-chart__tick-label"
          >
            {{ label }}
          </text>
        </g>

        <!-- X-axis -->
        <g v-if="showAxis">
          <line
            :x1="resolvedMargin.left"
            :y1="resolvedMargin.top + plotSize.height"
            :x2="resolvedMargin.left + plotSize.width"
            :y2="resolvedMargin.top + plotSize.height"
            stroke="var(--nm-chart-axis-color)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <text
            v-for="(label, i) in xAxisLabels"
            :key="'x' + i"
            :x="
              resolvedMargin.left +
              (xAxisLabels.length > 1
                ? i * (plotSize.width / (xAxisLabels.length - 1))
                : plotSize.width / 2)
            "
            :y="resolvedMargin.top + plotSize.height + 20"
            text-anchor="middle"
            fill="var(--nm-chart-label-color)"
            font-size="11"
            class="nm-chart__tick-label"
          >
            {{ label }}
          </text>
        </g>

        <!-- Area fills + Lines (translated to plot area, no clip-path so curves can breathe) -->
        <g :transform="`translate(${resolvedMargin.left}, ${resolvedMargin.top})`">
          <path
            v-for="(line, li) in lines"
            v-show="resolvedArea && line.areaPath"
            :key="'area' + li"
            :d="line.areaPath"
            :fill="`url(#nm-area-grad-${instanceId}-${li})`"
            :class="{ 'nm-chart__area--animate': shouldAnimate }"
          />
          <path
            v-for="(line, li) in lines"
            :key="'line' + li"
            :d="line.path"
            fill="none"
            :stroke="line.color"
            :stroke-width="resolvedLineWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="['nm-chart__line', { 'nm-chart__line--animate': shouldAnimate }]"
            :style="shouldAnimate ? { animationDelay: `${li * 200}ms` } : {}"
          />
        </g>

        <!-- Crosshair line + dots -->
        <template v-if="crosshairX !== null">
          <line
            :x1="resolvedMargin.left + crosshairX"
            :y1="resolvedMargin.top"
            :x2="resolvedMargin.left + crosshairX"
            :y2="resolvedMargin.top + plotSize.height"
            stroke="var(--nm-text-placeholder)"
            stroke-width="1"
            stroke-dasharray="4,3"
            opacity="0.5"
            class="nm-chart__crosshair"
          />
          <!-- Intersection dots on each line -->
          <circle
            v-for="(np, ni) in nearestPoints"
            :key="'cd' + ni"
            :cx="resolvedMargin.left + np.cx"
            :cy="resolvedMargin.top + np.cy"
            r="4.5"
            :fill="np.color"
            stroke="var(--nm-surface-color)"
            stroke-width="2"
            class="nm-chart__crosshair-dot"
          />
        </template>

        <!-- Data points -->
        <g>
          <circle
            v-for="(pt, pi) in points"
            v-show="resolvedShowPoints"
            :key="'pt' + pi"
            :cx="resolvedMargin.left + pt.cx"
            :cy="resolvedMargin.top + pt.cy"
            :r="
              crosshairX !== null && pt.dataIndex === nearestIndex
                ? resolvedPointSize + 1.5
                : resolvedPointSize
            "
            :fill="pt.color"
            :stroke="
              crosshairX !== null && pt.dataIndex === nearestIndex
                ? 'var(--nm-surface-color)'
                : 'var(--nm-surface-color)'
            "
            :stroke-width="crosshairX !== null && pt.dataIndex === nearestIndex ? 2.5 : 1.5"
            :opacity="crosshairX !== null && pt.dataIndex !== nearestIndex ? 0.3 : 1"
            :class="[
              'nm-chart__point',
              {
                'nm-chart__point--nearest': crosshairX !== null && pt.dataIndex === nearestIndex,
                'nm-chart__point--focused': pt.isFocused,
                'nm-chart__point--animate': shouldAnimate,
              },
            ]"
            :style="shouldAnimate ? { animationDelay: `${pi * 60}ms` } : {}"
            role="img"
            :aria-label="`${pt.value}`"
            @click="onPointClick(pt)"
          />
        </g>
      </svg>

      <!-- Tooltip -->
      <Transition name="nm-chart-tooltip">
        <div
          v-if="tooltip.visible && showTooltip"
          class="nm-chart__tooltip"
          :style="tooltipStyle"
          v-html="tooltip.content"
        />
      </Transition>
    </div>

    <!-- Legend -->
    <div
      v-if="showLegend && series.length > 0"
      class="nm-chart__legend"
      role="list"
      :aria-label="t('chartLegend')"
    >
      <div v-for="(s, si) in series" :key="si" class="nm-chart__legend-item" role="listitem">
        <span
          class="nm-chart__legend-marker"
          :style="{ backgroundColor: s.color ?? palette[si % palette.length] }"
        />
        <span class="nm-chart__legend-label">{{ s.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chart {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--nm-spacing-sm);
  }

  &__title {
    font-size: var(--nm-font-lg);
    font-weight: 600;
    color: var(--nm-text-primary);
  }

  &__body {
    position: relative;
    flex: 1;
    min-height: 0;
    @include nm-inset-deep(6px, 12px);
    padding: 8px;
    cursor: crosshair;
    contain: layout style;
    outline: none;

    &--hovering {
      cursor: none;
    }

    &:focus-visible {
      box-shadow:
        inset 6px 6px 12px var(--nm-shadow-dark-deep),
        inset -6px -6px 12px var(--nm-shadow-light-deep),
        0 0 0 2px var(--nm-primary-color);
    }

    @media (prefers-reduced-motion: reduce) {
      cursor: default;
    }
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__tick-label {
    user-select: none;
    pointer-events: none;
  }
}

// Line styles
.nm-chart__line {
  transition: opacity 0.3s ease;

  &--animate {
    animation: nm-chart-line-draw 0.8s $nm-ease-ambient both;
  }

  @media (prefers-reduced-motion: reduce) {
    &--animate {
      animation: none;
    }
  }
}

// Area fill
.nm-chart__area--animate {
  animation: nm-chart-area-fade 0.8s $nm-ease-ambient both;
}

@media (prefers-reduced-motion: reduce) {
  .nm-chart__area--animate {
    animation: none;
  }
}

// Data points
.nm-chart__point {
  cursor: pointer;
  transition:
    r 0.15s $nm-ease-bounce,
    filter 0.3s $nm-ease-ambient,
    opacity 0.2s ease,
    stroke-width 0.15s ease;
  filter: drop-shadow(1.5px 1.5px 2px var(--nm-shadow-dark))
    drop-shadow(-1px -1px 1.5px var(--nm-shadow-light));

  &--nearest,
  &--focused {
    filter: drop-shadow(3px 3px 4px var(--nm-shadow-dark-strong))
      drop-shadow(-2px -2px 3px var(--nm-shadow-light-strong));
  }

  &--animate {
    animation: nm-chart-point-pop 0.4s $nm-ease-spring both;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &--animate {
      animation: none;
    }
  }
}

// Crosshair
.nm-chart__crosshair {
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.nm-chart__crosshair-dot {
  pointer-events: none;
  filter: drop-shadow(2px 2px 3px var(--nm-shadow-dark))
    drop-shadow(-1.5px -1.5px 2px var(--nm-shadow-light));
  transition:
    cx 0.08s ease-out,
    cy 0.08s ease-out;
}

// Tooltip
.nm-chart__tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  padding: 10px 14px;
  background: var(--nm-chart-tooltip-bg);
  color: var(--nm-chart-tooltip-text);
  font-size: var(--nm-font-sm);
  border-radius: var(--nm-border-radius-sm);
  @include nm-raised(4px, 8px);
  max-width: 260px;
  line-height: 1.6;

  :deep(.nm-chart__tooltip-header) {
    font-weight: 600;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--nm-chart-grid-color);
    color: var(--nm-text-primary);
    font-size: 13px;
  }

  :deep(.nm-chart__tooltip-row) {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  :deep(.nm-chart__tooltip-dot) {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    @include nm-raised(1px, 2px);
  }
}

.nm-chart-tooltip-enter-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s $nm-ease-spring;
}

.nm-chart-tooltip-leave-active {
  transition:
    opacity 0.08s ease,
    transform 0.08s $nm-ease-compress;
}

.nm-chart-tooltip-enter-from {
  opacity: 0;
  transform: translateY(3px) scale(0.97);
}

.nm-chart-tooltip-leave-to {
  opacity: 0;
  transform: translateY(2px) scale(0.98);
}

// Legend
.nm-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-chart-legend-gap);
  padding: 4px 0;
}

.nm-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);
  cursor: default;
}

.nm-chart__legend-marker {
  display: inline-block;
  width: var(--nm-chart-legend-marker-size);
  height: var(--nm-chart-legend-marker-size);
  border-radius: 3px;
  flex-shrink: 0;
  @include nm-raised(2px, 3px);
}

.nm-chart__legend-label {
  user-select: none;
}

// Animations
@keyframes nm-chart-line-draw {
  from {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
  }
  to {
    stroke-dasharray: 2000;
    stroke-dashoffset: 0;
  }
}

@keyframes nm-chart-area-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes nm-chart-point-pop {
  from {
    r: 0;
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
