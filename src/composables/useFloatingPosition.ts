import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

export type FloatingPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface FloatingRect {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}

export interface UseFloatingPositionOptions {
  /** 触发器元素 */
  trigger: Ref<HTMLElement | undefined>
  /** 浮层是否打开（rAF 逐帧追踪随之启停） */
  open: Ref<boolean>
  /** 期望方向；'auto' 时按 candidates 顺序选择首个空间满足的方向 */
  placement: Ref<FloatingPlacement | 'auto'>
  /** 与触发器的间距 px（默认 0） */
  offset?: Ref<number>
  /** 浮层元素（读取实际尺寸用于边界判断；缺省用 estimateSize） */
  floating?: Ref<HTMLElement | undefined>
  /** auto 模式候选顺序（默认 bottom→top→right→left） */
  candidates?: FloatingPlacement[]
  /** 翻转滞后 px —— 对侧需比当前侧宽裕该值才翻转（默认 48，防边界抖动） */
  flipHysteresis?: number
  /** 当前侧可用空间低于该值才考虑翻转（默认 120） */
  minSpace?: number
  /** floating 未挂载时的内容尺寸估计（默认 200×120） */
  estimateSize?: { width: number; height: number }
  /**
   * 锁定展开期间的方向：打开时以当前几何决策一次后冻结，逐帧追踪与
   * refresh/resize 均不再重新判向，直到关闭（下次打开重新决策）。
   * 适用于单盒连体变体（outlined）—— 其触发器本身会随展开长高，
   * 逐帧判向会把盒底增长误判为"空间不足"而中途翻转；且翻转意味着
   * 盒体 column-reverse 重构，任何中途翻转都极度刺眼。
   */
  lockPlacement?: Ref<boolean>
  /** 每帧回调（跟随 rAF 追踪，用于消费方做逐帧同步，如负 margin 补偿） */
  onFrame?: () => void
}

export interface UseFloatingPositionReturn {
  /** 边界翻转后的实际方向 */
  actualPlacement: Ref<FloatingPlacement>
  /** 触发器视口 rect（逐帧更新，仅变化时写入） */
  rect: Ref<FloatingRect | null>
  /** 当前侧可用空间 px（打开/翻转/resize 时重估，滚动中冻结防抖动） */
  available: Ref<number>
  /** 立即全量重算（方向 + rect + 可用空间） */
  refresh: () => void
  /** 停止 rAF 追踪（组件卸载时自动调用） */
  stop: () => void
}

const OPPOSITE: Record<FloatingPlacement, FloatingPlacement> = {
  bottom: 'top',
  top: 'bottom',
  left: 'right',
  right: 'left',
}

/**
 * 共享浮层定位引擎 —— rAF 逐帧追踪 + 边界翻转（带滞后）。
 *
 * 滚动（含嵌套滚动容器）、缩放、布局变化均由逐帧轮询覆盖，不依赖
 * scroll 事件（事件在嵌套容器与平滑滚动下会漏发/滞后）。位置更新与
 * 页面绘制落在同一帧，浮层与触发器无坐标系错位。
 *
 * @example
 * ```ts
 * const { actualPlacement, rect, available, stop } = useFloatingPosition({
 *   trigger: triggerRef,
 *   open: isOpen,
 *   placement: computed(() => 'bottom'),
 *   offset: computed(() => 6),
 * })
 * ```
 */
