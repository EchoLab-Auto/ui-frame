import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSkeleton from './NeumorphismSkeleton.vue'

describe('NeumorphismSkeleton', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismSkeleton)
    const el = wrapper.find('span')
    expect(el.exists()).toBe(true)
    expect(el.classes()).toContain('nm-skeleton')
    expect(el.attributes('role')).toBe('status')
    expect(el.attributes('aria-label')).toBeDefined()
  })

  it('should apply variant class', () => {
    const variants = ['text', 'circle', 'rect'] as const
    for (const variant of variants) {
      const wrapper = mount(NeumorphismSkeleton, { props: { variant } })
      expect(wrapper.find('span').classes()).toContain(`nm-skeleton--${variant}`)
    }
  })

  it('should render with custom width and height', () => {
    const wrapper = mount(NeumorphismSkeleton, {
      props: { width: 200, height: 100 },
    })
    const style = wrapper.find('span').attributes('style')
    expect(style).toContain('width')
    expect(style).toContain('height')
  })

  it('should apply animation class', () => {
    const animations = ['pulse', 'wave', 'none'] as const
    for (const animation of animations) {
      const wrapper = mount(NeumorphismSkeleton, { props: { animation } })
      if (animation !== 'none') {
        expect(wrapper.find('span').classes()).toContain(`nm-skeleton--${animation}`)
      }
    }
  })

  it('should render multiple items with count prop', () => {
    const wrapper = mount(NeumorphismSkeleton, { props: { count: 3 } })
    const spans = wrapper.findAll('span.nm-skeleton')
    expect(spans).toHaveLength(3)
  })
})
