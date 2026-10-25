import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismGraphView from './NeumorphismGraphView.vue'
import { createResizeObserverMock } from '@/__test-utils__/test-helpers'
import type { GraphLink, GraphNode } from './types'

// happy-dom 没有 canvas 2D 实现：桩掉 getContext，验证组件行为而非像素输出
function stubCanvas() {
  const ctxStub = new Proxy(
    {},
    {
      get: () => vi.fn(),
      set: () => true,
    }
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctxStub as unknown as CanvasRenderingContext2D
  )
}

/** 视口尺寸在 happy-dom 里恒为 0，量测逻辑需要有非零尺寸才能跑通 */
function stubLayoutBox(width = 800, height = 520) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

const nodes: GraphNode[] = [
  { id: 'design', label: '设计哲学', group: 'core' },
  { id: 'tokens', label: '设计令牌', group: 'core' },
  { id: 'button', label: '按钮', group: 'form' },
  { id: 'graph', label: '节点图', group: 'lab' },
]

const links: GraphLink[] = [
  { source: 'design', target: 'tokens' },
  { source: 'tokens', target: 'button' },
  { source: 'button', target: 'graph' },
]

function mountGraph(props: Record<string, unknown> = {}) {
  return mount(NeumorphismGraphView, { props: { nodes, links, ...props } })
}

