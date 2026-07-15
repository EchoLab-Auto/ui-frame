import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export interface UseVirtualListOptions {
  /**
   * The full data array to virtualize.
   * The composable reads `items.value.length` to compute total height.
   */
  items: Ref<any[]>

  /**
   * Item height in pixels.
   * - `number` — every item has the same fixed height.
   * - `(index: number) => number` — dynamic per-item height function.
   *   When using dynamic heights the composable caches measured values.
   */
  itemHeight: Ref<number | ((index: number) => number)> | number | ((index: number) => number)

  /**
   * Number of extra items to render above and below the visible viewport.
   * Higher values produce smoother scrolling at the cost of more DOM nodes.
   * @default 5
   */
  overscan?: Ref<number> | number
}

export interface UseVirtualListReturn {
  /**
   * Template ref to attach to the scrollable container element.
   * The container must have overflow-y: auto (or scroll).
   */
  containerRef: Ref<HTMLElement | null>

  /** The currently visible slice of `items` — iterate this in the template. */
  visibleItems: ComputedRef<any[]>

  /** Total height of the virtual spacer (all items combined), in px. */
  totalHeight: Ref<number>

  /** Vertical translate offset for the visible-items wrapper, in px. */
  offsetY: Ref<number>

  /** Start index of the visible range (inclusive). */
  startIndex: Ref<number>

  /** End index of the visible range (exclusive). */
  endIndex: Ref<number>

  /**
   * Scroll to a specific item by index, optionally aligned to the
   * top (default) or center of the viewport.
   */
  scrollTo: (index: number, align?: 'top' | 'center') => void

  /**
   * Attach to the container's @scroll event.
   * The composable recalculates the visible window on each call.
   */
  handleScroll: () => void
}

/**
 * Headless virtual list composable.
 *
 * Encapsulates scroll-driven window calculation, viewport measurement
 * via ResizeObserver, fixed and dynamic item-height support, overscan,
 * and imperative scroll-to-item. Use with your own UI rendering — mount
 * `containerRef` on the scrollable wrapper and wire `handleScroll` to its
 * `@scroll` event.
 */
