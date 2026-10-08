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
