import { ref } from 'vue'

/**
 * Pre-defined z-index layers (static base values).
 *
 * Each layer's actual rendered z-index is computed as:
 *
 *   For overlay masks (Modal, Drawer):
 *     actualZIndex = Z_LAYERS[layer] + max(0, overlayCount - 1) × Z_STRIDE
 *
 *   For floating elements (dropdown, tooltip, popover, toast):
 *     actualZIndex = Z_LAYERS[layer] + overlayCount × Z_STRIDE
 *
 * The asymmetric offset ensures floating UI rendered inside a Modal / Drawer
 * always stacks **above** the overlay mask, while nested overlays still stack
 * correctly on top of each other.
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
 *   `getZIndex(layer)` to obtain a context-aware z-index that automatically
 *   stacks above any open overlay masks (Modals, Drawers).
 *
 * - **Overlay components** (Modal, Drawer) call `registerOverlay()` when they
 *   open and call the returned cleanup function when they close. The overlay
 *   mask itself receives a z-index that only shifts when nested, keeping the
 *   first overlay at its base level.
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
   * Floating elements (dropdown, tooltip, popover, toast) are offset by
   * `overlayCount × Z_STRIDE` so they always stack above any active overlay
   * masks. Overlay masks themselves use `max(0, overlayCount - 1) × Z_STRIDE`
   * so the first overlay sits at its base value and only nested overlays
   * receive the stride boost.
   *
   * @param layer - The logical layer (e.g. `'dropdown'`, `'overlay'`)
   * @returns The context-aware z-index value
   */
  function getZIndex(layer: ZLayer): number {
    const base = Z_LAYERS[layer]
    if (layer === 'overlay') {
      // Overlay masks: only offset when nested (≥ 2 overlays active).
      return base + Math.max(0, overlayCount.value - 1) * Z_STRIDE
    }
    // Floating elements: always offset by full overlay depth to stay above
    // every active overlay mask.
    return base + overlayCount.value * Z_STRIDE
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
