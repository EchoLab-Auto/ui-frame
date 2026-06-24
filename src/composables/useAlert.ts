import { ref, onBeforeUnmount, type Ref } from 'vue'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface UseAlertOptions {
  /**
   * Auto-dismiss duration in milliseconds.
   * 0 (default) means the alert must be closed manually.
   */
  duration?: number
}

export interface UseAlertReturn {
  /** Whether the alert is currently visible */
  isVisible: Ref<boolean>
  /** Close the alert (triggers leave animation then hides) */
  close: () => void
  /** Whether the alert is in its leave/dismiss animation phase */
  leaving: Ref<boolean>
}

/**
 * Headless alert — encapsulates visibility state, auto-dismiss timer,
 * and dismiss-animation lifecycle. Use with your own UI rendering.
 *
 * @example
 * ```ts
 * const { isVisible, close, leaving } = useAlert({ duration: 5000 })
 * // When duration expires or close() is called, `leaving` flips to true,
 * // the component runs its leave transition, then `isVisible` goes false.
 * ```
 */
export function useAlert(opts: UseAlertOptions = {}): UseAlertReturn {
  const { duration = 0 } = opts

  const isVisible = ref(true)
  const leaving = ref(false)

  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let leaveTimer: ReturnType<typeof setTimeout> | null = null

  function clearTimers() {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      leaveTimer = null
    }
  }

  function close() {
    // Prevent double-close
    if (leaving.value || !isVisible.value) return

    clearTimers()
    leaving.value = true

    // Allow the leave animation to play before fully hiding
    leaveTimer = setTimeout(() => {
      isVisible.value = false
      leaving.value = false
      leaveTimer = null
    }, 250)
  }

  // Auto-dismiss timer
  if (duration > 0) {
    dismissTimer = setTimeout(() => {
      close()
    }, duration)
  }

  onBeforeUnmount(() => {
    clearTimers()
  })

  return {
    isVisible,
    close,
    leaving,
  }
}
