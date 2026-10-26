import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAutoComplete from './NeumorphismAutoComplete.vue'

describe('NeumorphismAutoComplete', () => {
  it('默认渲染：档位走内嵌 Input，外层只做包装', () => {
    const wrapper = mount(NeumorphismAutoComplete)
    expect(wrapper.find('.nm-autocomplete').classes()).toContain('nm-autocomplete--medium')
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--medium')
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

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [36, 'small', 13, 6, 12],
      [48, 'medium', 14, 10, 16],
      [60, 'large', 16, 14, 20],
    ] as const
    for (const [px, tier, font, padY, padX] of anchors) {
      const byNumber = mount(NeumorphismAutoComplete, { props: { size: px } })
      const style = byNumber.find('.nm-input').attributes('style')
      expect(style).toContain(`--nm-field-sz-height: ${px}px`)
      expect(style).toContain(`--nm-field-sz-font: ${font}px`)
      expect(style).toContain(`--nm-field-sz-pad-y: ${padY}px`)
      expect(style).toContain(`--nm-field-sz-pad-x: ${padX}px`)

      const byTier = mount(NeumorphismAutoComplete, { props: { size: tier } })
      expect(byTier.find('.nm-autocomplete').classes()).toContain(`nm-autocomplete--${tier}`)
      expect(byTier.find('.nm-input').classes()).toContain(`nm-input--${tier}`)
      expect(byTier.find('.nm-input').attributes('style')).toBeUndefined()
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
