import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTree } from './useTree'

describe('useTree', () => {
  const treeData = [
    {
      key: '1',
      label: 'Node 1',
      children: [
        { key: '1-1', label: 'Node 1-1' },
        { key: '1-2', label: 'Node 1-2' },
      ],
    },
    { key: '2', label: 'Node 2' },
  ]

  it('should toggle expand a node', () => {
    const tree = useTree({ data: ref(treeData) })
    tree.toggleExpand('1')
    expect(tree.localExpandedKeys.value).toContain('1')
    tree.toggleExpand('1')
    expect(tree.localExpandedKeys.value).not.toContain('1')
  })

  it('should select a node (single mode)', () => {
    const tree = useTree({ data: ref(treeData) })
    tree.select('1')
    expect(tree.localSelectedKeys.value).toEqual(['1'])
    tree.select('2')
    expect(tree.localSelectedKeys.value).toEqual(['2'])
  })

  it('should select multiple nodes in multiple mode', () => {
    const tree = useTree({ data: ref(treeData), multiple: ref(true) })
    tree.select('1')
    tree.select('2')
    expect(tree.localSelectedKeys.value).toContain('1')
    expect(tree.localSelectedKeys.value).toContain('2')
  })

  it('should expand all and collapse all', () => {
    const tree = useTree({ data: ref(treeData) })
    tree.expandAll()
    expect(tree.localExpandedKeys.value.length).toBe(4)
    tree.collapseAll()
    expect(tree.localExpandedKeys.value).toHaveLength(0)
  })

  it('should find a node by key', () => {
    const tree = useTree({ data: ref(treeData) })
    const node = tree.findNode(treeData, '1-1')
    expect(node).toBeTruthy()
    expect(node!.key).toBe('1-1')
  })

  it('should find a nested node', () => {
    const tree = useTree({ data: ref(treeData) })
    const node = tree.findNode(treeData, '1-2')
    expect(node).toBeTruthy()
  })

  it('should return null for non-existent key', () => {
    const tree = useTree({ data: ref(treeData) })
    const node = tree.findNode(treeData, 'nonexistent')
    expect(node).toBeNull()
  })

  it('should search and expand matching nodes', () => {
    const tree = useTree({ data: ref(treeData) })
    tree.onSearchInput('1-1')
    expect(tree.localExpandedKeys.value).toContain('1')
  })

  it('should sync selectedKeys back to parent ref', async () => {
    const parentKeys = ref<string[]>([])
    const tree = useTree({ data: ref(treeData), selectedKeys: parentKeys })
    tree.select('1')
    await new Promise(r => setTimeout(r, 0))
    expect(parentKeys.value).toContain('1')
  })
})
