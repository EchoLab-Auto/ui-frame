import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'

export interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[]
  divided?: boolean
}

export interface UseMenuOptions {
  /** Flat or nested menu items */
  items: Ref<MenuItem[]> | ComputedRef<MenuItem[]>
  /** Layout direction */
  mode?: Ref<'vertical' | 'horizontal'>
  /** Initial active key (controlled: pass a Ref) */
  activeKey?: Ref<string | null>
  /** Initial expanded submenu keys (controlled: pass a Ref) */
  expandedKeys?: Ref<string[]>
  /** Called when an item is selected */
  onSelect?: (item: MenuItem) => void
  /** Whether the menu is disabled entirely */
  disabled?: Ref<boolean>
}

export interface UseMenuReturn {
  /** Currently active (focused/highlighted) key */
  activeKey: Ref<string | null>
  /** Currently expanded submenu keys */
  expandedKeys: Ref<string[]>
  /** All leaf keys in the menu tree */
  allKeys: ComputedRef<string[]>
  /** Handle keyboard events */
  handleKeydown: (event: KeyboardEvent) => void
  /** Handle item click */
  handleItemClick: (item: MenuItem) => void
  /** Handle item hover/focus (used in horizontal mode) */
  handleItemEnter: (item: MenuItem) => void
  /** Handle item leave (used in horizontal mode for submenus) */
  handleItemLeave: (item: MenuItem) => void
  /** Check if a key is currently expanded */
  isExpanded: (key: string) => boolean
  /** Check if a key is the active one */
  isActive: (key: string) => boolean
  /** Expand a submenu */
  expand: (key: string) => void
  /** Collapse a submenu */
  collapse: (key: string) => void
  /** Toggle a submenu */
  toggleExpand: (key: string) => void
}

// ---- Internal helpers ----

function flattenVisible(
  nodes: MenuItem[],
  expandedKeys: string[],
  result: MenuItem[] = []
): MenuItem[] {
  for (const n of nodes) {
    result.push(n)
    if (n.children?.length && expandedKeys.includes(n.key)) {
      flattenVisible(n.children, expandedKeys, result)
    }
  }
  return result
}

