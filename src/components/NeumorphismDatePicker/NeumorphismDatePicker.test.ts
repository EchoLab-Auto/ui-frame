import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismDatePicker from './NeumorphismDatePicker.vue'

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
    await nextTick()
    const grid = document.querySelector('[role="grid"]')
    expect(grid).not.toBeNull()
    // 焦点应落在网格内某个日期格上（roving tabindex）
    const active = document.activeElement as HTMLElement
    expect(active?.classList.contains('nm-datepicker__day')).toBe(true)
    wrapper.unmount()
  })
})
