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

  it('should default to the neumorphic variant (no outlined class)', () => {
    const wrapper = mountSelect()
    expect(wrapper.find('.nm-select').classes()).not.toContain('nm-select--outlined')
  })

  it('should apply the outlined variant classes when variant=outlined', async () => {
    const wrapper = mountSelect({ variant: 'outlined' })
    expect(wrapper.find('.nm-select').classes()).toContain('nm-select--outlined')
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    expect(document.querySelector('.nm-select__dropdown')!.classList).toContain(
      'nm-select__dropdown--outlined'
    )
  })

  it('should emit visible-change when dropdown opens and closes', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    expect(wrapper.emitted('visible-change')).toBeDefined()
    expect(wrapper.emitted('visible-change')![0]).toEqual([true])
  })

  it('should expose focus and blur methods', () => {
    const wrapper = mountSelect()
    const vm = wrapper.vm as unknown as { focus: () => void; blur: () => void }
    vm.focus()
    expect(document.activeElement).toBe(wrapper.find('.nm-select').element)
    vm.blur()
    expect(document.activeElement).not.toBe(wrapper.find('.nm-select').element)
  })

  it('should flip the dropdown upwards when viewport space below is insufficient', async () => {
    const wrapper = mountSelect()
    const trigger = wrapper.find('.nm-select').element as HTMLElement
    trigger.getBoundingClientRect = () =>
      ({
        top: 700,
        bottom: 748,
        left: 10,
        width: 200,
        height: 48,
        right: 210,
        x: 10,
        y: 700,
        toJSON: () => ({}),
      }) as DOMRect
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    await nextTick()
    const dropdown = document.querySelector('.nm-select__dropdown')
    expect(dropdown).not.toBeNull()
    expect(dropdown!.classList.contains('nm-select__dropdown--up')).toBe(true)
  })

  it('should open downwards when viewport space below is sufficient', async () => {
    const wrapper = mountSelect()
    const trigger = wrapper.find('.nm-select').element as HTMLElement
    trigger.getBoundingClientRect = () =>
      ({
        top: 10,
        bottom: 58,
        left: 10,
        width: 200,
        height: 48,
        right: 210,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      }) as DOMRect
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    await nextTick()
    const dropdown = document.querySelector('.nm-select__dropdown')
    expect(dropdown).not.toBeNull()
    expect(dropdown!.classList.contains('nm-select__dropdown--up')).toBe(false)
  })
})

