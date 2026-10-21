import { onBeforeUnmount, watch, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'
import { ART_EFFECTS, type ArtEffectName, type ArtState } from '@/components/NeumorphismArt/effects'

export interface UseArtRendererOptions {
  /** 目标 canvas 元素 */
  canvas: Ref<HTMLCanvasElement | null>
  effect: Ref<ArtEffectName>
  reactive: Ref<boolean>
  speed: Ref<number>
  density: Ref<number>
  /** 自定义配色；undefined 时从主题 token 读取 */
  palette: Ref<string[] | undefined>
  seed: Ref<number | undefined>
  /** 图片资源地址（图片类效果使用，如字符画） */
  src: Ref<string | undefined>
  /**
   * 指针未激活时的帧率上限（如字符画这类「缓慢呼吸」的低动态效果用 30 即可，
   * 主线程常驻成本减半、观感无差别）。指针交互中不节流（跟手）。
   * 缺省 = 跟随显示器刷新率。
   */
  idleFps?: number
}

const THEME_PALETTE_VARS = [
  '--nm-primary-color',
  '--nm-color-info',
  '--nm-color-success',
  '--nm-color-warning',
]

/** 页面滚动冻结窗口（ms）：滚动中跳过重绘，滚动停止后回落。滚动手势里动画
 *  已在高速位移中，冻结不可感知；相反每个 vsync 都叠加画布重绘会让滚动手感
 *  卡顿（实测滚动中帧间隔从 16ms 恶化到 40ms+）。 */
const SCROLL_IDLE_MS = 140

/** ResizeObserver 防抖（ms）：移动端 URL bar 折叠 / 窗口拖拽会产生 resize 风暴，
 *  每次都重采样图片代价高；静置后统一处理。 */
const RESIZE_DEBOUNCE_MS = 120

/** IntersectionObserver 提前量：离视口 80px 时即恢复循环，滚动进场时动画已连续。 */
const INTERSECT_ROOT_MARGIN = '80px'

/**
 * NeumorphismArt 的 headless 渲染循环：rAF 驱动 + DPR 适配 + ResizeObserver
 * 尺寸跟踪 + 指针追踪 + 主题切换重读配色。reduced-motion 时只渲染一帧
 * 静态画面，不启动循环。
 *
 * 调度门控（2026-10，修滚动卡顿）：
 * - 视口外停摆（IntersectionObserver）：元素滚出视口即停 rAF，
 *   屏幕外不再消耗 CPU/合成资源；
 * - 滚动冻结（window capture 监听）：页面或任意祖先滚动容器滚动期间
 *   跳过重绘（上一帧保持可见），停止后回落；
 * - 空闲降帧（idleFps）：指针未激活时按上限节流。
 */
export function useArtRenderer(opts: UseArtRendererOptions) {
  const { isReducedMotion } = useReducedMotion()

  let ctx: CanvasRenderingContext2D | null = null
  let rafId = 0
  let startTime = 0
  let resizeObserver: ResizeObserver | null = null
  let themeObserver: MutationObserver | null = null
  let running = false

  // ---- 调度门控状态 ----
  let intersecting = true
  let intersectionObserver: IntersectionObserver | null = null
  let scrolling = false
  let scrollIdleTimer: ReturnType<typeof setTimeout> | undefined
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  let lastDrawAt = 0
  let lastDpr = 0
  const frameInterval = opts.idleFps && opts.idleFps > 0 ? 1000 / opts.idleFps : 0

  const isCoarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  const state: ArtState = {
    width: 0,
    height: 0,
    palette: [],
    bg: '',
    fg: '',
    density: 1,
    speed: 1,
    reactive: false,
    seed: 1,
    src: undefined,
    pointer: { x: 0, y: 0, active: false },
    data: null,
  }

  function readThemeColors(el: HTMLElement) {
    const styles = getComputedStyle(el)
    state.palette = THEME_PALETTE_VARS.map(v => styles.getPropertyValue(v).trim()).filter(Boolean)
    state.bg = styles.getPropertyValue('--nm-bg-color').trim()
    state.fg = styles.getPropertyValue('--nm-text-primary').trim()
  }

  function currentEffect() {
    return ART_EFFECTS[opts.effect.value] ?? ART_EFFECTS['pixel-field']
  }

  let generation = 0

  async function initEffect() {
    const el = opts.canvas.value
    if (!el) return
    const gen = ++generation
    state.density = opts.density.value
    state.speed = opts.speed.value
    state.reactive = opts.reactive.value && !isCoarsePointer && !isReducedMotion.value
    state.seed = opts.seed.value ?? Math.floor(Math.random() * 0xffffffff)
    state.src = opts.src.value
    if (opts.palette.value?.length) state.palette = opts.palette.value
    const effect = currentEffect()
    effect.init(state)
    drawFrame(0.7)
    // 异步资源（图片等）就绪后重绘一帧；期间切换效果则丢弃过期结果
    await effect.prepare?.(state)
    if (gen !== generation) return
    drawFrame(0.7)
  }

  function drawFrame(t: number) {
    if (!ctx) return
    currentEffect().render(ctx, state, t)
  }

  function tick(now: number) {
    if (!running) return
    // 滚动中 / 视口外：跳过重绘（上一帧保持可见，恢复后按节拍续画）
    if (!scrolling && intersecting) {
      // 空闲降帧：指针交互中不节流（跟手）；否则按 idleFps 间隔节流
      if (!frameInterval || state.pointer.active || now - lastDrawAt >= frameInterval - 1) {
        drawFrame((now - startTime) / 1000)
        lastDrawAt = now
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (running || isReducedMotion.value) return
    running = true
    startTime = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  function syncSize() {
    const el = opts.canvas.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = Math.max(1, Math.round(rect.width * dpr))
    el.height = Math.max(1, Math.round(rect.height * dpr))
    state.width = rect.width
    state.height = rect.height
    lastDpr = dpr
    ctx = el.getContext('2d')
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ---- 指针追踪（仅 reactive 且非触屏时生效）----
  function onPointerMove(event: PointerEvent) {
    const el = opts.canvas.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    state.pointer.x = event.clientX - rect.left
    state.pointer.y = event.clientY - rect.top
    state.pointer.active = true
  }
  function onPointerLeave() {
    state.pointer.active = false
  }

  function bindPointer(el: HTMLElement) {
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)
  }
  function unbindPointer(el: HTMLElement) {
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerleave', onPointerLeave)
  }

  // ---- 滚动冻结：任意滚动容器（含页面内层容器；scroll 事件在 capture
  //  阶段可达 window）滚动期间跳过重绘；SCROLL_IDLE_MS 无滚动后回落。 ----
  function onScroll() {
    scrolling = true
    if (scrollIdleTimer !== undefined) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = setTimeout(() => {
      scrollIdleTimer = undefined
      scrolling = false
    }, SCROLL_IDLE_MS)
  }

  /** Resize 统一入口：防抖 + 尺寸/DPR 未变时跳过（避免 URL bar 折叠等
   *  resize 风暴反复重采样图片）。 */
  function handleResize() {
    const el = opts.canvas.value
    if (!el) return
    if (resizeTimer !== undefined) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      resizeTimer = undefined
      const rect = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (rect.width === state.width && rect.height === state.height && dpr === lastDpr) return
      syncSize()
      initEffect()
    }, RESIZE_DEBOUNCE_MS)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  }

  // canvas 挂载后启动；卸载前清理全部监听与循环
  const stopWatch = watch(
    opts.canvas,
    el => {
      if (!el) return
      if (opts.palette.value?.length) state.palette = opts.palette.value
      else readThemeColors(el)
      syncSize()
      initEffect()
      start()
      bindPointer(el)
      resizeObserver = new ResizeObserver(() => handleResize())
      resizeObserver.observe(el)
      // 视口门控：滚出视口即停摆（rootMargin 提前 80px 恢复）
      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          entries => {
            const entry = entries[entries.length - 1]
            if (!entry) return
            const visible = entry.isIntersecting
            if (visible === intersecting) return
            intersecting = visible
            if (visible) {
              start()
            } else {
              stop()
            }
          },
          { rootMargin: INTERSECT_ROOT_MARGIN }
        )
        intersectionObserver.observe(el)
      }
      // 主题切换（<html data-theme>）时重读配色并重渲染
      themeObserver = new MutationObserver(() => {
        if (!opts.palette.value?.length) {
          readThemeColors(el)
          drawFrame(performance.now() / 1000)
        }
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    },
    { immediate: true, flush: 'post' }
  )

  // 参数变化：重初始化并（静态模式下）补绘一帧
  watch([opts.effect, opts.density, opts.seed, opts.src], () => {
    if (!opts.canvas.value) return
    initEffect()
  })
  watch(opts.palette, () => {
    const el = opts.canvas.value
    if (!el) return
    if (opts.palette.value?.length) state.palette = opts.palette.value
    else readThemeColors(el)
    drawFrame(performance.now() / 1000)
  })
  watch(
    () => opts.reactive.value,
    val => {
      state.reactive = val && !isCoarsePointer && !isReducedMotion.value
      if (!state.reactive) state.pointer.active = false
    }
  )
  watch(opts.speed, val => {
    state.speed = val
  })

  // reduced-motion 切换：开启时停循环并渲染静态帧；关闭时恢复播放
  watch(isReducedMotion, reduced => {
    state.reactive = opts.reactive.value && !isCoarsePointer && !reduced
    if (reduced) {
      stop()
      drawFrame(0.7)
    } else {
      start()
    }
  })

  onBeforeUnmount(() => {
    stop()
    stopWatch()
    if (resizeTimer !== undefined) clearTimeout(resizeTimer)
    if (scrollIdleTimer !== undefined) clearTimeout(scrollIdleTimer)
    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()
    themeObserver?.disconnect()
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
    if (opts.canvas.value) unbindPointer(opts.canvas.value)
  })

  return { start, stop }
}
