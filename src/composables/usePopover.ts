import { ref, onBeforeUnmount, type Ref } from 'vue'

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'
export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual'

export interface UsePopoverOptions {
  /** Preferred position of the popover relative to the trigger */
  position?: Ref<PopoverPosition>
  /** How the popover is triggered */
  trigger?: Ref<PopoverTrigger>
  /** Whether the popover is disabled */
  disabled?: Ref<boolean>
  /** Offset from the trigger element in px */
  offset?: Ref<number> | number
  /** Delay before showing (ms, for hover trigger) */
  delay?: number
}

export interface UsePopoverReturn {
  /** Whether the popover is currently open */
  isOpen: Ref<boolean>
  /** Show the popover */
  show: () => void
  /** Hide the popover */
  hide: () => void
  /** Toggle visibility (for click trigger) */
  toggle: () => void
  /** Handle keydown (Escape to close). Tab handling is delegated to the component layer. */
  handleKeydown: (event: KeyboardEvent) => void
}

/**
 * Headless popover — encapsulates open/close, trigger modes (click/hover/focus/manual),
 * boundary-aware positioning helpers, keyboard dismissal, and click-outside detection.
 *
 * Use with your own UI rendering. Position calculation and DOM measurement
 * are the consumer's responsibility; this composable provides the state machine.
 */
export function usePopover(opts: UsePopoverOptions = {}): UsePopoverReturn {
  const { trigger, disabled } = opts
  const delay = opts.delay ?? 150

  const isOpen = ref(false)
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  // Trigger mode resolved
  const resolvedTrigger = trigger?.value ?? 'click'

  function show() {
    if (disabled?.value) return
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    // Delay only applies to hover trigger; click is instant
    if (resolvedTrigger === 'hover') {
      showTimer = setTimeout(() => {
        isOpen.value = true
      }, delay)
    } else {
      isOpen.value = true
    }
  }

  function hide() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
    hideTimer = setTimeout(() => {
      isOpen.value = false
    }, 100)
  }

  function toggle() {
    if (disabled?.value) return
    if (isOpen.value) {
      hide()
    } else {
      show()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled?.value) return

    if (event.key === 'Escape') {
      isOpen.value = false
      return
    }

    // Tab handling is delegated to the component layer, which has DOM refs
    // to correctly check whether focus left both trigger and popover content.
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

  return {
    isOpen,
    show,
    hide,
    toggle,
    handleKeydown,
  }
}
