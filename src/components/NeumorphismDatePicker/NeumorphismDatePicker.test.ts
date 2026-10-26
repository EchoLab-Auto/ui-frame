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

describe('NeumorphismDatePicker size（数字为一等公民）', () => {
  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismDatePicker, {
      props: { size: 42 },
      attachTo: document.body,
    })
    const trigger = wrapper.find('.nm-datepicker')
    expect(trigger.classes()).toContain('nm-datepicker--sized')
    expect(trigger.classes().some(c => /--(small|medium|large)$/.test(c))).toBe(false)
    // 42 落在 36(sm) 与 48(md) 之间：位置 0.5
    expect(trigger.attributes('style')).toContain('--nm-field-sz-height: 42px')
    expect(trigger.attributes('style')).toContain('--nm-field-sz-font: 13.5px')
    expect(trigger.attributes('style')).toContain('--nm-field-sz-pad-y: 8px')
    expect(trigger.attributes('style')).toContain('--nm-field-sz-pad-x: 14px')
    wrapper.unmount()
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [36, 'small', 13, 6, 12],
      [48, 'medium', 14, 10, 16],
      [60, 'large', 16, 14, 20],
    ] as const
    for (const [px, tier, font, padY, padX] of anchors) {
      const byNumber = mount(NeumorphismDatePicker, {
        props: { size: px },
        attachTo: document.body,
      })
      const style = byNumber.find('.nm-datepicker').attributes('style')
      expect(style).toContain(`--nm-field-sz-height: ${px}px`)
      expect(style).toContain(`--nm-field-sz-font: ${font}px`)
      expect(style).toContain(`--nm-field-sz-pad-y: ${padY}px`)
      expect(style).toContain(`--nm-field-sz-pad-x: ${padX}px`)
      byNumber.unmount()

      const byTier = mount(NeumorphismDatePicker, {
        props: { size: tier },
        attachTo: document.body,
      })
      expect(byTier.find('.nm-datepicker').classes()).toContain(`nm-datepicker--${tier}`)
      expect(byTier.find('.nm-datepicker').attributes('style')).toBeUndefined()
      byTier.unmount()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 48', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismDatePicker, {
        props: { size: bad },
        attachTo: document.body,
      })
      const style = wrapper.find('.nm-datepicker').attributes('style')
      expect(style).toContain('--nm-field-sz-height: 48px')
      expect(style).toContain('--nm-field-sz-font: 14px')
      wrapper.unmount()
    }
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
