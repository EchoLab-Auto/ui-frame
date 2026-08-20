import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DocFlowCanvas from './DocFlowCanvas.vue'
import { parseProDocFlow } from './flow-parser'
import type { ProDocFlowGraph } from './types'

function makeGraph(source: string): ProDocFlowGraph {
  return parseProDocFlow(source)
}

describe('DocFlowCanvas', () => {
  it('按图渲染节点与边', () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA --> B{判断}\nB --> C[/圆角/]') },
    })
    expect(wrapper.findAll('.nm-flow__node')).toHaveLength(3)
    expect(wrapper.findAll('.nm-flow__edge')).toHaveLength(2)
    expect(wrapper.find('.nm-flow__node--diamond').exists()).toBe(true)
    expect(wrapper.find('.nm-flow__node--rounded').exists()).toBe(true)
  })

  it('链接节点带 --link 类与跳转图标，点击触发 navigate', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA[首页|/guide/index.md] --> B[普通]') },
    })
    const link = wrapper.find('.nm-flow__node--link')
    expect(link.exists()).toBe(true)
    expect(link.find('.nm-flow__node-link-icon').exists()).toBe(true)
    expect(link.attributes('role')).toBe('link')

    await link.trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['guide/index.md']])
  })

  it('无链接节点点击不触发 navigate', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA[普通] --> B[一般]') },
    })
    await wrapper.find('.nm-flow__node').trigger('click')
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('键盘 Enter/Space 也可触发链接导航', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA[首页|/a.md] --> B') },
    })
    const link = wrapper.find('.nm-flow__node--link')
    await link.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('navigate')).toEqual([['a.md']])
  })

  it('边标签渲染', () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA -->|是| B\nB --> C') },
    })
    const labels = wrapper.findAll('.nm-flow__edge-label')
    expect(labels).toHaveLength(1)
    expect(labels[0].text()).toBe('是')
  })

  it('回边带虚线标记类', () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA --> B --> C --> A') },
    })
    expect(wrapper.find('.nm-flow__edge--back').exists()).toBe(true)
  })

  it('graph 响应式替换后重新渲染', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA --> B') },
    })
    expect(wrapper.findAll('.nm-flow__node')).toHaveLength(2)

    await wrapper.setProps({ graph: makeGraph('graph LR\nA --> B --> C --> D') })
    expect(wrapper.findAll('.nm-flow__node')).toHaveLength(4)
  })

  it('节点带 data-nm-no-pan（避免拖画布误触点击）', () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA[首页|/a.md] --> B') },
    })
    const nodes = wrapper.findAll('.nm-flow__node')
    expect(nodes.every(n => n.attributes('data-nm-no-pan') !== undefined)).toBe(true)
  })

  // ==========================================
  // 可编辑拖拽管线
  // ==========================================

  it('pointerup 提交 nodeMove；pointercancel 丢弃不提交', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA --> B'), editable: true },
    })
    // rAF 在 happy-dom 中可用；用假定时器控制
    const node = wrapper.find('.nm-flow__node')

    // —— 正常拖拽：提交 ——
    await node.trigger('pointerdown', { button: 0, clientX: 100, clientY: 100 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 160, clientY: 140 }))
    await new Promise(resolve => requestAnimationFrame(resolve))
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(wrapper.emitted('nodeMove')).toBeTruthy()

    // —— 取消拖拽：不提交 ——
    const callCount = wrapper.emitted('nodeMove')!.length
    await node.trigger('pointerdown', { button: 0, clientX: 100, clientY: 100 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }))
    await new Promise(resolve => requestAnimationFrame(resolve))
    window.dispatchEvent(new PointerEvent('pointercancel'))
    expect(wrapper.emitted('nodeMove')!).toHaveLength(callCount)
  })

  it('卸载时移除 window 拖拽监听（mid-drag 卸载不泄漏）', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA --> B'), editable: true },
    })
    await wrapper.find('.nm-flow__node').trigger('pointerdown', {
      button: 0,
      clientX: 0,
      clientY: 0,
    })
    wrapper.unmount()
    const removedTypes = removeSpy.mock.calls.map(c => c[0])
    expect(removedTypes).toContain('pointermove')
    expect(removedTypes).toContain('pointerup')
    expect(removedTypes).toContain('pointercancel')
    removeSpy.mockRestore()
  })

  it('箭头 marker id 实例唯一（多画布不共享）', () => {
    const a = mount(DocFlowCanvas, { props: { graph: makeGraph('graph LR\nA --> B') } })
    const b = mount(DocFlowCanvas, { props: { graph: makeGraph('graph LR\nC --> D') } })
    const idA = a.find('marker').attributes('id')
    const idB = b.find('marker').attributes('id')
    expect(idA).toBeTruthy()
    expect(idA).not.toBe(idB)
    expect(a.find('.nm-flow__edge').attributes('marker-end')).toBe(`url(#${idA})`)
  })

  it('拖拽松手在非节点处不吞下一次正常点击', async () => {
    const wrapper = mount(DocFlowCanvas, {
      props: { graph: makeGraph('graph LR\nA[首页|/a.md] --> B'), editable: true },
    })
    const node = wrapper.find('.nm-flow__node')
    await node.trigger('pointerdown', { button: 0, clientX: 100, clientY: 100 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 170, clientY: 170 }))
    await new Promise(resolve => requestAnimationFrame(resolve))
    window.dispatchEvent(new PointerEvent('pointerup'))
    // 配套 click 未落到节点：setTimeout(0) 兜底清除 suppressClick
    await new Promise(resolve => setTimeout(resolve, 5))

    await node.trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['a.md']])
  })
})
