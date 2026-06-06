import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismPagination from './NeumorphismPagination.vue'

describe('NeumorphismPagination', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismPagination)
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('nav').attributes('role')).toBe('navigation')
    expect(wrapper.classes()).toContain('nm-pagination')
    expect(wrapper.classes()).toContain('nm-pagination--medium')
  })

  it('should render page buttons', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { modelValue: 1, total: 100, pageSize: 10 },
    })
    const buttons = wrapper.findAll('.nm-pagination__btn')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should emit update:modelValue on page click', async () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { modelValue: 1, total: 100, pageSize: 10 },
    })
    const pageButtons = wrapper.findAll('.nm-pagination__item')
    if (pageButtons.length > 1) {
      await pageButtons[1].find('button').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeDefined()
    }
  })

  it('should disable prev button on first page', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { modelValue: 1, total: 100, pageSize: 10 },
    })
    const buttons = wrapper.findAll('.nm-pagination__btn')
    // First button is prev
    expect(buttons[0].attributes('disabled')).toBeDefined()
  })

  it('should disable next button on last page', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { modelValue: 10, total: 100, pageSize: 10 },
    })
    const buttons = wrapper.findAll('.nm-pagination__btn')
    // Last button is next
    expect(buttons[buttons.length - 1].attributes('disabled')).toBeDefined()
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismPagination, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-pagination--${size}`)
    }
  })

  it('should show total when showTotal is true', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showTotal: true },
    })
    expect(wrapper.find('.nm-pagination__total').exists()).toBe(true)
  })

  it('should show jumper when showJumper is true', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showJumper: true },
    })
    expect(wrapper.find('.nm-pagination__jumper').exists()).toBe(true)
  })

  it('should apply disabled class', () => {
    const wrapper = mount(NeumorphismPagination, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('nm-pagination--disabled')
  })

  it('should render ellipsis for many pages', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { modelValue: 50, total: 1000, pageSize: 10, maxVisiblePages: 5 },
    })
    expect(wrapper.find('.nm-pagination__ellipsis').exists()).toBe(true)
  })
})
