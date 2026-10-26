import { onBeforeUnmount, watch, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'
import {
  ART_EFFECTS,
  type ArtEffectName,
  type ArtMaskName,
  type ArtState,
} from '@/components/NeumorphismArt/effects'

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
  /** 图片资源地址（图片类效果使用，如字符画 / 波点） */
  src: Ref<string | undefined>
  /** 图片蒙版（图片类效果使用）；缺省由效果决定 */
  mask?: Ref<ArtMaskName | undefined>
  /** 波点蒙版：暗部 / 亮部波点直径（px） */
  dotMin?: Ref<number | undefined>
  dotMax?: Ref<number | undefined>
  /** 波点蒙版：网格占用（最大波点直径 / 单元格边长） */
  occupancy?: Ref<number | undefined>
  /**
   * 指针未激活时的帧率上限（如字符画这类「缓慢呼吸」的低动态效果用 30 即可，
   * 主线程常驻成本减半、观感无差别）。指针交互中不节流（跟手）。
   * 缺省 = 跟随显示器刷新率。
   */
  idleFps?: number
  /**
   * 滚动期间的帧率上限。**默认不设**——滚动时动画与静止同速，不做任何节流。
   *
   * 实测（独立长列表页 + 400×500@DPR2 的字符画满帧绘制）滚动全程 60fps、零掉帧，
   * 说明画布绘制本身不会拖累滚动；早先「滚动期间停绘 / 降帧」是错的解法，
   * 它把不存在的瓶颈当成理由，代价是动画在滚动中被截断。
   *
   * 只有特别重的自绘效果才需要显式给一个上限；传 `0` 表示滚动期间完全停绘。
   */
  scrollFps?: number
}

const THEME_PALETTE_VARS = [
  '--nm-primary-color',
  '--nm-color-info',
  '--nm-color-success',
  '--nm-color-warning',
]

/** 滚动窗口（ms）：仅在使用方显式配置 `scrollFps` 时才需要。
 *  收到 scroll 后进入「滚动中」，该窗口内无新 scroll 即回落。
 *  默认不注册 scroll 监听、也不做任何滚动节流（见 scrollFps 文档）。 */
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
 * - 滚动：**默认不干预**。画布绘制不是滚动的瓶颈（400×500@DPR2 满帧绘制时
 *   滚动实测 60fps / 零掉帧），所以不再为了「省」而停绘或降帧——那只会让动画
 *   在滚动中卡住。确实需要时可用 `scrollFps` 显式节流。
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
  /** 下一次允许绘制的时刻（节拍器；见 tick 里的说明） */
  let nextDrawAt = 0
  let lastDpr = 0
  const frameInterval = opts.idleFps && opts.idleFps > 0 ? 1000 / opts.idleFps : 0
  /**
   * 滚动期间的最小帧间隔。默认「不限制」（0）——滚动时保持与静止相同的节奏。
   * 只有调用方显式给 `scrollFps` 才生效：> 0 降帧，<= 0 停绘。
   */
  const scrollThrottled = opts.scrollFps !== undefined
  const scrollFrameInterval = scrollThrottled
    ? opts.scrollFps! > 0
      ? 1000 / opts.scrollFps!
      : Infinity
    : 0

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
    mask: undefined,
    dotMin: undefined,
    dotMax: undefined,
    occupancy: undefined,
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
    state.mask = opts.mask?.value
    state.dotMin = opts.dotMin?.value
    state.dotMax = opts.dotMax?.value
    state.occupancy = opts.occupancy?.value
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
    // 视口外完全停摆（IntersectionObserver 已停 rAF，这里再兜一层）
    if (intersecting) {
      // 帧间隔：空闲用 idleFps；滚动期间默认不变，仅当显式配置了 scrollFps 才取较大值
      const interval =
        scrolling && scrollThrottled ? Math.max(frameInterval, scrollFrameInterval) : frameInterval
      // 指针交互中不节流（跟手）
      const force = state.pointer.active || !interval
      // 节拍器而不是「距上次多久」：
      // 后者在 rAF 抖动（16.7/33.4ms 交错）时会漏拍——33.4ms 的间隔刚好卡在
      // 阈值边缘，一抖就少画一帧，实测让 30fps 目标掉到 25fps。改成累计计划
      // 时刻后，漏掉的那一帧下一拍就补上，长期帧率稳定在目标值。
      // interval = Infinity 表示「停绘」（scrollFps <= 0 的显式选择），此时永不满足
      if (force || (Number.isFinite(interval) && now >= nextDrawAt)) {
        drawFrame((now - startTime) / 1000)
        // 落后太多（掉帧/切回前台）时重置节拍，不连画多帧追赶
        nextDrawAt = force ? now + (interval || 0) : nextDrawAt + interval
        if (nextDrawAt < now) nextDrawAt = now + interval
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (running || isReducedMotion.value) return
    running = true
    // 时间基准只在首次启动时固定。
    // 之前每次 start() 都重置 startTime，于是「滚出视口 → 滚回来」会把呼吸相位
    // 拨回 0，观感上是动画停顿后从同一处重新开始（跳一下）。保持单调后，
    // 离屏期间只是不画，回到视口时相位正好接上。
    if (!startTime) startTime = performance.now()
    nextDrawAt = 0 // 立即画第一帧，之后由节拍器接管
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

  // ---- 可选的滚动节流：仅当调用方显式配置 scrollFps 时才走到这里。
  //  任意滚动容器（含页面内层容器；scroll 事件在 capture 阶段可达 window）
  //  滚动期间按 scrollFps 节流；SCROLL_IDLE_MS 无滚动后回落。
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
  // 只有显式配置 scrollFps 时才需要监听滚动（默认路径零开销：
  // 不为「不存在的节流需求」在 capture 阶段挂一堆 scroll 回调）
  if (typeof window !== 'undefined' && scrollThrottled) {
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
  watch(
    [
      opts.effect,
      opts.density,
      opts.seed,
      opts.src,
      // 蒙版与波点几何变化同样需要重建 data（栅格尺寸/图案类型都变了）
      () => opts.mask?.value,
      () => opts.dotMin?.value,
      () => opts.dotMax?.value,
      () => opts.occupancy?.value,
    ],
    () => {
      if (!opts.canvas.value) return
      initEffect()
    }
  )
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
    if (typeof window !== 'undefined' && scrollThrottled) {
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
    if (opts.canvas.value) unbindPointer(opts.canvas.value)
  })

  return { start, stop }
}
