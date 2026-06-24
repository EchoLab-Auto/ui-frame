<script setup lang="ts">
import { computed, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useAlert, type AlertType } from '@/composables/useAlert'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type { AlertType }

export interface NeumorphismAlertProps {
  type?: AlertType
  title?: string
  message?: string
  closable?: boolean
  duration?: number
  icon?: boolean
  bordered?: boolean
  size?: 'small' | 'medium' | 'large'
  /** Accessible label for the close button */
  closeLabel?: string
}

const props = withDefaults(defineProps<NeumorphismAlertProps>(), {
  type: 'info',
  title: '',
  message: '',
  closable: true,
  duration: 0,
  icon: true,
  bordered: true,
  size: 'medium',
  closeLabel: '',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { resolveProp } = useNeumorphismSetup()

const resolvedType = computed(() => resolveProp(props.type, undefined, 'info' as AlertType))
const resolvedClosable = computed(() => resolveProp(props.closable, undefined, true))
const resolvedDuration = computed(() => resolveProp(props.duration, undefined, 0))
const resolvedIcon = computed(() => resolveProp(props.icon, undefined, true))
const resolvedBordered = computed(() => resolveProp(props.bordered, undefined, true))
const resolvedSize = computed(() => resolveProp(props.size, undefined, 'medium'))

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel || t('alertClose'))

// Headless alert state management
const { isVisible, close, leaving } = useAlert({
  duration: resolvedDuration.value,
})

// Re-create the alert composable if duration changes via config
watch(resolvedDuration, newDuration => {
  // The composable auto-close is set at creation time only.
  // For prop/ config reactivity on duration, the parent should
  // re-mount the alert. This watcher provides a best-effort
  // reactive path: if the alert is still visible and duration
  // increases from 0 to >0, schedule a new close.
  if (isVisible.value && !leaving.value && newDuration > 0) {
    setTimeout(() => close(), newDuration)
  }
})

function handleClose() {
  close()
  // Emit after the leave animation completes so the parent can
  // remove the alert DOM node or respond once fully hidden.
  setTimeout(() => {
    emit('close')
  }, 300)
}

const classList = computed(() => [
  'nm-alert',
  `nm-alert--${resolvedType.value}`,
  `nm-alert--${resolvedSize.value}`,
  {
    'nm-alert--bordered': resolvedBordered.value,
    'nm-alert--leaving': leaving.value,
    'nm-alert--hidden': !isVisible.value,
  },
])

/**
 * Built-in SVG icons for each alert type.
 * Consumers can override via the "icon" slot.
 */
const defaultIcons: Record<AlertType, { viewBox: string; paths: string[] }> = {
  info: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    ],
  },
  success: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    ],
  },
  warning: {
    viewBox: '0 0 24 24',
    paths: ['M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'],
  },
  error: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    ],
  },
}
</script>

<template>
  <transition name="nm-alert-fade">
    <div
      v-if="isVisible"
      :class="classList"
      role="alert"
      :aria-live="resolvedType === 'error' ? 'assertive' : 'polite'"
    >
      <!-- Icon section -->
      <!-- @slot Custom icon content. Defaults to type-based SVG icon. -->
      <div v-if="resolvedIcon" class="nm-alert__icon" aria-hidden="true">
        <slot name="icon">
          <svg
            width="20"
            height="20"
            :viewBox="defaultIcons[resolvedType].viewBox"
            fill="currentColor"
          >
            <path v-for="(d, i) in defaultIcons[resolvedType].paths" :key="i" :d="d" />
          </svg>
        </slot>
      </div>

      <!-- Content section -->
      <div class="nm-alert__content">
        <!-- @slot Full custom content. Overrides title + message. -->
        <slot>
          <div v-if="title" class="nm-alert__title">{{ title }}</div>
          <div v-if="message" class="nm-alert__message">{{ message }}</div>
        </slot>
      </div>

      <!-- Close button -->
      <button
        v-if="resolvedClosable"
        class="nm-alert__close"
        :aria-label="resolvedCloseLabel"
        type="button"
        @click="handleClose"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Alert box
// ==========================================
.nm-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-alert-padding-y) var(--nm-alert-padding-x);
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(2px, 6px);
  @include nm-theme-transition;
  position: relative;
  overflow: hidden;
  line-height: 1.5;

  // ---- Variants ----
  &--info {
    color: var(--nm-color-info);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-info);
    }
  }

  &--success {
    color: var(--nm-color-success);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-success);
    }
  }

  &--warning {
    color: var(--nm-color-warning);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-warning);
    }
  }

  &--error {
    color: var(--nm-color-error);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-error);
    }
  }

  // ---- States ----
  &--hidden {
    display: none;
  }
}

// ==========================================
// Icon
// ==========================================
.nm-alert__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 1px; // optical alignment with text

  svg {
    display: block;
    color: inherit;
  }
}

// ==========================================
// Content
// ==========================================
.nm-alert__content {
  flex: 1;
  min-width: 0;
}

.nm-alert__title {
  font-size: var(--nm-alert-title-font);
  font-weight: 600;
  margin-bottom: var(--nm-alert-title-margin-bottom);
}

.nm-alert__message {
  font-size: var(--nm-alert-font);
}

// ==========================================
// Close button
// ==========================================
.nm-alert__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 2px;
  border: none;
  background: none;
  color: var(--nm-text-placeholder);
  cursor: pointer;
  border-radius: var(--nm-border-radius-xs);
  transition:
    color 0.2s ease,
    transform 0.25s $nm-ease-spring,
    background-color 0.2s ease;

  &:hover {
    color: var(--nm-text-primary);
    background-color: var(--nm-surface-raised);
    transform: rotate(90deg);
  }

  &:active {
    transform: rotate(90deg) scale(0.85);
  }
}

// ==========================================
// Sizes
// ==========================================
.nm-alert--small {
  --nm-alert-padding-y: var(--nm-alert-padding-y-sm);
  --nm-alert-padding-x: var(--nm-alert-padding-x-sm);
  --nm-alert-font: var(--nm-alert-font-sm);
  --nm-alert-title-font: var(--nm-alert-title-font-sm);
}

.nm-alert--medium {
  --nm-alert-padding-y: var(--nm-alert-padding-y-md);
  --nm-alert-padding-x: var(--nm-alert-padding-x-md);
  --nm-alert-font: var(--nm-alert-font-md);
  --nm-alert-title-font: var(--nm-alert-title-font-md);
}

.nm-alert--large {
  --nm-alert-padding-y: var(--nm-alert-padding-y-lg);
  --nm-alert-padding-x: var(--nm-alert-padding-x-lg);
  --nm-alert-font: var(--nm-alert-font-lg);
  --nm-alert-title-font: var(--nm-alert-title-font-lg);
}

// ==========================================
// Transition: nm-alert-fade
// ==========================================
.nm-alert-fade-enter-active {
  transition: all 0.35s $nm-ease-spring;
}

.nm-alert-fade-leave-active {
  transition: all 0.25s $nm-ease-accelerate;
}

.nm-alert-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.nm-alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-alert {
    transition: none;
  }

  .nm-alert__close {
    transition: none;
  }

  .nm-alert-fade-enter-active,
  .nm-alert-fade-leave-active {
    transition: none;
  }
}
</style>
