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
import { interpolateAnchor, normalizeNumericSize, positionOf } from '@/utils/controlScale'
import { CONTROL_SCALES } from '@/utils/controlScales'

export type ProgressSize = 'small' | 'medium' | 'large'

export interface UseProgressOptions {
  /** Current value. */
  modelValue: Ref<number>
  /** Maximum value. */
  max: Ref<number>
  /** Whether the progress is in indeterminate mode. */
  indeterminate: Ref<boolean>
  /**
   * 尺寸 —— 数字 = 线形条厚度 px（主几何量），字符串为三档兼容别名。
   *
   * 环形几何（直径 / 描边）也由它推导：数字与档位走**同一条**三锚点插值，
   * 所以 `:size="8"` 与 `size="medium"` 的环完全一致。
   */
  size: Ref<ProgressSize | number>
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

/**
 * 环形几何不再手写映射表，而是复用 `CONTROL_SCALES.progress` 的锚点：
 *
 * - 档位别名固定落在三锚点轴上（0 = sm / 1 = md / 2 = lg）
 * - 数字按「线形条厚度」在 primary 轴上定位，超出两端夹取（不外推）
 *
 * 两条路径共用 `interpolateAnchor`，于是 `:size="8"` 与 `size="medium"`
 * 得到的直径/描边天然逐像素一致——两套映射表则迟早漂移。
 */
const PROGRESS_SPEC = CONTROL_SCALES.progress

/** 档位别名在三锚点轴上的位置 */
const TIER_POSITION: Record<ProgressSize, number> = { small: 0, medium: 1, large: 2 }

/** 0 / 负数 / NaN 的回落值：medium 锚点（线形条 8px 厚） */
const DEFAULT_THICKNESS = PROGRESS_SPEC.primary.md

/** 环形直径锚点（64 / 120 / 160） */
const CIRCLE_ANCHOR = PROGRESS_SPEC.metrics['--nm-progress-sz-circle']

/** 环形描边锚点（4 / 7 / 10） */
const STROKE_ANCHOR = PROGRESS_SPEC.metrics['--nm-progress-sz-stroke']

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
  /** 三锚点轴上的位置：字符串档位取固定位置，数字按厚度定位 */
  const scalePosition = computed(() => {
    const raw = size.value
    if (typeof raw === 'string') return TIER_POSITION[raw] ?? 1
    return positionOf(PROGRESS_SPEC.primary, normalizeNumericSize(raw, DEFAULT_THICKNESS))
  })

  const circleSize = computed(() => interpolateAnchor(CIRCLE_ANCHOR, scalePosition.value))
  const strokeWidth = computed(() => interpolateAnchor(STROKE_ANCHOR, scalePosition.value))
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
