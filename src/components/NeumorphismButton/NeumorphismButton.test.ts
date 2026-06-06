import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismButton from './NeumorphismButton.vue'

describe('NeumorphismButton', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismButton, { slots: { default: 'Click me' } })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Click me')
    expect(btn.classes()).toContain('nm-button')
    expect(btn.classes()).toContain('nm-button--raised')
    expect(btn.classes()).toContain('nm-button--medium')
    expect(btn.classes()).toContain('nm-button--rounded')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('should apply variant classes', () => {
    const variants = ['raised', 'flat', 'pressed'] as const
    for (const variant of variants) {
      const wrapper = mount(NeumorphismButton, { props: { variant } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${variant}`)
    }
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismButton, { props: { size } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${size}`)
    }
  })

  it('should apply shape classes', () => {
    const shapes = ['rounded', 'pill', 'circle'] as const
    for (const shape of shapes) {
      const wrapper = mount(NeumorphismButton, { props: { shape } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${shape}`)
    }
  })

  it('should emit click event', () => {
    const wrapper = mount(NeumorphismButton)
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('should not emit click when disabled', () => {
    const wrapper = mount(NeumorphismButton, { props: { disabled: true } })
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should not emit click when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should have disabled attribute when disabled', () => {
    const wrapper = mount(NeumorphismButton, { props: { disabled: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').classes()).toContain('nm-button--disabled')
  })

  it('should have disabled attribute when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').classes()).toContain('nm-button--loading')
  })

  it('should render loading spinner', () => {
    const wrapper = mount(NeumorphismButton, {
      props: { loading: true },
      slots: { default: 'Save' },
    })
    expect(wrapper.find('.nm-button__spinner').exists()).toBe(true)
    expect(wrapper.find('.nm-button__content--hidden').exists()).toBe(true)
  })

  it('should set aria-label', () => {
    const wrapper = mount(NeumorphismButton, { props: { ariaLabel: 'Close dialog' } })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Close dialog')
  })

  it('should set aria-busy when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
  })

  it('should not set aria-busy when not loading', () => {
    const wrapper = mount(NeumorphismButton)
    expect(wrapper.find('button').attributes('aria-busy')).toBeUndefined()
  })

  it('should support different button types', () => {
    const types = ['button', 'submit', 'reset'] as const
    for (const type of types) {
      const wrapper = mount(NeumorphismButton, { props: { type } })
      expect(wrapper.find('button').attributes('type')).toBe(type)
    }
  })

  it('should set form attribute', () => {
    const wrapper = mount(NeumorphismButton, { props: { form: 'my-form' } })
    expect(wrapper.find('button').attributes('form')).toBe('my-form')
  })

  it('should render slot content', () => {
    const wrapper = mount(NeumorphismButton, {
      slots: { default: '<span class="icon">*</span> Save' },
    })
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save')
  })
})
