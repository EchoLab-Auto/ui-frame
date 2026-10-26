import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTabs from './NeumorphismTabs.vue'

describe('NeumorphismTabs', () => {
  const tabs = [
    { key: 'a', label: 'Tab A' },
    { key: 'b', label: 'Tab B' },
    { key: 'c', label: 'Tab C', disabled: true },
  ]

  function mountTabs(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
    return mount(NeumorphismTabs, {
      props: { tabs, modelValue: 'a', ...props },
      slots,
    })
  }

  it('should render all tabs', () => {
    const wrapper = mountTabs()
    const tabButtons = wrapper.findAll('.nm-tabs__tab')
    expect(tabButtons).toHaveLength(3)
    expect(tabButtons[0].text()).toBe('Tab A')
    expect(tabButtons[1].text()).toBe('Tab B')
    expect(tabButtons[2].text()).toBe('Tab C')
  })

  it('should mark active tab', () => {
    const wrapper = mountTabs()
    const tabButtons = wrapper.findAll('.nm-tabs__tab')
    expect(tabButtons[0].classes()).toContain('nm-tabs__tab--active')
    expect(tabButtons[0].attributes('aria-selected')).toBe('true')
    expect(tabButtons[0].attributes('tabindex')).toBe('0')
    expect(tabButtons[1].attributes('tabindex')).toBe('-1')
  })

  it('should mark disabled tab', () => {
    const wrapper = mountTabs()
    const tabButtons = wrapper.findAll('.nm-tabs__tab')
    expect(tabButtons[2].classes()).toContain('nm-tabs__tab--disabled')
    expect(tabButtons[2].attributes('aria-disabled')).toBe('true')
    expect(tabButtons[2].attributes('disabled')).toBeDefined()
  })

  it('should emit update:modelValue on tab click', async () => {
    const wrapper = mountTabs()
    await wrapper.findAll('.nm-tabs__tab')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['b'])
    expect(wrapper.emitted('change')).toBeDefined()
    expect(wrapper.emitted('tabClick')).toBeDefined()
  })

  it('should not emit when clicking disabled tab', async () => {
    const wrapper = mountTabs()
    await wrapper.findAll('.nm-tabs__tab')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('should apply position classes', () => {
    const positions = ['top', 'left', 'right'] as const
    for (const position of positions) {
      const wrapper = mountTabs({ position })
      expect(wrapper.classes()).toContain(`nm-tabs--${position}`)
    }
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mountTabs({ size })
      expect(wrapper.classes()).toContain(`nm-tabs--${size}`)
    }
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mountTabs({ size: 15 })
    expect(wrapper.classes()).toContain('nm-tabs--sized')
    expect(wrapper.classes().some(c => /^nm-tabs--(small|medium|large)$/.test(c))).toBe(false)
    // 15 落在 14(md) 与 16(lg) 之间：位置 1.5
    expect(wrapper.attributes('style')).toContain('--nm-tabs-sz-font: 15px')
    expect(wrapper.attributes('style')).toContain('--nm-tabs-sz-pad-y: 12px')
    expect(wrapper.attributes('style')).toContain('--nm-tabs-sz-pad-x: 24px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 12 / medium 14 / large 16（标签字号）
    const anchors = [
      [12, 'small'],
      [14, 'medium'],
      [16, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mountTabs({ size: px })
      const byTier = mountTabs({ size: tier })
      expect(byNumber.attributes('style')).toContain(`--nm-tabs-sz-font: ${px}px`)
      expect(byTier.classes()).toContain(`nm-tabs--${tier}`)
      expect(byTier.classes()).not.toContain('nm-tabs--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 14', () => {
    for (const bad of [0, -14, Number.NaN]) {
      const wrapper = mountTabs({ size: bad })
      expect(wrapper.attributes('style')).toContain('--nm-tabs-sz-font: 14px')
    }
  })

  it('should render panel', () => {
    const wrapper = mountTabs({}, { default: 'Panel content' })
    expect(wrapper.find('.nm-tabs__panel').exists()).toBe(true)
    expect(wrapper.find('.nm-tabs__panel').text()).toBe('Panel content')
  })

  it('should have correct ARIA attributes', () => {
    const wrapper = mountTabs()
    const nav = wrapper.find('.nm-tabs__nav')
    expect(nav.attributes('role')).toBe('tablist')
    const panel = wrapper.find('.nm-tabs__panel')
    expect(panel.attributes('role')).toBe('tabpanel')
  })

  it('should render custom tab slot', () => {
    const wrapper = mountTabs(
      {},
      {
        tab: '<span class="custom-tab">{{ tab.label }}</span>',
      }
    )
    expect(wrapper.findAll('.custom-tab')).toHaveLength(3)
  })

  it('should render tab icon before label when provided', () => {
    const wrapper = mountTabs({
      tabs: [
        { key: 'a', label: 'Tab A', icon: '🔥' },
        { key: 'b', label: 'Tab B' },
      ],
    })
    const tabButtons = wrapper.findAll('.nm-tabs__tab')
    const icon = tabButtons[0].find('.nm-tabs__tab-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.text()).toBe('🔥')
    expect(icon.attributes('aria-hidden')).toBe('true')
    // 图标位于 label 之前
    expect(tabButtons[0].text()).toBe('🔥Tab A')
    // 未提供 icon 的 tab 不渲染图标节点
    expect(tabButtons[1].find('.nm-tabs__tab-icon').exists()).toBe(false)
  })
})
