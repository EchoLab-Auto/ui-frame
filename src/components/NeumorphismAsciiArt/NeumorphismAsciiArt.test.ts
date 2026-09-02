import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAsciiArt from './NeumorphismAsciiArt.vue'
import { createResizeObserverMock } from '@/__test-utils__/test-helpers'

// jsdom 无 canvas 2D 实现：桩掉 getContext，验证组件行为而非像素输出
function stubCanvas() {
  const ctxStub = new Proxy(
    {},
    {
      get: () => vi.fn(),
      set: () => true,
    }
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctxStub as unknown as CanvasRenderingContext2D
  )
}

describe('NeumorphismAsciiArt', () => {
  beforeEach(() => {
    stubCanvas()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))
    globalThis.ResizeObserver = createResizeObserverMock()
      .ResizeObserver as unknown as typeof ResizeObserver
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas with role=img and locale aria-label', () => {
    const wrapper = mount(NeumorphismAsciiArt, { props: { src: '/test.jpg' } })
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes('role')).toBe('img')
    expect(canvas.attributes('aria-label')).toBeTruthy()
  })

  it('applies custom aria-label and numeric height', () => {
    const wrapper = mount(NeumorphismAsciiArt, {
      props: { src: '/test.jpg', ariaLabel: '蒙娜丽莎字符画', height: 320 },
    })
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('蒙娜丽莎字符画')
    expect(wrapper.find('.nm-ascii-art').attributes('style')).toContain('height: 320px')
  })

  it('accepts string height', () => {
    const wrapper = mount(NeumorphismAsciiArt, { props: { src: '/test.jpg', height: '50vh' } })
    expect(wrapper.find('.nm-ascii-art').attributes('style')).toContain('height: 50vh')
  })

  it('stretches to explicit width', () => {
    const wrapper = mount(NeumorphismAsciiArt, {
      props: { src: '/test.jpg', width: 320, height: 400 },
    })
    const style = wrapper.find('.nm-ascii-art').attributes('style') ?? ''
    expect(style).toContain('width: 320px')
    expect(style).toContain('height: 400px')
  })

  it('falls back to 240px placeholder height before image ratio is known', () => {
    // jsdom 不触发 Image onload —— 比例未知时应为占位高度而非 aspect-ratio
    const wrapper = mount(NeumorphismAsciiArt, { props: { src: '/test.jpg' } })
    const style = wrapper.find('.nm-ascii-art').attributes('style') ?? ''
    expect(style).toContain('height: 240px')
    expect(style).not.toContain('aspect-ratio')
  })

  it('applies radius tokens, defaults to large, none is square', () => {
    const def = mount(NeumorphismAsciiArt, { props: { src: '/t.jpg' } })
    expect(def.find('.nm-ascii-art').attributes('style')).toContain(
      'border-radius: var(--nm-border-radius-lg)'
    )
    const square = mount(NeumorphismAsciiArt, { props: { src: '/t.jpg', radius: 'none' } })
    expect(square.find('.nm-ascii-art').attributes('style')).toContain('border-radius: 0')
    const small = mount(NeumorphismAsciiArt, { props: { src: '/t.jpg', radius: 'small' } })
    expect(small.find('.nm-ascii-art').attributes('style')).toContain(
      'border-radius: var(--nm-border-radius-sm)'
    )
  })

  it('renders overlay slot', () => {
    const wrapper = mount(NeumorphismAsciiArt, {
      props: { src: '/test.jpg' },
      slots: { default: '<figcaption>说明</figcaption>' },
    })
    expect(wrapper.find('.nm-ascii-art__overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('说明')
  })
})
