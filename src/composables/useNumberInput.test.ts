import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useNumberInput } from './useNumberInput'

// Helper: create options with bounded range for increment/decrement tests
const DEFAULT_BOUNDS = { min: -100, max: 100 }

describe('useNumberInput', () => {
  it('should return display value for initial value', () => {
    const modelValue = ref(5)
    const { displayValue } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    expect(displayValue.value).toBe('5')
  })

  it('should return empty display for undefined value', () => {
    const modelValue = ref<number | undefined>(undefined)
    const { displayValue } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    expect(displayValue.value).toBe('')
  })

  it('should increment by step', () => {
    const modelValue = ref(5)
    const { increment } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    increment()
    expect(modelValue.value).toBe(6)
  })

  it('should decrement by step', () => {
    const modelValue = ref(5)
    const { decrement } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    decrement()
    expect(modelValue.value).toBe(4)
  })

  it('should clamp increment to max', () => {
    const modelValue = ref(9)
    const { increment } = useNumberInput({ modelValue, min: 0, max: 10 })
    increment()
    expect(modelValue.value).toBe(10)
    increment()
    expect(modelValue.value).toBe(10)
  })

  it('should clamp decrement to min', () => {
    const modelValue = ref(1)
    const { decrement } = useNumberInput({ modelValue, min: 0 })
    decrement()
    expect(modelValue.value).toBe(0)
    decrement()
    expect(modelValue.value).toBe(0)
  })

  it('should handle step > 1', () => {
    const modelValue = ref(10)
    const { increment, decrement } = useNumberInput({ modelValue, min: 0, max: 100, step: 5 })
    increment()
    expect(modelValue.value).toBe(15)
    decrement()
    expect(modelValue.value).toBe(10)
  })

  it('should round to step boundary', () => {
    const modelValue = ref(7)
    const { setValue } = useNumberInput({
      modelValue,
      min: 0,
      max: 100,
      step: 10,
    })
    setValue(7)
    expect(modelValue.value).toBe(10)
  })

  it('should handle fractional steps', () => {
    const modelValue = ref(1.0)
    const { increment, decrement } = useNumberInput({
      modelValue,
      min: 0,
      max: 2,
      step: 0.5,
    })
    increment()
    expect(modelValue.value).toBe(1.5)
    decrement()
    expect(modelValue.value).toBe(1.0)
  })

  it('should handle ArrowUp key to increment', () => {
    const modelValue = ref(5)
    const { handleKeydown } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(modelValue.value).toBe(6)
  })

  it('should handle ArrowDown key to decrement', () => {
    const modelValue = ref(5)
    const { handleKeydown } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(modelValue.value).toBe(4)
  })

  it('should commit value on Enter', () => {
    const modelValue = ref(5)
    const { handleInput, handleKeydown } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    const inputEvent = { target: { value: '42' } } as unknown as Event
    handleInput(inputEvent)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(modelValue.value).toBe(42)
  })

  it('should parse and commit on blur', () => {
    const modelValue = ref(5)
    const { handleInput, handleBlur } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    const inputEvent = { target: { value: '99' } } as unknown as Event
    handleInput(inputEvent)
    handleBlur()
    expect(modelValue.value).toBe(99)
  })

  it('should revert to previous value on invalid input blur', () => {
    const modelValue = ref(5)
    const { handleInput, handleBlur } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    const inputEvent = { target: { value: 'abc' } } as unknown as Event
    handleInput(inputEvent)
    handleBlur()
    expect(modelValue.value).toBe(5)
  })

  it('should revert to min on invalid input when no previous value', () => {
    const modelValue = ref<number | undefined>(undefined)
    const { handleInput, handleBlur, displayValue } = useNumberInput({
      modelValue,
      min: 10,
    })
    const inputEvent = { target: { value: 'xyz' } } as unknown as Event
    handleInput(inputEvent)
    handleBlur()
    expect(displayValue.value).toBe('10')
  })

  it('should not respond when disabled', () => {
    const modelValue = ref(5)
    const { increment, decrement, handleKeydown } = useNumberInput({
      modelValue,
      ...DEFAULT_BOUNDS,
      disabled: ref(true),
    })
    increment()
    expect(modelValue.value).toBe(5)
    decrement()
    expect(modelValue.value).toBe(5)
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(modelValue.value).toBe(5)
  })

  it('should track display buffer independently', () => {
    const modelValue = ref(5)
    const { handleInput, displayValue } = useNumberInput({ modelValue, ...DEFAULT_BOUNDS })
    const inputEvent = { target: { value: '123' } } as unknown as Event
    handleInput(inputEvent)
    expect(displayValue.value).toBe('123')
    expect(modelValue.value).toBe(5)
  })

  it('should handle negative values', () => {
    const modelValue = ref(-5)
    const { increment, decrement } = useNumberInput({
      modelValue,
      min: -10,
      max: 10,
    })
    increment()
    expect(modelValue.value).toBe(-4)
    decrement()
    expect(modelValue.value).toBe(-5)
  })
})
