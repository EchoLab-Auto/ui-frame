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

  it('works uncontrolled: zoom text updates without v-model write-back', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const zoomInBtn = wrapper.find('[aria-label*="Zoom in"], [aria-label*="放大"]')
    await zoomInBtn.trigger('click')
    expect(wrapper.find('.nm-canvas__zoom-text').text()).toBe('110%')
  })

  it('renders fit and fullscreen buttons; can be hidden individually', async () => {
    const wrapper = mount(NeumorphismCanvas)
    expect(wrapper.find('[aria-label*="Fit to screen"], [aria-label*="适应屏幕"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[aria-label*="fullscreen"], [aria-label*="全屏"]').exists()).toBe(true)

    const minimal = mount(NeumorphismCanvas, {
      props: { showFit: false, showFullscreen: false },
    })
    expect(minimal.find('[aria-label*="Fit to screen"], [aria-label*="适应屏幕"]').exists()).toBe(
      false
    )
    expect(minimal.find('[aria-label*="fullscreen"], [aria-label*="全屏"]').exists()).toBe(false)
  })

  it('gridVariant=lines uses linear-gradient grid; dots is the default', () => {
    const dots = mount(NeumorphismCanvas)
    expect(dots.find('.nm-canvas__sizer').attributes('style')).toContain('radial-gradient')

    const lines = mount(NeumorphismCanvas, { props: { gridVariant: 'lines' } })
    expect(lines.find('.nm-canvas__sizer').attributes('style')).toContain('linear-gradient')
  })

  it('showGrid=false removes the grid background', () => {
    const wrapper = mount(NeumorphismCanvas, { props: { showGrid: false } })
    expect(wrapper.find('.nm-canvas__sizer').attributes('style') ?? '').not.toContain('gradient')
  })

  it('Ctrl + wheel zooms in and emits the new value', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('wheel', { ctrlKey: true, deltaY: -100, clientX: 10, clientY: 10 })
    const emits = wrapper.emitted('update:modelValue')!
    expect(emits[emits.length - 1][0]).toBeGreaterThan(1)
  })

  it('wheel without Ctrl does not zoom', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('wheel', { deltaY: -100, clientX: 10, clientY: 10 })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keyboard: +/- zooms, 0 resets, arrows pan the viewport', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('keydown', { key: '+' })
    expect(wrapper.find('.nm-canvas__zoom-text').text()).toBe('110%')
    await viewport.trigger('keydown', { key: '0' })
    expect(wrapper.find('.nm-canvas__zoom-text').text()).toBe('100%')

    const el = viewport.element as HTMLElement
    await viewport.trigger('keydown', { key: 'ArrowDown' })
    await viewport.trigger('keydown', { key: 'ArrowRight' })
    expect(el.scrollTop).toBe(60)
    expect(el.scrollLeft).toBe(60)
  })

  it('mouse drag pans the viewport and toggles the panning class', async () => {
    const wrapper = mount(NeumorphismCanvas)
    const viewport = wrapper.find('.nm-canvas__viewport')
    const el = viewport.element as HTMLElement

    await viewport.trigger('pointerdown', {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 1, clientX: 60, clientY: 70 })
    )
    await wrapper.vm.$nextTick()
    expect(el.scrollLeft).toBe(40)
    expect(el.scrollTop).toBe(30)
    expect(viewport.classes()).toContain('nm-canvas__viewport--panning')

    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 1 }))
    await wrapper.vm.$nextTick()
    expect(viewport.classes()).not.toContain('nm-canvas__viewport--panning')
  })

  it('panOnDrag=false disables drag panning', async () => {
    const wrapper = mount(NeumorphismCanvas, { props: { panOnDrag: false } })
    const viewport = wrapper.find('.nm-canvas__viewport')
    const el = viewport.element as HTMLElement

    await viewport.trigger('pointerdown', {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 1, clientX: 60, clientY: 70 })
    )
    await wrapper.vm.$nextTick()
    expect(el.scrollLeft).toBe(0)
    expect(el.scrollTop).toBe(0)
    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 1 }))
  })

  it('exposes zoom/fit/fullscreen methods', () => {
    const wrapper = mount(NeumorphismCanvas)
    const vm = wrapper.vm as unknown as Record<string, unknown>
    expect(typeof vm.zoomIn).toBe('function')
    expect(typeof vm.zoomOut).toBe('function')
    expect(typeof vm.resetZoom).toBe('function')
    expect(typeof vm.fit).toBe('function')
    expect(typeof vm.toggleFullscreen).toBe('function')
  })
})
