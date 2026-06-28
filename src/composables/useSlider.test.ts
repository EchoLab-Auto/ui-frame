import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSlider, coordinateToValue } from './useSlider'

describe('useSlider', () => {
  it('should return clamped slider value', () => {
    const modelValue = ref(50)
    const { sliderValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    expect(sliderValue.value).toBe(50)
  })

  it('should clamp value below min', () => {
    const modelValue = ref(-10)
    const { sliderValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    expect(sliderValue.value).toBe(0)
  })

  it('should clamp value above max', () => {
    const modelValue = ref(150)
    const { sliderValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    expect(sliderValue.value).toBe(100)
  })

  it('should compute correct percentage', () => {
    const modelValue = ref(50)
    const { percentage } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    expect(percentage.value).toBe(50)
  })

  it('should return 0% when range is 0', () => {
    const modelValue = ref(5)
    const { percentage } = useSlider({
      modelValue,
      min: 5,
      max: 5,
      step: 1,
    })
    expect(percentage.value).toBe(0)
  })

  it('should set value with step rounding', () => {
    const modelValue = ref(0)
    const { setValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 5,
    })
    setValue(7)
    expect(modelValue.value).toBe(5)
  })

  it('should set value within bounds', () => {
    const modelValue = ref(0)
    const { setValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    setValue(200)
    expect(modelValue.value).toBe(100)
    setValue(-10)
    expect(modelValue.value).toBe(0)
  })

  it('should not set value when disabled', () => {
    const modelValue = ref(0)
    const { setValue } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
      disabled: ref(true),
    })
    setValue(50)
    expect(modelValue.value).toBe(0)
  })

  it('should handle ArrowRight/ArrowUp keys', () => {
    const modelValue = ref(50)
    const { handleKeydown } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 10,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(modelValue.value).toBe(60)
  })

  it('should handle ArrowLeft/ArrowDown keys', () => {
    const modelValue = ref(50)
    const { handleKeydown } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 10,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(modelValue.value).toBe(40)
  })

  it('should handle Home/End keys', () => {
    const modelValue = ref(50)
    const { handleKeydown } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'End' }))
    expect(modelValue.value).toBe(100)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Home' }))
    expect(modelValue.value).toBe(0)
  })

  it('should handle PageUp/PageDown keys', () => {
    const modelValue = ref(0)
    const { handleKeydown } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'PageUp' }))
    expect(modelValue.value).toBeGreaterThan(0)
    handleKeydown(new KeyboardEvent('keydown', { key: 'PageDown' }))
    expect(modelValue.value).toBe(0)
  })

  it('should not handle keys when disabled', () => {
    const modelValue = ref(50)
    const { handleKeydown } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
      disabled: ref(true),
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(modelValue.value).toBe(50)
  })

  it('should track dragging state', () => {
    const modelValue = ref(0)
    const { isDragging } = useSlider({
      modelValue,
      min: 0,
      max: 100,
      step: 1,
    })
    expect(isDragging.value).toBe(false)
    isDragging.value = true
    expect(isDragging.value).toBe(true)
  })
})

describe('coordinateToValue', () => {
  it('should compute value from coordinate', () => {
    const value = coordinateToValue(50, 0, 100, 0, 100, 1, false)
    expect(value).toBe(50)
  })

  it('should compute value for vertical slider', () => {
    // top=0 is max (100), bottom=100 is min (0)
    const value = coordinateToValue(10, 0, 100, 0, 100, 1, true)
    expect(value).toBe(90)
  })

  it('should clamp to min', () => {
    const value = coordinateToValue(-10, 0, 100, 20, 100, 1, false)
    expect(value).toBe(20)
  })

  it('should clamp to max', () => {
    const value = coordinateToValue(200, 0, 100, 0, 50, 1, false)
    expect(value).toBe(50)
  })

  it('should return min on zero track size', () => {
    const value = coordinateToValue(50, 0, 0, 10, 100, 1, false)
    expect(value).toBe(10)
  })

  it('should round to step', () => {
    const value = coordinateToValue(23, 0, 100, 0, 100, 10, false)
    expect(value).toBe(20)
  })
})
