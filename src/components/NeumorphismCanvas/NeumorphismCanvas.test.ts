import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismCanvas from './NeumorphismCanvas.vue'

describe('NeumorphismCanvas', () => {
  it('renders toolbar controls by default', () => {
    const wrapper = mount(NeumorphismCanvas)
    expect(wrapper.find('.nm-canvas__controls').exists()).toBe(true)
    expect(wrapper.find('.nm-canvas__zoom-text').text()).toBe('100%')
  })

  it('hides controls when showControls=false', () => {
    const wrapper = mount(NeumorphismCanvas, { props: { showControls: false } })
    expect(wrapper.find('.nm-canvas__controls').exists()).toBe(false)
  })

  it('zoom in/out updates zoom text and emits model value', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const zoomInBtn = wrapper.find('[aria-label*="Zoom in"], [aria-label*="放大"]')
    await zoomInBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBeGreaterThan(1)
    // 受控组件：父级回写 modelValue 后 zoom-text 跟随
    await wrapper.setProps({ modelValue: 1.2 })
    expect(wrapper.find('.nm-canvas__zoom-text').text()).toBe('120%')
  })

  it('reset restores 100%', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const zoomInBtn = wrapper.find('[aria-label*="Zoom in"], [aria-label*="放大"]')
    await zoomInBtn.trigger('click')
    const resetBtn = wrapper.find('.nm-canvas__btn--reset')
    await resetBtn.trigger('click')
    const emits = wrapper.emitted('update:modelValue')!
    expect(emits[emits.length - 1][0]).toBe(1)
  })
})
