import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 检测当前设备是否为触屏设备，并监听变化
 */
export function useTouchDevice() {
  const isTouch = ref(false)
  const isMobile = ref(false)

  let mediaQuery: MediaQueryList | undefined
  let resizeTimer: ReturnType<typeof setTimeout> | undefined

  function detect() {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    isMobile.value = window.innerWidth < 768
  }

  function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      isMobile.value = window.innerWidth < 768
    }, 100)
  }

  function handleTouchStart() {
    if (!isTouch.value) {
      isTouch.value = true
      mediaQuery?.removeEventListener('change', () => {})
    }
  }

  onMounted(() => {
    detect()

    // Detect touch via pointer capability
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(pointer: coarse)')
      if (mediaQuery.matches) {
        isTouch.value = true
      }
    }

    // Fallback: detect first touch interaction
    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimer)
  })

  return { isTouch, isMobile }
}
