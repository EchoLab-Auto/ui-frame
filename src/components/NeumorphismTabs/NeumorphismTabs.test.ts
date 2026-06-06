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
})
