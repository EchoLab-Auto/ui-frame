<script setup lang="ts">
import { computed } from 'vue'

export type ButtonVariant = 'raised' | 'flat' | 'pressed'
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
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset'
  /** Native button form attribute */
  form?: string
  /** Accessible label for the button */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismButtonProps>(), {
  variant: 'raised',
  size: 'medium',
  shape: 'rounded',
  disabled: false,
  loading: false,
  type: 'button',
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const classList = computed(() => [
  'nm-button',
  `nm-button--${props.variant}`,
  `nm-button--${props.size}`,
  `nm-button--${props.shape}`,
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
    @click="handleClick"
  >
    <span v-if="loading" class="nm-button__spinner">
      <svg v-once viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="31.42"
          stroke-dashoffset="10"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
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
  padding: 8px 16px;
  font-size: 13px;
  min-height: 32px;
}

.nm-button--medium {
  padding: 12px 24px;
  font-size: 14px;
  min-height: 44px;
}

.nm-button--large {
  padding: 16px 32px;
  font-size: 16px;
  min-height: 56px;
}

// ---------- Shape variants ----------
.nm-button--rounded {
  border-radius: var(--nm-border-radius-md);
}

.nm-button--pill {
  border-radius: var(--nm-border-radius-full);
}

.nm-button--circle {
  border-radius: 50%;
  padding: 0;

  &.nm-button--small {
    width: 32px;
    height: 32px;
  }

  &.nm-button--medium {
    width: 44px;
    height: 44px;
  }

  &.nm-button--large {
    width: 56px;
    height: 56px;
  }
}

// ---------- Style variants ----------

// Raised (default) — convex shadow, lifts toward finger on hover
.nm-button--raised {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-2px);
    box-shadow:
      0 3px 6px rgba(0, 0, 0, 0.1),
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

// Flat — subtle shadow, firms up on hover
.nm-button--flat {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    2px 2px 4px var(--nm-shadow-dark),
    -1px -1px 3px var(--nm-shadow-light);
  transition:
    box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-1px);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.06),
      4px 4px 8px var(--nm-shadow-dark),
      -2px -2px 6px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(0);
    box-shadow:
      inset 2px 2px 4px var(--nm-shadow-dark-deep),
      inset -2px -2px 4px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.1s ease,
      transform 0.1s ease;
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

.nm-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  transition: opacity var(--nm-transition-fast);

  &--hidden {
    opacity: 0;
  }
}
</style>
