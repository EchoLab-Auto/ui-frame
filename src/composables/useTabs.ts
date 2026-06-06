import { computed, type Ref, type ComputedRef } from 'vue'

export interface TabItem {
  key: string
  label: string
  disabled?: boolean
  icon?: string
}

export interface UseTabsOptions {
  /** v-model active tab key */
  modelValue: Ref<string>
  /** Tab items */
  tabs: Ref<TabItem[]> | ComputedRef<TabItem[]>
  /** Tab position (determines arrow key direction) */
  position?: Ref<'top' | 'left' | 'right' | 'bottom'>
}

export interface UseTabsReturn {
  /** Activate a tab by key */
  activate: (key: string) => void
  /** Handle keyboard navigation */
  handleKeydown: (event: KeyboardEvent, currentKey: string) => void
  /** Panel ID for ARIA */
  panelId: ComputedRef<string>
  /** Tab list ID for ARIA */
  tabListId: string
  /** ARIA orientation based on position */
  orientation: ComputedRef<'horizontal' | 'vertical'>
}

/**
 * Headless tabs — encapsulates tab activation and keyboard navigation.
 * Use with your own UI rendering.
 */
export function useTabs(opts: UseTabsOptions): UseTabsReturn {
  const { modelValue, tabs } = opts
  const pos = opts.position

  const tabListId = `nm-tabs-${Math.random().toString(36).slice(2, 9)}`
  const panelId = computed(() => `${tabListId}-panel`)

  const orientation = computed(() => {
    const p = pos?.value
    return p === 'left' || p === 'right' ? 'vertical' : 'horizontal'
  })

  function activate(key: string) {
    const tab = tabs.value.find(t => t.key === key)
    if (tab?.disabled) return
    modelValue.value = key
  }

  function handleKeydown(event: KeyboardEvent, currentKey: string) {
    const activeTabs = tabs.value.filter(t => !t.disabled)
    if (activeTabs.length === 0) return

    const idx = activeTabs.findIndex(t => t.key === currentKey)
    let nextIdx: number

    if (orientation.value === 'vertical') {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        nextIdx = idx + 1 < activeTabs.length ? idx + 1 : 0
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        nextIdx = idx - 1 >= 0 ? idx - 1 : activeTabs.length - 1
      } else {
        return
      }
    } else {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextIdx = idx + 1 < activeTabs.length ? idx + 1 : 0
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        nextIdx = idx - 1 >= 0 ? idx - 1 : activeTabs.length - 1
      } else {
        return
      }
    }

    const nextTab = activeTabs[nextIdx]
    if (nextTab) {
      activate(nextTab.key)
    }
  }

  return {
    activate,
    handleKeydown,
    panelId,
    tabListId,
    orientation,
  }
}
