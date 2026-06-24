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

  describe('keyboard navigation', () => {
    function keydown(key: string) {
      return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    }

    it('ArrowDown focuses next visible node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.handleKeydown(keydown('ArrowDown'))
      expect(tree.focusedKey.value).toBe('1')
      tree.handleKeydown(keydown('ArrowDown'))
      expect(tree.focusedKey.value).toBe('1-1')
    })

    it('ArrowUp focuses previous visible node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.focusedKey.value = '1-2'
      tree.handleKeydown(keydown('ArrowUp'))
      expect(tree.focusedKey.value).toBe('1-1')
    })

    it('ArrowRight expands focused parent and moves to first child', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.focusedKey.value = '1'
      tree.handleKeydown(keydown('ArrowRight'))
      expect(tree.localExpandedKeys.value).toContain('1')
      expect(tree.focusedKey.value).toBe('1-1')
    })

    it('ArrowLeft collapses expanded node or moves to parent', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.focusedKey.value = '1-1'
      tree.handleKeydown(keydown('ArrowLeft'))
      expect(tree.focusedKey.value).toBe('1')
      expect(tree.localExpandedKeys.value).toContain('1')

      tree.focusedKey.value = '1'
      tree.handleKeydown(keydown('ArrowLeft'))
      expect(tree.localExpandedKeys.value).not.toContain('1')
    })

    it('Enter selects focused node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.focusedKey.value = '2'
      tree.handleKeydown(keydown('Enter'))
      expect(tree.localSelectedKeys.value).toEqual(['2'])
    })

    it('Home focuses first visible node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.focusedKey.value = '2'
      tree.handleKeydown(keydown('Home'))
      expect(tree.focusedKey.value).toBe('1')
    })

    it('End focuses last visible node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.focusedKey.value = '1'
      tree.handleKeydown(keydown('End'))
      expect(tree.focusedKey.value).toBe('2')
    })

    it('typeahead jumps to matching node', () => {
      const tree = useTree({ data: ref(treeData) })
      tree.expandAll()
      tree.handleKeydown(new KeyboardEvent('keydown', { key: 'N', bubbles: true }))
      tree.handleKeydown(new KeyboardEvent('keydown', { key: 'o', bubbles: true }))
      tree.handleKeydown(new KeyboardEvent('keydown', { key: 'd', bubbles: true }))
      tree.handleKeydown(new KeyboardEvent('keydown', { key: 'e', bubbles: true }))
      expect(tree.focusedKey.value).toBe('2')
    })
  })
})
