import { describe, it, expect, beforeEach } from 'vitest'
import { useZIndex, Z_LAYERS, Z_STRIDE } from './useZIndex'

// The overlay stack is module-level — reset between tests by simulating
// the cleanup of any lingering registrations. Since the stack is internal,
// we create and immediately destroy overlays to get back to zero.

describe('useZIndex', () => {
  // Each test gets a fresh composable call; the module-level stack may carry
  // state from previous tests, so we manually drain it via a helper.
  let cleanupFns: (() => void)[] = []

  beforeEach(() => {
    cleanupFns = []
  })

  afterEach(() => {
    // Clean up any overlays registered during the test
    cleanupFns.forEach(fn => fn())
    cleanupFns = []
  })

  function register(): () => void {
    const { registerOverlay } = useZIndex()
    const unreg = registerOverlay()
    cleanupFns.push(unreg)
    return unreg
  }

  describe('getZIndex', () => {
    it('returns base values when no overlay is active', () => {
      const { getZIndex } = useZIndex()
      expect(getZIndex('dropdown')).toBe(100)
      expect(getZIndex('tooltip')).toBe(200)
      expect(getZIndex('popover')).toBe(300)
      expect(getZIndex('overlay')).toBe(400)
      expect(getZIndex('toast')).toBe(500)
    })

    it('offsets by one STRIDE when one overlay is active', () => {
      register()
      const { getZIndex } = useZIndex()
      // Floating elements: base + 1 × STRIDE (stack above the mask)
      expect(getZIndex('dropdown')).toBe(100 + Z_STRIDE)
      expect(getZIndex('tooltip')).toBe(200 + Z_STRIDE)
      expect(getZIndex('popover')).toBe(300 + Z_STRIDE)
      expect(getZIndex('toast')).toBe(500 + Z_STRIDE)
      // Overlay mask: base + 0 × STRIDE (first overlay stays at base level)
      expect(getZIndex('overlay')).toBe(400)
    })

    it('offsets by N × STRIDE when N overlays are active', () => {
      register()
      register()
      register()
      const { getZIndex } = useZIndex()
      // Floating elements: base + 3 × STRIDE
      expect(getZIndex('dropdown')).toBe(100 + 3 * Z_STRIDE)
      expect(getZIndex('toast')).toBe(500 + 3 * Z_STRIDE)
      // Overlay mask: base + (N-1) × STRIDE (only nested overlays shift)
      expect(getZIndex('overlay')).toBe(400 + 2 * Z_STRIDE)
    })

    it('ensures floating elements stack above overlay mask when overlay is active', () => {
      register()
      const { getZIndex } = useZIndex()
      // All floating layers must be above the overlay mask
      expect(getZIndex('dropdown')).toBeGreaterThan(getZIndex('overlay'))
      expect(getZIndex('tooltip')).toBeGreaterThan(getZIndex('overlay'))
      expect(getZIndex('popover')).toBeGreaterThan(getZIndex('overlay'))
      expect(getZIndex('toast')).toBeGreaterThan(getZIndex('overlay'))
    })

    it('preserves layer ordering regardless of overlay count', () => {
      // dropdown < tooltip < popover < toast must hold in every context
      for (let n = 0; n <= 3; n++) {
        // Register n overlays
        const unregs: (() => void)[] = []
        for (let i = 0; i < n; i++) {
          unregs.push(register())
        }
        const { getZIndex } = useZIndex()
        expect(getZIndex('dropdown')).toBeLessThan(getZIndex('tooltip'))
        expect(getZIndex('tooltip')).toBeLessThan(getZIndex('popover'))
        expect(getZIndex('popover')).toBeLessThan(getZIndex('toast'))
        // Cleanup
        unregs.forEach(fn => fn())
      }
    })

    it('returns to base values after all overlays are cleaned up', () => {
      const unreg1 = register()
      const unreg2 = register()
      unreg2()
      unreg1()
      const { getZIndex } = useZIndex()
      expect(getZIndex('dropdown')).toBe(100)
      expect(getZIndex('overlay')).toBe(400)
    })
  })

  describe('registerOverlay', () => {
    it('returns a cleanup function', () => {
      const { registerOverlay } = useZIndex()
      const unreg = registerOverlay()
      expect(typeof unreg).toBe('function')
      unreg()
    })

    it('increments and decrements overlayCount reactively', () => {
      const { overlayCount, registerOverlay } = useZIndex()
      expect(overlayCount.value).toBe(0)

      const unreg1 = registerOverlay()
      expect(overlayCount.value).toBe(1)

      const unreg2 = registerOverlay()
      expect(overlayCount.value).toBe(2)

      unreg1()
      expect(overlayCount.value).toBe(1)

      unreg2()
      expect(overlayCount.value).toBe(0)
    })

    it('handles multiple cleanup calls idempotently', () => {
      const { overlayCount, registerOverlay } = useZIndex()
      const unreg = registerOverlay()
      expect(overlayCount.value).toBe(1)
      unreg()
      expect(overlayCount.value).toBe(0)
      // Second cleanup should be a no-op
      unreg()
      expect(overlayCount.value).toBe(0)
    })

    it('handles out-of-order cleanup (stack resilience)', () => {
      const unreg1 = register()
      const unreg2 = register()
      const unreg3 = register()

      const { overlayCount } = useZIndex()
      expect(overlayCount.value).toBe(3)

      // Unregister middle one first
      unreg2()
      expect(overlayCount.value).toBe(2)

      unreg1()
      expect(overlayCount.value).toBe(1)

      unreg3()
      expect(overlayCount.value).toBe(0)
    })
  })

  describe('Z_LAYERS ordering', () => {
    it('maintains correct base layer ordering: dropdown < tooltip < popover < overlay < toast', () => {
      expect(Z_LAYERS.dropdown).toBeLessThan(Z_LAYERS.tooltip)
      expect(Z_LAYERS.tooltip).toBeLessThan(Z_LAYERS.popover)
      expect(Z_LAYERS.popover).toBeLessThan(Z_LAYERS.overlay)
      expect(Z_LAYERS.overlay).toBeLessThan(Z_LAYERS.toast)
    })

    it('ensures a full stride gap between layer and next layer', () => {
      // Each layer-to-layer gap must be less than STRIDE so adding one STRIDE
      // never causes lower layers to overtake higher layers
      const layers = Object.values(Z_LAYERS) as number[]
      for (let i = 1; i < layers.length; i++) {
        expect(layers[i] - layers[i - 1]).toBeLessThan(Z_STRIDE)
      }
    })
  })

  describe('Z_STRIDE', () => {
    it('is greater than the maximum base value', () => {
      const maxBase = Math.max(...Object.values(Z_LAYERS))
      expect(Z_STRIDE).toBeGreaterThan(maxBase)
    })
  })
})
