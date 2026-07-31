import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismFieldLabel from './NeumorphismFieldLabel.vue'
import NeumorphismFieldError from './NeumorphismFieldError.vue'

describe('NeumorphismField', () => {
  it('Label renders text with for attribute', () => {
    const wrapper = mount(NeumorphismFieldLabel, {
      props: { label: '用户名', forId: 'nm-input-1' },
    })
    const label = wrapper.find('label')
    expect(label.text()).toContain('用户名')
    expect(label.attributes('for')).toBe('nm-input-1')
  })

  it('Label shows required asterisk', () => {
    const wrapper = mount(NeumorphismFieldLabel, {
      props: { label: '邮箱', required: true },
    })
    expect(wrapper.find('.nm-field__required').exists()).toBe(true)
  })

  it('Label renders nothing when label is empty', () => {
    const wrapper = mount(NeumorphismFieldLabel, { props: { label: '' } })
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('Error renders message with role=alert', () => {
    const wrapper = mount(NeumorphismFieldError, {
      props: { id: 'err-1', message: '该字段为必填项' },
    })
    expect(wrapper.text()).toContain('该字段为必填项')
  })

  it('Error renders nothing when message is empty', () => {
    const wrapper = mount(NeumorphismFieldError, { props: { id: 'err-1', message: '' } })
    expect(wrapper.text()).toBe('')
  })
})
