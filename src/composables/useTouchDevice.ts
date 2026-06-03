import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Detect touch-capable devices and mobile viewport
 */
export function useTouchDevice() {
  const isTouch = ref(false)
  const isMobile = ref(false)

  let resizeTimer: ReturnType<typeof setTimeout> | undefined

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

  onMounted(() => {
    // Primary detection via pointer capability
    if (window.matchMedia) {
      const mq = window.matchMedia('(pointer: coarse)')
      if (mq.matches) {
        isTouch.value = true
      }
    }

    // Fallback: detect first touch interaction
    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true })

    // Initial mobile check
    updateMobile()
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimer)
  })

  return { isTouch, isMobile }
}
