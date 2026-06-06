import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTabs } from './useTabs'

describe('useTabs', () => {
  function setup(position: 'top' | 'left' | 'right' | 'bottom' = 'top') {
    const modelValue = ref('a')
    const tabs = ref([
      { key: 'a', label: 'Tab A' },
      { key: 'b', label: 'Tab B' },
      { key: 'c', label: 'Tab C', disabled: true },
      { key: 'd', label: 'Tab D' },
    ])
    const pos = ref(position)
    const result = useTabs({ modelValue, tabs, position: pos })
    return { modelValue, tabs, pos, ...result }
  }

  it('should activate a tab by key', () => {
    const { modelValue, activate } = setup()
    activate('b')
    expect(modelValue.value).toBe('b')
  })

  it('should not activate a disabled tab', () => {
    const { modelValue, activate } = setup()
    activate('c')
    expect(modelValue.value).toBe('a')
  })

  it('should report horizontal orientation for top position', () => {
    const { orientation } = setup('top')
    expect(orientation.value).toBe('horizontal')
  })

  it('should report vertical orientation for left position', () => {
    const { orientation } = setup('left')
    expect(orientation.value).toBe('vertical')
  })

  it('should report vertical orientation for right position', () => {
    const { orientation } = setup('right')
    expect(orientation.value).toBe('vertical')
  })

  it('should report horizontal orientation for bottom position', () => {
    const { orientation } = setup('bottom')
    expect(orientation.value).toBe('horizontal')
  })

  it('panelId should be based on tabListId', () => {
    const { panelId, tabListId } = setup()
    expect(panelId.value).toBe(`${tabListId}-panel`)
  })

  it('should navigate to next tab with ArrowRight in horizontal mode', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    handleKeydown(event, 'a')
    expect(modelValue.value).toBe('b')
    expect(preventDefault).toHaveBeenCalled()
  })

  it('should navigate to previous tab with ArrowLeft in horizontal mode', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    handleKeydown(event, 'b')
    expect(modelValue.value).toBe('a')
  })

  it('should wrap around to first tab from last with ArrowRight', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    handleKeydown(event, 'd')
    expect(modelValue.value).toBe('a')
  })

  it('should wrap around to last tab from first with ArrowLeft', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    handleKeydown(event, 'a')
    expect(modelValue.value).toBe('d')
  })

  it('should navigate down with ArrowDown in vertical mode', () => {
    const { modelValue, handleKeydown } = setup('left')
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeydown(event, 'a')
    expect(modelValue.value).toBe('b')
  })

  it('should navigate up with ArrowUp in vertical mode', () => {
    const { modelValue, handleKeydown } = setup('left')
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    handleKeydown(event, 'b')
    expect(modelValue.value).toBe('a')
  })

  it('should skip disabled tabs in keyboard navigation', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    // a -> b (c is disabled, skip to d)
    handleKeydown(event, 'b')
    expect(modelValue.value).toBe('d')
  })

  it('should ignore unrelated keys', () => {
    const { modelValue, handleKeydown } = setup('top')
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    handleKeydown(event, 'a')
    expect(modelValue.value).toBe('a')
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('should do nothing when all tabs are disabled', () => {
    const modelValue = ref('a')
    const tabs = ref([
      { key: 'a', label: 'Tab A', disabled: true },
      { key: 'b', label: 'Tab B', disabled: true },
    ])
    const result = useTabs({ modelValue, tabs })
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    result.handleKeydown(event, 'a')
    expect(modelValue.value).toBe('a')
  })
})
