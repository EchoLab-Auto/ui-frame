import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismProgress from './NeumorphismProgress.vue'

describe('NeumorphismProgress', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 50 },
    })
    expect(wrapper.classes()).toContain('nm-progress')
    expect(wrapper.find('.nm-progress__track').exists()).toBe(true)
  })

  it('should render progress bar with correct width', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 75 },
    })
    const bar = wrapper.find('.nm-progress__bar')
    expect(bar.attributes('style')).toContain('75%')
  })

  it('should show label text when showLabel is true', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 60, showLabel: true },
    })
    // Label text should be present
    expect(wrapper.text()).toBeTruthy()
  })

  it('should have ARIA progressbar role', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 40 },
    })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-valuenow')).toBe('40')
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('100')
  })

  it('should apply striped class', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 60, striped: true },
    })
    expect(wrapper.classes()).toContain('nm-progress--striped')
  })

  it('should handle indeterminate mode', () => {
    const wrapper = mount(NeumorphismProgress, {
      props: { modelValue: 0, indeterminate: true },
    })
    expect(wrapper.classes()).toContain('nm-progress--indeterminate')
  })
})
