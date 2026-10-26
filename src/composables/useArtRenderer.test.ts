//! useArtRenderer 调度门控契约测试（2026-10 滚动卡顿优化；2026-11 滚动改为降帧）：
//! 1. 滚动降帧——页面或任意祖先滚动容器滚动期间把帧率压到 scrollFps（默认 20），
//!    但仍持续重绘（不能停摆：停了动画就被截断成静止画面）；scrollFps: 0 才冻结；
//! 2. 视口门控——IntersectionObserver isIntersecting=false 完全停 rAF，回视口恢复；
//! 3. 空闲降帧——idleFps 时节流到 ~50%，指针激活后逐帧跟手。
//!
//! 手法：rAF 桩成手动驱动队列（tick 自注册，driveFrame 推进一拍）；
//! canvas 2D 上下文用记录型 Proxy——无 src 的 ascii 效果每帧恰好一次 fillRect，
//! 以 fillRect 计数作为「已绘制帧数」。

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useArtRenderer } from './useArtRenderer'
import {
  createIntersectionObserverMock,
  createResizeObserverMock,
} from '@/__test-utils__/test-helpers'

interface CtxCalls {
  method: Record<string, number>
  set: Record<string, number>
}

function createRecordingCtx(): { ctx: CanvasRenderingContext2D; calls: CtxCalls } {
  const calls: CtxCalls = { method: {}, set: {} }
  const ctx = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'canvas') return undefined
        return () => {
          calls.method[String(prop)] = (calls.method[String(prop)] ?? 0) + 1
        }
      },
      set: (_, prop) => {
        calls.set[String(prop)] = (calls.set[String(prop)] ?? 0) + 1
        return true
      },
    }
  )
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

// rAF 手动驱动队列
let rafQueue: FrameRequestCallback[] = []
let rafSeq = 0
let rafTime = 0
function driveFrame(dtMs = 16.7) {
  rafTime += dtMs
  const q = rafQueue
  rafQueue = []
  for (const cb of q) cb(rafTime)
}
function driveFrames(n: number, dtMs = 16.7) {
  for (let i = 0; i < n; i++) driveFrame(dtMs)
}

let ctxCalls: CtxCalls
let ioMock: ReturnType<typeof createIntersectionObserverMock>

const Harness = defineComponent({
  props: {
    idleFps: { type: Number, default: 0 },
    /** undefined = 用 composable 的默认值；0 = 冻结模式 */
    scrollFps: { type: Number, default: undefined },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    useArtRenderer({
      canvas: canvasRef,
      effect: ref('ascii'),
      reactive: ref(true),
      speed: ref(1),
      density: ref(1),
      palette: ref(undefined),
      seed: ref(undefined),
      src: ref(undefined), // 无图：每帧 = 背景 fillRect 一次
      idleFps: props.idleFps || undefined,
      scrollFps: props.scrollFps,
    })
    return () => h('canvas', { ref: canvasRef })
  },
})

