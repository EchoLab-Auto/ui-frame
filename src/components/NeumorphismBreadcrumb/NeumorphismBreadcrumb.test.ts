import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismBreadcrumb from './NeumorphismBreadcrumb.vue'

const items = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Detail', path: '/products/1' },
]

describe('NeumorphismBreadcrumb', () => {
  it('should render with items', () => {
    const wrapper = mount(NeumorphismBreadcrumb, { props: { items } })
    const listItems = wrapper.findAll('.nm-breadcrumb__item')
    expect(listItems).toHaveLength(3)
    expect(wrapper.text()).toContain('Home')
  })

  it('should mark last item as active', () => {
    const wrapper = mount(NeumorphismBreadcrumb, { props: { items } })
    const lastItem = wrapper.findAll('.nm-breadcrumb__item')[2]
    expect(lastItem.classes()).toContain('nm-breadcrumb__item--active')
    expect(lastItem.attributes('aria-current')).toBe('page')
  })

  it('should apply size class', () => {
    const wrapper = mount(NeumorphismBreadcrumb, {
      props: { items, size: 'small' },
    })
    expect(wrapper.classes()).toContain('nm-breadcrumb--small')
  })

  it('should handle empty items', () => {
    const wrapper = mount(NeumorphismBreadcrumb, {
      props: { items: [] },
    })
    expect(wrapper.findAll('.nm-breadcrumb__item')).toHaveLength(0)
  })
})
