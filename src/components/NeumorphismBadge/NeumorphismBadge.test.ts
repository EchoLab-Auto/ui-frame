import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismBadge from './NeumorphismBadge.vue'

describe('NeumorphismBadge', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismBadge, { slots: { default: 'Content' } })
    expect(wrapper.classes()).toContain('nm-badge')
    expect(wrapper.text()).toContain('Content')
  })

  it('should display numeric value', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 5 } })
    expect(wrapper.find('.nm-badge__text').text()).toBe('5')
  })

  it('should show max+ when value exceeds max', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 150, max: 99 } })
    expect(wrapper.find('.nm-badge__text').text()).toBe('99+')
  })

  it('should render dot variant', () => {
    const wrapper = mount(NeumorphismBadge, { props: { dot: true, value: 1 } })
    expect(wrapper.classes()).toContain('nm-badge--dot')
    expect(wrapper.find('.nm-badge__content--dot').exists()).toBe(true)
  })

  it('should hide when value is zero and showZero is false', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 0 } })
    expect(wrapper.classes()).toContain('nm-badge--hidden')
    expect(wrapper.find('.nm-badge__content').exists()).toBe(false)
  })

  it('should show zero when showZero is true', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 0, showZero: true } })
    expect(wrapper.find('.nm-badge__text').text()).toBe('0')
  })

  it('should apply custom color', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 1, color: '#ff0000' } })
    expect(wrapper.find('.nm-badge__content').attributes('style')).toContain('background-color')
  })

  it('should set aria-label', () => {
    const wrapper = mount(NeumorphismBadge, { props: { value: 5 } })
    expect(wrapper.find('.nm-badge__content').attributes('aria-label')).toBeDefined()
  })
})
