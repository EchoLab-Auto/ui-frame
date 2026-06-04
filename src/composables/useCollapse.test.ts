import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useCollapse } from './useCollapse'

describe('useCollapse', () => {
  const items = [
    { key: 'a', title: 'Panel A' },
    { key: 'b', title: 'Panel B' },
    { key: 'c', title: 'Panel C', disabled: true },
  ]

  it('should toggle panel active state', () => {
    const modelValue = ref<string[]>([])
    const collapse = useCollapse({ modelValue, items: ref(items) })
    collapse.toggle('a')
    expect(collapse.isActive('a')).toBe(true)
    collapse.toggle('a')
    expect(collapse.isActive('a')).toBe(false)
  })

  it('should support accordion mode (only one open)', () => {
    const modelValue = ref<string[]>([])
    const collapse = useCollapse({ modelValue, items: ref(items), accordion: ref(true) })
    collapse.toggle('a')
    expect(collapse.isActive('a')).toBe(true)
    collapse.toggle('b')
    expect(collapse.isActive('a')).toBe(false)
    expect(collapse.isActive('b')).toBe(true)
  })

  it('should allow multiple panels in non-accordion mode', () => {
    const modelValue = ref<string[]>([])
    const collapse = useCollapse({ modelValue, items: ref(items) })
    collapse.toggle('a')
    collapse.toggle('b')
    expect(collapse.isActive('a')).toBe(true)
    expect(collapse.isActive('b')).toBe(true)
  })

  it('should not toggle disabled panels', () => {
    const modelValue = ref<string[]>([])
    const collapse = useCollapse({ modelValue, items: ref(items) })
    collapse.toggle('c')
    expect(collapse.isActive('c')).toBe(false)
  })
})