export function useVirtualList(opts: UseVirtualListOptions): UseVirtualListReturn {
  const { items } = opts

  // ---- Normalize overscan ----
  const overscan = computed<number>(() => {
    const o = opts.overscan
    if (o === undefined || o === null) return 5
    if (typeof o === 'number') return o
    return o.value ?? 5
  })

  // ---- Normalize item height into a function ----
  const itemHeightFn = computed(() => {
    const raw = opts.itemHeight
    let result: (index: number) => number
    if (typeof raw === 'number') {
      result = () => raw
    } else if (typeof raw === 'function') {
      result = raw
    } else {
      // raw is a Ref<number | ((index: number) => number)>
      const v: number | ((index: number) => number) = raw.value
      result = typeof v === 'number' ? () => v : v
    }
    return result
  })

  // ---- Viewport height (tracked via ResizeObserver) ----
  const containerRef = ref<HTMLElement | null>(null)
  const viewportHeight = ref(0)

  let resizeObserver: ResizeObserver | null = null

  function disconnectObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  function connectObserver() {
    disconnectObserver()
    const el = containerRef.value
    if (!el || typeof ResizeObserver === 'undefined') return
    viewportHeight.value = el.clientHeight
    resizeObserver = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height
      if (h !== viewportHeight.value) {
        viewportHeight.value = h
      }
    })
    resizeObserver.observe(el)
  }

  onMounted(() => {
    connectObserver()
  })

  onBeforeUnmount(() => {
    disconnectObserver()
  })

  // ---- Scroll offset ----
  const scrollTop = ref(0)

  function handleScroll() {
    const el = containerRef.value
    if (!el) return
    scrollTop.value = el.scrollTop
  }

  // ---- Dynamic-height cache (cleared when items array changes) ----
  let dynamicCache = new Map<number, number>()

  function getHeight(index: number): number {
    const fn = itemHeightFn.value
    const cached = dynamicCache.get(index)
    if (cached !== undefined) return cached
    const h = fn(index)
    dynamicCache.set(index, h)
    return h
  }

  // ---- Height strategy detection ----
  const isFixedHeight = computed(() => {
    const raw = opts.itemHeight
    return typeof raw === 'number' || (typeof raw !== 'function' && typeof raw.value === 'number')
  })

  function getFixedHeight(): number {
    const raw = opts.itemHeight
    if (typeof raw === 'number') return raw
    if (typeof raw !== 'function') return (raw.value as number) ?? 30
    return 30
  }

  // ---- Prefix-sum offset array (used only for dynamic-height mode) ----
  let prefixCache: number[] | null = null

  function buildOffsets(): number[] {
    const count = items.value.length
    const offsets: number[] = [0]
    for (let i = 0; i < count; i++) {
      offsets.push(offsets[i] + getHeight(i))
    }
    return offsets
  }

  // ---- Visible range ----
  const totalHeight = ref(0)
  const startIndex = ref(0)
  const endIndex = ref(0)
  const offsetY = ref(0)

  function recalc() {
    const count = items.value.length
    if (count === 0) {
      totalHeight.value = 0
      startIndex.value = 0
      endIndex.value = 0
      offsetY.value = 0
      return
    }

    const vh = viewportHeight.value
    if (vh === 0) return

    const overscanVal = overscan.value
    const st = scrollTop.value

    let found: number
    let rawEnd: number

    if (isFixedHeight.value) {
      // O(1) fixed-height path — no array allocation needed
      const fh = getFixedHeight()
      totalHeight.value = count * fh
      found = Math.floor(st / fh)
      rawEnd = Math.ceil((st + vh) / fh)
    } else {
      // O(n) dynamic-height path — build offsets once, reuse via cache invalidation
      prefixCache = buildOffsets()
      totalHeight.value = prefixCache[count]

      // Binary search
      let lo = 0,
        hi = count - 1
      found = 0
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1
        if (prefixCache[mid + 1] <= st) lo = mid + 1
        else {
          found = mid
          hi = mid - 1
        }
      }
      // Scan forward for end index
      const limit = st + vh
      rawEnd = found
      while (rawEnd < count && prefixCache[rawEnd + 1] < limit) rawEnd++
    }

    const rawStart = Math.max(0, found - overscanVal)
    rawEnd = Math.min(count, rawEnd + 1 + overscanVal)

    startIndex.value = rawStart
    endIndex.value = rawEnd

    if (isFixedHeight.value) {
      offsetY.value = rawStart * getFixedHeight()
    } else {
      offsetY.value = prefixCache?.[rawStart] ?? 0
    }
  }

  // Invalidate dynamic height cache + recompute when the data changes.
  // Watch BOTH the array reference (covers `items.value = newArr`) and its
  // length (covers in-place mutation like push/splice/unshift, which keeps
  // the same reference and so wouldn't trigger a plain reference watch).
  watch([() => items.value, () => items.value.length], () => {
    dynamicCache = new Map()
    recalc()
  })

  // Recalculate when scroll position, viewport size, overscan, or the
  // resolved item-height function changes. Clearing the cache on an
  // item-height change matters for dynamic heights whose measured values
  // depend on it; otherwise stale cached heights would linger.
  watch(
    [scrollTop, viewportHeight, overscan, itemHeightFn],
    () => {
      dynamicCache = new Map()
      recalc()
    },
    { deep: false, immediate: false }
  )

  const visibleItems = computed(() => {
    return items.value.slice(startIndex.value, endIndex.value)
  })

  function scrollTo(index: number, align: 'top' | 'center' = 'top') {
    const el = containerRef.value
    if (!el) return
    const count = items.value.length
    if (count === 0) return
    const clamped = Math.max(0, Math.min(count - 1, index))
    const itemTop = isFixedHeight.value ? clamped * getFixedHeight() : buildOffsets()[clamped]
    const itemH = getHeight(clamped)
    const vh = viewportHeight.value

    let targetTop: number
    if (align === 'center') {
      targetTop = itemTop - (vh - itemH) / 2
    } else {
      targetTop = itemTop
    }

    el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    scrollTo,
    handleScroll,
  }
}