describe('useArtRenderer 调度门控', () => {
  beforeEach(() => {
    const rec = createRecordingCtx()
    ctxCalls = rec.calls
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(rec.ctx)
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))
    globalThis.ResizeObserver = createResizeObserverMock()
      .ResizeObserver as unknown as typeof ResizeObserver
    ioMock = createIntersectionObserverMock()
    globalThis.IntersectionObserver =
      ioMock.IntersectionObserver as unknown as typeof IntersectionObserver
    rafQueue = []
    rafSeq = 0
    rafTime = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafQueue.push(cb)
      return ++rafSeq
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function mountHarness(idleFps = 0, scrollFps?: number) {
    const wrapper = mount(Harness, { props: { idleFps, scrollFps } })
    await nextTick()
    // 异步 prepare（无 src → 立即 resolve）后的补绘帧落定
    await new Promise(r => setTimeout(r, 0))
    return wrapper
  }

  const drawn = () => ctxCalls.method.fillRect ?? 0

  it('正常节拍：每帧重绘一次', async () => {
    await mountHarness()
    const base = drawn()
    driveFrames(5)
    expect(drawn()).toBe(base + 5)
  })

  it('滚动降帧：滚动期间继续重绘，但压到 scrollFps（默认 20fps）', async () => {
    await mountHarness()
    driveFrames(2)
    const base = drawn()
    window.dispatchEvent(new Event('scroll'))
    // 10 帧 × 16.7ms ≈ 167ms；50ms 间隔（20fps）→ 3~4 帧。
    // 关键：既不是 10 帧（没降）也不是 0 帧（停摆）——动画必须还在走。
    driveFrames(10)
    const during = drawn() - base
    expect(during).toBeGreaterThanOrEqual(3)
    expect(during).toBeLessThanOrEqual(4)

    // 滚动停止 SCROLL_IDLE_MS 后回到满帧
    await new Promise(r => setTimeout(r, 160))
    const after = drawn()
    driveFrames(3)
    expect(drawn() - after).toBe(3)
  })

  it('滚动降帧：内层滚动容器的 scroll 经 capture 阶段同样生效', async () => {
    await mountHarness()
    const scroller = document.createElement('div')
    document.body.appendChild(scroller)
    driveFrames(2)
    const base = drawn()
    scroller.dispatchEvent(new Event('scroll'))
    driveFrames(10)
    const during = drawn() - base
    expect(during).toBeGreaterThan(0) // 仍在画
    expect(during).toBeLessThanOrEqual(4) // 但明显降频
    scroller.remove()
  })

  it('scrollFps: 0 时恢复成滚动期间完全冻结（重效果可选逃生口）', async () => {
    await mountHarness(0, 0)
    driveFrames(2)
    const base = drawn()
    window.dispatchEvent(new Event('scroll'))
    driveFrames(5)
    expect(drawn()).toBe(base) // 一帧都不画
    await new Promise(r => setTimeout(r, 160))
    driveFrames(2)
    expect(drawn()).toBe(base + 2)
  })

  it('滚动时期的降帧不会让时间轴倒退（呼吸相位连续，不平移）', async () => {
    // 记录每帧传入的时间戳：降帧只跳过帧，不改变 drawFrame 的时间基准
    const times: number[] = []
    const ctx = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'canvas') return undefined
          if (prop === 'fillRect') return () => times.push(rafTime)
          return () => {}
        },
        set: () => true,
      }
    ) as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)

    await mountHarness()
    driveFrames(3)
    window.dispatchEvent(new Event('scroll'))
    driveFrames(10)
    await new Promise(r => setTimeout(r, 160))
    driveFrames(3)

    // 时间轴单调不减（跳帧不等于回拨）。开头两笔是 init / prepare 后的
    // 立绘帧，此刻 rAF 还没推进过，时间戳同为 0，所以用「不减」而非「递增」。
    expect(times.length).toBeGreaterThan(5)
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    // 滚动期间确实有落笔（降帧 ≠ 停摆）
    const duringScroll = times.filter(t => t > 0 && t < rafTime).length
    expect(duringScroll).toBeGreaterThan(0)
  })

  it('视口门控：IntersectionObserver 离屏停循环，回视口恢复', async () => {
    await mountHarness()
    driveFrames(2)
    const base = drawn()
    ioMock.IntersectionObserver.trigger([{ isIntersecting: false }])
    driveFrames(4)
    expect(drawn()).toBe(base) // 完全停摆
    ioMock.IntersectionObserver.trigger([{ isIntersecting: true }])
    driveFrames(3)
    expect(drawn()).toBe(base + 3)
  })

  it('视口门控：重复的可见性回调不引起状态抖动', async () => {
    await mountHarness()
    driveFrames(2)
    const base = drawn()
    // 与当前状态相同的回调不应 stop/start
    ioMock.IntersectionObserver.trigger([{ isIntersecting: true }])
    ioMock.IntersectionObserver.trigger([{ isIntersecting: true }])
    driveFrames(3)
    expect(drawn()).toBe(base + 3)
  })

  it('idleFps：空闲节流约 50%，指针激活后逐帧跟手', async () => {
    const wrapper = await mountHarness(30)
    const base = drawn()
    driveFrames(10) // 16.7ms × 10 ≈ 167ms；33ms 间隔 → 5 ± 1 帧
    const throttled = drawn() - base
    expect(throttled).toBeGreaterThanOrEqual(4)
    expect(throttled).toBeLessThanOrEqual(6)

    const canvas = wrapper.find('canvas').element
    canvas.dispatchEvent(new Event('pointermove')) // 指针激活
    const base2 = drawn()
    driveFrames(6)
    expect(drawn() - base2).toBe(6)
  })

  it('离屏再回视口：时间基准不重置（呼吸相位接上，不跳回 0）', async () => {
    const times: number[] = []
    const ctx = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'canvas') return undefined
          if (prop === 'fillRect') return () => times.push(rafTime)
          return () => {}
        },
        set: () => true,
      }
    ) as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)

    await mountHarness()
    driveFrames(4)
    const before = times[times.length - 1]

    ioMock.IntersectionObserver.trigger([{ isIntersecting: false }])
    driveFrames(5) // 离屏：不画
    const countWhileHidden = times.length

    ioMock.IntersectionObserver.trigger([{ isIntersecting: true }])
    driveFrames(3)
    // 回视口后第一笔的时间戳必须继续往前，不能回落到 0 附近
    expect(times.length).toBeGreaterThan(countWhileHidden)
    expect(times[countWhileHidden]).toBeGreaterThanOrEqual(before)
  })

  it('卸载后不再响应滚动事件（监听已移除）', async () => {
    const wrapper = await mountHarness()
    driveFrames(2)
    wrapper.unmount()
    const base = drawn()
    window.dispatchEvent(new Event('scroll'))
    driveFrames(3)
    expect(drawn()).toBe(base)
  })
})
