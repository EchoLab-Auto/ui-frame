import { ref, getCurrentInstance, onBeforeUnmount, type Ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

export interface UseReducedMotionReturn {
  /** Whether the user has requested reduced motion. */
  isReducedMotion: Ref<boolean>
  /**
   * Stop listening to media query changes.
   * Called automatically on component unmount when used inside a component;
   * call it manually when used outside a component lifecycle (e.g. directives).
   */
  stop: () => void
}

/**
 * One-time (non-reactive) check of the user's reduced-motion preference.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

/**
 * Tracks the `prefers-reduced-motion` media query reactively.
 *
 * Inside a component the media listener is removed automatically on unmount;
 * outside a component (e.g. in a custom directive) call `stop()` manually.
 *
 * @example
 * ```ts
 * const { isReducedMotion } = useReducedMotion()
 * ```
 */
export function useReducedMotion(): UseReducedMotionReturn {
  const isReducedMotion = ref(prefersReducedMotion())

  let mql: MediaQueryList | null = null
  let handler: ((e: MediaQueryListEvent) => void) | null = null

  if (typeof window !== 'undefined') {
    mql = window.matchMedia(QUERY)
    handler = (e: MediaQueryListEvent) => {
      isReducedMotion.value = e.matches
    }
    mql.addEventListener('change', handler)
  }

  function stop() {
    if (mql && handler) {
      mql.removeEventListener('change', handler)
      mql = null
      handler = null
    }
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(stop)
  }

  return { isReducedMotion, stop }
}

export default useReducedMotion
