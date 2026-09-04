import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import DocTocNav from './DocTocNav.vue'
import type { TocNode } from './useMarkdownToc'

function node(id: string, text: string, children: TocNode[] = []): TocNode {
  return { level: 1, text, id, children }
}

const TREE: TocNode[] = [
  node('toc-a', '指南', [node('toc-a-1', '快速开始'), node('toc-a-2', '进阶')]),
  node('toc-b', '参考'),
]

describe('DocTocNav', () => {
  it('framed 模式渲染卡片外壳与目录列表', () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE } })
    expect(wrapper.find('.neumorphism-toc').exists()).toBe(true)
    expect(wrapper.find('.neumorphism-toc-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('指南')
    expect(wrapper.text()).toContain('快速开始')
  })

  it('framed=false 只渲染裸列表（无卡片外壳）', () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE, framed: false } })
    expect(wrapper.find('.neumorphism-toc').exists()).toBe(false)
    expect(wrapper.find('.neumorphism-toc-list').exists()).toBe(true)
  })

  it('点击目录项发出 select', async () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE } })
    await wrapper.find('[data-toc-id="toc-a-1"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['toc-a-1'])
  })

  it('折叠按钮切换子列表显隐', async () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE } })
    expect(wrapper.find('[data-toc-id="toc-a-1"]').exists()).toBe(true)

    await wrapper.find('.toc-toggle').trigger('click')
    expect(wrapper.find('[data-toc-id="toc-a-1"]').exists()).toBe(false)

    await wrapper.find('.toc-toggle').trigger('click')
    expect(wrapper.find('[data-toc-id="toc-a-1"]').exists()).toBe(true)
  })

  it('items 更换时重置折叠状态', async () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE } })
    await wrapper.find('.toc-toggle').trigger('click')
    expect(wrapper.find('[data-toc-id="toc-a-1"]').exists()).toBe(false)

    await wrapper.setProps({
      items: [node('toc-c', '新文档', [node('toc-c-1', '新章节')])],
    })
    expect(wrapper.find('[data-toc-id="toc-c-1"]').exists()).toBe(true)
  })

  it('activeId 指向被折叠的后代时自动展开祖先', async () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE } })
    await wrapper.find('.toc-toggle').trigger('click')
    expect(wrapper.find('[data-toc-id="toc-a-2"]').exists()).toBe(false)

    await wrapper.setProps({ activeId: 'toc-a-2' })
    expect(wrapper.find('[data-toc-id="toc-a-2"]').exists()).toBe(true)
  })

  it('activeId 对应的项带 active 类与 aria-current', async () => {
    const wrapper = mount(DocTocNav, { props: { items: TREE, activeId: 'toc-b' } })
    const item = wrapper.find('[data-toc-id="toc-b"]')
    expect(item.element.closest('.neumorphism-toc-item')?.classList.contains('active')).toBe(true)
    expect(item.attributes('aria-current')).toBe('location')
  })

  it('受控 collapsedGroups：两个实例共享同一份折叠状态', async () => {
    const shared = ref(new Set<string>())
    const a = mount(DocTocNav, {
      props: {
        items: TREE,
        collapsedGroups: shared.value,
        'onUpdate:collapsedGroups': (v: Set<string>) => (shared.value = v),
      },
    })
    const b = mount(DocTocNav, {
      props: {
        items: TREE,
        collapsedGroups: shared.value,
        'onUpdate:collapsedGroups': (v: Set<string>) => (shared.value = v),
      },
    })

    // 实例 A 折叠 → B 同步折叠
    await a.find('.toc-toggle').trigger('click')
    await b.setProps({ collapsedGroups: shared.value })
    expect(b.find('[data-toc-id="toc-a-1"]').exists()).toBe(false)
    expect(b.emitted()).toBeDefined()
  })
})
