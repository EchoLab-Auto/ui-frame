import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismInput from './NeumorphismInput.vue'

describe('NeumorphismInput', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismInput)
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('disabled')).toBeUndefined()
    expect(input.attributes('readonly')).toBeUndefined()
  })

  it('should bind modelValue', async () => {
    const wrapper = mount(NeumorphismInput, { props: { modelValue: 'hello' } })
    expect(wrapper.find('input').element.value).toBe('hello')
  })

  it('should emit update:modelValue on input', async () => {
    const wrapper = mount(NeumorphismInput)
    await wrapper.find('input').setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new value'])
    expect(wrapper.emitted('input')).toBeDefined()
  })

  it('should support different input types', () => {
    const types = ['text', 'password', 'email', 'number', 'tel']
    for (const type of types) {
      const wrapper = mount(NeumorphismInput, { props: { type } })
      expect(wrapper.find('input').attributes('type')).toBe(type)
    }
  })

  it('should set placeholder', () => {
    const wrapper = mount(NeumorphismInput, { props: { placeholder: 'Enter name' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter name')
  })

  it('should apply disabled state', () => {
    const wrapper = mount(NeumorphismInput, { props: { disabled: true } })
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--disabled')
  })

  it('should apply readonly state', () => {
    const wrapper = mount(NeumorphismInput, { props: { readonly: true } })
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--readonly')
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismInput, { props: { size } })
      expect(wrapper.find('.nm-input').classes()).toContain(`nm-input--${size}`)
    }
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismInput, { props: { size: 42 } })
    const box = wrapper.find('.nm-input')
    expect(box.classes()).toContain('nm-input--sized')
    expect(box.classes().some(c => /--(small|medium|large)$/.test(c))).toBe(false)
    // 42 落在 36(sm) 与 48(md) 之间：位置 0.5
    expect(box.attributes('style')).toContain('--nm-field-sz-height: 42px')
    expect(box.attributes('style')).toContain('--nm-field-sz-font: 13.5px')
    expect(box.attributes('style')).toContain('--nm-field-sz-pad-y: 8px')
    expect(box.attributes('style')).toContain('--nm-field-sz-pad-x: 14px')
    expect(box.attributes('style')).toContain('--nm-field-sz-affix-x: 12px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    // 锚点 ↔ 档位 ↔ tokens.scss 里的 --nm-field-* （高度 / 字号 / 内距）
    const anchors = [
      [36, 'small', 13, 6, 12, 10],
      [48, 'medium', 14, 10, 16, 14],
      [60, 'large', 16, 14, 20, 16],
    ] as const
    for (const [px, tier, font, padY, padX, affixX] of anchors) {
      const style = mount(NeumorphismInput, { props: { size: px } })
        .find('.nm-input')
        .attributes('style')
      expect(style).toContain(`--nm-field-sz-height: ${px}px`)
      expect(style).toContain(`--nm-field-sz-font: ${font}px`)
      expect(style).toContain(`--nm-field-sz-pad-y: ${padY}px`)
      expect(style).toContain(`--nm-field-sz-pad-x: ${padX}px`)
      expect(style).toContain(`--nm-field-sz-affix-x: ${affixX}px`)
      // 档位路径不挂内联变量，两者靠锚点取值一致而非共享代码
      const byTier = mount(NeumorphismInput, { props: { size: tier } })
      expect(byTier.find('.nm-input').classes()).toContain(`nm-input--${tier}`)
      expect(byTier.find('.nm-input').attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 48', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismInput, { props: { size: bad } })
      const style = wrapper.find('.nm-input').attributes('style')
      expect(style).toContain('--nm-field-sz-height: 48px')
      expect(style).toContain('--nm-field-sz-font: 14px')
    }
  })

  it('should display label', () => {
    const wrapper = mount(NeumorphismInput, { props: { label: 'Username' } })
    expect(wrapper.text()).toContain('Username')
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--has-label')
  })

  it('should apply error state', () => {
    const wrapper = mount(NeumorphismInput, { props: { error: 'Required field' } })
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--error')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Required field')
  })

  it('should set maxlength and minlength', () => {
    const wrapper = mount(NeumorphismInput, {
      props: { maxlength: 10, minlength: 3 },
    })
    const input = wrapper.find('input')
    expect(input.attributes('maxlength')).toBe('10')
    expect(input.attributes('minlength')).toBe('3')
  })

  it('should set name and autocomplete', () => {
    const wrapper = mount(NeumorphismInput, {
      props: { name: 'username', autocomplete: 'username' },
    })
    const input = wrapper.find('input')
    expect(input.attributes('name')).toBe('username')
    expect(input.attributes('autocomplete')).toBe('username')
  })

  it('should set inputmode', () => {
    const wrapper = mount(NeumorphismInput, { props: { inputmode: 'numeric' } })
    expect(wrapper.find('input').attributes('inputmode')).toBe('numeric')
  })

  it('should emit focus event', async () => {
    const wrapper = mount(NeumorphismInput)
    await wrapper.find('input').trigger('focus')
    expect(wrapper.emitted('focus')).toBeDefined()
  })

  it('should emit blur event', async () => {
    const wrapper = mount(NeumorphismInput)
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('blur')).toBeDefined()
  })

  it('should emit keydown event', async () => {
    const wrapper = mount(NeumorphismInput)
    await wrapper.find('input').trigger('keydown', { key: 'a' })
    expect(wrapper.emitted('keydown')).toBeDefined()
  })

  it('should emit enter event on Enter key', async () => {
    const wrapper = mount(NeumorphismInput, { props: { modelValue: 'test' } })
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('enter')).toBeDefined()
    expect(wrapper.emitted('enter')![0]).toEqual(['test'])
  })

  it('should render prefix slot', () => {
    const wrapper = mount(NeumorphismInput, {
      slots: { prefix: '<span class="prefix-icon">@</span>' },
    })
    expect(wrapper.find('.prefix-icon').exists()).toBe(true)
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--has-prefix')
  })

  it('should render suffix slot', () => {
    const wrapper = mount(NeumorphismInput, {
      slots: { suffix: '<span class="suffix-icon">#</span>' },
    })
    expect(wrapper.find('.suffix-icon').exists()).toBe(true)
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--has-suffix')
  })

  it('should apply filled class when has value', () => {
    const wrapper = mount(NeumorphismInput, { props: { modelValue: 'filled' } })
    expect(wrapper.find('.nm-input').classes()).toContain('nm-input--filled')
  })

  it('should not apply filled class when empty', () => {
    const wrapper = mount(NeumorphismInput, { props: { modelValue: '' } })
    expect(wrapper.find('.nm-input').classes()).not.toContain('nm-input--filled')
  })
})
