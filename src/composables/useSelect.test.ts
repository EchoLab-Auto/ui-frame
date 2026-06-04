import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSelect } from './useSelect'
import type { SelectOption } from './useSelect'

describe('useSelect', () => {
  const options: SelectOption[] = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3 },
    { label: 'Disabled', value: 4, disabled: true },
  ]

  function setup() {
    const modelValue = ref<string | number>('')
    const select = useSelect({
      modelValue,
      options: ref(options),
    })
    return { modelValue, select }
  }

  it('should toggle open state', () => {
    const { select } = setup()
    expect(select.isOpen.value).toBe(false)
    select.toggleOpen()
    expect(select.isOpen.value).toBe(true)
    select.toggleOpen()
    expect(select.isOpen.value).toBe(false)
  })

  it('should close on Escape', () => {
    const { select } = setup()
    select.isOpen.value = true
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(select.isOpen.value).toBe(false)
  })

  it('should select an option and close', () => {
    const { modelValue, select } = setup()
    select.selectOption(options[1])
    expect(modelValue.value).toBe(2)
    expect(select.isOpen.value).toBe(false)
  })

  it('should not select a disabled option', () => {
    const { modelValue, select } = setup()
    select.selectOption(options[3])
    expect(modelValue.value).toBe('')
  })

  it('should find selected option via computed', () => {
    const { modelValue, select } = setup()
    modelValue.value = 3
    expect(select.selectedOption.value).toEqual(options[2])
  })

  it('should clear value to undefined', () => {
    const { modelValue, select } = setup()
    modelValue.value = 1
    select.clearValue()
    expect(modelValue.value).toBeUndefined()
  })

  it('should accept custom clear value', () => {
    const { modelValue, select } = setup()
    modelValue.value = 1
    select.clearValue(0)
    expect(modelValue.value).toBe(0)
  })

  it('should not toggle when disabled', () => {
    const modelValue = ref('')
    const select = useSelect({
      modelValue,
      options: ref(options),
      disabled: ref(true),
    })
    select.toggleOpen()
    expect(select.isOpen.value).toBe(false)
  })

  it('should navigate with ArrowDown in open state', () => {
    const { modelValue, select } = setup()
    select.isOpen.value = true
    modelValue.value = 1
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(modelValue.value).toBe(2)
  })

  it('should navigate with ArrowUp in open state', () => {
    const { modelValue, select } = setup()
    select.isOpen.value = true
    modelValue.value = 2
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(modelValue.value).toBe(1)
  })

  it('should wrap ArrowDown to first option', () => {
    const { modelValue, select } = setup()
    select.isOpen.value = true
    modelValue.value = 3
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(modelValue.value).toBe(1)
  })

  it('should go to first/last with Home/End', () => {
    const { modelValue, select } = setup()
    select.isOpen.value = true
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'End' }))
    expect(modelValue.value).toBe(3)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Home' }))
    expect(modelValue.value).toBe(1)
  })

  it('should handle blur - close when focus leaves container', () => {
    const { select } = setup()
    select.isOpen.value = true
    const container = document.createElement('div')
    const outside = document.createElement('div')
    container.appendChild(outside)
    select.handleBlur(document.createElement('span'), container)
    expect(select.isOpen.value).toBe(false)
  })

  it('should not close on blur when focus stays inside', () => {
    const { select } = setup()
    select.isOpen.value = true
    const container = document.createElement('div')
    const child = document.createElement('button')
    container.appendChild(child)
    select.handleBlur(child, container)
    expect(select.isOpen.value).toBe(true)
  })
})
