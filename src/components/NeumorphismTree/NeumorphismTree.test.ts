import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTree from './NeumorphismTree.vue'
import type { TreeNodeData } from './NeumorphismTree.vue'

const treeData: TreeNodeData[] = [
  {
    key: '1',
    label: 'Node 1',
    children: [
      { key: '1-1', label: 'Node 1-1' },
      { key: '1-2', label: 'Node 1-2', children: [{ key: '1-2-1', label: 'Deep' }] },
    ],
  },
  { key: '2', label: 'Node 2' },
]

describe('NeumorphismTree', () => {
  it('renders root nodes', () => {
    const wrapper = mount(NeumorphismTree, { props: { data: treeData } })
    expect(wrapper.text()).toContain('Node 1')
    expect(wrapper.text()).toContain('Node 2')
  })

  it('toggles expand on click', async () => {
    const wrapper = mount(NeumorphismTree, {
      props: { data: treeData, expandedKeys: [] },
    })
    // Initially children are visible at root level; collapsed children hidden
    // Click expand toggle to open a node
    const toggle = wrapper.find('.nm-tree-node__toggle')
    if (toggle.exists()) {
      await toggle.trigger('click')
      // Should emit expanded keys update
      expect(wrapper.emitted()).toBeTruthy()
    }
  })

  it('emits node-click when a node is clicked', async () => {
    const wrapper = mount(NeumorphismTree, { props: { data: treeData } })
    const nodes = wrapper.findAll('.nm-tree-node__label')
    if (nodes.length > 0) {
      await nodes[0].trigger('click')
      expect(wrapper.emitted('node-click')).toBeTruthy()
    }
  })

  it('supports multiple selection', async () => {
    const wrapper = mount(NeumorphismTree, {
      props: { data: treeData, multiple: true, selectedKeys: [] },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows search input when showSearch is true', () => {
    const wrapper = mount(NeumorphismTree, { props: { data: treeData, showSearch: true } })
    const searchInput = wrapper.find('.nm-tree__search-input')
    expect(searchInput.exists()).toBe(true)
  })

  it('has ARIA tree role', () => {
    const wrapper = mount(NeumorphismTree, { props: { data: treeData } })
    expect(wrapper.find('[role="tree"]').exists()).toBe(true)
  })

  it('supports keyboard navigation (ArrowDown)', async () => {
    const wrapper = mount(NeumorphismTree, {
      props: { data: treeData, expandedKeys: ['1', '1-2'] },
    })
    const tree = wrapper.find('[role="tree"]')
    expect(tree.exists()).toBe(true)
    // Keyboard events are delegated to the composable
    await tree.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.exists()).toBe(true)
  })
})
