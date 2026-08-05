import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

/**
 * Options for the useNumberInput composable.
 */
export interface UseNumberInputOptions {
  /** v-model value — a writable Ref<number | undefined> */
  modelValue: Ref<number | undefined>
  /** Minimum allowed value (default: -Infinity) */
  min?: number
  /** Maximum allowed value (default: Infinity) */
  max?: number
  /** Step increment for up/down buttons and keyboard (default: 1) */
  step?: number
  /** Decimal precision (default: inferred from step) */
  precision?: number
  /** Whether the input is disabled */
  disabled?: Ref<boolean>
}

/**
 * Return type for the useNumberInput composable.
 */
export interface UseNumberInputReturn {
  /** Display value as a string, bound to the input field */
  displayValue: ComputedRef<string>
  /** Increment the value by step */
  increment: () => void
  /** Decrement the value by step */
  decrement: () => void
  /** Programmatically set the numeric value */
  setValue: (value: number) => void
  /** Keyboard event handler (ArrowUp/ArrowDown) */
  handleKeydown: (event: KeyboardEvent) => void
  /** Input handler — update display buffer without committing */
  handleInput: (event: Event) => void
  /** Blur handler — formats and commits display value */
  handleBlur: () => void
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round a value to the specified number of decimal places,
 * avoiding floating-point artifacts.
 */
function roundPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

/**
 * Infer the number of decimal places from a numeric step value.
 * e.g. 0.01 -> 2, 0.5 -> 1, 1 -> 0.
 */
function inferPrecision(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0
  const str = String(step)
  const dotIndex = str.indexOf('.')
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1
}

/**
 * Format a numeric value to a string using the given precision.
 */
export function formatNumber(value: number | undefined, precision: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return roundPrecision(value, precision).toFixed(precision)
}

/**
 * Parse a string value to a number, returning undefined on invalid input.
 */
export function parseNumber(str: string): number | undefined {
  const trimmed = str.trim()
  if (trimmed === '' || trimmed === '-' || trimmed === '+') return undefined
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : undefined
}

/**
 * Headless number input — encapsulates value clamping, step precision,
 * keyboard navigation, increment/decrement, and parse/format logic
 * without any rendering. Use with your own UI.
 */
export function useNumberInput(opts: UseNumberInputOptions): UseNumberInputReturn {
  const {
    modelValue,
    min = -Infinity,
    max = Infinity,
    step = 1,
    precision: explicitPrecision,
    disabled,
  } = opts

  // Resolved precision: explicit prop > inferred from step > 0
  const precision = computed(() => {
    if (explicitPrecision !== undefined) return explicitPrecision
    return inferPrecision(step)
  })

  // Internal buffer for the text displayed in the input field.
  // This allows the user to type freely without the value being
  // reformatted on every keystroke.
  const internalBuffer = ref(formatNumber(modelValue.value, precision.value))

  // ==========================================
  // Display value (derived from internal buffer)
  // ==========================================

  const displayValue = computed<string>(() => internalBuffer.value)

  // Sync external modelValue changes back into the buffer
  watch(modelValue, newVal => {
    const formatted = formatNumber(newVal, precision.value)
    // Only overwrite if the numeric value doesn't match what's displayed,
    // to avoid disrupting the user's typing.
    const parsed = parseNumber(internalBuffer.value)
    if (parsed !== newVal) {
      internalBuffer.value = formatted
    }
  })

  // ==========================================
  // Helper: round value to step boundary
  // ==========================================

  function roundToStep(value: number): number {
    if (step <= 0) return value
    const p = precision.value
    // 步进网格以 min 为原点对齐；min 为 -Infinity（未设置）时退化为以 0
    // 为原点 —— 否则 (value - (-Infinity)) 直接产出 Infinity/NaN
    const origin = Number.isFinite(min) ? min : 0
    const stepped = Math.round((value - origin) / step) * step + origin
    return roundPrecision(stepped, p)
  }

  // ==========================================
  // Set value with clamping and step rounding
  // ==========================================

  function setValue(value: number): void {
    if (disabled?.value) return
    const clamped = clamp(value, min, max)
    const stepped = roundToStep(clamped)
    modelValue.value = stepped
    internalBuffer.value = formatNumber(stepped, precision.value)
  }

  // ==========================================
  // Increment / Decrement
  // ==========================================

  function increment(): void {
    // 空值基值为 0（与原生 input[type=number] stepUp 对齐）—— 此前以 min
    // 为基值，min 未设置（-Infinity）时第一步就产出 NaN 并永久卡死
    const current = modelValue.value ?? 0
    const next = clamp(current + step, min, max)
    setValue(roundToStep(next))
  }

  function decrement(): void {
    const current = modelValue.value ?? 0
    const next = clamp(current - step, min, max)
    setValue(roundToStep(next))
  }

  // ==========================================
  // Keyboard handling
  // ==========================================

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled?.value) return

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault()
        increment()
        break
      }
      case 'ArrowDown': {
        event.preventDefault()
        decrement()
        break
      }
      case 'Enter': {
        event.preventDefault()
        handleBlur()
        break
      }
    }
  }

  // ==========================================
  // Input — update display buffer without committing
  // ==========================================

  function handleInput(event: Event): void {
    if (disabled?.value) return
    const target = event.target as HTMLInputElement
    internalBuffer.value = target.value
  }

  // ==========================================
  // Blur — commit the typed value
  // ==========================================

  function handleBlur(): void {
    if (disabled?.value) return
    const parsed = parseNumber(internalBuffer.value)
    if (parsed === undefined) {
      // Revert to previous modelValue or min
      const fallback = modelValue.value ?? min
      internalBuffer.value = formatNumber(fallback, precision.value)
      return
    }
    setValue(parsed)
  }

  return {
    displayValue,
    increment,
    decrement,
    setValue,
    handleInput,
    handleKeydown,
    handleBlur,
  }
}
