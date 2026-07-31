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

describe('useSelect — multiple', () => {
  const options: SelectOption[] = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3 },
    { label: 'Disabled', value: 4, disabled: true },
  ]

  function setupMultiple(initial: (string | number)[] = []) {
    const modelValue = ref<string | number | (string | number)[] | undefined>(initial)
    const select = useSelect({
      modelValue,
      options: ref(options),
      multiple: ref(true),
    })
    return { modelValue, select }
  }

  it('should toggle option into the selection array without closing', () => {
    const { modelValue, select } = setupMultiple()
    select.isOpen.value = true
    select.selectOption(options[0])
    expect(modelValue.value).toEqual([1])
    expect(select.isOpen.value).toBe(true)
    select.selectOption(options[0])
    expect(modelValue.value).toEqual([])
    expect(select.isOpen.value).toBe(true)
  })

  it('should not toggle a disabled option', () => {
    const { modelValue, select } = setupMultiple()
    select.selectOption(options[3])
    expect(modelValue.value).toEqual([])
  })

  it('should normalize a scalar modelValue into an array on toggle', () => {
    const { modelValue, select } = setupMultiple()
    modelValue.value = 2
    select.selectOption(options[0])
    expect(modelValue.value).toEqual([2, 1])
  })

  it('should report isSelected from the array', () => {
    const { modelValue, select } = setupMultiple([1, 3])
    expect(select.isSelected(options[0])).toBe(true)
    expect(select.isSelected(options[1])).toBe(false)
    expect(modelValue.value).toEqual([1, 3])
  })

  it('should expose selectedOptions for the selected values', () => {
    const { select } = setupMultiple([3, 1])
    expect(select.selectedOptions.value.map(o => o.value)).toEqual([1, 3])
  })

  it('should removeValue a single entry', () => {
    const { modelValue, select } = setupMultiple([1, 2])
    select.removeValue(1)
    expect(modelValue.value).toEqual([2])
  })

  it('should clearValue to an empty array', () => {
    const { modelValue, select } = setupMultiple([1, 2])
    select.clearValue()
    expect(modelValue.value).toEqual([])
  })

  it('should move activeValue with arrows instead of changing selection', () => {
    const { modelValue, select } = setupMultiple()
    select.isOpen.value = true
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(modelValue.value).toEqual([])
    expect(select.activeValue.value).toBe(1)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(select.activeValue.value).toBe(2)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(select.activeValue.value).toBe(1)
  })

  it('should toggle the active option with Enter while open', () => {
    const { modelValue, select } = setupMultiple()
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(select.isOpen.value).toBe(true)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(modelValue.value).toEqual([1])
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(modelValue.value).toEqual([])
  })

  it('should open on Enter when closed without selecting', () => {
    const { modelValue, select } = setupMultiple()
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(select.isOpen.value).toBe(true)
    expect(modelValue.value).toEqual([])
  })

  it('should wrap activeValue around the list ends', () => {
    const { select } = setupMultiple()
    select.isOpen.value = true
    select.activeValue.value = 3
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(select.activeValue.value).toBe(1)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(select.activeValue.value).toBe(3)
  })

  it('should move activeValue with Home/End', () => {
    const { select } = setupMultiple()
    select.isOpen.value = true
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'End' }))
    expect(select.activeValue.value).toBe(3)
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'Home' }))
    expect(select.activeValue.value).toBe(1)
  })

  it('should move activeValue with typeahead without selecting', () => {
    const { modelValue, select } = setupMultiple()
    select.isOpen.value = true
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'O' }))
    expect(select.activeValue.value).toBe(1)
    expect(modelValue.value).toEqual([])
  })
})

describe('useSelect — filter & group', () => {
  const options: SelectOption[] = [
    { label: 'Apple', value: 'apple', group: '水果' },
    { label: 'Banana', value: 'banana', group: '水果' },
    { label: 'Carrot', value: 'carrot', group: '蔬菜' },
    { label: 'Bread', value: 'bread' },
  ]

  it('should filter options by label (case-insensitive contains)', () => {
    const modelValue = ref<string | number>('')
    const filterText = ref('an')
    const select = useSelect({ modelValue, options: ref(options), filterText })
    expect(select.filteredOptions.value.map(o => o.value)).toEqual(['banana'])
  })

  it('should return all options when filter text is blank', () => {
    const modelValue = ref<string | number>('')
    const filterText = ref('   ')
    const select = useSelect({ modelValue, options: ref(options), filterText })
    expect(select.filteredOptions.value).toHaveLength(4)
  })

  it('should navigate within the filtered list', () => {
    const modelValue = ref<string | number>('')
    const filterText = ref('a')
    const select = useSelect({ modelValue, options: ref(options), filterText })
    select.isOpen.value = true
    // 过滤后: apple / banana / carrot / bread（全部含 a）—— 但排除不含 a 的项后语义相同，改用更窄的过滤
    filterText.value = 'an'
    select.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(modelValue.value).toBe('banana')
  })

  it('should group options by group field preserving order', () => {
    const modelValue = ref<string | number>('')
    const select = useSelect({ modelValue, options: ref(options) })
    expect(select.groupedOptions.value).toEqual([
      { name: '水果', options: [options[0], options[1]] },
      { name: '蔬菜', options: [options[2]] },
      { name: '', options: [options[3]] },
    ])
  })

  it('should group the filtered options', () => {
    const modelValue = ref<string | number>('')
    const filterText = ref('a')
    const select = useSelect({ modelValue, options: ref(options), filterText })
    const groups = select.groupedOptions.value
    expect(groups.map(g => g.name)).toEqual(['水果', '蔬菜', ''])
  })

  it('should clear the filter text after toggling an option in multiple mode', () => {
    const modelValue = ref<string | number | (string | number)[] | undefined>([])
    const filterText = ref('app')
    const select = useSelect({
      modelValue,
      options: ref(options),
      multiple: ref(true),
      filterText,
    })
    select.selectOption(options[0])
    expect(filterText.value).toBe('')
  })
})
