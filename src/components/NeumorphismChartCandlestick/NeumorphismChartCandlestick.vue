<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCandlestickChart } from '@/composables/useCandlestickChart'
import type { OhlcDataPoint } from '@/composables/useCandlestickChart'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'

export interface NeumorphismChartCandlestickProps {
  data?: OhlcDataPoint[]
  width?: string | number
  height?: string | number
  showVolume?: boolean
  showMA?: boolean
  maPeriods?: number[]
  upColor?: string
  downColor?: string
  showTooltip?: boolean
  showGrid?: boolean
  showAxis?: boolean
  animate?: boolean
  title?: string
}

const props = withDefaults(defineProps<NeumorphismChartCandlestickProps>(), {
  data: () => [],
  width: '100%',
  height: '400px',
  showVolume: true,
  showMA: true,
  maPeriods: () => [5, 10, 20],
  showTooltip: true,
  showGrid: true,
  showAxis: true,
  animate: true,
})

const emit = defineEmits<{
  (
    e: 'candle-click',
    payload: {
      index: number
      open: number
      high: number
      low: number
      close: number
      volume: number
    }
  ): void
}>()

const { t } = useLocale()
const containerRef = ref<HTMLElement | null>(null)
const hoveredIndex = ref<number | null>(null)
const instanceId = generateId('nm-cs')

