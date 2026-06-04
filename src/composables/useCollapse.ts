import { type Ref } from 'vue'

export interface CollapseItem {
  key: string
  title: string
  disabled?: boolean
}

export interface UseCollapseOptions {
  /** v-model active keys */
  modelValue: Ref<string[]>
  /** Collapse items */
  items: Ref<CollapseItem[]>
  /** Whether accordion mode (only one panel open at a time) */
  accordion?: Ref<boolean>
}

export interface UseCollapseReturn {
  /** Toggle a panel by key */
  toggle: (key: string) => void
  /** Check if a panel is active */
  isActive: (key: string) => boolean
}

/**
 * Headless collapse/accordion — encapsulates panel toggle logic.
 * Use with your own UI rendering.
 */
export function useCollapse(opts: UseCollapseOptions): UseCollapseReturn {
  const { modelValue, items } = opts
  const accordion = opts.accordion

  function toggle(key: string) {
    const item = items.value.find((i) => i.key === key)
    if (item?.disabled) return

    const keys = [...modelValue.value]
    const idx = keys.indexOf(key)
    if (idx >= 0) {
      keys.splice(idx, 1)
    } else {
      if (accordion?.value) {
        modelValue.value = [key]
        return
      }
      keys.push(key)
    }
    modelValue.value = keys
  }

  function isActive(key: string): boolean {
    return modelValue.value.includes(key)
  }

  return { toggle, isActive }
}
