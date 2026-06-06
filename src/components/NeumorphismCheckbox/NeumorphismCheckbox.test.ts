import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismCheckbox from './NeumorphismCheckbox.vue'

describe('NeumorphismCheckbox', () => {
  it('should render unchecked by default', () => {
    const wrapper = mount(NeumorphismCheckbox)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
    expect(input.element.checked).toBe(false)
    expect(input.attributes('disabled')).toBeUndefined()
  })

  it('should render checked when modelValue is true', () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { modelValue: true } })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.element.checked).toBe(true)
    expect(wrapper.classes()).toContain('nm-checkbox--checked')
  })

  it('should emit update:modelValue on change', async () => {
    const wrapper = mount(NeumorphismCheckbox)
    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    expect(wrapper.emitted('change')).toBeDefined()
  })

  it('should not emit when disabled', async () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { disabled: true } })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('nm-checkbox--disabled')

    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('should display label prop', () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { label: 'Accept terms' } })
    expect(wrapper.text()).toContain('Accept terms')
    expect(wrapper.find('.nm-checkbox__label').exists()).toBe(true)
  })

  it('should display slot content as label', () => {
    const wrapper = mount(NeumorphismCheckbox, {
      slots: { default: 'Slot Label' },
    })
    expect(wrapper.text()).toContain('Slot Label')
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismCheckbox, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-checkbox--${size}`)
    }
  })

  it('should set name attribute', () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { name: 'agree' } })
    expect(wrapper.find('input[type="checkbox"]').attributes('name')).toBe('agree')
  })

  it('should link label to input via for attribute', () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { label: 'Test' } })
    const label = wrapper.find('label')
    const input = wrapper.find('input[type="checkbox"]')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('should show indeterminate state', () => {
    const wrapper = mount(NeumorphismCheckbox, {
      props: { modelValue: false, indeterminate: true },
    })
    expect(wrapper.classes()).toContain('nm-checkbox--indeterminate')
    expect(wrapper.find('.nm-checkbox__box').exists()).toBe(true)
  })

  it('should toggle from checked to unchecked', async () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { modelValue: true } })
    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(false)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('should link label to input via for attribute', () => {
    const wrapper = mount(NeumorphismCheckbox, { props: { label: 'Test' } })
    const label = wrapper.find('label')
    const input = wrapper.find('input[type="checkbox"]')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })
})
