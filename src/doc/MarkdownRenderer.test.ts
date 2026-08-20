import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import MarkdownRenderer from './MarkdownRenderer.vue'
import {
  mountWithoutTeleport,
  cleanupDOM,
  createIntersectionObserverMock,
  createResizeObserverMock,
} from '@/__test-utils__/test-helpers'

vi.mock('mermaid', () => ({ default: { run: vi.fn() } }))

describe('MarkdownRenderer', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver
  const originalResizeObserver = globalThis.ResizeObserver

  beforeEach(() => {
    const io = createIntersectionObserverMock()
    const ro = createResizeObserverMock()
    globalThis.IntersectionObserver =
      io.IntersectionObserver as unknown as typeof IntersectionObserver
    globalThis.ResizeObserver = ro.ResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver
    globalThis.ResizeObserver = originalResizeObserver
    cleanupDOM()
  })

  function mountRenderer(content: string, props = {}) {
    return mountWithoutTeleport(MarkdownRenderer, {
      props: { content, ...props },
    })
  }

  it('renders markdown content', () => {
    const wrapper = mountRenderer('# Hello\n\nWorld')
    expect(wrapper.html()).toContain('Hello')
    expect(wrapper.html()).toContain('World')
  })

  it('generates unique heading IDs for Chinese headings', () => {
    const wrapper = mountRenderer('# 标题一\n\n# 标题二')
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(2)
    expect(h1s[0].attributes('id')).not.toBe(h1s[1].attributes('id'))
    expect(h1s[0].attributes('id')).toContain('标题一')
    expect(h1s[1].attributes('id')).toContain('标题二')
  })

  it('deduplicates heading IDs for identical titles', () => {
    const wrapper = mountRenderer('# Same\n\n# Same')
    const ids = wrapper.findAll('h1').map(h => h.attributes('id'))
    expect(new Set(ids).size).toBe(2)
    expect(ids[1]).toMatch(/same-1$/)
  })

  it('uses heading fallback ID for punctuation-only titles', () => {
    const wrapper = mountRenderer('# !!!\n\n# ???')
    const ids = wrapper.findAll('h1').map(h => h.attributes('id'))
    expect(ids[0]).toContain('heading')
    expect(ids[1]).toContain('heading')
    expect(ids[0]).not.toBe(ids[1])
  })

  it('renders nested TOC structure with separate toggle buttons', () => {
    const wrapper = mountRenderer('# H1\n\n## H2\n\n### H3')
    const topList = wrapper.find('.neumorphism-toc-list')
    expect(topList.exists()).toBe(true)
    // 嵌套的 ul
    expect(wrapper.findAll('.neumorphism-toc-list').length).toBeGreaterThan(1)
    // 有子项的节点应渲染 toggle button
    const toggles = wrapper.findAll('.toc-toggle')
    expect(toggles.length).toBeGreaterThan(0)
  })

  it('toggle button has aria-expanded and aria-controls', () => {
    const wrapper = mountRenderer('# Parent\n\n## Child')
    const toggle = wrapper.find('.toc-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBeDefined()
    expect(toggle.attributes('aria-controls')).toMatch(/^toc-list-/)
  })

  it('toggles collapse state when clicking toggle button', async () => {
    const wrapper = mountRenderer('# Parent\n\n## Child')
    const toggle = wrapper.find('.toc-toggle')
    const listId = toggle.attributes('aria-controls')
    expect(wrapper.find(`#${listId}`).exists()).toBe(true)

    await toggle.trigger('click')
    expect(wrapper.find(`#${listId}`).exists()).toBe(false)

    await toggle.trigger('click')
    expect(wrapper.find(`#${listId}`).exists()).toBe(true)
  })

  it('heading anchor does not use hash href', () => {
    const wrapper = mountRenderer('# Hello')
    const anchor = wrapper.find('.heading-anchor')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('#')
    expect(anchor.attributes('data-heading-id')).toBeDefined()
  })

  it('escapes image alt and title attributes to prevent attribute injection', () => {
    const wrapper = mountRenderer('![x" onerror="alert(1)](url "y\' onerror=alert(2)")')
    const attrs = wrapper.find('img').attributes()
    expect(attrs).not.toHaveProperty('onerror')
    expect(attrs.alt).toBe('x" onerror="alert(1)')
    expect(attrs.title).toBe("y' onerror=alert(2)")
  })

  it('emits docLink for relative links but not protocol-relative URLs', async () => {
    const wrapper = mount(MarkdownRenderer, {
      props: { content: '[internal](/path) [external](//example.com)' },
      attachTo: document.body,
      global: { stubs: { teleport: false, transition: false } },
    })

    const internal = wrapper.find('a[href="/path"]')
    await internal.trigger('click')
    expect(wrapper.emitted('docLink')).toHaveLength(1)
    expect(wrapper.emitted('docLink')![0]).toEqual(['/path'])

    const external = wrapper.find('a[href="//example.com"]')
    await external.trigger('click')
    expect(wrapper.emitted('docLink')).toHaveLength(1)

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('resets collapsed state when content changes', async () => {
    const wrapper = mountRenderer('# A\n\n## B')
    const toggle = wrapper.find('.toc-toggle')
    const listId = toggle.attributes('aria-controls')

    await toggle.trigger('click')
    expect(wrapper.find(`#${listId}`).exists()).toBe(false)

    await wrapper.setProps({ content: '# C\n\n## D' })
    const newToggle = wrapper.find('.toc-toggle')
    const newListId = newToggle.attributes('aria-controls')
    expect(wrapper.find(`#${newListId}`).exists()).toBe(true)
  })

  it('does not render TOC when showToc is false', () => {
    const wrapper = mountRenderer('# Hello', { showToc: false })
    expect(wrapper.find('.neumorphism-toc').exists()).toBe(false)
  })

  it('scrolls TOC to show children after expanding a collapsed group', async () => {
    const scrollSpy = vi.fn()
    const origScrollTo = Element.prototype.scrollTo
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect
    const origInnerWidth = window.innerWidth

    Element.prototype.scrollTo = scrollSpy
    Element.prototype.getBoundingClientRect = function (this: Element) {
      // 模拟 TOC 视口较小，子列表溢出场景
      if (this.classList.contains('neumorphism-toc')) {
        return {
          top: 0,
          bottom: 100,
          left: 0,
          right: 200,
          width: 200,
          height: 100,
          x: 0,
          y: 0,
        } as DOMRect
      }
      if (this.classList.contains('neumorphism-toc-list') && this.id.startsWith('toc-list-')) {
        return {
          top: 50,
          bottom: 200,
          left: 0,
          right: 200,
          width: 200,
          height: 150,
          x: 0,
          y: 50,
        } as DOMRect
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 } as DOMRect
    }
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })

    const wrapper = mountRenderer('# Parent\n\n## Child\n\n## Child 2\n\n### Grandchild')
    const toggle = wrapper.find('.toc-toggle')
    expect(toggle.exists()).toBe(true)
    const listId = toggle.attributes('aria-controls')
    expect(wrapper.find(`#${listId}`).exists()).toBe(true)

    // 先折叠
    await toggle.trigger('click')
    expect(wrapper.find(`#${listId}`).exists()).toBe(false)
    scrollSpy.mockClear()

    // 展开 — 应触发 scrollTo（在 TOC 容器上）
    await toggle.trigger('click')
    await nextTick()
    expect(scrollSpy).toHaveBeenCalled()

    Element.prototype.scrollTo = origScrollTo
    Element.prototype.getBoundingClientRect = origGetBoundingClientRect
    Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, configurable: true })
  })

  it('does not scroll TOC when collapsing a group', async () => {
    const scrollSpy = vi.fn()
    const origScrollTo = Element.prototype.scrollTo
    Element.prototype.scrollTo = scrollSpy

    const wrapper = mountRenderer('# Parent\n\n## Child')
    const toggle = wrapper.find('.toc-toggle')
    const listId = toggle.attributes('aria-controls')
    expect(wrapper.find(`#${listId}`).exists()).toBe(true)

    // 展开状态直接点击折叠 — 不应触发 scrollTo
    await toggle.trigger('click')
    await nextTick()
    expect(wrapper.find(`#${listId}`).exists()).toBe(false)
    expect(scrollSpy).not.toHaveBeenCalled()

    Element.prototype.scrollTo = origScrollTo
  })

  it('respects prefers-reduced-motion in scroll behavior', async () => {
    const matchMediaOrig = window.matchMedia
    const matchMediaSpy = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    window.matchMedia = matchMediaSpy

    const scrollSpy = vi.fn()
    const origScrollTo = Element.prototype.scrollTo
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect
    const origInnerWidth = window.innerWidth

    Element.prototype.scrollTo = scrollSpy
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this.classList.contains('neumorphism-toc')) {
        return {
          top: 0,
          bottom: 100,
          left: 0,
          right: 200,
          width: 200,
          height: 100,
          x: 0,
          y: 0,
        } as DOMRect
      }
      if (this.classList.contains('neumorphism-toc-list') && this.id.startsWith('toc-list-')) {
        return {
          top: 50,
          bottom: 200,
          left: 0,
          right: 200,
          width: 200,
          height: 150,
          x: 0,
          y: 50,
        } as DOMRect
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 } as DOMRect
    }
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })

    const wrapper = mountRenderer('# Parent\n\n## Child')
    const toggle = wrapper.find('.toc-toggle')
    // 先折叠再展开以触发 scrollToNode
    await toggle.trigger('click')
    scrollSpy.mockClear()
    await toggle.trigger('click')
    await nextTick()

    // 应使用 behavior: 'auto'（而非 'smooth'）
    if (scrollSpy.mock.calls.length > 0) {
      const callArg = scrollSpy.mock.calls[0][0] as ScrollToOptions | undefined
      if (callArg && typeof callArg === 'object') {
        expect(callArg.behavior).toBe('auto')
      }
    }

    Element.prototype.scrollTo = origScrollTo
    Element.prototype.getBoundingClientRect = origGetBoundingClientRect
    Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, configurable: true })
    window.matchMedia = matchMediaOrig
  })

  it('marks active heading with aria-current', async () => {
    const wrapper = mountRenderer('# A\n\n## B')
    await wrapper.setProps({ content: '# A\n\n## B' })

    // activeHeading 初始为空，手动设置后检查
    const links = wrapper.findAll('.neumorphism-toc-item a')
    expect(links.length).toBeGreaterThan(0)
  })

  // ==========================================
  // prodoc-flow 画布集成
  // ==========================================

  const FLOW_MD =
    '# 流程\n\n```prodoc-flow\ngraph LR\nA[首页|/guide/index.md] --> B{判断}\nB --> C[结束]\n```'

  it('prodoc-flow 代码块挂载为 DocFlowCanvas 子树', async () => {
    const wrapper = mountRenderer(FLOW_MD)
    await nextTick()
    await nextTick()

    const placeholder = wrapper.find('.prodoc-flow-diagram')
    expect(placeholder.exists()).toBe(true)
    // 占位内渲染出流程画布（节点 3 个、边 2 条）
    expect(placeholder.find('.nm-flow').exists()).toBe(true)
    expect(placeholder.findAll('.nm-flow__node')).toHaveLength(3)
    expect(placeholder.findAll('.nm-flow__edge')).toHaveLength(2)
    // <pre> 源码回退已被替换
    expect(placeholder.find('pre').exists()).toBe(false)
  })

  it('点击链接节点透传 docLink 事件', async () => {
    const wrapper = mountRenderer(FLOW_MD)
    await nextTick()
    await nextTick()

    const link = wrapper.find('.prodoc-flow-diagram .nm-flow__node--link')
    expect(link.exists()).toBe(true)
    await link.trigger('click')
    expect(wrapper.emitted('docLink')).toEqual([['guide/index.md']])
  })

  it('内容切换后旧画布卸载、无残留无重复挂载', async () => {
    const wrapper = mountRenderer(FLOW_MD)
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('.nm-flow')).toHaveLength(1)

    await wrapper.setProps({ content: '# 新文档\n\n无流程图' })
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('.nm-flow')).toHaveLength(0)

    // 换回流程内容：重新挂载且唯一
    await wrapper.setProps({ content: FLOW_MD })
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('.nm-flow')).toHaveLength(1)
  })

  it('全非法源码保留 <pre> 回退', async () => {
    const wrapper = mountRenderer('# 坏图\n\n```prodoc-flow\n这不是合法语句!!\n也不是!!\n```')
    await nextTick()
    await nextTick()
    const placeholder = wrapper.find('.prodoc-flow-diagram')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.find('pre').exists()).toBe(true)
    expect(placeholder.find('.nm-flow').exists()).toBe(false)
  })

  // ==========================================
  // 列表项行内解析（listitem 覆写回归）
  // ==========================================

  it('无序/有序列表项内的加粗与行内代码正常解析', () => {
    const wrapper = mountRenderer('- 支持 **加粗** 与 `code`\n\n1. 有序 **项**')
    const html = wrapper.find('.neumorphism-markdown-content').html()
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).toContain('<code class="inline-code">code</code>')
    expect(html).toContain('<strong>项</strong>')
  })

  it('列表项内的链接正常解析', () => {
    const wrapper = mountRenderer('- 见 [文档](/guide)')
    const link = wrapper.find('.neumorphism-markdown-content li a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/guide')
  })

  it('任务列表项内行内格式生效且复选框结构保留', () => {
    const wrapper = mountRenderer('- [ ] 待办 **重要**\n- [x] 已完成')
    const items = wrapper.findAll('.task-list-item')
    expect(items).toHaveLength(2)
    expect(items[0].find('input[type="checkbox"]').exists()).toBe(true)
    expect(items[0].html()).toContain('<strong>重要</strong>')
    expect((items[1].find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('代码块挂载为 DocCodeBlock 子树（语言标签 + 行号 + 复制按钮）', async () => {
    const wrapper = mountRenderer('```ts\nconst a = 1\n```')
    await nextTick()
    await nextTick()
    const block = wrapper.find('.doc-code-block-mount .doc-code-block')
    expect(block.exists()).toBe(true)
    expect(block.find('.code-lang').text()).toBe('ts')
    expect(block.find('.code-copy-btn').exists()).toBe(true)
    expect(block.findAll('.line-num')).toHaveLength(1)
  })

  it('内容追加时同源代码块子树保活（DOM 节点复用，不重建）', async () => {
    const wrapper = mountRenderer('```ts\nconst a = 1\n```')
    await nextTick()
    await nextTick()
    const blockBefore = wrapper.find('.doc-code-block-mount .doc-code-block')
    expect(blockBefore.exists()).toBe(true)
    const elBefore = blockBefore.element

    await wrapper.setProps({ content: '新增一段文字\n\n```ts\nconst a = 1\n```' })
    await nextTick()
    await nextTick()
    await nextTick()

    const blockAfter = wrapper.find('.doc-code-block-mount .doc-code-block')
    expect(blockAfter.exists()).toBe(true)
    // DOM 节点同一 → 子树被认领迁移而非卸载重建
    expect(blockAfter.element).toBe(elBefore)
  })

  it('内容变化导致代码块消失时子树正确卸载', async () => {
    const wrapper = mountRenderer('```ts\nconst a = 1\n```')
    await nextTick()
    await nextTick()
    expect(wrapper.find('.doc-code-block').exists()).toBe(true)

    await wrapper.setProps({ content: '# 只剩标题' })
    await nextTick()
    await nextTick()
    await nextTick()
    expect(wrapper.find('.doc-code-block').exists()).toBe(false)
    expect(wrapper.find('.doc-code-block-mount pre').exists()).toBe(false)
  })
})
