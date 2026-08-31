<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from '@/composables/useConfig'

export type ButtonVariant = 'raised' | 'pressed' | 'primary' | 'glow' | 'glass' | 'glass-raised'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonShape = 'rounded' | 'pill' | 'circle'

export interface NeumorphismButtonProps {
  /** Button display variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Button corner shape */
  shape?: ButtonShape
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the button is in loading state */
  loading?: boolean
  /** Whether the button is in a pressed/toggled state (sets aria-pressed) */
  pressed?: boolean
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset'
  /** Native button form attribute */
  form?: string
  /** Accessible label for the button */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismButtonProps>(), {
  disabled: false,
  loading: false,
  type: 'button',
})

// Global config overrides defaults (explicit props still take precedence)
const config = useConfig()
const resolvedVariant = computed(() => props.variant ?? config.value.button?.variant ?? 'raised')
const resolvedSize = computed(() => props.size ?? config.value.button?.size ?? 'medium')
const resolvedShape = computed(() => props.shape ?? config.value.button?.shape ?? 'rounded')

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const classList = computed(() => [
  'nm-button',
  `nm-button--${resolvedVariant.value}`,
  `nm-button--${resolvedSize.value}`,
  `nm-button--${resolvedShape.value}`,
  {
    'nm-button--disabled': isDisabled.value,
    'nm-button--loading': props.loading,
  },
])

function handleClick(event: MouseEvent): void {
  if (isDisabled.value) return
  emit('click', event)
}
</script>

<template>
  <button
    :class="classList"
    :type="type"
    :form="form"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :aria-busy="loading ? true : undefined"
    :aria-pressed="pressed !== undefined ? pressed : undefined"
    :aria-disabled="isDisabled ? true : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="nm-button__spinner">
      <svg
        v-once
        class="nm-button__spinner-svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="31.42"
          stroke-dashoffset="10"
        />
      </svg>
    </span>
    <span class="nm-button__content" :class="{ 'nm-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  @include nm-theme-transition;

  // Focus state
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--nm-primary-color),
      4px 4px 8px var(--nm-shadow-dark),
      -4px -4px 8px var(--nm-shadow-light);
  }

  // Disabled state
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// ---------- Size variants ----------
.nm-button--small {
  padding: var(--nm-button-padding-y-sm) var(--nm-button-padding-x-sm);
  font-size: var(--nm-button-font-sm);
  min-height: var(--nm-button-min-height-sm);
}

.nm-button--medium {
  padding: var(--nm-button-padding-y-md) var(--nm-button-padding-x-md);
  font-size: var(--nm-button-font-md);
  min-height: var(--nm-button-min-height-md);
}

.nm-button--large {
  padding: var(--nm-button-padding-y-lg) var(--nm-button-padding-x-lg);
  font-size: var(--nm-button-font-lg);
  min-height: var(--nm-button-min-height-lg);
}

// ---------- Shape variants ----------
.nm-button--rounded {
  border-radius: var(--nm-border-radius-md);
}

.nm-button--pill {
  border-radius: var(--nm-border-radius-full);
}

.nm-button--circle {
  border-radius: var(--nm-border-radius-full);
  padding: 0;
  width: var(--nm-button-min-height);
  height: var(--nm-button-min-height);
}

// ---------- Style variants ----------

// Raised (default) — convex shadow, lifts toward finger on hover
.nm-button--raised {
  box-shadow:
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-2px);
    box-shadow:
      0 3px 6px var(--nm-shadow-ambient-xl),
      6px 6px 14px var(--nm-shadow-dark),
      -3px -3px 10px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// Pressed — inset shadow, sinks deeper on press
.nm-button--pressed {
  box-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark-deep),
    inset -3px -3px 6px var(--nm-shadow-light-deep);
  transition: box-shadow 0.3s ease;

  &:not(.nm-button--disabled):hover {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark-deep),
      inset -4px -4px 8px var(--nm-shadow-light-deep);
  }

  &:not(.nm-button--disabled):active {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark-deep),
      inset -5px -5px 10px var(--nm-shadow-light-deep);
    transition: box-shadow 0.1s ease;
  }
}

// Primary — gradient fill with semantic color
.nm-button--primary {
  background: linear-gradient(
    135deg,
    var(--nm-color-primary-400),
    var(--nm-color-primary-500),
    var(--nm-color-primary-600)
  );
  color: var(--nm-text-on-primary);
  box-shadow:
    0 2px 6px color-mix(in srgb, var(--nm-primary-color) 35%, transparent),
    -2px -2px 6px var(--nm-shadow-light);

  &:not(.nm-button--disabled):hover {
    background: linear-gradient(
      135deg,
      var(--nm-color-primary-300),
      var(--nm-color-primary-400),
      var(--nm-color-primary-500)
    );
    transform: translateY(-2px);
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--nm-primary-color) 50%, transparent),
      -3px -3px 10px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(0);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
  }
}

// Glow — raised button with animated glow pulse
.nm-button--glow {
  box-shadow:
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light),
    0 0 12px color-mix(in srgb, var(--nm-primary-color) 30%, transparent);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-2px);
    box-shadow:
      0 3px 6px var(--nm-shadow-ambient-xl),
      6px 6px 14px var(--nm-shadow-dark),
      -3px -3px 10px var(--nm-shadow-light),
      0 0 24px color-mix(in srgb, var(--nm-primary-color) 50%, transparent);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// Glass — floating frosted glass, levitates further on hover
.nm-button--glass {
  background: var(--nm-glass-bg);
  backdrop-filter: blur(var(--nm-glass-blur));
  -webkit-backdrop-filter: blur(var(--nm-glass-blur));
  border: 1px solid color-mix(in srgb, var(--nm-shadow-light) 25%, transparent);
  box-shadow:
    0 8px 24px var(--nm-shadow-ambient-lg),
    0 2px 6px color-mix(in srgb, var(--nm-shadow-dark) 25%, transparent);
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--nm-transition-slow);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-3px);
    background: color-mix(in srgb, var(--nm-surface-color) 75%, transparent);
    box-shadow:
      0 14px 36px var(--nm-shadow-ambient-xl),
      0 4px 10px color-mix(in srgb, var(--nm-shadow-dark) 30%, transparent);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    background: color-mix(in srgb, var(--nm-surface-color) 55%, transparent);
    box-shadow:
      0 2px 8px var(--nm-shadow-ambient-sm),
      0 1px 3px color-mix(in srgb, var(--nm-shadow-dark) 20%, transparent);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// Glass raised — neumorphic convex shadows over a frosted glass surface
.nm-button--glass-raised {
  background: var(--nm-glass-bg);
  backdrop-filter: blur(var(--nm-glass-blur));
  -webkit-backdrop-filter: blur(var(--nm-glass-blur));
  border: 1px solid color-mix(in srgb, var(--nm-shadow-light) 18%, transparent);
  box-shadow:
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--nm-transition-slow);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--nm-surface-color) 75%, transparent);
    box-shadow:
      0 3px 6px var(--nm-shadow-ambient-xl),
      6px 6px 14px var(--nm-shadow-dark),
      -3px -3px 10px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    background: color-mix(in srgb, var(--nm-surface-color) 55%, transparent);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// ---------- Loading spinner ----------
.nm-button__spinner {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--nm-text-secondary);

  svg {
    width: 100%;
    height: 100%;
  }
}

.nm-button__spinner-svg {
  animation: nm-spin 1s linear infinite;
}

@keyframes nm-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.nm-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  transition: opacity var(--nm-transition-fast);

  &--hidden {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
