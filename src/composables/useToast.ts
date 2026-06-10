import { ref, onBeforeUnmount, type Ref } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'

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

export interface UseToastOptions {
  /** Maximum number of toasts visible at once */
  maxCount?: number
}

export interface UseToastReturn {
  /** Current toast items */
  toasts: Ref<ToastItem[]>
  /** Add a toast notification */
  addToast: (options: ToastOptions) => string
  /** Remove a toast by ID */
  removeToast: (id: string) => void
  /** Clear all toasts */
  clearAll: () => void
}

/** 生成 SSR 安全的唯一 Toast ID */
function generateToastId(): string {
  return `nm-toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Headless toast — encapsulates toast queue management, auto-dismiss
 * timers, and remove animations. Use with your own UI rendering.
 *
 * @example
 * ```ts
 * const { toasts, addToast, removeToast } = useToast({ maxCount: 5 })
 * addToast({ message: 'Saved!', type: 'success', duration: 3000 })
 * ```
 */
export function useToast(opts: UseToastOptions = {}): UseToastReturn {
  const { maxCount = 5 } = opts

  const toasts = ref<ToastItem[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let clearing = false

  function clearToastTimers(id: string) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  function addToast(options: ToastOptions): string {
    const id = generateToastId()
    const item: ToastItem = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration ?? 3000,
      closable: options.closable ?? true,
      timestamp: Date.now(),
      leaving: false,
    }

    toasts.value = [...toasts.value.slice(Math.max(0, toasts.value.length - (maxCount - 1))), item]

    // Cancel any in-flight clearAll since a new toast was added
    if (clearing) {
      const t = timers.get('__clearAll')
      if (t) {
        clearTimeout(t)
        timers.delete('__clearAll')
      }
      clearing = false
      // Remove toasts that were already in leaving state from the canceled clearAll
      toasts.value = toasts.value.filter(t => !t.leaving)
    }

    if (item.duration > 0) {
      clearToastTimers(id)
      timers.set(
        id,
        setTimeout(() => removeToast(id), item.duration)
      )
    }

    return id
  }

  function removeToast(id: string) {
    clearToastTimers(id)
    const item = toasts.value.find(t => t.id === id)
    if (item) item.leaving = true
    timers.set(
      id,
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
        timers.delete(id)
      }, 250)
    )
  }

  function clearAll() {
    timers.forEach(t => clearTimeout(t))
    timers.clear()
    clearing = true
    toasts.value.forEach(t => {
      t.leaving = true
    })
    timers.set(
      '__clearAll',
      setTimeout(() => {
        toasts.value = []
        timers.delete('__clearAll')
        clearing = false
      }, 250)
    )
  }

  onBeforeUnmount(() => {
    timers.forEach(t => clearTimeout(t))
    timers.clear()
  })

  return { toasts, addToast, removeToast, clearAll }
}
