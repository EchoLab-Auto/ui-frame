import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSlider from './NeumorphismSlider.vue'

describe('NeumorphismSlider', () => {
  it('renders slider with correct ARIA attributes', () => {
    const wrapper = mount(NeumorphismSlider, { props: { modelValue: 50, min: 0, max: 100 } })
    const slider = wrapper.find('[role="slider"]')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('aria-valuenow')).toBe('50')
    expect(slider.attributes('aria-valuemin')).toBe('0')
    expect(slider.attributes('aria-valuemax')).toBe('100')
  })

  it('handles ArrowRight key to increase value', async () => {
    const wrapper = mount(NeumorphismSlider, {
      props: { modelValue: 50, min: 0, max: 100, step: 10 },
    })
    const slider = wrapper.find('[role="slider"]')
    slider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([60])
  })

  it('handles ArrowLeft key to decrease value', async () => {
    const wrapper = mount(NeumorphismSlider, {
      props: { modelValue: 50, min: 0, max: 100, step: 10 },
    })
    const slider = wrapper.find('[role="slider"]')
    slider.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([40])
  })

  it('handles Home key to go to minimum', async () => {
    const wrapper = mount(NeumorphismSlider, { props: { modelValue: 50, min: 0, max: 100 } })
    wrapper.find('[role="slider"]').trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0])
  })

  it('handles End key to go to maximum', async () => {
    const wrapper = mount(NeumorphismSlider, { props: { modelValue: 50, min: 0, max: 100 } })
    wrapper.find('[role="slider"]').trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([100])
  })

  it('clamps value within min/max', () => {
    const wrapper = mount(NeumorphismSlider, { props: { modelValue: 150, min: 0, max: 100 } })
    const slider = wrapper.find('[role="slider"]')
    expect(slider.attributes('aria-valuenow')).toBe('100')
  })

  it('does not respond to keys when disabled', async () => {
    const wrapper = mount(NeumorphismSlider, {
      props: { modelValue: 50, min: 0, max: 100, disabled: true },
    })
    wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('handles PageUp/PageDown for larger jumps', async () => {
    const wrapper = mount(NeumorphismSlider, {
      props: { modelValue: 50, min: 0, max: 100, step: 1 },
    })
    wrapper.find('[role="slider"]').trigger('keydown', { key: 'PageUp' })
    const val = wrapper.emitted('update:modelValue')?.[0][0] as number
    expect(val).toBeGreaterThan(50)
  })
})
