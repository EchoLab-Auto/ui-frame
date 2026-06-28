import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useVirtualList } from './useVirtualList'

describe('useVirtualList', () => {
  function mountVirtualList(
    items: ReturnType<typeof ref>,
    itemHeight: Record<string, unknown> | number | ((index: number) => number) = 50,
    overscan = 2
  ) {
    let result: ReturnType<typeof useVirtualList> | null = null

    const Comp = defineComponent({
      setup() {
        result = useVirtualList({
          items: items as any,
          itemHeight: itemHeight as any,
          overscan,
        })
        return () => h('div')
      },
    })

    const wrapper = mount(Comp)
    return { result: () => result!, unmount: () => wrapper.unmount() }
  }

  it('should initialize with default values', () => {
    const items = ref(Array.from({ length: 100 }, (_, i) => ({ id: i })))
    const { result } = mountVirtualList(items, 50)
    expect(result().totalHeight.value).toBe(0) // 0 until ResizeObserver fires
    expect(result().startIndex.value).toBe(0)
    expect(result().endIndex.value).toBe(0)
    expect(result().offsetY.value).toBe(0)
  })

  it('should expose containerRef', () => {
    const items = ref<any[]>([])
    const { result } = mountVirtualList(items, 50)
    expect(result().containerRef).toBeDefined()
    expect(result().containerRef.value).toBeNull()
  })

  it('should expose visibleItems as a computed', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: i }))
    const items = ref(data)
    const { result } = mountVirtualList(items, 50)
    // With start/end both 0, visibleItems is empty initially
    expect(result().visibleItems.value).toBeDefined()
    expect(Array.isArray(result().visibleItems.value)).toBe(true)
  })

  it('should handle empty items list', () => {
    const items = ref<any[]>([])
    const { result } = mountVirtualList(items, 50)
    expect(result().totalHeight.value).toBe(0)
    expect(result().visibleItems.value).toHaveLength(0)
  })

  it('should handle scroll event without container', () => {
    const items = ref(Array.from({ length: 100 }, (_, i) => ({ id: i })))
    const { result } = mountVirtualList(items, 50)
    // handleScroll should not throw when container ref is null
    expect(() => result().handleScroll()).not.toThrow()
  })

  it('should handle scrollTo without container', () => {
    const items = ref(Array.from({ length: 100 }, (_, i) => ({ id: i })))
    const { result } = mountVirtualList(items, 50)
    // scrollTo should not throw when container ref is null
    expect(() => result().scrollTo(20)).not.toThrow()
  })

  it('should accept number for itemHeight', () => {
    const items = ref(Array.from({ length: 10 }, (_, i) => ({ id: i })))
    const { result } = mountVirtualList(items, 30)
    expect(result()).toBeDefined()
  })

  it('should accept function for dynamic itemHeight', () => {
    const items = ref([
      { id: 1, height: 50 },
      { id: 2, height: 100 },
    ])
    const { result } = mountVirtualList(
      items,
      (i: number) => (items.value[i]?.height as number) || 50
    )
    expect(result()).toBeDefined()
  })

  it('should accept ref for itemHeight', () => {
    const items = ref(Array.from({ length: 10 }, (_, i) => ({ id: i })))
    const itemHeight = ref(60)
    const { result } = mountVirtualList(items, itemHeight)
    expect(result()).toBeDefined()
  })
})
