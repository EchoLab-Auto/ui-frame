import {
  ref,
  computed,
  watch,
  getCurrentInstance,
  onBeforeUnmount,
  type Ref,
  type ComputedRef,
} from 'vue'
import { useReducedMotion } from './useReducedMotion'

export type ProgressSize = 'small' | 'medium' | 'large'

export interface UseProgressOptions {
  /** Current value. */
  modelValue: Ref<number>
  /** Maximum value. */
  max: Ref<number>
  /** Whether the progress is in indeterminate mode. */
  indeterminate: Ref<boolean>
  /** Resolved size — drives the circular geometry. */
  size: Ref<ProgressSize>
}

export interface UseProgressReturn {
  /** Clamped percentage in [0, 100]. Always 0 while indeterminate. */
  percentage: ComputedRef<number>
  /** Whether the progress has reached 100% (never true while indeterminate). */
  isComplete: ComputedRef<boolean>
  /**
   * Rounded percentage for display, animated towards `percentage` with an
   * rAF-driven ease-out so labels count smoothly instead of snapping.
   * Snaps instantly when the user prefers reduced motion.
   */
  displayPercentage: ComputedRef<number>
  /** Whether the user has requested reduced motion. */
  isReducedMotion: Ref<boolean>
  /** SVG viewBox edge length of the circular ring. */
  circleSize: ComputedRef<number>
  /** Stroke width of the circular ring. */
  strokeWidth: ComputedRef<number>
  /** Radius of the circular ring. */
  radius: ComputedRef<number>
  /** Circumference of the circular ring. */
  circumference: ComputedRef<number>
  /** stroke-dashoffset that renders `percentage` on the ring. */
  dashOffset: ComputedRef<number>
  /**
   * Cancel a running label animation.
   * Called automatically on component unmount when used inside a component.
   */
  stop: () => void
}

const CIRCLE_SIZE_MAP: Record<ProgressSize, number> = {
  small: 64,
  medium: 120,
  large: 160,
}

const STROKE_WIDTH_MAP: Record<ProgressSize, number> = {
  small: 4,
  medium: 7,
  large: 10,
}

/** Label count-up duration — mirrors the CSS width transition. */
const LABEL_ANIMATION_DURATION = 650

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Headless logic for NeumorphismProgress: percentage clamping, an animated
 * display value for labels, and circular-ring geometry. Contains no rendering
 * — the component layer binds these values to DOM and styles.
 *
 * @example
 * ```ts
 * const { percentage, displayPercentage, circumference, dashOffset } = useProgress({
 *   modelValue: toRef(props, 'modelValue'),
 *   max: toRef(props, 'max'),
 *   indeterminate: toRef(props, 'indeterminate'),
 *   size: resolvedSize,
 * })
 * ```
 */
export function useProgress(options: UseProgressOptions): UseProgressReturn {
  const { modelValue, max, indeterminate, size } = options
  const { isReducedMotion } = useReducedMotion()

  const percentage = computed(() => {
    if (indeterminate.value) return 0
    if (max.value <= 0) return 0
    return Math.min(100, Math.max(0, (modelValue.value / max.value) * 100))
  })

  const isComplete = computed(() => !indeterminate.value && percentage.value >= 100)

  // ---- Animated display value ----
  const displayed = ref(percentage.value)
  let rafId: number | null = null

  function cancelAnimation() {
    if (rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  watch(percentage, target => {
    cancelAnimation()
    if (isReducedMotion.value || typeof window === 'undefined') {
      displayed.value = target
      return
    }
    const from = displayed.value
    if (from === target) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LABEL_ANIMATION_DURATION)
      displayed.value = from + (target - from) * easeOutCubic(t)
      rafId = t < 1 ? window.requestAnimationFrame(tick) : null
    }
    rafId = window.requestAnimationFrame(tick)
  })

  const displayPercentage = computed(() => Math.round(displayed.value))

  // ---- Circular ring geometry ----
  const circleSize = computed(() => CIRCLE_SIZE_MAP[size.value])
  const strokeWidth = computed(() => STROKE_WIDTH_MAP[size.value])
  const radius = computed(() => (circleSize.value - strokeWidth.value) / 2)
  const circumference = computed(() => 2 * Math.PI * radius.value)
  const dashOffset = computed(
    () => circumference.value - (percentage.value / 100) * circumference.value
  )

  function stop() {
    cancelAnimation()
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(stop)
  }

  return {
    percentage,
    isComplete,
    displayPercentage,
    isReducedMotion,
    circleSize,
    strokeWidth,
    radius,
    circumference,
    dashOffset,
    stop,
  }
}

export default useProgress
