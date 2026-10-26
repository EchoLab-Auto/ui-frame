import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismCheckbox from './NeumorphismCheckbox.vue'
import { CHECKBOX_SCALE } from '@/utils/controlScales'
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

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    // 13 落在锚点 12(sm) 与 14(md) 之间：值就是传进去的 px，不做倍率换算
    const wrapper = mount(NeumorphismCheckbox, { props: { size: 13 } })
    expect(wrapper.classes()).toContain('nm-checkbox--sized')
    // 数字与档位类互斥：同时存在就变成「两套声明比顺序」
    expect(wrapper.classes().some(c => /^nm-checkbox--(small|medium|large)$/.test(c))).toBe(false)
    expect(wrapper.attributes('style')).toContain('--nm-checkbox-sz-box: 13px')
  })

  it('数字 size 在锚点上与档位别名一致（盒 18 / 24 / 30）', () => {
    const box = CHECKBOX_SCALE.primary /* --nm-checkbox-sz-box 是主几何量，已提到 primaryVar */
    // 锚点值只从引擎取一次，测试里不再抄第二份数字。
    // 注意主几何量是「盒边长」（`checkable-sizes` 混基的 18/24/30），
    // 不是内部勾形图标的枚举档（12/14/16）——后者单列在 metrics 里。
    expect([box.sm, box.md, box.lg]).toEqual([18, 24, 30])
    const anchors = [
      [box.sm, 'small'],
      [box.md, 'medium'],
      [box.lg, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismCheckbox, { props: { size: px } })
      expect(byNumber.attributes('style')).toContain(`--nm-checkbox-sz-box: ${px}px`)

      const byTier = mount(NeumorphismCheckbox, { props: { size: tier } })
      expect(byTier.classes()).toContain(`nm-checkbox--${tier}`)
      // 档位路径不写内联变量：两条通道互不干扰
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 24', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismCheckbox, { props: { size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-checkbox-sz-box: 24px')
      // 回落后仍走数字通道，不会掉回档位类
      expect(wrapper.classes()).toContain('nm-checkbox--sized')
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