describe('NeumorphismSelect — loading', () => {
  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ]

  it('should show spinner in the trigger and hide the arrow when loading', async () => {
    const wrapper = mount(NeumorphismSelect, {
      props: { options, loading: true },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.find('.nm-select__spinner').exists()).toBe(true)
    expect(wrapper.find('.nm-select__arrow').exists()).toBe(false)
  })

  it('should show loading text inside the dropdown instead of options', async () => {
    const wrapper = mount(NeumorphismSelect, {
      props: { options, loading: true },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const loading = document.querySelector('.nm-select__loading')
    expect(loading).not.toBeNull()
    expect(loading!.textContent).toContain('加载中')
    expect(document.querySelector('.nm-select__option')).toBeNull()
  })
})

describe('NeumorphismSelect — filterable', () => {
  const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ]

  function mountFilterable(props: Record<string, unknown> = {}) {
    return mount(NeumorphismSelect, {
      props: { options, filterable: true, ...props },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render an input with combobox role when filterable', () => {
    const wrapper = mountFilterable()
    const input = wrapper.find('.nm-select__input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('role')).toBe('combobox')
    // 触发器容器不再承担 combobox 语义
    expect(wrapper.find('.nm-select').attributes('role')).toBeUndefined()
  })

  it('should filter options as the user types', async () => {
    const wrapper = mountFilterable()
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const input = wrapper.find('.nm-select__input')
    await input.setValue('an')
    await nextTick()
    const rendered = document.querySelectorAll('.nm-select__option')
    expect(rendered).toHaveLength(1)
    expect(rendered[0].textContent).toContain('Banana')
    expect(wrapper.emitted('search')).toBeDefined()
    expect(wrapper.emitted('search')![0]).toEqual(['an'])
  })

  it('should show no-match text when the filter yields nothing', async () => {
    const wrapper = mountFilterable()
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    await wrapper.find('.nm-select__input').setValue('zzz')
    await nextTick()
    const empty = document.querySelector('.nm-select__option--empty')
    expect(empty).not.toBeNull()
    expect(empty!.textContent).toContain('无匹配选项')
  })

  it('should display the selected label in the input when closed', async () => {
    const wrapper = mountFilterable({ modelValue: 'banana' })
    await nextTick()
    const input = wrapper.find('.nm-select__input').element as HTMLInputElement
    expect(input.value).toBe('Banana')
  })

  it('should open the dropdown when the input gains focus (keyboard path)', async () => {
    const wrapper = mountFilterable()
    expect(document.querySelector('.nm-select__dropdown')).toBeNull()
    await wrapper.find('.nm-select__input').trigger('focus')
    await nextTick()
    expect(document.querySelector('.nm-select__dropdown')).not.toBeNull()
  })
})

describe('NeumorphismSelect — multiple', () => {
  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' },
  ]

  function mountMultiple(props: Record<string, unknown> = {}) {
    return mount(NeumorphismSelect, {
      props: { options, multiple: true, modelValue: [], ...props },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render tags for selected values', () => {
    const wrapper = mountMultiple({ modelValue: ['a', 'b'] })
    const tags = wrapper.findAll('.nm-select__tags .nm-tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].text()).toContain('Option A')
    expect(tags[1].text()).toContain('Option B')
  })

  it('should show placeholder when the selection is empty', () => {
    const wrapper = mountMultiple({ modelValue: [] })
    const value = wrapper.find('.nm-select__value')
    expect(value.exists()).toBe(true)
    expect(value.classes()).toContain('nm-select__value--placeholder')
  })

  it('should toggle options into an array and keep the dropdown open', async () => {
    const wrapper = mountMultiple({ modelValue: [] })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const optionEls = document.querySelectorAll('.nm-select__option')
    ;(optionEls[0] as HTMLElement).click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['a']])
    // 多选选择后保持展开
    expect(document.querySelector('.nm-select__dropdown')).not.toBeNull()
  })

  it('should set aria-multiselectable on the listbox', async () => {
    const wrapper = mountMultiple({ modelValue: [] })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    expect(
      document.querySelector('.nm-select__dropdown')!.getAttribute('aria-multiselectable')
    ).toBe('true')
  })

  it('should remove a value via the tag close button and emit remove-tag', async () => {
    const wrapper = mountMultiple({ modelValue: ['a', 'b'] })
    const closeButtons = wrapper.findAll('.nm-select__tags .nm-tag__close')
    expect(closeButtons).toHaveLength(2)
    await closeButtons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['b']])
    expect(wrapper.emitted('remove-tag')).toBeDefined()
    expect(wrapper.emitted('remove-tag')![0]).toEqual(['a'])
  })

  it('should clear to an empty array', async () => {
    const wrapper = mountMultiple({ modelValue: ['a'], clearable: true })
    await nextTick()
    await wrapper.find('.nm-select__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([[]])
  })

  it('should collapse tags beyond maxCollapseTags into a +N counter', () => {
    const wrapper = mountMultiple({
      modelValue: ['a', 'b', 'c'],
      collapseTags: true,
      maxCollapseTags: 1,
    })
    const tags = wrapper.findAll('.nm-select__tags .nm-tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].text()).toContain('Option A')
    expect(tags[1].text()).toContain('+2')
  })

  it('should render checkbox indicators for options in multiple mode', async () => {
    const wrapper = mountMultiple({ modelValue: ['a'] })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const checkboxes = document.querySelectorAll('.nm-select__checkbox')
    expect(checkboxes.length).toBe(3)
    expect(document.querySelectorAll('.nm-select__checkbox--checked').length).toBe(1)
  })
})

describe('NeumorphismSelect — group', () => {
  const groupedOptions = [
    { label: 'Apple', value: 'apple', group: '水果' },
    { label: 'Banana', value: 'banana', group: '水果' },
    { label: 'Carrot', value: 'carrot', group: '蔬菜' },
  ]

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render group titles inside the dropdown', async () => {
    const wrapper = mount(NeumorphismSelect, {
      props: { options: groupedOptions },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const titles = document.querySelectorAll('.nm-select__group-title')
    expect(titles).toHaveLength(2)
    expect(titles[0].textContent).toContain('水果')
    expect(titles[1].textContent).toContain('蔬菜')
    expect(document.querySelectorAll('.nm-select__option')).toHaveLength(3)
  })

  it('should select a grouped option normally', async () => {
    const wrapper = mount(NeumorphismSelect, {
      props: { options: groupedOptions },
      global: { stubs: { teleport: false, transition: false } },
      attachTo: document.body,
    })
    await wrapper.find('.nm-select').trigger('click')
    await nextTick()
    const optionEls = document.querySelectorAll('.nm-select__option')
    ;(optionEls[2] as HTMLElement).click()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['carrot'])
  })
})
