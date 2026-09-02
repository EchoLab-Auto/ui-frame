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
}

const THEME_PALETTE_VARS = [
  '--nm-primary-color',
  '--nm-color-info',
  '--nm-color-success',
  '--nm-color-warning',
]

/**
 * NeumorphismArt 的 headless 渲染循环：rAF 驱动 + DPR 适配 + ResizeObserver
 * 尺寸跟踪 + 指针追踪 + 主题切换重读配色。reduced-motion 时只渲染一帧
 * 静态画面，不启动循环。
 */
export function useArtRenderer(opts: UseArtRendererOptions) {
  const { isReducedMotion } = useReducedMotion()

  let ctx: CanvasRenderingContext2D | null = null
  let rafId = 0
  let startTime = 0
  let resizeObserver: ResizeObserver | null = null
  let themeObserver: MutationObserver | null = null
  let running = false

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
    drawFrame((now - startTime) / 1000)
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
      resizeObserver = new ResizeObserver(() => {
        syncSize()
        initEffect()
      })
      resizeObserver.observe(el)
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
    resizeObserver?.disconnect()
    themeObserver?.disconnect()
    if (opts.canvas.value) unbindPointer(opts.canvas.value)
  })

  return { start, stop }
}
