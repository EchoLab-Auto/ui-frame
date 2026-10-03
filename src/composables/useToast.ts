import { ref, inject, hasInjectionContext, type Ref, type InjectionKey } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

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

/**
 * Injection key shared by `NeumorphismToastProvider` (provide) and
 * `useToast()` (inject). Descendants of a mounted provider reuse the
 * provider's queue so their notifications are actually rendered.
 */
export const ToastInjectionKey: InjectionKey<UseToastReturn> = Symbol('echo-toast')

/** 生成 SSR 安全的唯一 Toast ID */
function generateToastId(): string {
  return `nm-toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** 创建一个独立的 toast 队列实例（内部使用）。 */
function createToast(opts: UseToastOptions = {}): UseToastReturn {
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

    // Clean up timers for toasts that will be pushed off by the maxCount limit
    const removed = toasts.value.slice(0, Math.max(0, toasts.value.length - (maxCount - 1)))
    for (const t of removed) clearToastTimers(t.id)
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
    if (!item) return
    item.leaving = true
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

  return { toasts, addToast, removeToast, clearAll }
}

/**
 * 模块级共享单例：Provider 未 provide（或在 setup 之外/模块级调用）时，
 * 所有调用方共享同一条通知队列。Provider 自身也通过 useToast() 复用该单例，
 * 因此无论调用方能否 inject 到 Provider，通知都能被已挂载的 Provider 渲染。
 */
let sharedToast: UseToastReturn | null = null

/**
 * Headless toast — encapsulates toast queue management, auto-dismiss
 * timers, and remove animations.
 *
 * 解析顺序：
 * 1. 组件 setup 内且存在 `NeumorphismToastProvider` provide 的实例 → 复用它；
 * 2. 否则回退到模块级共享单例（首次调用时的 `opts` 生效，后续忽略）。
 *
 * @example
 * ```ts
 * const { toasts, addToast, removeToast } = useToast({ maxCount: 5 })
 * addToast({ message: 'Saved!', type: 'success', duration: 3000 })
 * ```
 */
/** 测试专用：重置模块级共享单例（下一调用按新 opts 重建）。
 * 生产代码不应调用。 */
export function __resetSharedToastForTest(): void {
  sharedToast?.clearAll()
  sharedToast = null
}

export function useToast(opts: UseToastOptions = {}): UseToastReturn {
  // 组件内调用时优先复用 NeumorphismToastProvider 提供的实例
  if (hasInjectionContext()) {
    const provided = inject(ToastInjectionKey, null)
    if (provided) return provided
  }
  if (!sharedToast) {
    sharedToast = createToast(opts)
  }
  return sharedToast
}
