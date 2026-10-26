import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ConfigKey } from '@/composables/useConfig'
import { createMatchMediaMock } from '@/__test-utils__/test-helpers'
import NeumorphismProgress from './NeumorphismProgress.vue'

describe('NeumorphismProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 50 },
    })
    expect(wrapper.classes()).toContain('nm-progress')
    expect(wrapper.find('.nm-progress__track').exists()).toBe(true)
  })

  it('should render progress bar with correct width', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 75 },
    })
    const bar = wrapper.find('.nm-progress__bar')
    expect(bar.attributes('style')).toContain('75%')
  })

  it('should show label text when showLabel is true', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 60, showLabel: true },
    })
    // Label text should be present
    expect(wrapper.text()).toBeTruthy()
  })

  it('should have ARIA progressbar role', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 40 },
    })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-valuenow')).toBe('40')
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('100')
  })

  it('should apply effect classes', () => {
    const effects = ['pulse', 'flow', 'wave', 'stripes', 'sparkle'] as const
    effects.forEach(effect => {
      const wrapper = mount(NeumorphismProgress, {
        props: { modelValue: 60, effect },
      })
      expect(wrapper.classes()).toContain(`nm-progress--effect-${effect}`)
    })
  })

  it('should apply effect from global config', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 60 },
      global: {
        provide: {
          [ConfigKey]: {
            value: {
              progress: {
                effect: 'pulse',
              },
            },
          },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-progress--effect-pulse')
  })

  it('should handle indeterminate mode with ARIA busy state', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 0, indeterminate: true },
    })
    expect(wrapper.classes()).toContain('nm-progress--indeterminate')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('aria-valuetext')).toBeTruthy()
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
  })

  it('should render the current percentage in the label immediately', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 60, showLabel: true },
    })
    expect(wrapper.find('.nm-progress__label').text()).toBe('60%')
  })

  it('should snap the label to the target value when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(true)))
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 10, showLabel: true },
    })
    await wrapper.setProps({ modelValue: 90 })
    expect(wrapper.find('.nm-progress__label').text()).toBe('90%')
  })

  it('should animate the label towards the target value', async () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(false)))
    const rafCallbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.spyOn(performance, 'now').mockReturnValue(1000)

    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 0, showLabel: true },
    })
    await wrapper.setProps({ modelValue: 100 })
    expect(rafCallbacks.length).toBeGreaterThan(0)

    rafCallbacks[rafCallbacks.length - 1](1650)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.nm-progress__label').text()).toBe('100%')
  })

  it('should render a circular ring when type is circle', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 40, type: 'circle', showLabel: true },
    })
    expect(wrapper.classes()).toContain('nm-progress--circle')
    const svg = wrapper.find('.nm-progress-circle__svg')
    expect(svg.exists()).toBe(true)
    expect(wrapper.find('.nm-progress-circle__track').exists()).toBe(true)
    expect(wrapper.find('.nm-progress-circle__fill--primary').exists()).toBe(true)
    expect(wrapper.find('.nm-progress-circle__label').text()).toBe('40%')
    // Root carries the ring geometry, including the circumference custom property
    expect(wrapper.attributes('style')).toContain('--nm-progress-c')
  })

  it('should apply indeterminate classes on the circular ring', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { type: 'circle', indeterminate: true },
    })
    expect(wrapper.classes()).toContain('nm-progress--indeterminate')
    expect(wrapper.find('.nm-progress-circle__fill--indeterminate').exists()).toBe(true)
  })

  // ---- 数字 size（px 线形条厚度）----

  it('数字 size：走 --sized 类 + 线性条厚度变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismProgress, { props: { modelValue: 40, size: 6 } })
    expect(wrapper.classes()).toContain('nm-progress--sized')
    expect(wrapper.classes().some(c => /^nm-progress--(small|medium|large)$/.test(c))).toBe(false)
    // 6 落在 4(sm) 与 8(md) 之间：位置 0.5
    expect(wrapper.attributes('style')).toContain('--nm-progress-sz-height: 6px')
  })

  it('数字 size 时环形几何随之插值（直径 / 描边 / 半径）', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 40, type: 'circle', size: 6 },
    })
    // 位置 0.5：直径 64→120 的中点 92，描边 4→7 的中点 5.5，半径 (92-5.5)/2
    expect(wrapper.attributes('style')).toContain('width: 92px')
    expect(wrapper.attributes('style')).toContain('height: 92px')
    const track = wrapper.find('.nm-progress-circle__track')
    expect(track.attributes('stroke-width')).toBe('5.5')
    expect(track.attributes('r')).toBe('43.25')
    // 进度芯与轨道共用同一份描边宽度
    expect(wrapper.find('.nm-progress-circle__fill').attributes('stroke-width')).toBe('5.5')
  })

  it('数字 size 在锚点上与档位别名逐像素一致（线性条与环形）', () => {
    const anchors = [
      [4, 'small'],
      [8, 'medium'],
      [12, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismProgress, { props: { modelValue: 40, size: px } })
      expect(byNumber.attributes('style')).toContain(`--nm-progress-sz-height: ${px}px`)
      const byTier = mount(NeumorphismProgress, { props: { modelValue: 40, size: tier } })
      expect(byTier.classes()).toContain(`nm-progress--${tier}`)
      expect(byTier.attributes('style')).toBeUndefined()
    }

    // 环形：数字 8 ≡ medium（直径 120 / 描边 7 / 半径 56.5）
    const ring = mount(NeumorphismProgress, {
      props: { modelValue: 40, type: 'circle', size: 8 },
    })
    expect(ring.attributes('style')).toContain('width: 120px')
    const track = ring.find('.nm-progress-circle__track')
    expect(track.attributes('stroke-width')).toBe('7')
    expect(track.attributes('r')).toBe('56.5')
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 8', () => {
    for (const bad of [0, -3, Number.NaN]) {
      const bar = mount(NeumorphismProgress, { props: { modelValue: 40, size: bad } })
      expect(bar.attributes('style')).toContain('--nm-progress-sz-height: 8px')

      const ring = mount(NeumorphismProgress, {
        props: { modelValue: 40, type: 'circle', size: bad },
      })
      expect(ring.attributes('style')).toContain('width: 120px')
      expect(ring.find('.nm-progress-circle__track').attributes('stroke-width')).toBe('7')
    }
  })
})
