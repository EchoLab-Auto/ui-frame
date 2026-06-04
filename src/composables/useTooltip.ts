import { ref, onBeforeUnmount, type Ref } from 'vue'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
export type TooltipTrigger = 'hover' | 'click' | 'focus'

export interface UseTooltipOptions {
  /** Whether the tooltip is disabled */
  disabled?: Ref<boolean>
  /** Delay before showing (ms) */
  delay?: number
  /** Trigger mode */
  trigger?: Ref<TooltipTrigger>
}

export interface UseTooltipReturn {
  /** Whether the tooltip is visible */
  isVisible: Ref<boolean>
  /** Show the tooltip */
  show: () => void
  /** Hide the tooltip */
  hide: () => void
  /** Toggle visibility (for click trigger) */
  toggle: () => void
  /** Handle keydown (Escape to close) */
  handleKeydown: (event: KeyboardEvent) => void
}

/**
 * Headless tooltip — encapsulates show/hide with delay, toggle for
 * click trigger, and keyboard dismissal. Use with your own UI rendering.
 */
export function useTooltip(opts: UseTooltipOptions = {}): UseTooltipReturn {
  const { disabled } = opts
  const delay = opts.delay ?? 150

  const isVisible = ref(false)
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function show() {
    if (disabled?.value) return
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    showTimer = setTimeout(() => {
      isVisible.value = true
    }, delay)
  }

  function hide() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
    hideTimer = setTimeout(() => {
      isVisible.value = false
    }, 100)
  }

  function toggle() {
    if (disabled?.value) return
    isVisible.value ? hide() : show()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isVisible.value = false
    }
  }

  onBeforeUnmount(() => {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  })

  return { isVisible, show, hide, toggle, handleKeydown }
}
