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

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismBreadcrumb, { props: { items, size: 13 } })
    expect(wrapper.classes()).toContain('nm-breadcrumb--sized')
    expect(wrapper.classes().some(c => /^nm-breadcrumb--(small|medium|large)$/.test(c))).toBe(false)
    expect(wrapper.attributes('style')).toContain('--nm-breadcrumb-sz-font: 13px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 12 / medium 14 / large 16（字号）
    const anchors = [
      [12, 'small'],
      [14, 'medium'],
      [16, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismBreadcrumb, { props: { items, size: px } })
      const byTier = mount(NeumorphismBreadcrumb, { props: { items, size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-breadcrumb-sz-font: ${px}px`)
      expect(byTier.classes()).toContain(`nm-breadcrumb--${tier}`)
      expect(byTier.classes()).not.toContain('nm-breadcrumb--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 14', () => {
    for (const bad of [0, -14, Number.NaN]) {
      const wrapper = mount(NeumorphismBreadcrumb, { props: { items, size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-breadcrumb-sz-font: 14px')
    }
  })

  it('should handle empty items', () => {
    const wrapper = mount(NeumorphismBreadcrumb, {
      props: { items: [] },
    })
    expect(wrapper.findAll('.nm-breadcrumb__item')).toHaveLength(0)
  })
})
