import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismDivider from './NeumorphismDivider.vue'

describe('NeumorphismDivider', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismDivider)
    expect(wrapper.classes()).toContain('nm-divider')
    expect(wrapper.classes()).toContain('nm-divider--horizontal')
  })

  it('should apply direction class', () => {
    const directions = ['horizontal', 'vertical'] as const
    for (const direction of directions) {
      const wrapper = mount(NeumorphismDivider, { props: { direction } })
      expect(wrapper.classes()).toContain(`nm-divider--${direction}`)
    }
  })

  it('should render with text content', () => {
    const wrapper = mount(NeumorphismDivider, {
      slots: { default: 'Section' },
    })
    expect(wrapper.text()).toContain('Section')
  })

  it('should apply dashed class', () => {
    const wrapper = mount(NeumorphismDivider, { props: { dashed: true } })
    expect(wrapper.classes()).toContain('nm-divider--dashed')
  })

  it('should apply inset class', () => {
    const wrapper = mount(NeumorphismDivider, { props: { inset: true } })
    expect(wrapper.classes()).toContain('nm-divider--inset')
  })
})