const {
  candles,
  volumeBars,
  maLines,
  xAxisLabels,
  yAxisLabels,
  yAxisTicks,
  volumeYAxisLabels,
  volumeYAxisTicks,
  gridLines,
  plotSize,
  resolvedMargin,
  priceAreaHeight,
  volumeAreaHeight,
  volumeAreaTop,
  resolvedShowVolume,
  resolvedShowMA,
  tooltip,
  reducedMotion,
  showTooltip: showTooltipFn,
  hideTooltip,
  handleChartKeydown,
} = useCandlestickChart({
  containerRef,
  data: computed(() => props.data),
  showVolume: props.showVolume,
  showMA: props.showMA,
  maPeriods: props.maPeriods,
  upColor: props.upColor,
  downColor: props.downColor,
  showTooltip: props.showTooltip,
  showGrid: props.showGrid,
  showAxis: props.showAxis,
  animate: props.animate,
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
  return `Candlestick chart with ${props.data.length} data points`
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

function onCandleClick(candle: {
  index: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}): void {
  emit('candle-click', {
    index: candle.index,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  })
}

function onCandleMouseEnter(
  candle: { index: number; open: number; high: number; low: number; close: number; volume: number },
  event: MouseEvent
): void {
  hoveredIndex.value = candle.index
  const content = [
    `${t('chartOhlcOpen')}: ${candle.open}`,
    `${t('chartOhlcHigh')}: ${candle.high}`,
    `${t('chartOhlcLow')}: ${candle.low}`,
    `${t('chartOhlcClose')}: ${candle.close}`,
    candle.volume ? `${t('chartVolume')}: ${candle.volume}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
  showTooltipFn(candle.index, 0, event.clientX, event.clientY)
  tooltip.value.content = content
}

function onCandleMouseLeave(): void {
  hoveredIndex.value = null
  hideTooltip()
}
</script>

<template>
  <div :class="['nm-chart', 'nm-chart--candlestick']" :style="containerStyle">
    <div v-if="title || $slots.title" class="nm-chart__header">
      <span v-if="title" class="nm-chart__title">{{ title }}</span>
      <slot name="title" />
    </div>

    <div
      ref="containerRef"
      class="nm-chart__body"
      role="img"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="handleChartKeydown"
      @mouseleave="onCandleMouseLeave"
    >
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="nm-chart__svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath :id="`nm-price-clip-${instanceId}`">
            <rect
              :x="resolvedMargin.left - 1"
              :y="resolvedMargin.top - 1"
              :width="plotSize.width + 2"
              :height="priceAreaHeight + 2"
            />
          </clipPath>
          <clipPath :id="`nm-volume-clip-${instanceId}`">
            <rect
              :x="resolvedMargin.left - 1"
              :y="resolvedMargin.top + volumeAreaTop - 1"
              :width="plotSize.width + 2"
              :height="volumeAreaHeight + 2"
            />
          </clipPath>
        </defs>

        <!-- Grid lines (price area) -->
        <g v-if="showGrid" :clip-path="`url(#nm-price-clip-${instanceId})`">
          <line
            v-for="(tick, i) in gridLines"
            :key="'g' + i"
            :x1="resolvedMargin.left"
            :y1="
              resolvedMargin.top +
              priceAreaHeight -
              ((tick - yAxisTicks[0]) / (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                priceAreaHeight
            "
            :x2="resolvedMargin.left + plotSize.width"
            :y2="
              resolvedMargin.top +
              priceAreaHeight -
              ((tick - yAxisTicks[0]) / (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                priceAreaHeight
            "
            stroke="var(--nm-chart-grid-color)"
            stroke-width="0.5"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Volume area grid -->
        <g v-if="showGrid && resolvedShowVolume" :clip-path="`url(#nm-volume-clip-${instanceId})`">
          <line
            v-for="(tick, i) in volumeYAxisTicks"
            :key="'vg' + i"
            :x1="resolvedMargin.left"
            :y1="
              resolvedMargin.top +
              volumeAreaTop +
              volumeAreaHeight -
              ((tick - volumeYAxisTicks[0]) /
                (volumeYAxisTicks[volumeYAxisTicks.length - 1] - volumeYAxisTicks[0] || 1)) *
                volumeAreaHeight
            "
            :x2="resolvedMargin.left + plotSize.width"
            :y2="
              resolvedMargin.top +
              volumeAreaTop +
              volumeAreaHeight -
              ((tick - volumeYAxisTicks[0]) /
                (volumeYAxisTicks[volumeYAxisTicks.length - 1] - volumeYAxisTicks[0] || 1)) *
                volumeAreaHeight
            "
            stroke="var(--nm-chart-grid-color)"
            stroke-width="0.3"
            stroke-dasharray="3,3"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Volume bars -->
        <g v-if="resolvedShowVolume" :clip-path="`url(#nm-volume-clip-${instanceId})`">
          <rect
            v-for="(bar, bi) in volumeBars"
            :key="'v' + bi"
            :x="resolvedMargin.left + bar.x"
            :y="resolvedMargin.top + bar.y"
            :width="bar.width"
            :height="Math.max(0.5, bar.height)"
            :fill="bar.color"
            :opacity="0.35"
            rx="1"
            :class="['nm-chart__volume-bar', { 'nm-chart__volume-bar--animate': shouldAnimate }]"
            :style="
              shouldAnimate ? { transformOrigin: 'bottom', animationDelay: `${bi * 20}ms` } : {}
            "
          />
        </g>

        <!-- MA lines (no clip-path so curves can overshoot naturally) -->
        <g
          v-if="resolvedShowMA && maLines.length > 0"
          :transform="`translate(${resolvedMargin.left}, ${resolvedMargin.top})`"
        >
          <path
            v-for="(line, li) in maLines"
            :key="'ma' + li"
            :d="line.path"
            fill="none"
            :stroke="line.color"
            :stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="['nm-chart__ma-line', { 'nm-chart__ma-line--animate': shouldAnimate }]"
            :style="shouldAnimate ? { animationDelay: `${li * 200}ms` } : {}"
          />
        </g>

        <!-- Candles -->
        <g :clip-path="`url(#nm-price-clip-${instanceId})`">
          <g
            v-for="(candle, ci) in candles"
            :key="'c' + ci"
            :class="{ 'nm-chart__candle-group--hovered': hoveredIndex === ci }"
          >
            <!-- Wick (shadow) -->
            <line
              :x1="resolvedMargin.left + candle.wickX"
              :y1="resolvedMargin.top + candle.wickY1"
              :x2="resolvedMargin.left + candle.wickX"
              :y2="resolvedMargin.top + candle.wickY2"
              stroke="var(--nm-chart-wick-color)"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
            <!-- Body -->
            <rect
              :x="resolvedMargin.left + candle.x"
              :y="resolvedMargin.top + candle.y"
              :width="candle.width"
              :height="Math.max(1, candle.height)"
              :fill="candle.color"
              :rx="candle.width <= 3 ? 1 : 2"
              :class="[
                'nm-chart__candle-body',
                {
                  'nm-chart__candle-body--up': candle.isUp,
                  'nm-chart__candle-body--down': !candle.isUp,
                  'nm-chart__candle-body--focused': candle.isFocused,
                  'nm-chart__candle-body--animate': shouldAnimate,
                },
              ]"
              :style="
                shouldAnimate ? { transformOrigin: 'bottom', animationDelay: `${ci * 15}ms` } : {}
              "
              @click="onCandleClick(candle)"
              @mouseenter="onCandleMouseEnter(candle, $event)"
              @mouseleave="onCandleMouseLeave"
            />
          </g>
        </g>

        <!-- Divider between price and volume -->
        <line
          v-if="resolvedShowVolume"
          :x1="resolvedMargin.left"
          :y1="resolvedMargin.top + volumeAreaTop"
          :x2="resolvedMargin.left + plotSize.width"
          :y2="resolvedMargin.top + volumeAreaTop"
          stroke="var(--nm-chart-axis-color)"
          stroke-width="0.5"
          stroke-dasharray="4,4"
          vector-effect="non-scaling-stroke"
        />

        <!-- Y-axis (price) -->
        <g v-if="showAxis">
          <line
            :x1="resolvedMargin.left"
            :y1="resolvedMargin.top"
            :x2="resolvedMargin.left"
            :y2="resolvedMargin.top + priceAreaHeight"
            stroke="var(--nm-chart-axis-color)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <text
            v-for="(label, i) in yAxisLabels"
            :key="'py' + i"
            :x="resolvedMargin.left - 8"
            :y="
              resolvedMargin.top +
              priceAreaHeight -
              ((yAxisTicks[i] - yAxisTicks[0]) /
                (yAxisTicks[yAxisTicks.length - 1] - yAxisTicks[0] || 1)) *
                priceAreaHeight
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

        <!-- Y-axis (volume, right side) -->
        <g v-if="showAxis && resolvedShowVolume">
          <text
            v-for="(label, i) in volumeYAxisLabels"
            :key="'vy' + i"
            :x="resolvedMargin.left + plotSize.width + 8"
            :y="
              resolvedMargin.top +
              volumeAreaTop +
              volumeAreaHeight -
              ((volumeYAxisTicks[i] - volumeYAxisTicks[0]) /
                (volumeYAxisTicks[volumeYAxisTicks.length - 1] - volumeYAxisTicks[0] || 1)) *
                volumeAreaHeight
            "
            text-anchor="start"
            dominant-baseline="middle"
            fill="var(--nm-chart-label-color)"
            font-size="10"
            class="nm-chart__tick-label"
          >
            {{ label }}
          </text>
        </g>

        <!-- X-axis (date) -->
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
            v-for="(item, i) in xAxisLabels"
            :key="'xl' + i"
            :x="resolvedMargin.left + item.x"
            :y="resolvedMargin.top + plotSize.height + 16"
            text-anchor="middle"
            fill="var(--nm-chart-label-color)"
            font-size="10"
            class="nm-chart__tick-label"
          >
            {{ item.label }}
          </text>
        </g>
      </svg>

      <!-- Tooltip -->
      <Transition name="nm-chart-tooltip">
        <div v-if="tooltip.visible && showTooltip" class="nm-chart__tooltip" :style="tooltipStyle">
          {{ tooltip.content }}
        </div>
      </Transition>
    </div>

    <!-- MA Legend -->
    <div v-if="resolvedShowMA && maLines.length > 0" class="nm-chart__legend" role="list">
      <div v-for="(line, li) in maLines" :key="li" class="nm-chart__legend-item" role="listitem">
        <span class="nm-chart__legend-marker" :style="{ backgroundColor: line.color }" />
        <span class="nm-chart__legend-label">{{ line.name }}</span>
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

// Candle body styles
.nm-chart__candle-body {
  cursor: pointer;
  transition:
    filter 0.2s ease,
    opacity 0.2s ease;

  &--up {
    filter: drop-shadow(1.5px 1.5px 2px var(--nm-shadow-dark))
      drop-shadow(-1px -1px 1.5px var(--nm-shadow-light));
  }

  &--down {
    filter: drop-shadow(1px 1px 1.5px var(--nm-shadow-dark));
    opacity: 0.85;
  }

  &--animate {
    animation: nm-chart-candle-grow 0.4s $nm-ease-spring both;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &--animate {
      animation: none;
    }
  }
}

.nm-chart__candle-group--hovered .nm-chart__candle-body {
  filter: drop-shadow(3px 3px 4px var(--nm-shadow-dark-strong))
    drop-shadow(-2px -2px 3px var(--nm-shadow-light-strong));
  opacity: 1;
}

// Volume bars
.nm-chart__volume-bar {
  transition: opacity 0.2s ease;

  &--animate {
    animation: nm-chart-bar-grow 0.4s $nm-ease-spring both;
  }

  @media (prefers-reduced-motion: reduce) {
    &--animate {
      animation: none;
    }
  }
}

// MA lines
.nm-chart__ma-line {
  transition: opacity 0.3s ease;

  &--animate {
    animation: nm-chart-line-draw 0.6s $nm-ease-ambient both;
  }

  @media (prefers-reduced-motion: reduce) {
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
  max-width: 320px;
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
@keyframes nm-chart-candle-grow {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

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
</style>
