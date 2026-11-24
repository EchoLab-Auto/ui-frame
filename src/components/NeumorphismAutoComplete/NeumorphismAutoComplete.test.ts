import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAutoComplete from './NeumorphismAutoComplete.vue'

describe('NeumorphismAutoComplete', () => {
  it('默认渲染：外层挂 --sized，几何量交给内嵌 Input', () => {
    const wrapper = mount(NeumorphismAutoComplete)
    expect(wrapper.find('.nm-autocomplete').classes()).toContain('nm-autocomplete--sized')
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--sized')
  })

  it('数字 size：外层挂 --sized，几何量交给内嵌 Input 的内联变量', () => {
    const wrapper = mount(NeumorphismAutoComplete, { props: { size: 42 } })
    expect(wrapper.find('.nm-autocomplete').classes()).toContain('nm-autocomplete--sized')
    expect(
      wrapper
        .find('.nm-autocomplete')
        .classes()
        .some(c => /--(small|medium|large)$/.test(c))
    ).toBe(false)

    const input = wrapper.find('.nm-input')
    expect(input.classes()).toContain('nm-input--sized')
    // 42 落在 36(sm) 与 48(md) 之间：位置 0.5
    expect(input.attributes('style')).toContain('--nm-field-sz-height: 42px')
    expect(input.attributes('style')).toContain('--nm-field-sz-font: 13.5px')
    expect(input.attributes('style')).toContain('--nm-field-sz-pad-y: 8px')
    expect(input.attributes('style')).toContain('--nm-field-sz-pad-x: 14px')
  })

  it('数字 size 落在锚点上：内联变量原样下发该 px', () => {
    const anchors = [
      [36, 13, 6, 12],
      [48, 14, 10, 16],
      [60, 16, 14, 20],
    ] as const
    for (const [px, font, padY, padX] of anchors) {
      const byNumber = mount(NeumorphismAutoComplete, { props: { size: px } })
      const style = byNumber.find('.nm-input').attributes('style')
      expect(style).toContain(`--nm-field-sz-height: ${px}px`)
      expect(style).toContain(`--nm-field-sz-font: ${font}px`)
      expect(style).toContain(`--nm-field-sz-pad-y: ${padY}px`)
      expect(style).toContain(`--nm-field-sz-pad-x: ${padX}px`)
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 48', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismAutoComplete, { props: { size: bad } })
      const style = wrapper.find('.nm-input').attributes('style')
      expect(style).toContain('--nm-field-sz-height: 48px')
      expect(style).toContain('--nm-field-sz-font: 14px')
    }
  })
})
