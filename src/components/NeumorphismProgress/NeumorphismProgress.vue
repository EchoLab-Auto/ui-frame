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
</script>

<template>
  <div
    :class="classList"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-busy="indeterminate || undefined"
    :aria-valuetext="indeterminate ? t('progressIndeterminate') : undefined"
    :aria-label="
      resolvedShowLabel ? undefined : t('progressLabel', { percentage: Math.round(percentage) })
    "
  >
    <div class="nm-progress__track">
      <div class="nm-progress__bar" :style="barStyle" />
    </div>
    <span v-if="resolvedShowLabel" class="nm-progress__label">{{ Math.round(percentage) }}%</span>
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
}
</style>
