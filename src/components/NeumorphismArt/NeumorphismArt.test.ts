import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismArt from './NeumorphismArt.vue'
import { ConfigKey } from '@/composables/useConfig'
import { createResizeObserverMock } from '@/__test-utils__/test-helpers'
import { createRng } from './effects'
import { pixelBrightness } from './effects/pixel-field'
import { shouldLink } from './effects/particles'
import { waveY } from './effects/waves'
import { charFor, ASCII_RAMP } from './effects/ascii'

// jsdom 无 canvas 2D 实现：桩掉 getContext，验证组件行为而非像素输出
function stubCanvas() {
  const ctxStub = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'setTransform') return vi.fn()
        return vi.fn()
      },
      set: () => true,
    }
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctxStub as unknown as CanvasRenderingContext2D
  )
}

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
}

describe('NeumorphismArt', () => {
  beforeEach(() => {
    stubCanvas()
    mockMatchMedia(false)
    globalThis.ResizeObserver = createResizeObserverMock()
      .ResizeObserver as unknown as typeof ResizeObserver
    // rAF 不回掉，避免测试内死循环
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas with role=img and locale aria-label', () => {
    const wrapper = mount(NeumorphismArt)
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes('role')).toBe('img')
    expect(canvas.attributes('aria-label')).toBeTruthy()
  })

  it('applies custom aria-label and numeric height', () => {
    const wrapper = mount(NeumorphismArt, { props: { ariaLabel: '试验画布', height: 320 } })
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('试验画布')
    expect(wrapper.find('.nm-art').attributes('style')).toContain('height: 320px')
  })

  it('applies goo filter class only for goo effect', async () => {
    const wrapper = mount(NeumorphismArt, { props: { effect: 'goo' } })
    expect(wrapper.find('canvas').classes()).toContain('nm-art__canvas--goo')
    await wrapper.setProps({ effect: 'waves' })
    expect(wrapper.find('canvas').classes()).not.toContain('nm-art__canvas--goo')
  })

  it('emits effect-change when effect prop changes', async () => {
    const wrapper = mount(NeumorphismArt, { props: { effect: 'pixel-field' } })
    await wrapper.setProps({ effect: 'particles' })
    expect(wrapper.emitted('effect-change')).toEqual([['particles']])
  })

  it('resolves effect/reactive from global config when props absent', () => {
    const wrapper = mount(NeumorphismArt, {
      global: {
        provide: {
          [ConfigKey]: { value: { art: { effect: 'goo', reactive: true } } },
        },
      },
    })
    expect(wrapper.find('canvas').classes()).toContain('nm-art__canvas--goo')
  })

  it('renders overlay slot', () => {
    const wrapper = mount(NeumorphismArt, { slots: { default: '<h2>标题</h2>' } })
    expect(wrapper.find('.nm-art__overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('标题')
  })

  it('does not start rAF loop under reduced-motion', () => {
    mockMatchMedia(true)
    mount(NeumorphismArt)
    // 静态帧直接同步绘制，不应排入动画帧循环
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })
})

describe('art effects (pure functions)', () => {
  it('createRng is deterministic for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
    const c = createRng(43)
    expect(createRng(42)()).not.toBe(c())
  })

  it('pixelBrightness stays within [0, 1]', () => {
    for (let i = 0; i < 100; i++) {
      const v = pixelBrightness(i * 3, i * 7, 100, 100, i, i * 0.1)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('shouldLink respects the distance threshold', () => {
    expect(shouldLink(0, 0, 50, 0, 110)).toBe(true)
    expect(shouldLink(0, 0, 200, 0, 110)).toBe(false)
  })

  it('charFor maps brightness to ramp characters', () => {
    expect(charFor(0)).toBe(' ')
    expect(charFor(1)).toBe(ASCII_RAMP[ASCII_RAMP.length - 1])
    expect(charFor(-5)).toBe(' ')
    expect(charFor(99)).toBe(ASCII_RAMP[ASCII_RAMP.length - 1])
    expect(charFor(0.5)).toBe(ASCII_RAMP[Math.round(0.5 * (ASCII_RAMP.length - 1))])
  })

  it('waveY lifts near the active pointer and is deterministic otherwise', () => {
    const layer = { amplitude: 10, frequency: 0.01, speed: 1, phase: 0, yRatio: 0.5, alpha: 0.2 }
    const base = waveY(100, 50, layer, 1)
    expect(waveY(100, 50, layer, 1)).toBe(base)
    const lifted = waveY(100, 50, layer, 1, { x: 100, active: true })
    expect(lifted).toBeLessThan(base) // 隆起 = y 减小
    const far = waveY(900, 50, layer, 1, { x: 100, active: true })
    expect(Math.abs(far - waveY(900, 50, layer, 1))).toBeLessThan(0.001)
  })
})
