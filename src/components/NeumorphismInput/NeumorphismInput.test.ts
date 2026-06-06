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