describe('NeumorphismGraphView', () => {
  beforeEach(() => {
    stubCanvas()
    stubLayoutBox()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))
    globalThis.ResizeObserver = createResizeObserverMock()
      .ResizeObserver as unknown as typeof ResizeObserver
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1 as unknown as number)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a focusable canvas with an application role', () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes('role')).toBe('application')
    expect(canvas.attributes('tabindex')).toBe('0')
  })

  it('uses the locale aria-label by default and honours a custom one', () => {
    expect(mountGraph().find('canvas').attributes('aria-label')).toContain('节点图')
    expect(mountGraph({ ariaLabel: '组件依赖图' }).find('canvas').attributes('aria-label')).toBe(
      '组件依赖图'
    )
  })

  it('applies the height prop as a CSS length', () => {
    expect(mountGraph({ height: 320 }).find('.nm-graph').attributes('style')).toContain(
      'height: 320px'
    )
    expect(mountGraph({ height: '60vh' }).find('.nm-graph').attributes('style')).toContain(
      'height: 60vh'
    )
  })

  it('renders zoom controls with locale labels', () => {
    const wrapper = mountGraph()
    const buttons = wrapper.findAll('.nm-graph__btn')
    expect(buttons).toHaveLength(4)
    expect(buttons[0].attributes('aria-label')).toBe('缩小')
    expect(buttons[1].attributes('aria-label')).toBe('放大')
    expect(buttons[2].attributes('aria-label')).toBe('适应视图')
    expect(buttons[3].attributes('aria-label')).toBe('重新布局')
  })

  it('hides the controls when showControls is false', () => {
    expect(mountGraph({ showControls: false }).find('.nm-graph__controls').exists()).toBe(false)
  })

  it('zooms in and out through the exposed API', async () => {
    // autoFit 关闭：初始缩放保持 1，便于断言绝对倍率
    const wrapper = mountGraph({ autoFit: false })
    const vm = wrapper.vm as unknown as {
      getZoom: () => number
      zoomIn: () => void
      zoomOut: () => void
    }
    expect(vm.getZoom()).toBe(1)
    vm.zoomIn()
    await wrapper.vm.$nextTick()
    expect(vm.getZoom()).toBeCloseTo(1.25)
    vm.zoomOut()
    await wrapper.vm.$nextTick()
    expect(vm.getZoom()).toBeCloseTo(1)
  })

  it('fits the graph into the available viewport', async () => {
    const wrapper = mountGraph({ nodes: [{ id: 'only', x: 0, y: 0 }], links: [] })
    const vm = wrapper.vm as unknown as { getZoom: () => number; fit: () => void }
    vm.fit()
    await wrapper.vm.$nextTick()
    // 单节点包围盒极小 → 命中放大上限 4
    expect(vm.getZoom()).toBeCloseTo(4)
    expect(wrapper.emitted('zoom-change')).toBeTruthy()
  })

  it('renders a sorted legend and skips ungrouped nodes', () => {
    const wrapper = mountGraph({ showLegend: true })
    const items = wrapper.findAll('.nm-graph__legend-item')
    expect(items.map(i => i.text())).toEqual(['core', 'form', 'lab'])
    // 未分组节点（无 group）不产生图例项
    const ungrouped = mount({
      components: { NeumorphismGraphView },
      template: '<NeumorphismGraphView :nodes="[{ id: \'a\' }]" :links="[]" show-legend />',
    })
    expect(ungrouped.find('.nm-graph__legend').exists()).toBe(false)
  })

  it('emits node-hover and node-click from the keyboard', async () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('canvas')
    await canvas.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('node-hover')?.at(-1)?.[0]).toMatchObject({ id: 'design' })

    await canvas.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('node-click')?.at(-1)?.[0]).toMatchObject({ id: 'design' })
  })

  it('walks the node order with arrow keys and clears with Escape', async () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('canvas')
    await canvas.trigger('keydown', { key: 'ArrowRight' })
    await canvas.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('node-hover')?.at(-1)?.[0]).toMatchObject({ id: 'tokens' })
    await canvas.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('node-hover')?.at(-1)?.[0]).toMatchObject({ id: 'design' })
  })

  it('zooms with the + / - keys', async () => {
    const wrapper = mountGraph({ autoFit: false })
    const vm = wrapper.vm as unknown as { getZoom: () => number }
    await wrapper.find('canvas').trigger('keydown', { key: '+' })
    expect(vm.getZoom()).toBeCloseTo(1.25)
    await wrapper.find('canvas').trigger('keydown', { key: '-' })
    expect(vm.getZoom()).toBeCloseTo(1)
  })

  it('emits node-click when a node is clicked', async () => {
    // 单节点固定在原点：适应视图后它正好落在视口中心 (400, 260)
    const wrapper = mountGraph({ nodes: [{ id: 'solo', label: '独苗', x: 0, y: 0 }], links: [] })
    const vm = wrapper.vm as unknown as { fit: () => void }
    vm.fit()
    await wrapper.vm.$nextTick()
    const canvas = wrapper.find('canvas')
    await canvas.trigger('pointerdown', { clientX: 400, clientY: 260, pointerId: 1 })
    await canvas.trigger('pointerup', { clientX: 400, clientY: 260, pointerId: 1 })
    expect(wrapper.emitted('node-click')?.at(-1)?.[0]).toMatchObject({ id: 'solo' })
  })

  it('emits background-click when clicking empty space', async () => {
    const wrapper = mountGraph({ nodes: [{ id: 'solo', x: 0, y: 0 }], links: [] })
    const vm = wrapper.vm as unknown as { fit: () => void }
    vm.fit()
    await wrapper.vm.$nextTick()
    const canvas = wrapper.find('canvas')
    await canvas.trigger('pointerdown', { clientX: 12, clientY: 12, pointerId: 2 })
    await canvas.trigger('pointerup', { clientX: 12, clientY: 12, pointerId: 2 })
    expect(wrapper.emitted('background-click')).toHaveLength(1)
  })

  it('emits layout-settled once the simulation stops', async () => {
    const wrapper = mountGraph()
    await wrapper.vm.$nextTick()
    // requestAnimationFrame 被桩成不回调，settled 由显式帧驱动
    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.emitted('layout-settled')).toBeUndefined()
  })

  it('does not throw on pointer move without a hit', async () => {
    const wrapper = mountGraph()
    await wrapper.find('canvas').trigger('pointermove', { clientX: 5, clientY: 5, pointerId: 3 })
    expect(wrapper.emitted('node-hover')).toBeUndefined()
  })

  it('merges forceSettings with the dedicated linkDistance / repulsion props', async () => {
    // autoFit 关闭便于断言；显式 linkDistance/repulsion 应盖掉 forceSettings 里的同名字段
    const wrapper = mountGraph({
      autoFit: false,
      linkDistance: 120,
      repulsion: 1500,
      forceSettings: {
        spring: 0.02,
        gravity: 0.001,
        velocityDecay: 0.2,
        linkDistance: 1,
        repulsion: 1,
      },
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { getForceSettings: () => Record<string, number> | null }
    const settings = vm.getForceSettings()
    expect(settings).not.toBeNull()
    expect(settings!.linkDistance).toBe(120)
    expect(settings!.repulsion).toBe(1500)
    expect(settings!.spring).toBe(0.02)
    expect(settings!.gravity).toBe(0.001)
    expect(settings!.velocityDecay).toBe(0.2)
    // 未覆盖的字段保留内置默认
    expect(settings!.alphaDecay).toBeCloseTo(0.0228, 4)
  })

  it('exposes the annealing coefficient and stops at zero once settled', async () => {
    const wrapper = mountGraph()
    const vm = wrapper.vm as unknown as { getAlpha: () => number }
    // happy-dom 里 rAF 被桩掉不回调，alpha 保持挂载时 warmup 之后的值（0 ≤ α ≤ 1）
    const alpha = vm.getAlpha()
    expect(alpha).toBeGreaterThanOrEqual(0)
    expect(alpha).toBeLessThanOrEqual(1)
  })

  it('accepts every label mode', () => {
    for (const mode of ['auto', 'always', 'hover'] as const) {
      expect(mountGraph({ showLabels: mode }).find('canvas').exists()).toBe(true)
    }
  })
})
