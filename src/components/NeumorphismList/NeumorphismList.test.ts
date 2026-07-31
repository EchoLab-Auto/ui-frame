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
})
