import { describe, it, expect, vi, afterEach } from 'vitest'
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

  it('emits change once per keyboard interaction', () => {
    const wrapper = mount(NeumorphismSlider, {
      props: { modelValue: 50, min: 0, max: 100, step: 10 },
    })
    wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([60])
    expect(wrapper.emitted('change')).toEqual([[60]])
  })

  describe('drag interaction', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    function mountWithRail(width = 200) {
      const wrapper = mount(NeumorphismSlider, {
        props: { modelValue: 0, min: 0, max: 100 },
        attachTo: document.body,
      })
      const rail = wrapper.find('.nm-slider__rail')
      const el = rail.element as HTMLElement
      el.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: width,
          bottom: 8,
          width,
          height: 8,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
      // happy-dom 未实现指针捕获，桩掉即可（组件只调用，不读取结果）
      el.setPointerCapture = () => {}
      el.releasePointerCapture = () => {}
      return { wrapper, rail }
    }

    function stubManualRaf() {
      const queue: FrameRequestCallback[] = []
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        queue.push(cb)
        return queue.length
      })
      vi.stubGlobal('cancelAnimationFrame', () => {
        queue.length = 0
      })
      return queue
    }

    it('updates continuously during drag, coalesces moves per frame, fires change once on release', async () => {
      const rafQueue = stubManualRaf()
      const { wrapper, rail } = mountWithRail(200)

      await rail.trigger('pointerdown', { clientX: 20, clientY: 4 })
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10])

      // Two moves before the next frame — only the latest may apply, once.
      await rail.trigger('pointermove', { clientX: 100, clientY: 4 })
      await rail.trigger('pointermove', { clientX: 160, clientY: 4 })
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
      expect(rafQueue).toHaveLength(1)

      rafQueue.shift()?.(0)
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([80])

      await rail.trigger('pointerup', { clientX: 180, clientY: 4 })
      expect(wrapper.emitted('update:modelValue')?.[2]).toEqual([90])
      expect(wrapper.emitted('change')).toEqual([[90]])
    })

    it('ignores pointermove when not dragging', async () => {
      const { wrapper, rail } = mountWithRail(200)
      await rail.trigger('pointermove', { clientX: 100, clientY: 4 })
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('does not start dragging when disabled', async () => {
      const wrapper = mount(NeumorphismSlider, {
        props: { modelValue: 0, min: 0, max: 100, disabled: true },
      })
      await wrapper.find('.nm-slider__rail').trigger('pointerdown', { clientX: 100, clientY: 4 })
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
      expect(wrapper.classes()).not.toContain('nm-slider--dragging')
    })
  })
})
