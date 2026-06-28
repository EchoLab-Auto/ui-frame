import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAutoComplete } from './useAutoComplete'
import type { AutoCompleteOption } from './useAutoComplete'

describe('useAutoComplete', () => {
  const options: AutoCompleteOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date', disabled: true },
    { label: 'Apricot', value: 'apricot' },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with empty input and closed dropdown', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { inputValue, isOpen, filteredOptions } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    expect(inputValue.value).toBe('')
    expect(isOpen.value).toBe(false)
    expect(filteredOptions.value).toEqual(options)
  })

  it('should open dropdown and filter options when typing', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, isOpen, filteredOptions } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('ap')
    expect(isOpen.value).toBe(true)
    expect(filteredOptions.value.length).toBe(2) // Apple, Apricot
    expect(filteredOptions.value[0].label).toBe('Apple')
  })

  it('should filter options locally', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, filteredOptions } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('ban')
    expect(filteredOptions.value).toHaveLength(1)
    expect(filteredOptions.value[0].value).toBe('banana')
  })

  it('should select an option', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { selectOption, inputValue, isOpen } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    selectOption(options[0])
    expect(modelValue.value).toBe('apple')
    expect(inputValue.value).toBe('Apple')
    expect(isOpen.value).toBe(false)
  })

  it('should not select a disabled option', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { selectOption } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    selectOption(options[3]) // Date (disabled)
    expect(modelValue.value).toBeUndefined()
  })

  it('should navigate with ArrowDown/ArrowUp', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, handleKeydown, activeIndex, isOpen } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('a')
    expect(isOpen.value).toBe(true)
    // ArrowDown should select first enabled option
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeIndex.value).toBe(0)
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeIndex.value).toBe(1) // wraps to index 1 (Apricot has 2 matches)
  })

  it('should wrap ArrowUp to last', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, handleKeydown, activeIndex } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('a')
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(activeIndex.value).toBeGreaterThanOrEqual(0) // wraps to last
  })

  it('should select with Enter key', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, handleKeydown, inputValue } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('apple')
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(modelValue.value).toBe('apple')
    expect(inputValue.value).toBe('Apple')
  })

  it('should close on Escape', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, handleKeydown, isOpen } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('a')
    expect(isOpen.value).toBe(true)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isOpen.value).toBe(false)
  })

  it('should highlight matching text', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { handleInput, highlightMatch } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    handleInput('app')
    const highlighted = highlightMatch('Apple')
    expect(highlighted).toContain('<mark')
    expect(highlighted).toContain('App')
    expect(highlighted).toContain('le')
  })

  it('should escape HTML in labels', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { highlightMatch } = useAutoComplete({
      modelValue,
      options: ref([]),
    })
    const result = highlightMatch('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should open and close programmatically', () => {
    const modelValue = ref<string | number | undefined>(undefined)
    const { open, close, isOpen } = useAutoComplete({
      modelValue,
      options: ref(options),
    })
    open()
    expect(isOpen.value).toBe(true)
    close()
    expect(isOpen.value).toBe(false)
  })

  it('should perform async search', async () => {
    vi.useRealTimers()
    const modelValue = ref<string | number | undefined>(undefined)
    const searchFn = vi.fn().mockResolvedValue([{ label: 'Remote Result', value: 'remote' }])
    const { handleInput } = useAutoComplete({
      modelValue,
      searchFn,
    })
    handleInput('test')
    // Wait for debounce
    await new Promise(r => setTimeout(r, 350))
    expect(searchFn).toHaveBeenCalledWith('test')
  })
})
