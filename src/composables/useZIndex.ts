import { ref } from 'vue'

/**
 * Pre-defined z-index layers (static base values).
 *
 * Each layer's actual rendered z-index is computed as:
 *   actualZIndex = Z_LAYERS[layer] + (active overlay count × Z_STRIDE)
 *
 * This ensures that floating UI rendered inside a Modal / Drawer automatically
 * stacks above the overlay mask, and that nested overlays stack correctly.
 */
export const Z_LAYERS = {
  /** Select / AutoComplete dropdowns, Menu submenus, Chart tooltips */
  dropdown: 100,
  /** Tooltip */
  tooltip: 200,
  /** Popover, Dropdown */
  popover: 300,
  /** Modal mask, Drawer mask */
  overlay: 400,
  /** Toast notification container */
  toast: 500,
} as const

/** Step between nesting levels — large enough to avoid any overlap. */
export const Z_STRIDE = 1000

export type ZLayer = keyof typeof Z_LAYERS

// ---------------------------------------------------------------------------
// Module-level overlay stack (shared across all component instances)
//
// We use a module-level ref rather than provide / inject because many
// floating components teleport their content to <body>, which breaks Vue's
// component-tree-based injection chain.
// ---------------------------------------------------------------------------

const overlayIds: symbol[] = []
const overlayCount = ref(0)

/**
 * Composable for participating in the global z-index layering system.
 *
 * - **Floating components** (Select, Tooltip, Popover, Toast, …) call
 *   `getZIndex(layer)` to obtain a context-aware z-index that accounts for
 *   any open overlays (Modals, Drawers) the component lives inside.
 *
 * - **Overlay components** (Modal, Drawer) call `registerOverlay()` when they
 *   open and call the returned cleanup function when they close.
 *
 * @example
 * ```ts
 * // In a floating component (e.g., Select dropdown)
 * const { getZIndex } = useZIndex()
 * const dropdownZIndex = computed(() => getZIndex('dropdown'))
 *
 * // In an overlay component (e.g., Modal)
 * const { getZIndex, registerOverlay } = useZIndex()
 * onMounted(() => {
 *   const unregister = registerOverlay()
 *   onBeforeUnmount(unregister)
 * })
 * ```
 */
export function useZIndex() {
  /**
   * Compute the actual z-index for a given layer in the current context.
   *
   * @param layer - The logical layer (e.g. `'dropdown'`, `'overlay'`)
   * @returns `Z_LAYERS[layer] + overlayCount × Z_STRIDE`
   */
  function getZIndex(layer: ZLayer): number {
    return Z_LAYERS[layer] + overlayCount.value * Z_STRIDE
  }

  /**
   * Register the calling component as an active overlay.
   *
   * Must be paired with a call to the returned cleanup function when the
   * overlay closes (typically in `onBeforeUnmount` or a watcher teardown).
   *
   * @returns A zero-argument cleanup function that unregisters this overlay.
   */
  function registerOverlay(): () => void {
    const id = Symbol('nm-overlay')
    overlayIds.push(id)
    overlayCount.value = overlayIds.length
    return () => {
      const idx = overlayIds.indexOf(id)
      if (idx !== -1) {
        overlayIds.splice(idx, 1)
        overlayCount.value = overlayIds.length
      }
    }
  }

  return {
    getZIndex,
    registerOverlay,
    /** Reactive count of currently-active overlays (read-only for debugging). */
    overlayCount,
  }
}
