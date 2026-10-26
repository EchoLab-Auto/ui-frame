import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismList from './NeumorphismList.vue'

describe('NeumorphismList', () => {
  it('renders items with dividers by default (split)', () => {
    const wrapper = mount(NeumorphismList, {
      props: { items: ['苹果', '香蕉', '橙子'] },
    })
    const items = wrapper.findAll('.nm-list__item')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toBe('苹果')
  })

  it('shows empty text when no items', () => {
    const wrapper = mount(NeumorphismList, { props: { items: [] } })
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('shows loading state', () => {
    const wrapper = mount(NeumorphismList, { props: { items: [], loading: true } })
    expect(wrapper.find('.nm-list__loading, .nm-skeleton, [class*="loading"]').exists()).toBe(true)
  })

  it('item click emits item-click with payload', async () => {
    const wrapper = mount(NeumorphismList, {
      props: { items: ['A', 'B'] },
    })
    await wrapper.findAll('.nm-list__item')[1].trigger('click')
    expect(wrapper.emitted('item-click')?.[0]).toEqual(['B', 1])
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismList, { props: { items: ['A'], size: 14.5 } })
    expect(wrapper.classes()).toContain('nm-list--sized')
    expect(wrapper.classes().some(c => /^nm-list--(small|medium|large)$/.test(c))).toBe(false)
    // 14.5 落在 14(md) 与 15(lg) 之间：位置 1.5
    expect(wrapper.attributes('style')).toContain('--nm-list-sz-font: 14.5px')
    expect(wrapper.attributes('style')).toContain('--nm-list-sz-pad-y: 12px')
    expect(wrapper.attributes('style')).toContain('--nm-list-sz-pad-x: 20px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 12 / medium 14 / large 15（字号）
    const anchors = [
      [12, 'small'],
      [14, 'medium'],
      [15, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismList, { props: { items: ['A'], size: px } })
      const byTier = mount(NeumorphismList, { props: { items: ['A'], size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-list-sz-font: ${px}px`)
      expect(byTier.classes()).toContain(`nm-list--${tier}`)
      expect(byTier.classes()).not.toContain('nm-list--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 14', () => {
    for (const bad of [0, -14, Number.NaN]) {
      const wrapper = mount(NeumorphismList, { props: { items: ['A'], size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-list-sz-font: 14px')
    }
  })

  it('rows with default slot are keyboard accessible (tabindex + Enter/Space)', async () => {
    const wrapper = mount(NeumorphismList, {
      props: { items: ['A', 'B'] },
      slots: { default: '<span class="custom-item">自定义</span>' },
    })
    const items = wrapper.findAll('.nm-list__item')
    expect(items[0].attributes('tabindex')).toBe('0')

    await items[0].trigger('keydown.enter')
    expect(wrapper.emitted('item-click')?.[0]).toEqual(['A', 0])

    await items[1].trigger('keydown.space')
    expect(wrapper.emitted('item-click')?.[1]).toEqual(['B', 1])
  })

  it('rows without slot are not focusable (pure display list)', () => {
    const wrapper = mount(NeumorphismList, { props: { items: ['A'] } })
    expect(wrapper.find('.nm-list__item').attributes('tabindex')).toBeUndefined()
  })
})
