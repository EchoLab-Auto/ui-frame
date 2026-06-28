import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismContainer from './NeumorphismContainer.vue'

describe('NeumorphismContainer', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismContainer, {
      slots: { default: 'Content' },
    })
    expect(wrapper.classes()).toContain('nm-container')
    expect(wrapper.text()).toBe('Content')
  })

  it('should apply fluid mode class', () => {
    const wrapper = mount(NeumorphismContainer, { props: { mode: 'fluid' } })
    expect(wrapper.classes()).toContain('nm-container--fluid')
  })

  it('should apply fixed mode by default', () => {
    const wrapper = mount(NeumorphismContainer)
    // Default mode is 'fixed', which doesn't add a special class
    expect(wrapper.classes()).toContain('nm-container')
    expect(wrapper.classes()).not.toContain('nm-container--fluid')
  })

  it('should apply noPadding class', () => {
    const wrapper = mount(NeumorphismContainer, { props: { noPadding: true } })
    expect(wrapper.classes()).toContain('nm-container--no-padding')
  })

  it('should render slot content', () => {
    const wrapper = mount(NeumorphismContainer, {
      slots: { default: '<div class="inner">Inner</div>' },
    })
    expect(wrapper.find('.inner').exists()).toBe(true)
  })

  it('should render with custom tag', () => {
    const wrapper = mount(NeumorphismContainer, { props: { tag: 'section' } })
    expect(wrapper.element.tagName).toBe('SECTION')
  })
})
