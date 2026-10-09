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

  it('should expose role=switch and localized fallback accessible name', () => {
    const wrapper = mount(NeumorphismSwitch)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('role')).toBe('switch')
    expect(input.attributes('aria-checked')).toBe('false')
    expect(input.attributes('aria-label')).toBeTruthy()
  })

  it('should prefer activeText as accessible name when provided', () => {
    const wrapper = mount(NeumorphismSwitch, { props: { activeText: '启用' } })
    expect(wrapper.find('input[type="checkbox"]').attributes('aria-label')).toBe('启用')
  })

  describe('power variant', () => {
    const power = { variant: 'power' as const }

    it('should render power structure with variant class', () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      expect(wrapper.classes()).toContain('nm-switch--power')
      expect(wrapper.classes()).toContain('nm-switch--medium')
      expect(wrapper.classes()).not.toContain('nm-switch--checked')
      expect(wrapper.find('.nm-switch__shell').exists()).toBe(true)
      expect(wrapper.find('.nm-switch__well').exists()).toBe(true)
      expect(wrapper.find('.nm-switch__knob').exists()).toBe(true)
      // 默认变体的轨道/滑块结构不渲染
      expect(wrapper.find('.nm-switch__track').exists()).toBe(false)
    })

    it('should not render power structure for default variant', () => {
      const wrapper = mount(NeumorphismSwitch)
      expect(wrapper.classes()).not.toContain('nm-switch--power')
      expect(wrapper.find('.nm-switch__shell').exists()).toBe(false)
      expect(wrapper.find('.nm-switch__track').exists()).toBe(true)
    })

    it('should render checked state when modelValue is true', () => {
      const wrapper = mount(NeumorphismSwitch, { props: { ...power, modelValue: true } })
      expect(wrapper.classes()).toContain('nm-switch--checked')
      expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    })

    it('should emit update:modelValue on change', async () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      await wrapper.find('input[type="checkbox"]').setValue(true)
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
      expect(wrapper.emitted('change')![0]).toEqual([true])
    })

    it('should not emit when disabled', async () => {
      const wrapper = mount(NeumorphismSwitch, { props: { ...power, disabled: true } })
      expect(wrapper.classes()).toContain('nm-switch--disabled')
      await wrapper.find('input[type="checkbox"]').setValue(true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('should apply size classes', () => {
      const sizes = ['small', 'medium', 'large'] as const
      for (const size of sizes) {
        const wrapper = mount(NeumorphismSwitch, { props: { ...power, size } })
        expect(wrapper.classes()).toContain(`nm-switch--${size}`)
      }
    })

    it('should display default ON/OFF engravings', () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      expect(wrapper.find('.nm-switch__state--off').text()).toBe('OFF')
      expect(wrapper.find('.nm-switch__state--on').text()).toBe('ON')
    })

    it('should display custom engraving texts', () => {
      const wrapper = mount(NeumorphismSwitch, {
        props: { ...power, activeText: '已通电', inactiveText: '已断电' },
      })
      expect(wrapper.find('.nm-switch__state--on').text()).toBe('已通电')
      expect(wrapper.find('.nm-switch__state--off').text()).toBe('已断电')
    })

    it('should map activeColor to the energized face and inactiveColor to the well', () => {
      const wrapper = mount(NeumorphismSwitch, {
        props: { ...power, activeColor: '#27ae60', inactiveColor: '#333333' },
      })
      const shell = wrapper.find('.nm-switch__shell')
      expect(shell.attributes('style')).toContain('--nm-switch-active-color: #27ae60')
      expect(shell.attributes('style')).toContain('--nm-switch-inactive-color: #333333')
    })

    it('should not apply flash classes before any user toggle', () => {
      const wrapper = mount(NeumorphismSwitch, { props: { ...power, modelValue: true } })
      expect(wrapper.classes()).not.toContain('nm-switch--flash-on')
      expect(wrapper.classes()).not.toContain('nm-switch--flash-off')
    })

    it('should apply flash classes after toggle', async () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      // 受控组件：点击先发事件，父组件回写 modelValue 后 watch 才触发闪烁
      await wrapper.find('input[type="checkbox"]').setValue(true)
      await wrapper.setProps({ modelValue: true })
      expect(wrapper.classes()).toContain('nm-switch--flash-on')

      await wrapper.setProps({ modelValue: false })
      expect(wrapper.classes()).toContain('nm-switch--flash-off')
      expect(wrapper.classes()).not.toContain('nm-switch--flash-on')
    })

    it('should expose role=switch and localized fallback accessible name', () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      const input = wrapper.find('input[type="checkbox"]')
      expect(input.attributes('role')).toBe('switch')
      expect(input.attributes('aria-checked')).toBe('false')
      expect(input.attributes('aria-label')).toBeTruthy()
    })
  })
})
