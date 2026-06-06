import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismSelect from './NeumorphismSelect.vue'

describe('NeumorphismSelect', () => {
  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c', disabled: true },
  ]

  function mountSelect(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
    return mount(NeumorphismSelect, {
      props: { options, ...props },
      slots,
      global: {
        stubs: { teleport: false, transition: false },
      },
      attachTo: document.body,
    })
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with placeholder when no value selected', () => {
    const wrapper = mountSelect()
    expect(wrapper.find('.nm-select__value').text()).toContain('请选择')
    expect(wrapper.find('.nm-select__value').classes()).toContain('nm-select__value--placeholder')
  })

  it('should display selected option label', () => {
    const wrapper = mountSelect({ modelValue: 'b' })
    expect(wrapper.find('.nm-select__value').text()).toContain('Option B')
  })

  it('should open dropdown on click', async () => {
    const wrapper = mountSelect()
    expect(wrapper.find('.nm-select__dropdown').exists()).toBe(false)
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    expect(document.querySelector('.nm-select__dropdown')).not.toBeNull()
  })

  it('should emit update:modelValue on option select', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const option = document.querySelector('.nm-select__option')
    expect(option).not.toBeNull()
    ;(option as HTMLElement).click()
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
  })

  it('should apply disabled state', () => {
    const wrapper = mountSelect({ disabled: true })
    const select = wrapper.find('.nm-select')
    expect(select.classes()).toContain('nm-select--disabled')
    expect(select.attributes('tabindex')).toBe('-1')
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mountSelect({ size })
      expect(wrapper.find('.nm-select').classes()).toContain(`nm-select--${size}`)
    }
  })

  it('should display label', () => {
    const wrapper = mountSelect({ label: 'Country' })
    expect(wrapper.text()).toContain('Country')
  })

  it('should show clear button when clearable and has value', async () => {
    const wrapper = mountSelect({ modelValue: 'a', clearable: true })
    await nextTick()
    expect(wrapper.find('.nm-select__clear').exists()).toBe(true)
  })

  it('should not show clear button when not clearable', async () => {
    const wrapper = mountSelect({ modelValue: 'a', clearable: false })
    await nextTick()
    expect(wrapper.find('.nm-select__clear').exists()).toBe(false)
  })

  it('should clear value on clear button click', async () => {
    const wrapper = mountSelect({ modelValue: 'a', clearable: true })
    await nextTick()
    await wrapper.find('.nm-select__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([undefined])
  })

  it('should show empty text when no options', async () => {
    const wrapper = mount(NeumorphismSelect, {
      props: { options: [], modelValue: '' },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    expect(document.querySelector('.nm-select__option--empty')).not.toBeNull()
  })

  it('should apply error state', () => {
    const wrapper = mountSelect({ error: 'Required' })
    expect(wrapper.find('.nm-select').classes()).toContain('nm-select--error')
  })

  it('should set role and aria attributes', () => {
    const wrapper = mountSelect()
    const select = wrapper.find('.nm-select')
    expect(select.attributes('role')).toBe('combobox')
    expect(select.attributes('aria-haspopup')).toBe('listbox')
  })
})
