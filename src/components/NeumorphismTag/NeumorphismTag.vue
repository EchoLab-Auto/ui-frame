<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

export interface NeumorphismTagProps {
  closable?: boolean
  variant?: TagVariant
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  rounded?: boolean
  /** Accessible label for the close button */
  closeLabel?: string
}

const props = withDefaults(defineProps<NeumorphismTagProps>(), {
  closable: false,
  variant: 'default',
  size: 'medium',
  disabled: false,
  rounded: false,
  closeLabel: '',
})

const emit = defineEmits<{
  (e: 'close', event: MouseEvent): void
  (e: 'click', event: MouseEvent): void
}>()

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel || t('tagClose'))

function handleClose(event: MouseEvent) {
  if (props.disabled) return
  event.stopPropagation()
  emit('close', event)
}

const classList = computed(() => [
  'nm-tag',
  `nm-tag--${props.variant}`,
  `nm-tag--${props.size}`,
  {
    'nm-tag--rounded': props.rounded,
    'nm-tag--disabled': props.disabled,
    'nm-tag--closable': props.closable,
  },
])

const variantColors: Record<TagVariant, string> = {
  default: '',
  primary: 'var(--nm-primary-color)',
  success: 'var(--nm-color-success)',
  warning: 'var(--nm-color-warning)',
  error: 'var(--nm-color-error)',
  info: 'var(--nm-color-info)',
}
</script>

<template>
  <span
    :class="classList"
    :style="variant !== 'default' ? { '--tag-color': variantColors[variant] } : undefined"
    role="status"
    @click="emit('click', $event)"
  >
    <span class="nm-tag__text">
      <slot />
    </span>
    <button
      v-if="closable"
      class="nm-tag__close"
      :aria-label="resolvedCloseLabel"
      type="button"
      @click="handleClose"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </span>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-sm);
  @include nm-raised(1px, 3px);
  transition:
    box-shadow 0.3s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    background-color 0.3s $nm-ease-ambient;
  user-select: none;
  white-space: nowrap;

  &--rounded {
    border-radius: var(--nm-border-radius-full);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--closable {
    cursor: default;
  }

  @media (hover: hover) {
    &:hover:not(.nm-tag--disabled) {
      transform: translateY(-1px);
      box-shadow:
        3px 3px 8px var(--nm-shadow-dark),
        -2px -2px 6px var(--nm-shadow-light);
    }
  }

  &:active:not(.nm-tag--disabled) {
    transform: translateY(0);
    transition:
      transform 0.1s $nm-ease-compress,
      box-shadow 0.1s $nm-ease-compress;
  }

  // Colored variants
  &--primary,
  &--success,
  &--warning,
  &--error,
  &--info {
    background-color: var(--tag-color);
    color: #fff;
    box-shadow:
      2px 2px 4px rgba(0, 0, 0, 0.15),
      -1px -1px 3px rgba(255, 255, 255, 0.2);

    .nm-tag__close {
      color: rgba(255, 255, 255, 0.7);
    }
    .nm-tag__close:hover {
      color: #fff;
    }

    @media (hover: hover) {
      &:hover:not(.nm-tag--disabled) {
        box-shadow:
          3px 3px 8px rgba(0, 0, 0, 0.25),
          -2px -2px 6px rgba(255, 255, 255, 0.15);
        filter: brightness(1.05);
      }
    }
  }
}

.nm-tag__text {
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.nm-tag__close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  transition:
    color 0.2s ease,
    transform 0.25s $nm-ease-spring;
  border-radius: 50%;

  &:hover {
    color: var(--nm-text-primary);
    transform: rotate(90deg);
  }

  &:active {
    transform: rotate(90deg) scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-tag {
    transition: none;
  }
  .nm-tag__close {
    transition: none;
  }
}

// Sizes
.nm-tag--small {
  padding: 2px 8px;
  font-size: 11px;
  height: 22px;
}
.nm-tag--medium {
  padding: 4px 12px;
  font-size: 13px;
  height: 28px;
}
.nm-tag--large {
  padding: 6px 16px;
  font-size: 14px;
  height: 34px;
}
</style>
