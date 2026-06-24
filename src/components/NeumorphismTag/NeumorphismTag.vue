<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

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

const { config, resolveProp } = useNeumorphismSetup()

const resolvedVariant = computed(() =>
  resolveProp(props.variant, config.value.tag?.variant, 'default')
)
const resolvedSize = computed(() => resolveProp(props.size, config.value.tag?.size, 'medium'))
const resolvedRounded = computed(() => resolveProp(props.rounded, config.value.tag?.rounded, false))

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
  `nm-tag--${resolvedVariant.value}`,
  `nm-tag--${resolvedSize.value}`,
  {
    'nm-tag--rounded': resolvedRounded.value,
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
    :style="
      resolvedVariant !== 'default' ? { '--tag-color': variantColors[resolvedVariant] } : undefined
    "
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
  gap: var(--nm-tag-gap);
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
    color: var(--nm-text-on-primary);
    box-shadow:
      2px 2px 4px var(--nm-shadow-dark),
      -1px -1px 3px var(--nm-shadow-light-ambient-lg);

    .nm-tag__close {
      color: color-mix(in srgb, var(--nm-text-on-primary) 70%, transparent);
    }
    .nm-tag__close:hover {
      color: var(--nm-text-on-primary);
    }

    @media (hover: hover) {
      &:hover:not(.nm-tag--disabled) {
        box-shadow:
          3px 3px 8px color-mix(in srgb, black 25%, transparent),
          -2px -2px 6px var(--nm-shadow-light-ambient-md);
        filter: brightness(1.05);
      }
    }
  }
}

.nm-tag__text {
  font-size: var(--nm-font-md);
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
  border-radius: var(--nm-border-radius-full);

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
  padding: var(--nm-tag-padding-y-sm) var(--nm-tag-padding-x-sm);
  font-size: var(--nm-tag-font-sm);
  height: 22px;
}
.nm-tag--medium {
  padding: var(--nm-tag-padding-y-md) var(--nm-tag-padding-x-md);
  font-size: var(--nm-tag-font-md);
  height: 28px;
}
.nm-tag--large {
  padding: var(--nm-tag-padding-y-lg) var(--nm-tag-padding-x-lg);
  font-size: var(--nm-tag-font-lg);
  height: 34px;
}
</style>
