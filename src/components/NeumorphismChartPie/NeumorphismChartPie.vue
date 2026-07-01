<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePieChart } from '@/composables/usePieChart'
import type { ChartDataPoint } from '@/composables/usePieChart'
import { useLocale } from '@/composables/useLocale'

export interface NeumorphismChartPieProps {
  data?: ChartDataPoint[]
  width?: string | number
  height?: string | number
  innerRadius?: number
  padAngle?: number
  startAngle?: number
  labelPosition?: 'inside' | 'outside' | 'none'
  roundedCorners?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  animate?: boolean
  title?: string
  colorPalette?: string[]
}

const props = withDefaults(defineProps<NeumorphismChartPieProps>(), {
  data: () => [],
  width: '100%',
  height: '300px',
  innerRadius: 0,
  padAngle: 0.02,
  startAngle: -90,
  labelPosition: 'outside',
  roundedCorners: false,
  showTooltip: true,
  showLegend: true,
  animate: true,
  colorPalette: () => [],
})

const emit = defineEmits<{
  (e: 'arc-click', payload: { index: number; value: number; label: string }): void
}>()

const { t } = useLocale()
const containerRef = ref<HTMLElement | null>(null)
const hoveredArcIndex = ref<number | null>(null)

const {
  arcs,
  total,
  resolvedInnerRadius,
  resolvedLabelPosition,
  plotSize,
  resolvedMargin,
  tooltip,
  reducedMotion,
  showTooltip: showTooltipFn,
  hideTooltip,
  handleChartKeydown,
  effectivePalette,
} = usePieChart({
  containerRef,
  data: computed(() => props.data),
  innerRadius: props.innerRadius,
  padAngle: props.padAngle,
  startAngle: props.startAngle,
  labelPosition: props.labelPosition,
  roundedCorners: props.roundedCorners,
  showTooltip: props.showTooltip,
  showLegend: props.showLegend,
  animate: props.animate,
  colorPalette: props.colorPalette,
})

const svgWidth = computed(
  () => plotSize.value.width + resolvedMargin.value.left + resolvedMargin.value.right
)
const svgHeight = computed(
  () => plotSize.value.height + resolvedMargin.value.top + resolvedMargin.value.bottom
)

const cx = computed(() => resolvedMargin.value.left + plotSize.value.width / 2)
const cy = computed(() => resolvedMargin.value.top + plotSize.value.height / 2)

