import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import NeumorphismPagination from './NeumorphismPagination.vue'
import { LocaleKey } from '@/composables/useLocale'
import { enUS } from '@/locales/en-US'

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

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismPagination, { props: { size: 42 } })
    expect(wrapper.classes()).toContain('nm-pagination--sized')
    expect(wrapper.classes().some(c => /^nm-pagination--(small|medium|large)$/.test(c))).toBe(false)
    // 42 落在 38(md) 与 46(lg) 之间：位置 1.5
    expect(wrapper.attributes('style')).toContain('--nm-pagination-sz-height: 42px')
    expect(wrapper.attributes('style')).toContain('--nm-pagination-sz-min-width: 42px')
    expect(wrapper.attributes('style')).toContain('--nm-pagination-sz-font: 15px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 30 / medium 38 / large 46（页码按钮高）；medium 走基础规则，无独立 class
    const anchors = [
      [30, 'small'],
      [38, 'medium'],
      [46, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismPagination, { props: { size: px } })
      const byTier = mount(NeumorphismPagination, { props: { size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-pagination-sz-height: ${px}px`)
      expect(byTier.classes()).toContain(`nm-pagination--${tier}`)
      expect(byTier.classes()).not.toContain('nm-pagination--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 38', () => {
    for (const bad of [0, -38, Number.NaN]) {
      const wrapper = mount(NeumorphismPagination, { props: { size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-pagination-sz-height: 38px')
    }
  })

  it('should show total when showTotal is true', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showTotal: true },
    })
    expect(wrapper.find('.nm-pagination__total').exists()).toBe(true)
  })

  it('should render locale total text by default (zh-CN)', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showTotal: true },
    })
    expect(wrapper.find('.nm-pagination__total').text()).toBe('共 100 条')
  })

  it('totalLabel overrides the total text template with {total} placeholder', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showTotal: true, totalLabel: '共 {total} 条记录' },
    })
    expect(wrapper.find('.nm-pagination__total').text()).toBe('共 100 条记录')
  })

  it('should render jumper labels from locale (zh-CN)', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showJumper: true },
    })
    const jumper = wrapper.find('.nm-pagination__jumper')
    expect(jumper.text()).toContain('跳至')
    expect(jumper.text()).toContain('页')
  })

  it('should render jumper labels from provided en-US locale', () => {
    const wrapper = mount(NeumorphismPagination, {
      props: { total: 100, showJumper: true },
      global: {
        provide: {
          [LocaleKey as symbol]: computed(() => enUS),
        },
      },
    })
    const jumper = wrapper.find('.nm-pagination__jumper')
    expect(jumper.text()).toContain('Go to')
    expect(jumper.text()).not.toContain('跳至')
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
