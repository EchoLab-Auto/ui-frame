<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'

export type ProgressVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

export interface NeumorphismProgressProps {
  modelValue?: number
  max?: number
  variant?: ProgressVariant
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  indeterminate?: boolean
  striped?: boolean
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

const { t } = useLocale()

const percentage = computed(() => {
  if (props.indeterminate) return 0
  return Math.min(100, Math.max(0, (props.modelValue / props.max) * 100))
})

const classList = computed(() => [
  'nm-progress',
  `nm-progress--${props.size}`,
  `nm-progress--${props.variant}`,
  {
    'nm-progress--indeterminate': props.indeterminate,
    'nm-progress--striped': props.striped,
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
</script>

<template>
  <div
    :class="classList"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="showLabel ? undefined : t('progressLabel', { percentage: Math.round(percentage) })"
  >
    <div class="nm-progress__track">
      <div
        class="nm-progress__bar"
        :style="{
          width: indeterminate ? '40%' : `${percentage}%`,
          backgroundColor: variantColors[variant],
        }"
      />
    </div>
    <span v-if="showLabel" class="nm-progress__label">{{ Math.round(percentage) }}%</span>
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
  border-radius: 6px;
  @include nm-inset(3px, 6px);
}

.nm-progress__bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s $nm-ease-spring;
  box-shadow:
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

// Shimmer sweep on the bar
.nm-progress__bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  animation: nm-progress-shimmer 2s ease-in-out infinite;
}

// Glow on complete (100%)
.nm-progress--complete .nm-progress__bar {
  box-shadow:
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    0 0 8px rgba(108, 122, 224, 0.3);
  animation: nm-progress-complete-glow 1.5s ease-in-out infinite;
}

.nm-progress--complete .nm-progress__bar::after {
  animation: none;
}

.nm-progress--indeterminate .nm-progress__bar {
  animation: nm-progress-indeterminate 1.5s ease-in-out infinite;
}

.nm-progress--striped:not(.nm-progress--indeterminate) .nm-progress__bar {
  background-image: linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
  animation: nm-progress-striped 0.8s linear infinite;
}

.nm-progress__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--nm-text-primary);
  min-width: 40px;
  text-align: right;
}

// Sizes
.nm-progress--small .nm-progress__track {
  height: 6px;
  border-radius: 3px;
}
.nm-progress--large .nm-progress__track {
  height: 18px;
  border-radius: 9px;
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

@keyframes nm-progress-complete-glow {
  0%,
  100% {
    box-shadow:
      inset 0 -2px 4px rgba(0, 0, 0, 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.1),
      0 0 6px rgba(108, 122, 224, 0.2);
  }
  50% {
    box-shadow:
      inset 0 -2px 4px rgba(0, 0, 0, 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.1),
      0 0 14px rgba(108, 122, 224, 0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-progress__bar {
    transition: none;
  }
  .nm-progress__bar::after {
    animation: none;
  }
  .nm-progress--complete .nm-progress__bar {
    animation: none;
  }
}
</style>
