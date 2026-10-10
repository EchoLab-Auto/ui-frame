import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import NeumorphismSwitch from './NeumorphismSwitch.vue'

describe('NeumorphismSwitch', () => {
  it('should render unchecked by default', () => {
    const wrapper = mount(NeumorphismSwitch)
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
    expect(wrapper.classes()).toContain('nm-switch')
    // 尺寸 = px 高度：默认 30px（通过内联 CSS 变量驱动几何）
    expect(wrapper.attributes('style')).toContain('--nm-switch-height: 30px')
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

  it('should size by px height via inline CSS variable', () => {
    const wrapper = mount(NeumorphismSwitch, { props: { size: 40 } })
    expect(wrapper.attributes('style')).toContain('--nm-switch-height: 40px')
  })

  it('should clamp too-small sizes to 8px', () => {
    const wrapper = mount(NeumorphismSwitch, { props: { size: 4 } })
    expect(wrapper.attributes('style')).toContain('--nm-switch-height: 8px')
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

    it('should render power structure with variant class and default 91px height', () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      expect(wrapper.classes()).toContain('nm-switch--power')
      expect(wrapper.attributes('style')).toContain('--nm-switch-power-u: 1px')
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

    it('should map px height to device unit u (height / 91)', () => {
      const wrapper = mount(NeumorphismSwitch, { props: { ...power, size: 44 } })
      expect(wrapper.attributes('style')).toMatch(/--nm-switch-power-u: 0\.4835/)
      expect(wrapper.classes()).not.toContain('nm-switch--compact')
    })

    it('should enter compact mode below 36px (engraving suppression)', () => {
      const wrapper = mount(NeumorphismSwitch, { props: { ...power, size: 24 } })
      expect(wrapper.classes()).toContain('nm-switch--compact')
      // 类切换仅控制刻印文本的摘除；圆钮纹理不随阈值隐藏
      // （低于 34px 冻结缩放、始终保留——见下方纹理冻结契约测试）
      const wrapper36 = mount(NeumorphismSwitch, { props: { ...power, size: 36 } })
      expect(wrapper36.classes()).not.toContain('nm-switch--compact')
    })

    it('should freeze texture scale below 34px instead of hiding it', () => {
      const source = readFileSync('src/components/NeumorphismSwitch/NeumorphismSwitch.vue', 'utf-8')
      // 纹理缩放单位钳制：不低于 34px 器件高对应的设计单位（max 取大者）——
      // 图案周期低于 ~1.5px 会跌入亚像素摩尔纹，届时停止缩放而非隐藏
      expect(source).toMatch(
        /--nm-switch-power-tex-u:\s*max\(calc\(34 \/ 91 \* 1px\),\s*var\(--nm-switch-power-u\)\)/
      )
      // 图案平铺消费冻结单位（4 × tex-u），而非直接乘随设备缩小的 u
      expect(source).toMatch(/calc\(4 \* var\(--nm-switch-power-tex-u\)\)/)
      // 紧凑模式只摘刻印文本，不得再摘除纹理层
      const compactBlock =
        source.match(/\.nm-switch--power\.nm-switch--compact \{[\s\S]*?\n\}/)?.[0] ?? ''
      expect(compactBlock).toContain('nm-switch__state')
      expect(compactBlock).not.toContain('knob-texture')
    })

    it('should not render engraving text by default', () => {
      const wrapper = mount(NeumorphismSwitch, { props: power })
      expect(wrapper.find('.nm-switch__state').exists()).toBe(false)
      expect(wrapper.text()).toBe('')
    })

    it('should display custom engraving texts when provided', () => {
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
