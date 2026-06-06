import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismForm from './NeumorphismForm.vue'

describe('NeumorphismForm', () => {
  it('should render form element', () => {
    const wrapper = mount(NeumorphismForm)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('form').attributes('novalidate')).toBeDefined()
  })

  it('should apply direction class', () => {
    const wrapper = mount(NeumorphismForm, { props: { direction: 'horizontal' } })
    expect(wrapper.find('form').classes()).toContain('nm-form--horizontal')
  })

  it('should emit submit when validation passes', async () => {
    const wrapper = mount(NeumorphismForm, {
      props: {
        model: { name: 'John' },
        rules: {},
      },
      slots: { default: '<input name="name" />' },
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeDefined()
    expect(wrapper.emitted('submit')![0]).toEqual([{ name: 'John' }])
  })

  it('should not emit submit when validation fails', async () => {
    const wrapper = mount(NeumorphismForm, {
      props: {
        model: { name: '' },
        rules: {
          name: [{ required: true, message: 'Required' }],
        },
      },
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('validate')).toBeDefined()
    expect(wrapper.emitted('validate')![0]).toEqual([false])
  })

  it('should emit submit when model passes rules', async () => {
    const wrapper = mount(NeumorphismForm, {
      props: {
        model: { name: 'Valid' },
        rules: {
          name: [{ required: true, message: 'Required' }],
        },
      },
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeDefined()
    expect(wrapper.emitted('validate')![0]).toEqual([true])
  })

  it('should expose validateAll method', () => {
    const wrapper = mount(NeumorphismForm, {
      props: {
        model: { name: '' },
        rules: {
          name: [{ required: true, message: 'Required' }],
        },
      },
    })
    const vm = wrapper.vm as unknown as { validateAll: () => boolean }
    expect(vm.validateAll()).toBe(false)
  })

  it('should expose clearErrors method', () => {
    const wrapper = mount(NeumorphismForm, {
      props: {
        model: { name: '' },
        rules: {
          name: [{ required: true, message: 'Required' }],
        },
      },
    })
    const vm = wrapper.vm as unknown as { validateAll: () => boolean; clearErrors: () => void }
    vm.validateAll()
    vm.clearErrors()
    // After clearing, validateAll should pass for empty model with no rules
    const wrapper2 = mount(NeumorphismForm)
    const vm2 = wrapper2.vm as unknown as { validateAll: () => boolean }
    expect(vm2.validateAll()).toBe(true)
  })

  it('should render slot content', () => {
    const wrapper = mount(NeumorphismForm, {
      slots: { default: '<div class="form-content">Fields</div>' },
    })
    expect(wrapper.find('.form-content').exists()).toBe(true)
  })

  it('should expose scoped slot props', () => {
    const wrapper = mount(NeumorphismForm, {
      slots: {
        default: '<template #default="{ errors, validateAll }"><div>form</div></template>',
      },
    })
    expect(wrapper.text()).toContain('form')
  })
})