const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const ariaLabel = computed(() => {
  const items = props.data.map(d => `${d.label ?? ''}: ${d.value}`).join(', ')
  return `Pie chart: ${items}`
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

function onArcClick(arc: { index: number; value: number; label: string }): void {
  emit('arc-click', {
    index: arc.index,
    value: arc.value,
    label: arc.label,
  })
}

function onArcMouseEnter(
  arc: { index: number; label: string; value: number },
  event: MouseEvent
): void {
  hoveredArcIndex.value = arc.index
  showTooltipFn(arc.index, 0, event.clientX, event.clientY)
}

function onArcMouseLeave(): void {
  hoveredArcIndex.value = null
  hideTooltip()
}

function getColor(index: number, pointColor?: unknown): string {
  return (
    (pointColor as string | undefined) ??
    effectivePalette.value[index % effectivePalette.value.length] ??
    'var(--nm-chart-color-1)'
  )
}
</script>

<template>
  <div :class="['nm-chart', 'nm-chart--pie']" :style="containerStyle">
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
      @mouseleave="onArcMouseLeave"
    >
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="nm-chart__svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Arcs -->
        <g v-if="total > 0">
          <path
            v-for="(arc, ai) in arcs"
            :key="ai"
            :d="arc.path"
            :fill="arc.color"
            stroke="var(--nm-surface-color)"
            stroke-width="2"
            :class="[
              'nm-chart__arc',
              {
                'nm-chart__arc--hovered': hoveredArcIndex === arc.index,
                'nm-chart__arc--focused': arc.isFocused,
                'nm-chart__arc--animate': shouldAnimate,
              },
            ]"
            :style="
              shouldAnimate
                ? { transformOrigin: `${cx}px ${cy}px`, animationDelay: `${ai * 100}ms` }
                : {}
            "
            role="img"
            :aria-label="`${arc.label}: ${arc.percentage}%`"
            @click="onArcClick(arc)"
            @mouseenter="onArcMouseEnter(arc, $event)"
            @mouseleave="onArcMouseLeave"
          />

          <!-- Outside labels -->
          <template v-if="resolvedLabelPosition === 'outside'">
            <line
              v-for="(arc, ai) in arcs"
              :key="'line' + ai"
              :x1="arc.centroidX"
              :y1="arc.centroidY"
              :x2="arc.labelX"
              :y2="arc.labelY"
              stroke="var(--nm-chart-axis-color)"
              stroke-width="0.5"
            />
            <text
              v-for="(arc, ai) in arcs"
              :key="'lbl' + ai"
              :x="(arc.labelX ?? 0) + (arc.labelAnchor === 'start' ? 4 : -4)"
              :y="arc.labelY"
              :text-anchor="arc.labelAnchor"
              dominant-baseline="middle"
              fill="var(--nm-chart-label-color)"
              font-size="11"
              class="nm-chart__tick-label"
            >
              {{ arc.label || `${arc.percentage}%` }}
            </text>
          </template>

          <!-- Inside labels -->
          <text
            v-for="(arc, ai) in arcs"
            v-show="resolvedLabelPosition === 'inside'"
            :key="'ilbl' + ai"
            :x="arc.centroidX"
            :y="arc.centroidY"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="var(--nm-text-on-primary)"
            font-size="11"
            font-weight="600"
            class="nm-chart__tick-label"
          >
            {{ arc.percentage }}%
          </text>
        </g>

        <!-- Empty state -->
        <text
          v-if="total === 0"
          :x="cx"
          :y="cy"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="var(--nm-text-placeholder)"
          font-size="13"
        >
          {{ t('chartNoData') }}
        </text>

        <!-- Center slot (for donut charts) -->
        <foreignObject
          v-if="resolvedInnerRadius > 0"
          :x="cx - resolvedInnerRadius"
          :y="cy - resolvedInnerRadius"
          :width="resolvedInnerRadius * 2"
          :height="resolvedInnerRadius * 2"
        >
          <div class="nm-chart__center-slot" xmlns="http://www.w3.org/1999/xhtml">
            <slot name="center" :total="total" />
          </div>
        </foreignObject>
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
      v-if="showLegend && data.length > 0"
      class="nm-chart__legend"
      role="list"
      :aria-label="t('chartLegend')"
    >
      <div v-for="(d, di) in data" :key="di" class="nm-chart__legend-item" role="listitem">
        <span class="nm-chart__legend-marker" :style="{ backgroundColor: getColor(di, d.color) }" />
        <span class="nm-chart__legend-label">{{ d.label ?? `Item ${di + 1}` }}</span>
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
    cursor: default;
    contain: layout style;
    outline: none;

    &:focus-visible {
      box-shadow:
        inset 6px 6px 12px var(--nm-shadow-dark-deep),
        inset -6px -6px 12px var(--nm-shadow-light-deep),
        0 0 0 2px var(--nm-primary-color);
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

  &__center-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-align: center;
    color: var(--nm-text-primary);
    font-size: var(--nm-font-sm);
  }
}

// Arc styles — neumorphism raised
.nm-chart__arc {
  cursor: pointer;
  transition:
    filter 0.3s $nm-ease-ambient,
    transform 0.3s $nm-ease-spring;
  filter: drop-shadow(2px 2px 3px var(--nm-shadow-dark))
    drop-shadow(-1.5px -1.5px 2px var(--nm-shadow-light));

  &--hovered,
  &--focused {
    filter: drop-shadow(4px 4px 6px var(--nm-shadow-dark-strong))
      drop-shadow(-2px -2px 4px var(--nm-shadow-light-strong));
    transform: scale(1.03);
  }

  &--animate {
    animation: nm-chart-arc-expand 0.5s $nm-ease-spring both;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &--hovered,
    &--focused {
      transform: none;
    }

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
@keyframes nm-chart-arc-expand {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
