import { describe, it, expect, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useScrollbar } from './useScrollbar'

function makeOptions(overrides: Record<string, unknown> = {}) {
  return {
    variant: ref('standard' as const),
    target: ref('#scroll-box'),
    dotColor: ref('153,153,153'),
    accentColor: ref('205,250,78'),
    sigma: ref(14),
    ...overrides,
  }
}

describe('useScrollbar', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="scroll-box" style="height:100px;overflow:auto"></div>'
  })

  it('CSS 类变体：start 为目标元素添加类,stop 移除', () => {
    const { start, stop } = useScrollbar(makeOptions({ variant: ref('primary' as const) }))
    start()
    const el = document.querySelector('#scroll-box')!
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(true)
    stop()
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(false)
  })

  it('变体切换时替换旧类', async () => {
    const variant = ref<'standard' | 'primary'>('standard')
    const { start } = useScrollbar(makeOptions({ variant }))
    start()
    const el = document.querySelector('#scroll-box')!
    expect(el.classList.contains('nm-scrollbar--standard')).toBe(true)
    variant.value = 'primary'
    await nextTick()
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(true)
    expect(el.classList.contains('nm-scrollbar--standard')).toBe(false)
  })

  it('空 target 为安全 no-op', () => {
    const { start, stop } = useScrollbar(makeOptions({ target: ref('') }))
    expect(() => {
      start()
      stop()
    }).not.toThrow()
    expect(document.querySelector('#scroll-box')!.className).toBe('')
  })

  it('dots 覆盖层：注入隐藏原生滚动条的 style 并构建 sticky 包装', () => {
    const { start, stop } = useScrollbar(makeOptions({ variant: ref('dots' as const) }))
    start()
    const el = document.querySelector('#scroll-box')!
    expect(el.querySelector('div')).not.toBeNull()
    expect(document.getElementById('nm-sb-hide--scroll-box')).not.toBeNull()
    stop()
    expect(document.getElementById('nm-sb-hide--scroll-box')).toBeNull()
  })

  it('glow 覆盖层：辉光随滚动进度移动', () => {
    const { start, stop } = useScrollbar(makeOptions({ variant: ref('glow' as const) }))
    start()
    const el = document.querySelector('#scroll-box') as HTMLElement
    const wrapper = el.children[0] as HTMLElement
    const glow = wrapper.children[0] as HTMLElement
    expect(glow).not.toBeNull()
    expect(glow.style.backgroundImage).toContain('radial-gradient')
    expect(glow.style.backgroundImage.replace(/\s/g, '')).toContain('205,250,78')
    stop()
  })

  it('卸载时清理监听器与 DOM', () => {
    const { start, stop } = useScrollbar(makeOptions({ variant: ref('dots' as const) }))
    start()
    const el = document.querySelector('#scroll-box')!
    expect(el.children.length).toBeGreaterThan(0)
    stop()
    expect(el.children.length).toBe(0)
  })
})
