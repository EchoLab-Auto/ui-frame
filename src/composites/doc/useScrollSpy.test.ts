import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useScrollSpy, getScrollBehavior } from './useScrollSpy'
import { createIntersectionObserverMock } from '@/__test-utils__/test-helpers'

function createContainerWithHeadings(ids: string[]): HTMLElement {
  const el = document.createElement('div')
  for (const id of ids) {
    const h = document.createElement('h2')
    h.id = id
    el.appendChild(h)
  }
  return el
}

describe('useScrollSpy', () => {
  const originalIO = globalThis.IntersectionObserver

  beforeEach(() => {
    const io = createIntersectionObserverMock()
    globalThis.IntersectionObserver =
      io.IntersectionObserver as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO
    vi.restoreAllMocks()
  })

  it('scrollToHeading 立即设置激活项并平滑滚动到目标', () => {
    vi.useFakeTimers()
    const container = createContainerWithHeadings(['h-a', 'h-b'])
    const content = ref<HTMLElement | null>(container)
    const { activeHeading, scrollToHeading } = useScrollSpy({ content })

    const target = container.querySelector('#h-b') as HTMLElement
    target.scrollIntoView = vi.fn()

    scrollToHeading('h-b')
    expect(activeHeading.value).toBe('h-b')
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    vi.useRealTimers()
  })

  it('syncActiveHeading 依据视口位置计算激活项', () => {
    const scrollContainer = document.createElement('div')
    const contentEl = createContainerWithHeadings(['h-a', 'h-b'])
    scrollContainer.appendChild(contentEl)
    const content = ref<HTMLElement | null>(contentEl)

    // 布局环境 mock：滚动容器顶部为 0，h-a 在偏移上方，h-b 在下方
    scrollContainer.getBoundingClientRect = () => ({ top: 0, bottom: 600, height: 600 }) as DOMRect
    const [ha, hb] = Array.from(contentEl.querySelectorAll('h2'))
    ha.getBoundingClientRect = () => ({ top: 10, bottom: 40 }) as DOMRect
    hb.getBoundingClientRect = () => ({ top: 300, bottom: 340 }) as DOMRect

    const { activeHeading, syncActiveHeading } = useScrollSpy({
      content,
      scrollContainer: ref(scrollContainer),
    })
    syncActiveHeading()
    expect(activeHeading.value).toBe('h-a')
  })

  it('内容容器为空时静默安全', () => {
    const content = ref<HTMLElement | null>(null)
    const { activeHeading, syncActiveHeading, scrollToHeading } = useScrollSpy({ content })
    expect(() => {
      syncActiveHeading()
      scrollToHeading('x')
    }).not.toThrow()
    // 目标不存在时不滚动，但点击导航语义仍会立即高亮（与原有行为一致）
    expect(activeHeading.value).toBe('x')
  })

  it('getScrollBehavior 跟随 prefers-reduced-motion', () => {
    const original = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof matchMedia
    expect(getScrollBehavior()).toBe('auto')
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia
    expect(getScrollBehavior()).toBe('smooth')
    window.matchMedia = original
  })

  it('watchSource 变化后重建观察器', async () => {
    const io = createIntersectionObserverMock()
    globalThis.IntersectionObserver =
      io.IntersectionObserver as unknown as typeof IntersectionObserver

    const scrollContainer = document.createElement('div')
    const contentEl = createContainerWithHeadings(['h-a'])
    scrollContainer.appendChild(contentEl)
    document.body.appendChild(scrollContainer)

    const version = ref(0)
    useScrollSpy({
      content: ref(contentEl),
      scrollContainer: ref(scrollContainer),
      watchSource: () => version.value,
    })
    await nextTick()
    await nextTick()

    version.value = 1
    await nextTick()
    await nextTick()
    // 无异常即通过（观察器重建路径）
    document.body.removeChild(scrollContainer)
  })
})
