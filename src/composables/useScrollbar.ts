import { ref, computed, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export type ScrollbarVariant = 'standard' | 'primary' | 'none' | 'dots' | 'glow'

export interface UseScrollbarOptions {
  /** 变体：standard/primary/none 为 CSS 类变体，dots/glow 为覆盖层变体 */
  variant: Ref<ScrollbarVariant>
  /** 目标滚动容器的 CSS 选择器；空串为禁用（不再默认耦合应用布局类名） */
  target: Ref<string>
  /** 点阵基础色（"r,g,b"） */
  dotColor: Ref<string>
  /** 强调色（"r,g,b"） */
  accentColor: Ref<string>
  /** 点阵高斯半径 */
  sigma: Ref<number>
}

export interface UseScrollbarReturn {
  /** 是否覆盖层变体（dots/glow） */
  overlayKind: ComputedRef<'dots' | 'glow' | null>
  /** 当前滚动位置（覆盖层变体使用） */
  scrollY: Ref<number>
  /** 可视高度（覆盖层变体使用） */
  overlayH: Ref<number>
  /** 文档总高（覆盖层变体使用） */
  overlayDocH: Ref<number>
  /** 挂载行为（CSS 类或覆盖层）；空 target 为安全 no-op */
  start: () => void
  /** 卸载全部行为与监听器 */
  stop: () => void
}

const GLOW_WIDTH = 26
const GLOW_HEIGHT = 72

/**
 * Headless 滚动条行为 —— CSS 类变体应用、点阵/辉光覆盖层的构建、
 * 滚动进度同步与监听器清理。组件层仅声明 props 并调用 start/stop。
 *
 * @example
 * ```ts
 * const { start, stop } = useScrollbar({
 *   variant: toRef(props, 'variant'),
 *   target: toRef(props, 'target'),
 *   dotColor: toRef(props, 'dotColor'),
 *   accentColor: toRef(props, 'accentColor'),
 *   sigma: toRef(props, 'sigma'),
 * })
 * onMounted(start)
 * onBeforeUnmount(stop)
 * ```
 */
export function useScrollbar(opts: UseScrollbarOptions): UseScrollbarReturn {
  const { variant, target, dotColor, accentColor, sigma } = opts

  const overlayKind = computed<'dots' | 'glow' | null>(() =>
    variant.value === 'dots' || variant.value === 'glow' ? variant.value : null
  )

  // ==================== CSS-class variants ====================
  let targetEl: HTMLElement | null = null

  function applyClass(cls: string) {
    if (!targetEl) return
    const existing = Array.from(targetEl.classList).filter(c => c.startsWith('nm-scrollbar--'))
    existing.forEach(c => targetEl!.classList.remove(c))
    targetEl.classList.add(cls)
  }

  function startClassVariant() {
    if (!target.value) return
    targetEl = document.querySelector(target.value)
    if (targetEl) applyClass(`nm-scrollbar--${variant.value}`)
  }

  function stopClassVariant() {
    if (targetEl) {
      const existing = Array.from(targetEl.classList).filter(c => c.startsWith('nm-scrollbar--'))
      existing.forEach(c => targetEl!.classList.remove(c))
      targetEl = null
    }
  }

  // ==================== Overlay variants (dots / glow) ====================
  const scrollY = ref(0)
  const overlayH = ref(100)
  const overlayDocH = ref(1000)
  let el: HTMLElement | null = null
  let wrapperEl: HTMLDivElement | null = null
  let overlayEl: HTMLDivElement | null = null
  let glowEl: HTMLDivElement | null = null
  let styleId: string | null = null

  function accentRgb(): [number, number, number] {
    const [r, g, b] = accentColor.value.split(',').map(Number)
    return [r, g, b]
  }

  // A soft bloom hugging the container's right edge plus a slim bright core.
  function paintGlow() {
    if (!glowEl) return
    const [r, g, b] = accentRgb()
    glowEl.style.backgroundImage = `radial-gradient(ellipse 55% 42% at 82% 50%, rgba(${r},${g},${b},0.5), transparent 70%)`
    const core = glowEl.firstElementChild as HTMLElement | null
    if (core) {
      core.style.background = `rgba(${r},${g},${b},0.95)`
      core.style.boxShadow = `0 0 6px rgba(${r},${g},${b},0.9), 0 0 18px rgba(${r},${g},${b},0.45)`
    }
  }

  // The glow rides the edge: scroll progress maps to its vertical position.
  function positionGlow() {
    if (!el || !glowEl) return
    const maxScroll = el.scrollHeight - el.clientHeight
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 0
    glowEl.style.transform = `translateY(${progress * (el.clientHeight - GLOW_HEIGHT)}px)`
  }

  function onResize() {
    if (!el) return
    if (overlayKind.value === 'glow') {
      positionGlow()
      return
    }
    overlayH.value = el.clientHeight
    if (overlayEl) overlayEl.style.height = `${overlayH.value}px`
  }

  function onScroll() {
    if (!el) return
    if (overlayKind.value === 'glow') {
      positionGlow()
      return
    }
    scrollY.value = el.scrollTop
    overlayDocH.value = el.scrollHeight
  }

  function injectHider(selector: string) {
    const id = `nm-sb-hide-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`
    if (document.getElementById(id)) return
    const s = document.createElement('style')
    s.id = id
    s.textContent = `${selector}{scrollbar-width:none}${selector}::-webkit-scrollbar{display:none}`
    document.head.appendChild(s)
    styleId = id
  }

  function removeHider() {
    if (styleId) {
      const s = document.getElementById(styleId)
      if (s) s.remove()
      styleId = null
    }
  }

  function startOverlay(kind: 'dots' | 'glow') {
    if (!target.value) return
    el = document.querySelector(target.value)
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    injectHider(target.value)
    window.addEventListener('resize', onResize, { passive: true })

    // Zero-height sticky wrapper — occupies no vertical space in flow
    // but stays pinned to the visible top while scrolling.
    wrapperEl = document.createElement('div')
    wrapperEl.style.cssText =
      'position:sticky;top:0;margin-left:auto;margin-right:4px;width:25px;height:0;z-index:1'

    if (kind === 'glow') {
      glowEl = document.createElement('div')
      glowEl.style.cssText = `position:absolute;right:0;top:0;width:${GLOW_WIDTH}px;height:${GLOW_HEIGHT}px;pointer-events:none;will-change:transform;background-repeat:no-repeat`
      const core = document.createElement('div')
      core.style.cssText =
        'position:absolute;right:1px;top:50%;transform:translateY(-50%);width:3px;height:36px;border-radius:2px'
      glowEl.appendChild(core)
      paintGlow()
      wrapperEl.appendChild(glowEl)
    } else {
      // Dots overlay — absolute within the wrapper, rendered at full container
      // height so the dot pattern spans the entire visible area.
      overlayEl = document.createElement('div')
      overlayEl.style.cssText = 'position:absolute;right:0;top:0;width:25px;pointer-events:none'
      overlayEl.style.height = `${overlayH.value}px`
      wrapperEl.appendChild(overlayEl)
    }
    el.insertBefore(wrapperEl, el.firstChild)

    onScroll()
    onResize()
  }

  function stopOverlay() {
    if (el) el.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    removeHider()
    wrapperEl?.remove()
    wrapperEl = null
    overlayEl = null
    glowEl = null
    el = null
  }

  // ---- dots 点阵背景（滚动进度 → 游标位置 → 高斯权重混色） ----
  const bgImage = computed(() => {
    const h = overlayH.value
    const maxScroll = overlayDocH.value - h
    const progress = maxScroll > 0 ? scrollY.value / maxScroll : 0
    const cursorY = progress * h
    const s = sigma.value

    const rows = Math.ceil(h / 5)
    const layers: string[] = []

    const [dR, dG, dB] = dotColor.value.split(',').map(Number)
    const [aR, aG, aB] = accentColor.value.split(',').map(Number)

    for (let i = 0; i < rows; i++) {
      const y = i * 5 + 2.5
      const dist = Math.abs(y - cursorY)
      const t = Math.exp(-(dist * dist) / (2 * s * s))
      const r = Math.round(dR + (aR - dR) * t)
      const g = Math.round(dG + (aG - dG) * t)
      const b = Math.round(dB + (aB - dB) * t)
      const a = (0.3 + 0.7 * t).toFixed(2)
      const c = `rgba(${r},${g},${b},${a})`

      for (let j = 0; j < 5; j++) {
        const cx = 2.5 + j * 5
        layers.push(`radial-gradient(circle at ${cx}px ${y}px, ${c} 1px, transparent 1.1px)`)
      }
    }
    return layers.join(',\n')
  })

  // Sync computed background to DOM overlay
  watch(bgImage, val => {
    if (overlayEl) {
      overlayEl.style.backgroundImage = val
      overlayEl.style.backgroundSize = `25px ${overlayH.value}px`
      overlayEl.style.backgroundRepeat = 'no-repeat'
    }
  })

  // ==================== 生命周期 ====================
  function start() {
    if (typeof document === 'undefined') return
    if (overlayKind.value) {
      startOverlay(overlayKind.value)
    } else {
      startClassVariant()
    }
  }

  function stop() {
    stopOverlay()
    stopClassVariant()
  }

  watch([variant, target], () => {
    stop()
    start()
  })

  watch(accentColor, paintGlow)

  onBeforeUnmount(stop)

  return {
    overlayKind,
    scrollY,
    overlayH,
    overlayDocH,
    start,
    stop,
  }
}

export default useScrollbar
