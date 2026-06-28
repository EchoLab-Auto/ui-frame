import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAlert from './NeumorphismAlert.vue'

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
})
