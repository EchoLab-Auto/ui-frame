import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UseSliderOptions {
  /** v-model value — a writable Ref<number> */
  modelValue: Ref<number>
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Step increment */
  step: number
  /** Whether the slider is disabled */
  disabled?: Ref<boolean>
  /** Whether the slider is vertical (default: false) */
  vertical?: Ref<boolean>
}

export interface UseSliderReturn {
  /** Current slider value (computed from modelValue, clamped) */
  sliderValue: ComputedRef<number>
  /** Value expressed as a percentage (0–100) */
  percentage: ComputedRef<number>
  /** Programmatically set the slider value; returns the applied (clamped, stepped) value */
  setValue: (value: number) => number
  /**
   * Keyboard event handler. Returns the applied value when a key was handled,
   * `undefined` otherwise (disabled or unrecognized key).
   */
  handleKeydown: (event: KeyboardEvent) => number | undefined
  /** Whether the thumb is currently being dragged */
  isDragging: Ref<boolean>
}

/**
 * Clamp a value between min and max.
 * SSR-safe — no DOM access.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round a value to the nearest step boundary relative to min.
 * Decimal precision is derived from `step` so fractional steps don't leak
 * floating-point noise (e.g. step 0.1 producing 0.30000000000000004).
 */
function roundToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value
  const stepped = Math.round((value - min) / step) * step + min
  const decimals = (String(step).split('.')[1] ?? '').length
  return decimals > 0 ? Number(stepped.toFixed(decimals)) : stepped
}

/**
 * Calculate a slider value from a coordinate (mouse / touch) relative to a
 * track element. The caller is responsible for providing the track rect and
 * the track size dimension.
 */
export function coordinateToValue(
  clientCoord: number,
  trackStart: number,
  trackSize: number,
  min: number,
  max: number,
  step: number,
  vertical: boolean
): number {
  // Prevent division by zero
  if (trackSize <= 0) return min

  let ratio = (clientCoord - trackStart) / trackSize

  // In vertical mode the start (top) is max and end (bottom) is min
  if (vertical) {
    ratio = 1 - ratio
  }

  ratio = clamp(ratio, 0, 1)
  const raw = min + ratio * (max - min)
  // Rounding to the nearest step can overshoot the range (e.g. max=10, step=4
  // rounds 10 → 12), so clamp again after rounding.
  return clamp(roundToStep(raw, min, step), min, max)
}

/**
 * Headless slider — encapsulates value clamping, keyboard navigation, and
 * a drag state without any rendering. Use with your own UI.
 */
export function useSlider(opts: UseSliderOptions): UseSliderReturn {
  const { modelValue, min, max, step, disabled } = opts

  const isDragging = ref(false)

  // ==========================================
  // Derived values
  // ==========================================

  const sliderValue = computed<number>(() => clamp(modelValue.value, min, max))

  const percentage = computed<number>(() => {
    const range = max - min
    if (range === 0) return 0
    return ((sliderValue.value - min) / range) * 100
  })

  // ==========================================
  // Set value with clamping and step rounding
  // ==========================================

  function setValue(value: number): number {
    if (disabled?.value) return sliderValue.value
    // Round before clamping: rounding can push the value out of range
    // (e.g. max=10, step=4 rounds 10 → 12), so clamp last.
    const applied = clamp(roundToStep(value, min, step), min, max)
    modelValue.value = applied
    return applied
  }

  // ==========================================
  // Keyboard navigation
  // ==========================================

  function handleKeydown(event: KeyboardEvent): number | undefined {
    if (disabled?.value) return undefined

    let applied: number | undefined
    const current = sliderValue.value

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        const increment = step
        // ArrowUp in horizontal mode still increases; ArrowRight in vertical
        // follows the logical "increase" direction regardless of orientation.
        applied = setValue(clamp(current + increment, min, max))
        break
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        const decrement = step
        applied = setValue(clamp(current - decrement, min, max))
        break
      }
      case 'Home': {
        applied = setValue(min)
        break
      }
      case 'End': {
        applied = setValue(max)
        break
      }
      case 'PageUp': {
        // Jump by 10 steps (or 10% of range if step is very small)
        const jump = Math.max(step * 10, (max - min) / 10)
        applied = setValue(clamp(current + jump, min, max))
        break
      }
      case 'PageDown': {
        const jump = Math.max(step * 10, (max - min) / 10)
        applied = setValue(clamp(current - jump, min, max))
        break
      }
      default: {
        return undefined
      }
    }

    event.preventDefault()
    return applied
  }

  return {
    sliderValue,
    percentage,
    setValue,
    handleKeydown,
    isDragging,
  }
}
