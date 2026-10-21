//! useArtRenderer 调度门控契约测试（2026-10 滚动卡顿优化）：
//! 1. 滚动冻结——页面或任意祖先滚动容器滚动期间跳过重绘，SCROLL_IDLE_MS 后回落；
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
  props: { idleFps: { type: Number, default: 0 } },
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

  async function mountHarness(idleFps = 0) {
    const wrapper = mount(Harness, { props: { idleFps } })
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

  it('滚动冻结：window 滚动事件期间跳过重绘，空闲后回落', async () => {
    await mountHarness()
    driveFrames(2)
    const base = drawn()
    window.dispatchEvent(new Event('scroll'))
    driveFrames(5)
    expect(drawn()).toBe(base) // 滚动中不重绘（上一帧保持可见）
    await new Promise(r => setTimeout(r, 160)) // SCROLL_IDLE_MS=140
    driveFrames(2)
    expect(drawn()).toBe(base + 2)
  })

  it('滚动冻结：内层滚动容器的 scroll 经 capture 阶段同样触发冻结', async () => {
    await mountHarness()
    const scroller = document.createElement('div')
    document.body.appendChild(scroller)
    driveFrames(2)
    const base = drawn()
    scroller.dispatchEvent(new Event('scroll'))
    driveFrames(4)
    expect(drawn()).toBe(base)
    scroller.remove()
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
