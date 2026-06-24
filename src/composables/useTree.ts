import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'

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
  /** Currently focused key for keyboard navigation */
  focusedKey: Ref<string | null>
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
  /** Handle keyboard navigation events */
  handleKeydown: (event: KeyboardEvent) => void
}

/** 浅比较两个字符串数组是否相等 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
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
  const searchLower = search.toLowerCase()

  function walk(list: TreeNodeData[]): boolean {
    let hasMatch = false
    for (const n of list) {
      const labelMatch = n.label.toLowerCase().includes(searchLower)
      let childMatch = false
      if (n.children?.length) {
        childMatch = walk(n.children)
      }
      if (labelMatch || childMatch) {
        keys.push(n.key)
        hasMatch = true
      }
    }
    return hasMatch
  }

  walk(nodes)
  return keys
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

function buildVisibleNodes(
  nodes: TreeNodeData[],
  expandedKeys: string[],
  result: TreeNodeData[] = []
): TreeNodeData[] {
  for (const n of nodes) {
    result.push(n)
    if (n.children?.length && expandedKeys.includes(n.key)) {
      buildVisibleNodes(n.children, expandedKeys, result)
    }
  }
  return result
}

function buildParentMap(
  nodes: TreeNodeData[],
  parent: string | null = null,
  map: Map<string, string | null> = new Map()
): Map<string, string | null> {
  for (const n of nodes) {
    map.set(n.key, parent)
    if (n.children?.length) buildParentMap(n.children, n.key, map)
  }
  return map
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
  const focusedKey = ref<string | null>(null)

  // ==========================================
  // 安全的双向同步 — 使用 syncFlag 打破循环
  // ==========================================
  let syncing = false

  function syncFromExternal(external: Ref<string[]> | undefined, local: Ref<string[]>) {
    if (!external) return
    watch(
      () => external.value,
      val => {
        if (syncing) return
        const next = [...val]
        if (arraysEqual(local.value, next)) return
        syncing = true
        local.value = next
        nextTick(() => {
          syncing = false
        })
      },
      { immediate: true, deep: true }
    )
  }

  function syncToExternal(local: Ref<string[]>, external: Ref<string[]> | undefined) {
    if (!external) return
    watch(
      () => local.value,
      val => {
        if (syncing) return
        const next = [...val]
        if (arraysEqual(external.value, next)) return
        syncing = true
        external.value = next
        nextTick(() => {
          syncing = false
        })
      },
      { deep: true }
    )
  }

  syncFromExternal(opts.selectedKeys, localSelectedKeys)
  syncFromExternal(opts.expandedKeys, localExpandedKeys)
  syncToExternal(localSelectedKeys, opts.selectedKeys)
  syncToExternal(localExpandedKeys, opts.expandedKeys)

  const allKeys = computed(() => collectAllKeys(data.value))
  const visibleNodes = computed(() => buildVisibleNodes(data.value, localExpandedKeys.value))
  const parentMap = computed(() => buildParentMap(data.value))

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

  // ==========================================
  // Keyboard navigation
  // ==========================================
  let typeaheadBuffer = ''
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

  function appendTypeahead(char: string) {
    typeaheadBuffer += char.toLowerCase()
    if (typeaheadTimer) clearTimeout(typeaheadTimer)
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer = ''
    }, 500)

    const nodes = visibleNodes.value
    const startIndex = focusedKey.value ? nodes.findIndex(n => n.key === focusedKey.value) + 1 : 0
    const searchList = [...nodes.slice(startIndex), ...nodes.slice(0, startIndex)]
    const match = searchList.find(n => n.label.toLowerCase().startsWith(typeaheadBuffer))
    if (match) {
      focusedKey.value = match.key
    }
  }

  function focusNext() {
    const nodes = visibleNodes.value
    if (!nodes.length) return
    if (!focusedKey.value) {
      focusedKey.value = nodes[0].key
      return
    }
    const idx = nodes.findIndex(n => n.key === focusedKey.value)
    if (idx >= 0 && idx < nodes.length - 1) {
      focusedKey.value = nodes[idx + 1].key
    }
  }

  function focusPrev() {
    const nodes = visibleNodes.value
    if (!nodes.length) return
    if (!focusedKey.value) {
      focusedKey.value = nodes[nodes.length - 1].key
      return
    }
    const idx = nodes.findIndex(n => n.key === focusedKey.value)
    if (idx > 0) {
      focusedKey.value = nodes[idx - 1].key
    }
  }

  function focusFirst() {
    const nodes = visibleNodes.value
    if (nodes.length) focusedKey.value = nodes[0].key
  }

  function focusLast() {
    const nodes = visibleNodes.value
    if (nodes.length) focusedKey.value = nodes[nodes.length - 1].key
  }

  function focusParent() {
    if (!focusedKey.value) return
    const parent = parentMap.value.get(focusedKey.value)
    if (parent) focusedKey.value = parent
  }

  function focusFirstChild() {
    if (!focusedKey.value) return
    const node = findNodeInTree(data.value, focusedKey.value)
    if (node?.children?.length) {
      if (!localExpandedKeys.value.includes(node.key)) {
        toggleExpand(node.key)
      }
      focusedKey.value = node.children[0].key
    }
  }

  function collapseOrFocusParent() {
    if (!focusedKey.value) return
    const node = findNodeInTree(data.value, focusedKey.value)
    if (node?.children?.length && localExpandedKeys.value.includes(node.key)) {
      toggleExpand(node.key)
    } else {
      focusParent()
    }
  }

  function toggleFocused() {
    if (!focusedKey.value) return
    const node = findNodeInTree(data.value, focusedKey.value)
    if (node?.children?.length) {
      toggleExpand(node.key)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    const key = event.key
    const isPrintable = key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey

    if (isPrintable) {
      appendTypeahead(key)
      event.preventDefault()
      return
    }

    switch (key) {
      case 'ArrowDown':
        focusNext()
        event.preventDefault()
        break
      case 'ArrowUp':
        focusPrev()
        event.preventDefault()
        break
      case 'ArrowRight':
        focusFirstChild()
        event.preventDefault()
        break
      case 'ArrowLeft':
        collapseOrFocusParent()
        event.preventDefault()
        break
      case 'Enter':
      case ' ':
        if (focusedKey.value) select(focusedKey.value)
        event.preventDefault()
        break
      case 'Home':
        focusFirst()
        event.preventDefault()
        break
      case 'End':
        focusLast()
        event.preventDefault()
        break
      case '*':
        toggleFocused()
        event.preventDefault()
        break
      default:
        break
    }
  }

  return {
    localExpandedKeys,
    localSelectedKeys,
    allKeys,
    searchText,
    focusedKey,
    toggleExpand,
    select,
    findNode: findNodeInTree,
    expandAll,
    collapseAll,
    onSearchInput,
    handleKeydown,
  }
}
