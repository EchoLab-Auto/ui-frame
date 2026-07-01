<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBarChart } from '@/composables/useBarChart'
import type { ChartSeries } from '@/composables/useBarChart'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'

export interface NeumorphismChartBarProps {
  series?: ChartSeries[]
  width?: string | number
  height?: string | number
  showTooltip?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showAxis?: boolean
  animate?: boolean
  yMin?: number
  yMax?: number
  title?: string
}

const props = withDefaults(defineProps<NeumorphismChartBarProps>(), {
  series: () => [],
  width: '100%',
  height: '300px',
  showTooltip: true,
  showLegend: true,
  showGrid: true,
  showAxis: true,
  animate: true,
})

const emit = defineEmits<{
  (e: 'bar-click', payload: { index: number; seriesIndex: number; value: number }): void
}>()

const { t } = useLocale()
const containerRef = ref<HTMLElement | null>(null)
const hoveredKey = ref<string | null>(null)
const instanceId = generateId('nm-bar')

const {
  bars,
  xAxisLabels,
  yAxisLabels,
  yAxisTicks,
  gridLines,
  plotSize,
  resolvedMargin,
  palette,
  tooltip,
  reducedMotion,
  showTooltip: showTooltipFn,
  hideTooltip,
  handleChartKeydown,
} = useBarChart({
  containerRef,
  series: computed(() => props.series),
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
  return `Bar chart: ${names}`
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

function barKey(bar: { dataIndex: number; seriesIndex: number }): string {
  return `${bar.dataIndex}-${bar.seriesIndex}`
}

function onBarClick(bar: { dataIndex: number; seriesIndex: number; value: number }): void {
  emit('bar-click', {
    index: bar.dataIndex,
    seriesIndex: bar.seriesIndex,
    value: bar.value,
  })
}

function onBarMouseEnter(bar: { dataIndex: number; seriesIndex: number }, event: MouseEvent): void {
  hoveredKey.value = barKey(bar)
  showTooltipFn(bar.dataIndex, bar.seriesIndex, event.clientX, event.clientY)
}

function onBarMouseLeave(): void {
  hoveredKey.value = null
  hideTooltip()
}

// Zero-baseline Y position
const zeroY = computed(() => {
  const ticks = yAxisTicks.value
  if (ticks.length < 2) return plotSize.value.height
  const yRange = ticks[ticks.length - 1] - ticks[0] || 1
  const yMinVal = ticks[0] ?? 0
  return plotSize.value.height - ((0 - yMinVal) / yRange) * plotSize.value.height
})
</script>

<template>
  <div :class="['nm-chart', 'nm-chart--bar']" :style="containerStyle">
    <!-- Title -->
    <div v-if="title || $slots.title" class="nm-chart__header">
      <span v-if="title" class="nm-chart__title">{{ title }}</span>
      <slot name="title" />
    </div>

    <!-- Chart body -->
    <div
      ref="containerRef"
      class="nm-chart__body"
      role="img"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="handleChartKeydown"
      @mouseleave="onBarMouseLeave"
    >
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="nm-chart__svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath :id="`nm-plot-clip-bar-${instanceId}`">
            <rect
              :x="resolvedMargin.left"
              :y="resolvedMargin.top"
              :width="plotSize.width"
              :height="plotSize.height + 1"
            />
          </clipPath>
        </defs>

        <!-- Grid lines -->
        <g v-if="showGrid" :clip-path="`url(#nm-plot-clip-bar-${instanceId})`">
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
          <line
            :x1="resolvedMargin.left"
            :y1="resolvedMargin.top + zeroY"
            :x2="resolvedMargin.left + plotSize.width"
            :y2="resolvedMargin.top + zeroY"
            stroke="var(--nm-chart-axis-color)"
            stroke-width="1"
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
            :x="resolvedMargin.left + (i + 0.5) * (plotSize.width / xAxisLabels.length)"
            :y="resolvedMargin.top + plotSize.height + 20"
            text-anchor="middle"
            fill="var(--nm-chart-label-color)"
            font-size="11"
            class="nm-chart__tick-label"
          >
            {{ label }}
          </text>
        </g>

        <!-- Bars -->
        <g :clip-path="`url(#nm-plot-clip-bar-${instanceId})`">
          <rect
            v-for="(bar, bi) in bars"
            :key="bi"
            :x="resolvedMargin.left + bar.x"
            :y="resolvedMargin.top + bar.y"
            :width="bar.width"
            :height="bar.height"
            :fill="bar.color"
            :rx="bar.width <= 6 || bar.height <= 6 ? 1 : 4"
            :class="[
              'nm-chart__bar',
              {
                'nm-chart__bar--hovered': hoveredKey === barKey(bar),
                'nm-chart__bar--focused': bar.isFocused,
                'nm-chart__bar--animate': shouldAnimate,
              },
            ]"
            :style="
              shouldAnimate ? { transformOrigin: 'bottom', animationDelay: `${bi * 40}ms` } : {}
            "
            role="img"
            :aria-label="`${bar.value}`"
            @click="onBarClick(bar)"
            @mouseenter="onBarMouseEnter(bar, $event)"
            @mouseleave="onBarMouseLeave"
          />
        </g>
      </svg>

      <!-- Tooltip -->
      <Transition name="nm-chart-tooltip">
        <div v-if="tooltip.visible && showTooltip" class="nm-chart__tooltip" :style="tooltipStyle">
          {{ tooltip.content }}
        </div>
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
    border-radius: var(--nm-border-radius-md);
    padding: 8px;
    cursor: crosshair;
    contain: layout style;
    outline: none;

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

// Bar styles — use CSS drop-shadow for neumorphism
.nm-chart__bar {
  cursor: pointer;
  transition:
    filter 0.3s $nm-ease-ambient,
    opacity 0.2s ease;
  filter: drop-shadow(2px 2px 3px var(--nm-shadow-dark))
    drop-shadow(-1.5px -1.5px 2px var(--nm-shadow-light));

  &--hovered,
  &--focused {
    filter: drop-shadow(4px 4px 5px var(--nm-shadow-dark-strong))
      drop-shadow(-2px -2px 3px var(--nm-shadow-light-strong));
  }

  &--animate {
    animation: nm-chart-bar-grow 0.5s $nm-ease-spring both;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &--animate {
      animation: none;
    }
  }
}

// Tooltip
.nm-chart__tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  padding: 8px 12px;
  background: var(--nm-chart-tooltip-bg);
  color: var(--nm-chart-tooltip-text);
  font-size: var(--nm-font-sm);
  border-radius: var(--nm-border-radius-sm);
  @include nm-raised(4px, 8px);
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nm-chart-tooltip-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s $nm-ease-spring;
}

.nm-chart-tooltip-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s $nm-ease-compress;
}

.nm-chart-tooltip-enter-from {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
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
@keyframes nm-chart-bar-grow {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
