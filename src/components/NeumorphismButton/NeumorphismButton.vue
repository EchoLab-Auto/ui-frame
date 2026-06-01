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
    @click="handleClick"
  >
    <span v-if="loading" class="nm-button__spinner">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// Raised (default) - convex shadow
.nm-button--raised {
  @include nm-raised(4px, 8px);
  transition: box-shadow var(--nm-transition-fast), transform var(--nm-transition-fast);

  &:not(.nm-button--disabled):hover {
    transform: translateY(-2px);
    box-shadow:
      6px 6px 12px var(--nm-shadow-dark),
      -6px -6px 12px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    @include nm-inset(3px, 6px);
  }
}

// Flat - subtle shadow
.nm-button--flat {
  box-shadow:
    2px 2px 4px var(--nm-shadow-dark),
    -2px -2px 4px var(--nm-shadow-light);
  transition: box-shadow var(--nm-transition-fast), transform var(--nm-transition-fast);

  &:not(.nm-button--disabled):hover {
    box-shadow:
      4px 4px 8px var(--nm-shadow-dark),
      -4px -4px 8px var(--nm-shadow-light);
  }

  &:not(.nm-button--disabled):active {
    @include nm-inset(2px, 4px);
  }
}

// Pressed - inset shadow
.nm-button--pressed {
  @include nm-inset(3px, 6px);
  transition: box-shadow var(--nm-transition-fast);

  &:not(.nm-button--disabled):hover {
    @include nm-inset(4px, 8px);
  }

  &:not(.nm-button--disabled):active {
    @include nm-inset(5px, 10px);
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
