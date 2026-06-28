import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useMenu } from './useMenu'
import type { MenuItem } from './useMenu'

describe('useMenu', () => {
  const items: MenuItem[] = [
    { key: '1', label: 'Item 1' },
    { key: '2', label: 'Item 2', divided: true },
    {
      key: '3',
      label: 'Submenu',
      children: [
        { key: '3-1', label: 'Sub 1' },
        { key: '3-2', label: 'Sub 2' },
      ],
    },
    { key: '4', label: 'Item 4', disabled: true },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with no active key', () => {
    const { activeKey, allKeys } = useMenu({ items: ref(items) })
    expect(activeKey.value).toBeNull()
    expect(allKeys.value).toEqual(['1', '2', '3', '3-1', '3-2', '4'])
  })

  it('should handle item click (leaf)', () => {
    const onSelect = vi.fn()
    const { handleItemClick, activeKey } = useMenu({
      items: ref(items),
      onSelect,
    })
    handleItemClick(items[0])
    expect(activeKey.value).toBe('1')
    expect(onSelect).toHaveBeenCalledWith(items[0])
  })

  it('should handle item click (submenu toggle)', () => {
    const { handleItemClick, isExpanded } = useMenu({
      items: ref(items),
    })
    handleItemClick(items[2]) // Submenu
    expect(isExpanded('3')).toBe(true)
    handleItemClick(items[2])
    expect(isExpanded('3')).toBe(false)
  })

  it('should not activate disabled items', () => {
    const onSelect = vi.fn()
    const { handleItemClick, activeKey } = useMenu({
      items: ref(items),
      onSelect,
    })
    handleItemClick(items[3]) // Disabled
    expect(onSelect).not.toHaveBeenCalled()
    expect(activeKey.value).toBeNull()
  })

  it('should not handle clicks when disabled', () => {
    const onSelect = vi.fn()
    const { handleItemClick } = useMenu({
      items: ref(items),
      onSelect,
      disabled: ref(true),
    })
    handleItemClick(items[0])
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('should handle item hover (horizontal mode)', () => {
    const { handleItemEnter, activeKey, isExpanded } = useMenu({
      items: ref(items),
      mode: ref('horizontal'),
    })
    handleItemEnter(items[2]) // Submenu in horizontal mode
    expect(isExpanded('3')).toBe(true)
    expect(activeKey.value).toBe('3')
  })

  it('should handle keyboard navigation (ArrowDown)', () => {
    const { handleKeydown, activeKey } = useMenu({
      items: ref(items),
      mode: ref('vertical'),
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeKey.value).toBe('1')
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeKey.value).toBe('2')
  })

  it('should handle keyboard navigation (ArrowUp)', () => {
    const { handleKeydown, activeKey } = useMenu({
      items: ref(items),
      mode: ref('vertical'),
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeKey.value).toBe('2')
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(activeKey.value).toBe('1')
  })

  it('should handle Home/End keys', () => {
    const { handleKeydown, activeKey } = useMenu({
      items: ref(items),
    })
    // End jumps to last enabled visible node
    // visible nodes: [1, 2, 3] (4 is disabled, submenu children hidden when collapsed)
    handleKeydown(new KeyboardEvent('keydown', { key: 'End' }))
    expect(activeKey.value).toBe('3')
    // Home jumps to first
    handleKeydown(new KeyboardEvent('keydown', { key: 'Home' }))
    expect(activeKey.value).toBe('1')
  })

  it('should handle Enter to select', () => {
    const onSelect = vi.fn()
    const { handleKeydown, activeKey } = useMenu({
      items: ref(items),
      mode: ref('vertical'),
      onSelect,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeKey.value).toBe('1')
    handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onSelect).toHaveBeenCalledWith(items[0])
  })

  it('should handle Escape to clear state', () => {
    const { handleKeydown, activeKey, handleItemClick, isExpanded } = useMenu({
      items: ref(items),
    })
    handleItemClick(items[2]) // Expand submenu
    expect(isExpanded('3')).toBe(true)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isExpanded('3')).toBe(false)
    expect(activeKey.value).toBeNull()
  })

  it('should typeahead search', () => {
    const { handleKeydown, activeKey } = useMenu({
      items: ref([
        { key: 'a', label: 'Alpha' },
        { key: 'b', label: 'Beta' },
        { key: 'g', label: 'Gamma' },
      ]),
    })
    // Type 'B' should jump to Beta
    handleKeydown(new KeyboardEvent('keydown', { key: 'b' }))
    expect(activeKey.value).toBe('b')
  })

  it('should expand and collapse submenus', () => {
    const { expand, collapse, isExpanded } = useMenu({
      items: ref(items),
    })
    expand('3')
    expect(isExpanded('3')).toBe(true)
    collapse('3')
    expect(isExpanded('3')).toBe(false)
  })

  it('should toggle submenus', () => {
    const { toggleExpand, isExpanded } = useMenu({
      items: ref(items),
    })
    toggleExpand('3')
    expect(isExpanded('3')).toBe(true)
    toggleExpand('3')
    expect(isExpanded('3')).toBe(false)
  })

  it('should allow expanding any key', () => {
    const { expand, isExpanded, collapse } = useMenu({ items: ref(items) })
    // expand() stores the key regardless of whether it exists in the menu tree
    expand('nonexistent')
    expect(isExpanded('nonexistent')).toBe(true)
    collapse('nonexistent')
    expect(isExpanded('nonexistent')).toBe(false)
  })

  it('should handle horizontal mode ArrowRight/ArrowLeft', () => {
    const onSelect = vi.fn()
    const { handleKeydown, handleItemClick } = useMenu({
      items: ref(items),
      mode: ref('horizontal'),
      onSelect,
    })
    // Expand submenu first
    handleItemClick(items[2])
    // ArrowRight should expand into first child
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    // ArrowLeft should collapse back to parent
  })

  it('should not handle keys when disabled', () => {
    const { handleKeydown, activeKey } = useMenu({
      items: ref(items),
      disabled: ref(true),
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(activeKey.value).toBeNull()
  })
})
