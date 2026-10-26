import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ArtState } from './types'
import { imageMaskEffect } from './image-mask'

/**
 * 端到端管线测试：图片 → 采样 → 栅格 → 波点。
 *
 * 上一版单测只喂手工构造的亮度栅格，绕过了 `sampleLuminance`。真实环境里
 * 图案与源图对不上（亮部反而点小），这里把「离屏重采样」也纳入，用一张
 * 左黑右白的合成图走完整条链，验证圆点直径随源图亮度左→右递增。
 */

const IMG_W = 64
const IMG_H = 64

/** 合成图：x 方向 0→1 的线性亮度渐变（纯灰阶） */
function syntheticLum(x: number): number {
  return x / (IMG_W - 1)
}

function installCanvasMock() {
  const originalCreate = document.createElement.bind(document)

  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') return originalCreate(tag)
    const canvas: Record<string, unknown> = { width: 0, height: 0 }
    canvas.getContext = () => ({
      // 离屏重采样：按目标尺寸直接给出合成图（等价于把渐变图缩到栅格）
      drawImage: (_img: unknown, _x: number, _y: number, w: number, h: number) => {
        canvas.__w = w
        canvas.__h = h
      },
      getImageData: (_x: number, _y: number, w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4)
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const v = Math.round(syntheticLum((col / (w - 1)) * (IMG_W - 1)) * 255)
            const i = (row * w + col) * 4
            data[i] = v
            data[i + 1] = v
            data[i + 2] = v
            data[i + 3] = 255
          }
        }
        return { data }
      },
    })
    return canvas as unknown as HTMLCanvasElement
  }) as typeof document.createElement)

  // Image：加载即刻成功，尺寸固定
  class FakeImage {
    width = IMG_W
    height = IMG_H
    crossOrigin = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_v: string) {
      queueMicrotask(() => this.onload?.())
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

interface RecordingCtx {
  ctx: CanvasRenderingContext2D
  arcs: { x: number; y: number; r: number }[]
}

function createRecordingCtx(): RecordingCtx {
  const out: RecordingCtx = { ctx: null as unknown as CanvasRenderingContext2D, arcs: [] }
  out.ctx = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'canvas') return undefined
        if (prop === 'arc') return (x: number, y: number, r: number) => out.arcs.push({ x, y, r })
        return () => {}
      },
      set: () => true,
    }
  ) as unknown as CanvasRenderingContext2D
  return out
}

function makeState(overrides: Partial<ArtState> = {}): ArtState {
  return {
    width: 200,
    height: 200,
    palette: [],
    bg: '#e0e0e0',
    fg: '#333333',
    src: '/synthetic.jpg',
    density: 1,
    speed: 0,
    reactive: false,
    seed: 1,
    pointer: { x: 0, y: 0, active: false },
    data: null,
    ...overrides,
  }
}

describe('图片蒙版端到端（采样 → 绘制）', () => {
  beforeEach(() => installCanvasMock())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('波点：圆点直径随源图亮度左 → 右递增（不得倒挂）', async () => {
    const state = makeState({ mask: 'dots', dotMin: 1, dotMax: 10, occupancy: 1 })
    imageMaskEffect.init(state)
    await imageMaskEffect.prepare(state)
    const rec = createRecordingCtx()
    imageMaskEffect.render(rec.ctx, state, 0)

    expect(rec.arcs.length).toBeGreaterThan(10)
    // 取同一行（y 相同）的圆点，按 x 排序，半径必须整体随 x 增大
    const byRow = new Map<number, { x: number; r: number }[]>()
    for (const a of rec.arcs) {
      const key = Math.round(a.y)
      if (!byRow.has(key)) byRow.set(key, [])
      byRow.get(key)!.push({ x: a.x, r: a.r })
    }
    const row = [...byRow.values()].sort((a, b) => b.length - a.length)[0]
    const sorted = row.sort((a, b) => a.x - b.x)

    const left = sorted[0].r
    const right = sorted[sorted.length - 1].r
    expect(right).toBeGreaterThan(left)

    // 逐段单调（允许同档相等：亮度量化到 32 档）
    let drops = 0
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].r < sorted[i - 1].r - 1e-6) drops++
    }
    expect(drops).toBe(0)
  })

  it('字符画：同一张图同样是亮部密、暗部疏（作为对照组）', async () => {
    const state = makeState({ mask: 'ascii' })
    imageMaskEffect.init(state)
    await imageMaskEffect.prepare(state)

    const texts: { ch: string; x: number; y: number }[] = []
    const ctx = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'canvas') return undefined
          if (prop === 'fillText')
            return (ch: string, x: number, y: number) => texts.push({ ch, x, y })
          return () => {}
        },
        set: () => true,
      }
    ) as unknown as CanvasRenderingContext2D
    imageMaskEffect.render(ctx, state, 0)

    expect(texts.length).toBeGreaterThan(10)
    // 右侧（亮）应比左侧（暗）用更密的字符
    const density = (ch: string) => ' .·:-=+*#%@'.indexOf(ch)
    const xs = texts.map(t => t.x)
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2
    const leftAvg =
      texts.filter(t => t.x < mid).reduce((s, t) => s + density(t.ch), 0) /
      Math.max(1, texts.filter(t => t.x < mid).length)
    const rightAvg =
      texts.filter(t => t.x >= mid).reduce((s, t) => s + density(t.ch), 0) /
      Math.max(1, texts.filter(t => t.x >= mid).length)
    expect(rightAvg).toBeGreaterThan(leftAvg)
  })
})
