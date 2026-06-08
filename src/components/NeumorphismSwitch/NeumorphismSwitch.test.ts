import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSwitch from './NeumorphismSwitch.vue'

describe('NeumorphismSwitch', () => {
  it('should render unchecked by default', () => {
    const wrapper = mount(NeumorphismSwitch)
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
    expect(wrapper.classes()).toContain('nm-switch')
    expect(wrapper.classes()).toContain('nm-switch--medium')
    expect(wrapper.classes()).not.toContain('nm-switch--checked')
  })

  it('should render checked when modelValue is true', () => {
    const wrapper = mount(NeumorphismSwitch, { props: { modelValue: true } })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    expect(wrapper.classes()).toContain('nm-switch--checked')
  })

  it('should emit update:modelValue on change', async () => {
    const wrapper = mount(NeumorphismSwitch)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    expect(wrapper.emitted('change')).toBeDefined()
  })

  it('should not emit when disabled', async () => {
    const wrapper = mount(NeumorphismSwitch, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('nm-switch--disabled')
    expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismSwitch, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-switch--${size}`)
    }
  })

  it('should display active and inactive text', () => {
    const wrapper = mount(NeumorphismSwitch, {
      props: { activeText: 'On', inactiveText: 'Off' },
    })
    expect(wrapper.text()).toContain('On')
    expect(wrapper.text()).toContain('Off')
  })

  it('should apply active color CSS variable when checked', () => {
    const wrapper = mount(NeumorphismSwitch, {
      props: { modelValue: true, activeColor: '#00ff00' },
    })
    const track = wrapper.find('.nm-switch__track')
    expect(track.attributes('style')).toContain('--nm-switch-active-color: #00ff00')
  })

  it('should apply inactive color CSS variable when unchecked', () => {
    const wrapper = mount(NeumorphismSwitch, {
      props: { modelValue: false, inactiveColor: '#ff0000' },
    })
    const track = wrapper.find('.nm-switch__track')
    expect(track.attributes('style')).toContain('--nm-switch-inactive-color: #ff0000')
  })

  it('should toggle from checked to unchecked', async () => {
    const wrapper = mount(NeumorphismSwitch, { props: { modelValue: true } })
    await wrapper.find('input[type="checkbox"]').setValue(false)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })
})