function collectAllKeys(nodes: MenuItem[]): string[] {
  const keys: string[] = []
  function walk(list: MenuItem[]) {
    for (const n of list) {
      keys.push(n.key)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

function findNode(nodes: MenuItem[], key: string): MenuItem | null {
  for (const n of nodes) {
    if (n.key === key) return n
    if (n.children?.length) {
      const found = findNode(n.children, key)
      if (found) return found
    }
  }
  return null
}

function buildParentMap(
  nodes: MenuItem[],
  parent: string | null = null,
  map: Map<string, string | null> = new Map()
): Map<string, string | null> {
  for (const n of nodes) {
    map.set(n.key, parent)
    if (n.children?.length) buildParentMap(n.children, n.key, map)
  }
  return map
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Headless menu — encapsulates active-item tracking, keyboard navigation,
 * submenu expansion, typeahead search, and mode-aware arrow key behaviour.
 */
export function useMenu(opts: UseMenuOptions): UseMenuReturn {
  const { items, onSelect } = opts
  const mode = opts.mode ?? ref('vertical')
  const disabled = opts.disabled ?? ref(false)

  const _activeKey = ref<string | null>(null)
  const _expandedKeys = ref<string[]>([])

  // ----- Controlled sync (activeKey) -----
  let syncingActive = false
  if (opts.activeKey) {
    watch(
      () => opts.activeKey!.value,
      val => {
        if (syncingActive) return
        if (_activeKey.value === val) return
        syncingActive = true
        _activeKey.value = val
        nextTick(() => {
          syncingActive = false
        })
      },
      { immediate: true }
    )
    watch(
      () => _activeKey.value,
      val => {
        if (syncingActive) return
        if (opts.activeKey!.value === val) return
        syncingActive = true
        opts.activeKey!.value = val
        nextTick(() => {
          syncingActive = false
        })
      }
    )
  }

  // ----- Controlled sync (expandedKeys) -----
  let syncingExpanded = false
  if (opts.expandedKeys) {
    watch(
      () => opts.expandedKeys!.value,
      val => {
        if (syncingExpanded) return
        if (arraysEqual(_expandedKeys.value, val)) return
        syncingExpanded = true
        _expandedKeys.value = [...val]
        nextTick(() => {
          syncingExpanded = false
        })
      },
      { immediate: true, deep: true }
    )
    watch(
      () => _expandedKeys.value,
      val => {
        if (syncingExpanded) return
        if (arraysEqual(opts.expandedKeys!.value, val)) return
        syncingExpanded = true
        opts.expandedKeys!.value = [...val]
        nextTick(() => {
          syncingExpanded = false
        })
      },
      { deep: true }
    )
  }

  const allKeys = computed(() => collectAllKeys(items.value))
  const visibleNodes = computed(() => flattenVisible(items.value, _expandedKeys.value))
  const parentMap = computed(() => buildParentMap(items.value))
  const enabledVisibleNodes = computed(() => visibleNodes.value.filter(n => !n.disabled))

  // ---- Public methods ----

  function isExpanded(key: string): boolean {
    return _expandedKeys.value.includes(key)
  }

  function isActive(key: string): boolean {
    return _activeKey.value === key
  }

  function expand(key: string) {
    if (!_expandedKeys.value.includes(key)) {
      _expandedKeys.value.push(key)
    }
  }

  function collapse(key: string) {
    const idx = _expandedKeys.value.indexOf(key)
    if (idx !== -1) _expandedKeys.value.splice(idx, 1)
  }

  function toggleExpand(key: string) {
    if (isExpanded(key)) {
      collapse(key)
    } else {
      expand(key)
    }
  }

  function handleItemClick(item: MenuItem) {
    if (disabled.value || item.disabled) return

    if (item.children?.length) {
      toggleExpand(item.key)
    } else {
      _activeKey.value = item.key
      onSelect?.(item)
    }
  }

  function handleItemEnter(item: MenuItem) {
    if (disabled.value || item.disabled) return

    // In horizontal mode, hovering opens submenus
    if (mode.value === 'horizontal' && item.children?.length) {
      expand(item.key)
    }

    _activeKey.value = item.key
  }

  function handleItemLeave(item: MenuItem) {
    if (disabled.value || item.disabled) return

    // In horizontal mode, leaving may collapse submenus
    // The component handles timing; here we just reset active if it matches
    if (mode.value === 'horizontal' && item.children?.length) {
      // Do not collapse immediately — component handles delay
    }
  }

  // ---- Keyboard navigation ----

  // Typeahead
  let typeaheadBuffer = ''
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

  function appendTypeahead(char: string) {
    typeaheadBuffer += char.toLowerCase()
    if (typeaheadTimer) clearTimeout(typeaheadTimer)
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer = ''
    }, 500)

    const nodes = enabledVisibleNodes.value
    const startIndex = _activeKey.value ? nodes.findIndex(n => n.key === _activeKey.value) + 1 : 0
    const searchList = [...nodes.slice(startIndex), ...nodes.slice(0, startIndex)]
    const match = searchList.find(n => n.label.toLowerCase().startsWith(typeaheadBuffer))
    if (match) {
      _activeKey.value = match.key
    }
  }

  function focusNext() {
    const nodes = enabledVisibleNodes.value
    if (!nodes.length) return
    if (!_activeKey.value) {
      _activeKey.value = nodes[0].key
      return
    }
    const idx = nodes.findIndex(n => n.key === _activeKey.value)
    if (idx >= 0 && idx < nodes.length - 1) {
      _activeKey.value = nodes[idx + 1].key
    } else {
      _activeKey.value = nodes[0].key
    }
  }

  function focusPrev() {
    const nodes = enabledVisibleNodes.value
    if (!nodes.length) return
    if (!_activeKey.value) {
      _activeKey.value = nodes[nodes.length - 1].key
      return
    }
    const idx = nodes.findIndex(n => n.key === _activeKey.value)
    if (idx > 0) {
      _activeKey.value = nodes[idx - 1].key
    } else {
      _activeKey.value = nodes[nodes.length - 1].key
    }
  }

  function focusFirst() {
    const nodes = enabledVisibleNodes.value
    if (nodes.length) _activeKey.value = nodes[0].key
  }

  function focusLast() {
    const nodes = enabledVisibleNodes.value
    if (nodes.length) _activeKey.value = nodes[nodes.length - 1].key
  }

  function focusParent() {
    if (!_activeKey.value) return
    const parent = parentMap.value.get(_activeKey.value)
    if (parent) _activeKey.value = parent
  }

  function focusFirstChild() {
    if (!_activeKey.value) return
    const node = findNode(items.value, _activeKey.value)
    if (node?.children?.length) {
      if (!isExpanded(node.key)) expand(node.key)
      _activeKey.value = node.children[0].key
    }
  }

  function collapseOrFocusParent() {
    if (!_activeKey.value) return
    const node = findNode(items.value, _activeKey.value)
    if (node?.children?.length && isExpanded(node.key)) {
      collapse(node.key)
    } else {
      focusParent()
    }
  }

  function activateAndSelect() {
    if (!_activeKey.value) return
    const node = findNode(items.value, _activeKey.value)
    if (!node || node.disabled) return
    if (node.children?.length) {
      toggleExpand(node.key)
    } else {
      onSelect?.(node)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled.value) return

    const key = event.key
    const isPrintable = key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey

    if (isPrintable) {
      appendTypeahead(key)
      event.preventDefault()
      return
    }

    const isVertical = mode.value === 'vertical'
    const isHorizontal = mode.value === 'horizontal'

    switch (key) {
      case 'ArrowDown':
        if (isVertical) {
          focusNext()
        } else if (isHorizontal) {
          focusFirstChild()
        }
        event.preventDefault()
        break

      case 'ArrowUp':
        if (isVertical) {
          focusPrev()
        } else if (isHorizontal) {
          collapseOrFocusParent()
        }
        event.preventDefault()
        break

      case 'ArrowRight':
        if (isVertical) {
          focusFirstChild()
        } else if (isHorizontal) {
          focusNext()
        }
        event.preventDefault()
        break

      case 'ArrowLeft':
        if (isVertical) {
          collapseOrFocusParent()
        } else if (isHorizontal) {
          focusPrev()
        }
        event.preventDefault()
        break

      case 'Enter':
      case ' ':
        activateAndSelect()
        event.preventDefault()
        break

      case 'Escape':
        _expandedKeys.value = []
        _activeKey.value = null
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

      default:
        break
    }
  }

  return {
    activeKey: _activeKey,
    expandedKeys: _expandedKeys,
    allKeys,
    handleKeydown,
    handleItemClick,
    handleItemEnter,
    handleItemLeave,
    isExpanded,
    isActive,
    expand,
    collapse,
    toggleExpand,
  }
}
