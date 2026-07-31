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
})
