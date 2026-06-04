import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface TreeNodeData {
  key: string
  label: string
  children?: TreeNodeData[]
  disabled?: boolean
  [k: string]: unknown
}

export interface UseTreeOptions {
  /** Tree data */
  data: Ref<TreeNodeData[]> | ComputedRef<TreeNodeData[]>
  /** v-model selected keys */
  selectedKeys?: Ref<string[]>
  /** v-model expanded keys */
  expandedKeys?: Ref<string[]>
  /** Whether multiple selection is allowed */
  multiple?: Ref<boolean>
}

export interface UseTreeReturn {
  /** Local expanded keys */
  localExpandedKeys: Ref<string[]>
  /** Local selected keys */
  localSelectedKeys: Ref<string[]>
  /** All node keys in the tree */
  allKeys: ComputedRef<string[]>
  /** Search text for filtering */
  searchText: Ref<string>
  /** Toggle expand/collapse of a node */
  toggleExpand: (key: string) => void
  /** Select a node */
  select: (key: string) => void
  /** Find a node by key */
  findNode: (nodes: TreeNodeData[], key: string) => TreeNodeData | null
  /** Expand all nodes */
  expandAll: () => void
  /** Collapse all nodes */
  collapseAll: () => void
  /** Handle search input — auto-expands matching nodes */
  onSearchInput: (value: string) => void
}

function collectAllKeys(nodes: TreeNodeData[]): string[] {
  const keys: string[] = []
  function walk(list: TreeNodeData[]) {
    for (const n of list) {
      keys.push(n.key)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

function expandMatching(nodes: TreeNodeData[], search: string): string[] {
  const keys: string[] = []
  function walk(list: TreeNodeData[]) {
    for (const n of list) {
      if (
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.children?.some((c) => matchesAny(c, search))
      ) {
        keys.push(n.key)
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

function matchesAny(node: TreeNodeData, search: string): boolean {
  if (node.label.toLowerCase().includes(search)) return true
  return node.children?.some((c) => matchesAny(c, search)) ?? false
}

function findNodeInTree(nodes: TreeNodeData[], key: string): TreeNodeData | null {
  for (const n of nodes) {
    if (n.key === key) return n
    if (n.children?.length) {
      const found = findNodeInTree(n.children, key)
      if (found) return found
    }
  }
  return null
}

/**
 * Headless tree — encapsulates expand/collapse, selection, search, and
 * node lookup without any rendering. Use with your own UI.
 */
export function useTree(opts: UseTreeOptions): UseTreeReturn {
  const { data } = opts
  const multiple = opts.multiple ?? ref(false)

  const localExpandedKeys = ref<string[]>([...(opts.expandedKeys?.value ?? [])])
  const localSelectedKeys = ref<string[]>([...(opts.selectedKeys?.value ?? [])])
  const searchText = ref('')

  const allKeys = computed(() => collectAllKeys(data.value))

  function toggleExpand(key: string) {
    const idx = localExpandedKeys.value.indexOf(key)
    if (idx === -1) {
      localExpandedKeys.value.push(key)
    } else {
      localExpandedKeys.value.splice(idx, 1)
    }
  }

  function select(key: string) {
    if (multiple.value) {
      const idx = localSelectedKeys.value.indexOf(key)
      if (idx === -1) {
        localSelectedKeys.value.push(key)
      } else {
        localSelectedKeys.value.splice(idx, 1)
      }
    } else {
      localSelectedKeys.value = [key]
    }
  }

  function expandAll() {
    localExpandedKeys.value = [...allKeys.value]
  }

  function collapseAll() {
    localExpandedKeys.value = []
  }

  function onSearchInput(value: string) {
    searchText.value = value
    if (value.trim()) {
      const matching = expandMatching(data.value, value)
      localExpandedKeys.value = [...new Set([...localExpandedKeys.value, ...matching])]
    }
  }

  return {
    localExpandedKeys,
    localSelectedKeys,
    allKeys,
    searchText,
    toggleExpand,
    select,
    findNode: findNodeInTree,
    expandAll,
    collapseAll,
    onSearchInput,
  }
}
