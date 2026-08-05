import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import DocViewer from './DocViewer.vue'
import { buildDocTree } from './parser'
import {
  createResizeObserverMock,
  createIntersectionObserverMock,
} from '@/__test-utils__/test-helpers'

const files: Record<string, string> = {
  'index.md': '---\ntitle: 首页\norder: 1\n---\n# 首页',
  'guide/index.md':
    '---\ntitle: 指南\norder: 2\n---\n# 指南\n\n```prodoc-flow\ngraph LR\nStart[首页|/index.md] --> Quick[快速|/guide/getting-started.md]\n```',
  'guide/getting-started.md': '---\ntitle: 快速入门\norder: 1\n---\n# 快速入门',
  'api/index.md': '---\ntitle: API\norder: 3\n---\n# API',
  'api/rest.md': '---\ntitle: REST\norder: 1\n---\n# REST',
}

describe('DocViewer 画布视图', () => {
  const root = buildDocTree(files)
  const originalIO = globalThis.IntersectionObserver
  const originalRO = globalThis.ResizeObserver

  beforeEach(() => {
    const io = createIntersectionObserverMock()
    const ro = createResizeObserverMock()
    globalThis.IntersectionObserver =
      io.IntersectionObserver as unknown as typeof IntersectionObserver
    globalThis.ResizeObserver = ro.ResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO
    globalThis.ResizeObserver = originalRO
    document.body.innerHTML = ''
  })

  function mountViewer(initialPath?: string) {
    return mount(DocViewer, { props: { root, initialPath } })
  }

  it('渲染视图切换按钮', () => {
    const wrapper = mountViewer('index.md')
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.length).toBe(2)
    expect(tabs[0].text()).toContain('文档')
    expect(tabs[1].text()).toContain('画布')
  })

  it('叶子文档的画布入口禁用；含流程文档的入口可用', () => {
    const leaf = mountViewer('guide/getting-started.md')
    const leafCanvasBtn = leaf.findAll('[role="tab"]')[1]
    expect(leafCanvasBtn.attributes('disabled')).toBeDefined()

    const withFlow = mountViewer('guide/index.md')
    const flowCanvasBtn = withFlow.findAll('[role="tab"]')[1]
    expect(flowCanvasBtn.attributes('disabled')).toBeUndefined()
  })

  it('无流程但有子级的文档也可用画布（层级地图）', async () => {
    const wrapper = mountViewer('api/index.md')
    // api/index.md 无 flow 块，但有子文档 api/rest.md → 层级地图
    const canvasBtn = wrapper.findAll('[role="tab"]')[1]
    expect(canvasBtn.attributes('disabled')).toBeUndefined()

    await canvasBtn.trigger('click')
    await nextTick()
    // 层级地图：API 根卡片 + REST 子卡片
    expect(wrapper.find('.nm-flow').exists()).toBe(true)
    expect(wrapper.text()).toContain('REST')
  })

  it('切到画布视图渲染流程画布', async () => {
    const wrapper = mountViewer('guide/index.md')
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.nm-flow').exists()).toBe(true)
    expect(wrapper.find('.markdown-body').exists() || wrapper.find('.nm-flow').exists()).toBe(true)
  })

  it('画布钻取：点链接节点选中目标文档；目标为叶子时落回文档视图', async () => {
    const wrapper = mountViewer('guide/index.md')
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await nextTick()

    // 流程中"快速"节点链接 guide/getting-started.md（叶子）→ 跳转后回文档视图
    const link = wrapper.findAll('.nm-flow__node--link').find(n => n.text().includes('快速'))
    expect(link).toBeDefined()
    await link!.trigger('click')
    await nextTick()

    expect(wrapper.emitted('docLink')).toEqual([['guide/getting-started.md']])
    // 落回文档视图：正文渲染出"快速入门"
    await nextTick()
    expect(wrapper.text()).toContain('快速入门')
    // 且画布按钮此时已禁用（叶子）
    expect(wrapper.findAll('[role="tab"]')[1].attributes('disabled')).toBeDefined()
  })
})
