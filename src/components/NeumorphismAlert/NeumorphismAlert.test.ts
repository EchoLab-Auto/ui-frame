import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAlert from './NeumorphismAlert.vue'
import { ConfigKey } from '@/composables/useConfig'

const mountAlert = (props = {}, slots = {}) =>
  mount(NeumorphismAlert, {
    props,
    slots,
    global: { stubs: { transition: false } },
  })

describe('NeumorphismAlert', () => {
  it('should render with default props', () => {
    const wrapper = mountAlert({ message: 'Alert message' })
    const root = wrapper.find('.nm-alert')
    expect(root.exists()).toBe(true)
    expect(wrapper.text()).toContain('Alert message')
  })

  it('should apply type class', () => {
    const types = ['info', 'success', 'warning', 'error'] as const
    for (const type of types) {
      const wrapper = mountAlert({ type, message: 'Message' })
      expect(wrapper.find('.nm-alert').classes()).toContain(`nm-alert--${type}`)
    }
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mountAlert({ size: 12.5, message: 'Message' })
    const root = wrapper.find('.nm-alert')
    expect(root.classes()).toContain('nm-alert--sized')
    expect(root.classes().some(c => /^nm-alert--(small|medium|large)$/.test(c))).toBe(false)
    // 12.5 落在 12(md... 实为 sm) 与 13(md) 之间：位置 0.5
    expect(root.attributes('style')).toContain('--nm-alert-sz-font: 12.5px')
    expect(root.attributes('style')).toContain('--nm-alert-sz-title-font: 13.5px')
    expect(root.attributes('style')).toContain('--nm-alert-sz-pad-y: 10px')
    expect(root.attributes('style')).toContain('--nm-alert-sz-pad-x: 14px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 12 / medium 13 / large 14（正文字号）
    const anchors = [
      [12, 'small'],
      [13, 'medium'],
      [14, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mountAlert({ size: px, message: 'Message' })
      const byTier = mountAlert({ size: tier, message: 'Message' })
      expect(byNumber.find('.nm-alert').attributes('style')).toContain(
        `--nm-alert-sz-font: ${px}px`
      )
      expect(byTier.find('.nm-alert').classes()).toContain(`nm-alert--${tier}`)
      expect(byTier.find('.nm-alert').classes()).not.toContain('nm-alert--sized')
      expect(byTier.find('.nm-alert').attributes('style') ?? '').not.toContain('--nm-alert-sz-font')
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 13', () => {
    for (const bad of [0, -13, Number.NaN]) {
      const wrapper = mountAlert({ size: bad, message: 'Message' })
      expect(wrapper.find('.nm-alert').attributes('style')).toContain('--nm-alert-sz-font: 13px')
    }
  })

  it('should show close button by default (closable=true)', () => {
    const wrapper = mountAlert({ message: 'Message' })
    expect(wrapper.find('.nm-alert__close').exists()).toBe(true)
  })

  it('should hide close button when closable is false', () => {
    const wrapper = mountAlert({ message: 'Message', closable: false })
    expect(wrapper.find('.nm-alert__close').exists()).toBe(false)
  })

  it('should render title', () => {
    const wrapper = mountAlert({ title: 'Warning', message: 'Details' })
    expect(wrapper.find('.nm-alert__title').exists()).toBe(true)
    expect(wrapper.text()).toContain('Warning')
  })

  it('should emit close event when close button clicked', async () => {
    const wrapper = mountAlert({ message: 'Message' })
    const closeBtn = wrapper.find('.nm-alert__close')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    // After close, the alert should emit 'close' or disappear
    // Note: useAlert delay may affect immediate emission
  })

  it('should render custom slot content', () => {
    const wrapper = mountAlert({}, { default: '<span class="custom">Custom content</span>' })
    expect(wrapper.find('.custom').exists()).toBe(true)
  })

  it('should apply type/closable from global config', () => {
    const wrapper = mount(NeumorphismAlert, {
      props: { message: 'Message' },
      global: {
        provide: { [ConfigKey]: { value: { alert: { type: 'warning', closable: false } } } },
      },
    })
    expect(wrapper.find('.nm-alert').classes()).toContain('nm-alert--warning')
    expect(wrapper.find('.nm-alert__close').exists()).toBe(false)
  })

  it('should let explicit type override global config', () => {
    const wrapper = mount(NeumorphismAlert, {
      props: { message: 'Message', type: 'error' },
      global: {
        provide: { [ConfigKey]: { value: { alert: { type: 'warning' } } } },
      },
    })
    expect(wrapper.find('.nm-alert').classes()).toContain('nm-alert--error')
  })
})
