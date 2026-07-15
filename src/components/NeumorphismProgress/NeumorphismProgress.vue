<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type ProgressVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'
export type ProgressEffect = 'default' | 'gradient' | 'striped' | 'glow' | 'segmented'

export interface NeumorphismProgressProps {
  modelValue?: number
  max?: number
  variant?: ProgressVariant
  size?: 'small' | 'medium' | 'large'
  /** Progress shape: linear bar (default) or circular SVG ring */
  type?: 'line' | 'circle'
  showLabel?: boolean
  indeterminate?: boolean
  striped?: boolean
  effect?: ProgressEffect
}

const props = withDefaults(defineProps<NeumorphismProgressProps>(), {
  modelValue: 0,
  max: 100,
  variant: 'primary',
  size: 'medium',
  showLabel: false,
  indeterminate: false,
  striped: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedVariant = computed(() =>
  resolveProp(props.variant, config.value.progress?.variant, 'primary')
)
const resolvedSize = computed(() => resolveProp(props.size, config.value.progress?.size, 'medium'))
const resolvedShowLabel = computed(() =>
  resolveProp(props.showLabel, config.value.progress?.showLabel, false)
)

const resolvedEffect = computed<ProgressEffect>(() => {
  if (props.effect !== undefined) return props.effect
  if (props.striped) return 'striped'
  return config.value.progress?.effect ?? 'default'
})

const { t } = useLocale()

const percentage = computed(() => {
  if (props.indeterminate) return 0
  return Math.min(100, Math.max(0, (props.modelValue / props.max) * 100))
})

const classList = computed(() => [
  'nm-progress',
  `nm-progress--${resolvedSize.value}`,
  `nm-progress--${resolvedVariant.value}`,
  `nm-progress--effect-${resolvedEffect.value}`,
  {
    'nm-progress--striped': resolvedEffect.value === 'striped',
    'nm-progress--indeterminate': props.indeterminate,
    'nm-progress--complete': !props.indeterminate && percentage.value >= 100,
  },
])

const variantColors: Record<ProgressVariant, string> = {
  default: 'var(--nm-text-secondary)',
  primary: 'var(--nm-primary-color)',
  success: 'var(--nm-color-success)',
  warning: 'var(--nm-color-warning)',
  error: 'var(--nm-color-error)',
}

const barStyle = computed(() => ({
  width: props.indeterminate ? '40%' : `${percentage.value}%`,
  '--nm-progress-bar-color': variantColors[resolvedVariant.value],
}))

// ---- Circle SVG geometry ----
const circleSize = computed(() => {
  switch (resolvedSize.value) {
    case 'small':
      return 64
    case 'large':
      return 160
    default:
      return 120
  }
})
const strokeWidth = computed(() =>
  resolvedSize.value === 'small' ? 4 : resolvedSize.value === 'large' ? 10 : 7
)
const radius = computed(() => (circleSize.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  if (props.indeterminate) return circumference.value * 0.75
  return circumference.value - (percentage.value / 100) * circumference.value
})
</script>

<template>
  <div
    :class="[...classList, ...(type === 'circle' ? ['nm-progress--circle'] : [])]"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-busy="indeterminate || undefined"
    :aria-valuetext="indeterminate ? t('progressIndeterminate') : undefined"
    :aria-label="
      resolvedShowLabel ? undefined : t('progressLabel', { percentage: Math.round(percentage) })
    "
    :style="type === 'circle' ? { width: `${circleSize}px`, height: `${circleSize}px` } : undefined"
  >
    <!-- Linear bar -->
    <template v-if="type !== 'circle'">
      <div class="nm-progress__track">
        <div class="nm-progress__bar" :style="barStyle" />
      </div>
      <span v-if="resolvedShowLabel" class="nm-progress__label">{{ Math.round(percentage) }}%</span>
    </template>

    <!-- Circular SVG ring -->
    <template v-else>
      <svg :width="circleSize" :height="circleSize" :viewBox="`0 0 ${circleSize} ${circleSize}`">
        <circle
          :cx="circleSize / 2"
          :cy="circleSize / 2"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          class="nm-progress-circle__track"
        />
        <circle
          :cx="circleSize / 2"
          :cy="circleSize / 2"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          :class="[
            'nm-progress-circle__fill',
            {
              'nm-progress-circle__fill--indeterminate': indeterminate,
              [`nm-progress-circle__fill--${resolvedVariant}`]: true,
            },
          ]"
        />
      </svg>
      <span v-if="resolvedShowLabel" class="nm-progress-circle__label"
        >{{ Math.round(percentage) }}%</span
      >
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.nm-progress__track {
  flex: 1;
  height: 12px;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border-radius: calc(12px / 2);
  @include nm-inset(3px, 6px);
}

.nm-progress__bar {
  height: 100%;
  border-radius: calc(12px / 2);
  background-color: var(--nm-progress-bar-color);
  transition: width 0.5s $nm-ease-spring;
  box-shadow:
    inset 0 -2px 4px var(--nm-shadow-dark),
    inset 0 2px 4px var(--nm-shadow-light-ambient-sm);
  position: relative;
  overflow: hidden;
}

// Shimmer sweep on the bar (default effect only)
.nm-progress--effect-default .nm-progress__bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--nm-shadow-light-ambient-md), transparent);
  animation: nm-progress-shimmer 2s ease-in-out infinite;
}

