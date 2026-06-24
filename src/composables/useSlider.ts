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
  /** Programmatically set the slider value */
  setValue: (value: number) => void
  /** Keyboard event handler */
  handleKeydown: (event: KeyboardEvent) => void
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
 */
function roundToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value
  return Math.round((value - min) / step) * step + min
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
  return roundToStep(raw, min, step)
}

/**
 * Headless slider — encapsulates value clamping, keyboard navigation, and
 * a drag state without any rendering. Use with your own UI.
 */
export function useSlider(opts: UseSliderOptions): UseSliderReturn {
  const { modelValue, min, max, step, disabled, vertical } = opts

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

  function setValue(value: number): void {
    if (disabled?.value) return
    const clamped = clamp(value, min, max)
    const stepped = roundToStep(clamped, min, step)
    modelValue.value = stepped
  }

  // ==========================================
  // Keyboard navigation
  // ==========================================

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled?.value) return
    const isVertical = vertical?.value ?? false

    let prevent = true
    const current = sliderValue.value

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        const increment = isVertical && event.key === 'ArrowUp' ? step : step
        // ArrowUp in horizontal mode still increases; ArrowRight in vertical
        // follows the logical "increase" direction regardless of orientation.
        const next = clamp(current + increment, min, max)
        setValue(next)
        break
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        const decrement = step
        const next = clamp(current - decrement, min, max)
        setValue(next)
        break
      }
      case 'Home': {
        setValue(min)
        break
      }
      case 'End': {
        setValue(max)
        break
      }
      case 'PageUp': {
        // Jump by 10 steps (or 10% of range if step is very small)
        const jump = Math.max(step * 10, (max - min) / 10)
        setValue(clamp(current + jump, min, max))
        break
      }
      case 'PageDown': {
        const jump = Math.max(step * 10, (max - min) / 10)
        setValue(clamp(current - jump, min, max))
        break
      }
      default: {
        prevent = false
        break
      }
    }

    if (prevent) {
      event.preventDefault()
    }
  }

  return {
    sliderValue,
    percentage,
    setValue,
    handleKeydown,
    isDragging,
  }
}
