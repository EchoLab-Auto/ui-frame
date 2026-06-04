import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Detect touch-capable devices and mobile viewport
 */
export function useTouchDevice() {
  const isTouch = ref(false)
  const isMobile = ref(false)

  let resizeTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  function updateMobile() {
    isMobile.value = window.innerWidth < 768
  }

  function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateMobile, 100)
  }

  function handleTouchStart() {
    isTouch.value = true
  }

  let mq: MediaQueryList | undefined
  let mqHandler: ((e: MediaQueryListEvent) => void) | undefined

  onMounted(() => {
    // Primary detection via pointer capability + live updates
    if (window.matchMedia) {
      mq = window.matchMedia('(pointer: coarse)')
      isTouch.value = mq.matches
      mqHandler = (e: MediaQueryListEvent) => {
        isTouch.value = e.matches
      }
      mq.addEventListener('change', mqHandler)
    }

    // Fallback: detect first touch interaction
    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true })

    // Initial mobile check
    updateMobile()
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onBeforeUnmount(() => {
    if (mq && mqHandler) mq.removeEventListener('change', mqHandler)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimer)
  })

  return { isTouch, isMobile }
}