// Gradient flow effect
.nm-progress--effect-gradient .nm-progress__bar {
  background-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--nm-progress-bar-color) 60%, transparent),
    var(--nm-progress-bar-color),
    color-mix(in srgb, var(--nm-progress-bar-color) 60%, transparent)
  );
  background-size: 200% 100%;
  animation: nm-progress-gradient-flow 2s linear infinite;
}

// Striped fill effect
.nm-progress--effect-striped .nm-progress__bar {
  background-image: linear-gradient(
    -45deg,
    var(--nm-shadow-light-ambient-lg) 25%,
    transparent 25%,
    transparent 50%,
    var(--nm-shadow-light-ambient-lg) 50%,
    var(--nm-shadow-light-ambient-lg) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
  animation: nm-progress-striped 0.8s linear infinite;
}

// Glow / pulse effect
.nm-progress--effect-glow .nm-progress__bar {
  box-shadow:
    inset 0 -2px 4px var(--nm-shadow-dark),
    inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
    0 0 10px color-mix(in srgb, var(--nm-progress-bar-color) 55%, transparent);
  animation: nm-progress-glow 1.5s ease-in-out infinite;
}

// Segmented block effect
.nm-progress--effect-segmented .nm-progress__bar {
  background-image: repeating-linear-gradient(
    90deg,
    var(--nm-progress-bar-color) 0,
    var(--nm-progress-bar-color) 16px,
    transparent 16px,
    transparent 20px
  );
  background-color: transparent;
  animation: nm-progress-segmented-march 0.6s linear infinite;
}

// Glow on complete (100%)
.nm-progress--complete .nm-progress__bar {
  box-shadow:
    inset 0 -2px 4px var(--nm-shadow-dark),
    inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
    0 0 8px color-mix(in srgb, var(--nm-progress-bar-color) 30%, transparent);
  animation: nm-progress-complete-glow 1.5s ease-in-out infinite;
}

.nm-progress--complete .nm-progress__bar::after {
  animation: none;
}

.nm-progress--indeterminate .nm-progress__bar {
  animation: nm-progress-indeterminate 1.5s ease-in-out infinite;
}

.nm-progress__label {
  font-size: var(--nm-font-base);
  font-weight: 600;
  color: var(--nm-text-primary);
  min-width: 40px;
  text-align: right;
}

// Sizes
.nm-progress--small .nm-progress__track {
  height: 6px;
  border-radius: calc(6px / 2);
}
.nm-progress--large .nm-progress__track {
  height: 18px;
  border-radius: calc(18px / 2);
}

@keyframes nm-progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes nm-progress-striped {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 16px 0;
  }
}

@keyframes nm-progress-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

@keyframes nm-progress-gradient-flow {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@keyframes nm-progress-glow {
  0%,
  100% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 6px color-mix(in srgb, var(--nm-progress-bar-color) 40%, transparent);
  }
  50% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 14px color-mix(in srgb, var(--nm-progress-bar-color) 70%, transparent);
  }
}

@keyframes nm-progress-segmented-march {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}

@keyframes nm-progress-complete-glow {
  0%,
  100% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 6px color-mix(in srgb, var(--nm-progress-bar-color) 20%, transparent);
  }
  50% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 14px color-mix(in srgb, var(--nm-progress-bar-color) 40%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-progress__bar {
    transition: none;
  }
  .nm-progress__bar::after {
    animation: none;
  }
  .nm-progress--effect-gradient .nm-progress__bar,
  .nm-progress--effect-striped .nm-progress__bar,
  .nm-progress--effect-glow .nm-progress__bar,
  .nm-progress--effect-segmented .nm-progress__bar,
  .nm-progress--complete .nm-progress__bar,
  .nm-progress--indeterminate .nm-progress__bar {
    animation: none;
  }
  .nm-progress-circle__fill--indeterminate {
    animation: none;
  }
}

// ---- Circular progress ----
.nm-progress-circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    transform: rotate(-90deg);
  }

  &__track {
    stroke: var(--nm-surface-raised);
    transition: stroke var(--nm-transition-slow);
  }

  &__fill {
    stroke: var(--nm-primary-color);
    transition:
      stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1),
      stroke var(--nm-transition-slow);

    &--primary {
      stroke: var(--nm-primary-color);
    }
    &--success {
      stroke: var(--nm-color-success);
    }
    &--warning {
      stroke: var(--nm-color-warning);
    }
    &--error {
      stroke: var(--nm-color-error);
    }
    &--default {
      stroke: var(--nm-text-secondary);
    }

    &--indeterminate {
      animation: nm-progress-circle-spin 1.5s linear infinite;
      stroke-dasharray: 150 450;
    }
  }

  &__label {
    position: absolute;
    font-size: calc(var(--nm-font-base) * 1.2);
    font-weight: var(--nm-font-weight-semibold);
    color: var(--nm-text-primary);
  }
}

@keyframes nm-progress-circle-spin {
  0% {
    transform: rotate(0deg);
    transform-origin: center;
  }
  100% {
    transform: rotate(360deg);
    transform-origin: center;
  }
}
</style>
