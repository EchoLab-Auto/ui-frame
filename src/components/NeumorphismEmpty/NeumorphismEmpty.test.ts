import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismEmpty from './NeumorphismEmpty.vue'

describe('NeumorphismEmpty', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismEmpty)
    expect(wrapper.classes()).toContain('nm-empty')
  })

  it('should render description', () => {
    const wrapper = mount(NeumorphismEmpty, {
      props: { description: 'No data available' },
    })
    expect(wrapper.text()).toContain('No data available')
  })

  it('should apply size class', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismEmpty, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-empty--${size}`)
    }
  })

  it('should render custom slot content', () => {
    const wrapper = mount(NeumorphismEmpty, {
      slots: { default: '<div class="custom-empty">Custom</div>' },
    })
    expect(wrapper.find('.custom-empty').exists()).toBe(true)
  })
})
