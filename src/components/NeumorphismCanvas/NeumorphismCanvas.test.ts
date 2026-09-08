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

describe('NeumorphismCanvas (infinite mode)', () => {
  interface ViewState {
    panX: number
    panY: number
    zoom: number
  }
  const getView = (wrapper: ReturnType<typeof mount>) =>
    (wrapper.vm as unknown as { getView: () => ViewState }).getView()

  it('renders no sizer and positions content via translate + scale', () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    expect(wrapper.find('.nm-canvas__sizer').exists()).toBe(false)
    const content = wrapper.find('.nm-canvas__content')
    expect(content.attributes('style')).toContain('translate(0px, 0px) scale(1)')
    expect(wrapper.find('.nm-canvas__viewport').classes()).toContain(
      'nm-canvas__viewport--infinite'
    )
  })

  it('mouse drag pans the unbounded canvas (content follows the pointer)', async () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    const viewport = wrapper.find('.nm-canvas__viewport')

    await viewport.trigger('pointerdown', {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 1, clientX: 40, clientY: 30 })
    )
    await wrapper.vm.$nextTick()
    expect(getView(wrapper)).toEqual({ panX: -60, panY: -70, zoom: 1 })
    expect(viewport.classes()).toContain('nm-canvas__viewport--panning')

    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 1 }))
    await wrapper.vm.$nextTick()
    expect(viewport.classes()).not.toContain('nm-canvas__viewport--panning')
    const style = wrapper.find('.nm-canvas__content').attributes('style') ?? ''
    expect(style).toContain('translate(-60px, -70px)')
  })

  it('touch drag pans in infinite mode (pointer events instead of native scroll)', async () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('pointerdown', {
      button: 0,
      pointerId: 7,
      pointerType: 'touch',
      clientX: 50,
      clientY: 50,
    })
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 7, clientX: 70, clientY: 90 })
    )
    await wrapper.vm.$nextTick()
    expect(getView(wrapper).panX).toBe(20)
    expect(getView(wrapper).panY).toBe(40)
    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 7 }))
  })

  it('plain wheel pans; Ctrl + wheel zooms around the cursor', async () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('wheel', { deltaX: 30, deltaY: 120 })
    expect(getView(wrapper).panX).toBe(-30)
    expect(getView(wrapper).panY).toBe(-120)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await viewport.trigger('wheel', { ctrlKey: true, deltaY: -100, clientX: 0, clientY: 0 })
    const emits = wrapper.emitted('update:modelValue')!
    expect(emits[emits.length - 1][0]).toBeGreaterThan(1)
  })

  it('keyboard arrows pan and 0 resets the view', async () => {
    const wrapper = mount(NeumorphismCanvas, {
      props: { infinite: true, contentBounds: { x: 0, y: 0, w: 200, h: 100 } },
    })
    const viewport = wrapper.find('.nm-canvas__viewport')
    await viewport.trigger('keydown', { key: 'ArrowDown' })
    await viewport.trigger('keydown', { key: 'ArrowRight' })
    expect(getView(wrapper).panX).toBe(-60)
    expect(getView(wrapper).panY).toBe(-60)

    // 0 = resetView → 回到 contentBounds 的适配视图（happy-dom 视口为 0，缩放到下限 0.1）
    await viewport.trigger('keydown', { key: '0' })
    const view = getView(wrapper)
    expect(view.zoom).toBe(0.1)
    expect(view.panX).toBe(-10)
    expect(view.panY).toBe(-5)
  })

  it('resetView/fit center negative-coordinate contentBounds', () => {
    const wrapper = mount(NeumorphismCanvas, {
      props: { infinite: true, contentBounds: { x: -100, y: -50, w: 400, h: 300 } },
    })
    const vm = wrapper.vm as unknown as { resetView: () => void }
    vm.resetView()
    const view = getView(wrapper)
    expect(view.zoom).toBe(0.1)
    // panX = (0 − 400×0.1)/2 − (−100)×0.1 = −10；panY = (0 − 300×0.1)/2 − (−50)×0.1 = −10
    expect(view.panX).toBe(-10)
    expect(view.panY).toBe(-10)
  })

  it('panBy translates the view imperatively (edge auto-pan support)', () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    const vm = wrapper.vm as unknown as { panBy: (dx: number, dy: number) => void }
    vm.panBy(-14, 7)
    vm.panBy(-14, 7)
    expect(getView(wrapper).panX).toBe(-28)
    expect(getView(wrapper).panY).toBe(14)
  })

  it('reset button resets the view (not just zoom) in infinite mode', async () => {
    const wrapper = mount(NeumorphismCanvas, {
      props: { infinite: true, contentBounds: { x: 0, y: 0, w: 100, h: 100 } },
    })
    const vm = wrapper.vm as unknown as { panBy: (dx: number, dy: number) => void }
    vm.panBy(-500, -500)
    const resetBtn = wrapper.find('.nm-canvas__btn--reset')
    expect(resetBtn.attributes('aria-label')).toMatch(/复位视图|Reset view/)
    await resetBtn.trigger('click')
    const view = getView(wrapper)
    expect(view.panX).toBe(-5)
    expect(view.panY).toBe(-5)
    expect(view.zoom).toBe(0.1)
  })

  it('exposes infinite-mode view methods', () => {
    const wrapper = mount(NeumorphismCanvas, { props: { infinite: true } })
    const vm = wrapper.vm as unknown as Record<string, unknown>
    expect(typeof vm.resetView).toBe('function')
    expect(typeof vm.panBy).toBe('function')
    expect(typeof vm.getView).toBe('function')
    expect(typeof vm.toCanvasCoords).toBe('function')
    expect(typeof vm.getViewportRect).toBe('function')
  })
})
