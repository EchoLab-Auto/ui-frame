/**
 * Touch swipe gesture detection composable.
 *
 * Detects swipe direction (left/right/up/down) on touch devices with
 * configurable threshold. Used by Drawer (edge-swipe to open) and
 * Tabs (horizontal swipe to switch panels).
 *
 * @example
 * ```ts
 * const { direction, distance } = useSwipe(elementRef, {
 *   threshold: 50,
 *   onSwipeLeft: () => drawerOpen.value = true,
 * })
 * ```
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface UseSwipeOptions {
  /** Minimum swipe distance in px to trigger (default: 50) */
  threshold?: number
  /** Only detect swipes starting from the screen edge (default: false) */
  edgeOnly?: boolean
  /** Edge width in px for edgeOnly mode (default: 40) */
  edgeWidth?: number
  /** Called when a swipe is completed */
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export interface UseSwipeReturn {
  /** Current swipe direction during active gesture */
  direction: Ref<SwipeDirection | null>
  /** Current swipe distance in px */
  distance: Ref<number>
  /** Whether a swipe gesture is in progress */
  isSwiping: Ref<boolean>
}

export function useSwipe(
  target: Ref<HTMLElement | null>,
  options: UseSwipeOptions = {}
): UseSwipeReturn {
  const { threshold = 50, edgeOnly = false, edgeWidth = 40 } = options

  const direction = ref<SwipeDirection | null>(null)
  const distance = ref(0)
  const isSwiping = ref(false)

  let startX = 0
  let startY = 0

  function getDirection(dx: number, dy: number): SwipeDirection | null {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    }
    return dy > 0 ? 'down' : 'up'
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]

    // Edge-only: only start tracking if near the edge
    if (edgeOnly && touch.clientX > edgeWidth && touch.clientX < window.innerWidth - edgeWidth) {
      return
    }

    startX = touch.clientX
    startY = touch.clientY
    direction.value = null
    distance.value = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (direction.value === null && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        direction.value = getDirection(dx, dy)
        isSwiping.value = true
      }
      distance.value = Math.sqrt(dx * dx + dy * dy)
    }
  }

  function onTouchEnd() {
    isSwiping.value = false
    if (!direction.value || distance.value < threshold) {
      direction.value = null
      return
    }

    switch (direction.value) {
      case 'left':
        options.onSwipeLeft?.()
        break
      case 'right':
        options.onSwipeRight?.()
        break
      case 'up':
        options.onSwipeUp?.()
        break
      case 'down':
        options.onSwipeDown?.()
        break
    }
    options.onSwipe?.(direction.value)
    direction.value = null
    distance.value = 0
  }

  onMounted(() => {
    const el = target.value
    if (!el && !edgeOnly) return
    const listenerTarget = el ?? (edgeOnly ? document : null)
    if (!listenerTarget) return

    listenerTarget.addEventListener('touchstart', onTouchStart as EventListener, { passive: true })
    listenerTarget.addEventListener('touchmove', onTouchMove as EventListener, { passive: true })
    listenerTarget.addEventListener('touchend', onTouchEnd as EventListener)
  })

  onBeforeUnmount(() => {
    const el = target.value
    const listenerTarget = el ?? document
    listenerTarget.removeEventListener('touchstart', onTouchStart as EventListener)
    listenerTarget.removeEventListener('touchmove', onTouchMove as EventListener)
    listenerTarget.removeEventListener('touchend', onTouchEnd as EventListener)
  })

  return { direction, distance, isSwiping }
}
