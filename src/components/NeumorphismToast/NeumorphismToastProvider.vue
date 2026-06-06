<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useLocale } from '@/composables/useLocale'
import type { ToastType, ToastPosition, ToastItem, ToastOptions } from '@/composables/useToast'

export type { ToastType, ToastPosition, ToastItem, ToastOptions }

export interface NeumorphismToastProviderProps {
  position?: ToastPosition
  maxCount?: number
  closeLabel?: string
}

const props = withDefaults(defineProps<NeumorphismToastProviderProps>(), {
  position: 'top-right',
  maxCount: 5,
  closeLabel: '',
})

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel || t('toastClose'))

// Use headless toast composable for all behavioral logic
const { toasts, addToast, removeToast, clearAll } = useToast({
  maxCount: props.maxCount,
})

defineExpose({ addToast, removeToast, clearAll, toasts })

const classList = computed(() => ['nm-toast-container', `nm-toast-container--${props.position}`])
</script>

<template>
  <teleport to="body">
    <div :class="classList" aria-live="polite" aria-atomic="false">
      <transition-group name="nm-toast-list">
        <!-- @slot Custom toast item rendering. Bind: toast -->
        <slot
          v-for="toast in toasts"
          :key="toast.id"
          name="toast-item"
          :toast="toast"
          :remove="() => removeToast(toast.id)"
        >
          <div
            class="nm-toast"
            :class="[`nm-toast--${toast.type}`, { 'nm-toast--leaving': toast.leaving }]"
            role="status"
          >
            <span class="nm-toast__icon">
              <svg
                v-if="toast.type === 'success'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <svg
                v-else-if="toast.type === 'error'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <svg
                v-else-if="toast.type === 'warning'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2L2 22h20L12 2zM12 9v4M12 17v1" />
              </svg>
              <svg
                v-else
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8v-1" />
              </svg>
            </span>
            <span class="nm-toast__message">{{ toast.message }}</span>
            <button
              v-if="toast.closable"
              class="nm-toast__close"
              :aria-label="resolvedCloseLabel"
              type="button"
              @click="removeToast(toast.id)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </slot>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-toast-container {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  padding: 16px;

  &--top-left {
    top: 0;
    left: 0;
  }
  &--top-right {
    top: 0;
    right: 0;
  }
  &--top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  &--bottom-left {
    bottom: 0;
    left: 0;
    flex-direction: column-reverse;
  }
  &--bottom-right {
    bottom: 0;
    right: 0;
    flex-direction: column-reverse;
  }
  &--bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column-reverse;
  }
}

.nm-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  pointer-events: auto;
  min-width: 280px;
  max-width: 420px;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  @include nm-theme-transition;

  &--success .nm-toast__icon {
    color: var(--nm-color-success);
  }
  &--error .nm-toast__icon {
    color: var(--nm-color-error);
  }
  &--warning .nm-toast__icon {
    color: var(--nm-color-warning);
  }
  &--info .nm-toast__icon {
    color: var(--nm-primary-color);
  }

  &--leaving {
    opacity: 0;
    transform: translateX(20px);
  }
}

.nm-toast__icon {
  display: flex;
  flex-shrink: 0;
}

.nm-toast__message {
  flex: 1;
  font-size: 14px;
  color: var(--nm-text-primary);
  line-height: 1.4;
}

.nm-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 2px;
  border: none;
  background: none;
  color: var(--nm-text-placeholder);
  cursor: pointer;
  border-radius: 4px;
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

// Toast list transitions — position-aware elastic entrance
.nm-toast-list-enter-active {
  transition: all 0.35s $nm-ease-spring;
}
.nm-toast-list-leave-active {
  transition: all 0.2s $nm-ease-accelerate;
}

.nm-toast-container--top-right .nm-toast-list-enter-from,
.nm-toast-container--bottom-right .nm-toast-list-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.nm-toast-container--top-left .nm-toast-list-enter-from,
.nm-toast-container--bottom-left .nm-toast-list-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.95);
}

.nm-toast-container--top-center .nm-toast-list-enter-from,
.nm-toast-container--bottom-center .nm-toast-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.nm-toast-list-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

@keyframes nm-toast-icon-pop {
  0% {
    transform: scale(0) rotate(-30deg);
  }
  60% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-toast {
    transition: none;
  }
  .nm-toast .nm-toast__icon svg {
    animation: none;
  }
  .nm-toast__close {
    transition: none;
  }
}
</style>
