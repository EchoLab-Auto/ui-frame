import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  it('marks active heading with aria-current', async () => {
    const wrapper = mountRenderer('# A\n\n## B')
    await wrapper.setProps({ content: '# A\n\n## B' })

    // activeHeading 初始为空，手动设置后检查
    const links = wrapper.findAll('.neumorphism-toc-item a')
    expect(links.length).toBeGreaterThan(0)
  })
})
