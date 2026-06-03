<script setup lang="ts">
import { ref, computed } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
  closable: boolean
  timestamp: number
  leaving: boolean
}

export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
  closable?: boolean
}

export interface NeumorphismToastProviderProps {
  position?: ToastPosition
  maxCount?: number
}

const props = withDefaults(defineProps<NeumorphismToastProviderProps>(), {
  position: 'top-right',
  maxCount: 5,
})

const toasts = ref<ToastItem[]>([])
let idCounter = 0

function addToast(options: ToastOptions): string {
  const id = `nm-toast-${++idCounter}`
  const item: ToastItem = {
    id,
    message: options.message,
    type: options.type || 'info',
    duration: options.duration ?? 3000,
    closable: options.closable ?? true,
    timestamp: Date.now(),
    leaving: false,
  }

  toasts.value = [...toasts.value.slice(Math.max(0, toasts.value.length - (props.maxCount - 1))), item]

  if (item.duration > 0) {
    setTimeout(() => removeToast(id), item.duration)
  }

  return id
}

function removeToast(id: string) {
  const item = toasts.value.find((t) => t.id === id)
  if (item) item.leaving = true
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 250)
}

function clearAll() {
  toasts.value.forEach((t) => { t.leaving = true })
  setTimeout(() => { toasts.value = [] }, 250)
}

defineExpose({ addToast, removeToast, clearAll, toasts })

const classList = computed(() => [
  'nm-toast-container',
  `nm-toast-container--${props.position}`,
])
</script>

<template>
  <teleport to="body">
    <div :class="classList" aria-live="polite" aria-atomic="false">
      <transition-group name="nm-toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="nm-toast"
          :class="[`nm-toast--${toast.type}`, { 'nm-toast--leaving': toast.leaving }]"
          role="status"
        >
          <span class="nm-toast__icon">
            <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            <svg v-else-if="toast.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            <svg v-else-if="toast.type === 'warning'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2zM12 9v4M12 17v1"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8v-1"/></svg>
          </span>
          <span class="nm-toast__message">{{ toast.message }}</span>
          <button
            v-if="toast.closable"
            class="nm-toast__close"
            @click="removeToast(toast.id)"
            :aria-label="'关闭通知'"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
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

  &--top-left    { top: 0; left: 0; }
  &--top-right   { top: 0; right: 0; }
  &--top-center  { top: 0; left: 50%; transform: translateX(-50%); }
  &--bottom-left { bottom: 0; left: 0; flex-direction: column-reverse; }
  &--bottom-right{ bottom: 0; right: 0; flex-direction: column-reverse; }
  &--bottom-center{ bottom: 0; left: 50%; transform: translateX(-50%); flex-direction: column-reverse; }
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

  &--success .nm-toast__icon { color: var(--nm-color-success); }
  &--error .nm-toast__icon { color: var(--nm-color-error); }
  &--warning .nm-toast__icon { color: var(--nm-color-warning); }
  &--info .nm-toast__icon { color: var(--nm-primary-color); }

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
  &:hover { color: var(--nm-text-primary); }
}

// Toast list transitions
.nm-toast-list-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.nm-toast-list-leave-active { transition: all 0.2s ease; }
.nm-toast-list-enter-from { opacity: 0; transform: translateX(30px); }
.nm-toast-list-leave-to { opacity: 0; transform: translateX(30px); }
</style>
