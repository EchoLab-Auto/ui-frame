import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismDatePicker from './NeumorphismDatePicker.vue'

describe('NeumorphismDatePicker name prop', () => {
  it('renders a hidden input carrying name and formatted value for form submission', () => {
    const wrapper = mount(NeumorphismDatePicker, {
      props: { name: 'birthday', modelValue: new Date(2026, 0, 15) },
    })
    const input = wrapper.find('input[type="hidden"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('name')).toBe('birthday')
    expect((input.element as HTMLInputElement).value).toBe('2026-01-15')
    wrapper.unmount()
  })

  it('hidden input submits empty string when no date selected', () => {
    const wrapper = mount(NeumorphismDatePicker, { props: { name: 'birthday' } })
    const input = wrapper.find('input[type="hidden"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('does not render hidden input without name', () => {
    const wrapper = mount(NeumorphismDatePicker)
    expect(wrapper.find('input[type="hidden"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('NeumorphismDatePicker a11y', () => {
  it('trigger is keyboard-focusable and has combobox semantics', () => {
    const wrapper = mount(NeumorphismDatePicker, { attachTo: document.body })
    const trigger = wrapper.find('[role="combobox"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    wrapper.unmount()
  })

  it('trigger is removed from tab order when disabled', () => {
    const wrapper = mount(NeumorphismDatePicker, {
      props: { disabled: true },
      attachTo: document.body,
    })
    expect(wrapper.find('[role="combobox"]').attributes('tabindex')).toBe('-1')
    wrapper.unmount()
  })

  it('opens calendar on Enter and moves focus into the day grid', async () => {
    const wrapper = mount(NeumorphismDatePicker, { attachTo: document.body })
    const trigger = wrapper.find('[role="combobox"]')
    await trigger.trigger('keydown', { key: 'Enter' })
    await nextTick()
    const grid = document.querySelector('[role="grid"]')
    expect(grid).not.toBeNull()
    // 焦点经有界 rAF 重试落格 —— 等待帧任务而非微任务
    await new Promise(r => setTimeout(r, 60))
    const active = document.activeElement as HTMLElement
    expect(active?.classList.contains('nm-datepicker__day')).toBe(true)
    wrapper.unmount()
  })
})
