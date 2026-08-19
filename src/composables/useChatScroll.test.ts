import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useChatScroll } from './useChatScroll'

/** 构造一个可控尺寸的滚动容器 mock */
function createContainer({ scrollHeight = 1000, clientHeight = 200, scrollTop = 800 } = {}) {
  const el = document.createElement('div')
  Object.defineProperties(el, {
    scrollHeight: { value: scrollHeight, configurable: true, writable: true },
    clientHeight: { value: clientHeight, configurable: true, writable: true },
    scrollTop: { value: scrollTop, configurable: true, writable: true },
  })
  el.scrollTo = vi.fn()
  return el
}

describe('useChatScroll', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('贴底时 isNearBottom 为 true，不显示跳转按钮', () => {
    const container = ref(createContainer())
    const s = useChatScroll({ container })
    s.handleScroll()
    expect(s.isNearBottom.value).toBe(true)
    expect(s.showJumpButton.value).toBe(false)
  })

  it('向上翻阅超过阈值后显示"回到底部"', () => {
    const container = ref(createContainer({ scrollTop: 500 }))
    const s = useChatScroll({ container, threshold: 120 })
    s.handleScroll()
    expect(s.isNearBottom.value).toBe(false)
    expect(s.showJumpButton.value).toBe(true)
  })

  it('scrollToBottom 滚动到 scrollHeight 并乐观置位', () => {
    const el = createContainer({ scrollTop: 0 })
    const container = ref(el)
    const s = useChatScroll({ container })
    s.handleScroll()
    expect(s.isNearBottom.value).toBe(false)

    s.scrollToBottom()
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' })
    expect(s.isNearBottom.value).toBe(true)
  })

  it('watchSource 变化且用户贴底时自动吸底', async () => {
    const el = createContainer()
    const container = ref(el)
    const count = ref(1)
    const s = useChatScroll({ container, watchSource: () => count.value })

    count.value = 2
    await nextTick()
    await nextTick()
    expect(el.scrollTo).toHaveBeenCalled()
    expect(s.isNearBottom.value).toBe(true)
  })

  it('贴底用户在新内容超过阈值（流式长回复）时仍跟随', async () => {
    const el = createContainer({ scrollHeight: 1000, scrollTop: 800, clientHeight: 200 })
    const container = ref(el)
    const count = ref(1)
    const s = useChatScroll({ container, watchSource: () => count.value, threshold: 120 })
    s.handleScroll() // 用户贴底

    count.value = 2
    // 模拟 DOM 在 nextTick 前增长 500px（远超阈值）
    Object.defineProperty(el, 'scrollHeight', { value: 1500, configurable: true })
    await nextTick()
    await nextTick()
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1500, behavior: 'smooth' })
    expect(s.isNearBottom.value).toBe(true)
  })

  it('watchSource 变化但用户不在底部时不打扰', async () => {
    const el = createContainer({ scrollTop: 0 })
    const container = ref(el)
    const count = ref(1)
    const s = useChatScroll({ container, watchSource: () => count.value })
    s.handleScroll()

    count.value = 2
    await nextTick()
    await nextTick()
    expect(el.scrollTo).not.toHaveBeenCalled()
    expect(s.showJumpButton.value).toBe(true)
  })

  it('autoScroll 为 false 时 watchSource 变化不吸底', async () => {
    const el = createContainer()
    const container = ref(el)
    const count = ref(1)
    useChatScroll({ container, autoScroll: false, watchSource: () => count.value })

    count.value = 2
    await nextTick()
    await nextTick()
    expect(el.scrollTo).not.toHaveBeenCalled()
  })

  it('容器未挂载时 recheck/scrollToBottom 安全静默', () => {
    const container = ref<HTMLElement | null>(null)
    const s = useChatScroll({ container })
    expect(() => {
      s.recheck()
      s.handleScroll()
      s.scrollToBottom()
    }).not.toThrow()
    expect(s.isNearBottom.value).toBe(true)
  })
})