export function useFloatingPosition(opts: UseFloatingPositionOptions): UseFloatingPositionReturn {
  const {
    trigger,
    open,
    placement,
    floating,
    offset,
    candidates = ['bottom', 'top', 'right', 'left'],
    flipHysteresis = 48,
    minSpace = 120,
    estimateSize = { width: 200, height: 120 },
    lockPlacement,
    onFrame,
  } = opts

  const rect = ref<FloatingRect | null>(null)
  const available = ref(0)
  const initial: FloatingPlacement = placement.value === 'auto' ? candidates[0] : placement.value
  const actualPlacement = ref<FloatingPlacement>(initial)

  function gap(): number {
    return offset?.value ?? 0
  }

  function contentSize(): { width: number; height: number } {
    const el = floating?.value
    return {
      width: el?.offsetWidth ?? estimateSize.width,
      height: el?.offsetHeight ?? estimateSize.height,
    }
  }

  /** 各方向可用空间（含间距） */
  function spaces(r: FloatingRect): Record<FloatingPlacement, number> {
    return {
      bottom: window.innerHeight - r.bottom - gap(),
      top: r.top - gap(),
      right: window.innerWidth - r.right - gap(),
      left: r.left - gap(),
    }
  }

  /** auto：选首个能容纳内容的方向（全部不足时回退第一候选） */
  function pickAuto(r: FloatingRect): FloatingPlacement {
    const s = spaces(r)
    const size = contentSize()
    for (const c of candidates) {
      const need = (c === 'bottom' || c === 'top' ? size.height : size.width) + 8
      if (s[c] >= need) return c
    }
    return candidates[0]
  }

  /** 显式方向：当前侧不足且对侧宽裕滞后值以上时翻转 */
  function pickWithHysteresis(r: FloatingRect, current: FloatingPlacement): FloatingPlacement {
    const s = spaces(r)
    const opposite = OPPOSITE[current]
    if (s[current] < minSpace && s[opposite] > s[current] + flipHysteresis) {
      return opposite
    }
    return current
  }

  function update(fullRecompute: boolean) {
    if (!trigger.value || typeof window === 'undefined') return
    const r = trigger.value.getBoundingClientRect()
    const next: FloatingRect = {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
    }

    let nextPlacement: FloatingPlacement
    if (lockPlacement?.value && !pendingDecision) {
      // 锁定：整段展开期间冻结方向，rect/available 照常逐帧同步
      nextPlacement = actualPlacement.value
    } else if (placement.value === 'auto') {
      // auto 仅在全量重估时重新选向，滚动中冻结防抖动
      nextPlacement = fullRecompute ? pickAuto(next) : actualPlacement.value
    } else {
      nextPlacement = fullRecompute
        ? pickWithHysteresis(next, placement.value)
        : pickWithHysteresis(next, actualPlacement.value)
    }
    pendingDecision = false
    const flipped = nextPlacement !== actualPlacement.value

    // available 仅在打开/翻转/resize 时重估 —— 滚动中逐帧收缩会引起面板
    // 高度抖动与列表滚动位置跳变；冻结后面板随触发器整体移动
    if (fullRecompute || flipped) {
      available.value = spaces(next)[nextPlacement]
    }

    // 逐帧轮询下避免无谓的重渲染 —— 仅在实际变化时写入响应式状态
    const prev = rect.value
    if (
      !prev ||
      prev.top !== next.top ||
      prev.bottom !== next.bottom ||
      prev.left !== next.left ||
      prev.right !== next.right ||
      prev.width !== next.width ||
      prev.height !== next.height
    ) {
      rect.value = next
    }
    if (flipped || fullRecompute) actualPlacement.value = nextPlacement
  }

  // ---- rAF 逐帧追踪（open 驱动启停） ----
  let rafId: number | null = null
  let needsFullRecompute = false
  // 锁定模式下仅打开转换后的首次 update 判向，其后冻结直到关闭
  let pendingDecision = true

  function onWindowResize() {
    needsFullRecompute = true
  }

  function trackFrame() {
    rafId = null
    const full = needsFullRecompute
    needsFullRecompute = false
    update(full)
    onFrame?.()
    if (open.value && typeof window !== 'undefined') {
      rafId = window.requestAnimationFrame(trackFrame)
    }
  }

  function start() {
    if (typeof window === 'undefined' || rafId !== null) return
    rafId = window.requestAnimationFrame(trackFrame)
  }

  function stop() {
    if (rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function refresh() {
    update(true)
  }

  watch(open, isOpen => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', onWindowResize)
      }
      // 打开时全量重估（方向 + 可用空间）
      update(true)
      start()
    } else {
      stop()
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onWindowResize)
      }
      actualPlacement.value = placement.value === 'auto' ? candidates[0] : placement.value
      // 下次打开重新判向（锁定模式的一次决策随关闭失效）
      pendingDecision = true
    }
  })

  onBeforeUnmount(() => {
    stop()
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onWindowResize)
    }
  })

  return {
    actualPlacement,
    rect,
    available,
    refresh,
    stop,
  }
}

export default useFloatingPosition
