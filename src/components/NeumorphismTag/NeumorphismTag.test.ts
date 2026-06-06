import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTag from './NeumorphismTag.vue'

describe('NeumorphismTag', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismTag, { slots: { default: 'Tag' } })
    expect(wrapper.classes()).toContain('nm-tag')
    expect(wrapper.classes()).toContain('nm-tag--default')
    expect(wrapper.text()).toBe('Tag')
  })

  it('should apply variant classes', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
    for (const variant of variants) {
      const wrapper = mount(NeumorphismTag, { props: { variant } })
      expect(wrapper.classes()).toContain(`nm-tag--${variant}`)
    }
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismTag, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-tag--${size}`)
    }
  })

  it('should apply rounded class', () => {
    const wrapper = mount(NeumorphismTag, { props: { rounded: true } })
    expect(wrapper.classes()).toContain('nm-tag--rounded')
  })

  it('should emit close event', () => {
    const wrapper = mount(NeumorphismTag, { props: { closable: true } })
    wrapper.find('.nm-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('should not show close button when not closable', () => {
    const wrapper = mount(NeumorphismTag)
    expect(wrapper.find('.nm-tag__close').exists()).toBe(false)
  })

  it('should set aria-label on close button', () => {
    const wrapper = mount(NeumorphismTag, { props: { closable: true } })
    expect(wrapper.find('.nm-tag__close').attributes('aria-label')).toBeDefined()
  })
})
