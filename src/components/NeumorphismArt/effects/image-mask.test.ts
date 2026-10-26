import { describe, it, expect } from 'vitest'
import type { ArtState } from './types'
import { imageMaskEffect } from './image-mask'
import { ART_MASKS, resolveMask } from './masks'
import { fitGrid } from './masks/shared'
import {
  DEFAULT_DOT_MAX,
  DEFAULT_DOT_MIN,
  DEFAULT_OCCUPANCY,
  dotGeometry,
  dotRadiusFor,
} from './masks/dot-mask'

/** 记录 canvas 调用的桩：只关心几何（arc 的圆心/半径）与批处理次数 */
interface RecordingCtx {
  ctx: CanvasRenderingContext2D
  arcs: { x: number; y: number; r: number }[]
  fills: number
  beginPaths: number
}

function createRecordingCtx(): RecordingCtx {
  const out: RecordingCtx = {
    ctx: null as unknown as CanvasRenderingContext2D,
    arcs: [],
    fills: 0,
    beginPaths: 0,
  }
  out.ctx = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'canvas') return undefined
        if (prop === 'arc') {
          return (x: number, y: number, r: number) => out.arcs.push({ x, y, r })
        }
        if (prop === 'fill') return () => (out.fills += 1)
        if (prop === 'beginPath') return () => (out.beginPaths += 1)
        return () => {}
      },
      set: () => true,
    }
  ) as unknown as CanvasRenderingContext2D
  return out
}

function makeState(overrides: Partial<ArtState> = {}): ArtState {
  return {
    width: 40,
    height: 20,
    palette: [],
    bg: '#e0e0e0',
    fg: '#333333',
    src: undefined,
    density: 1,
    speed: 0, // 静止：排除呼吸时变量
    reactive: false,
    seed: 1,
    pointer: { x: 0, y: 0, active: false },
    data: null,
    ...overrides,
  }
}

/** 手工构造栅格（绕过图片采样）：几何 + 亮度直给 */
function primeGrid(state: ArtState, lum: number[], cols: number, rows: number) {
  imageMaskEffect.init(state)
  const d = state.data as unknown as Record<string, unknown> & { lum: Float32Array }
  d.cols = cols
  d.rows = rows
  d.cellW = 10
  d.cellH = 10
  d.offsetX = 0
  d.offsetY = 0
  d.lum = new Float32Array(lum)
  d.ready = true
  return d
}

describe('图片蒙版注册表', () => {
  it('字符画与波点都在册，未知名称回退字符画', () => {
    expect(Object.keys(ART_MASKS).sort()).toEqual(['ascii', 'dots'])
    expect(resolveMask('dots').name).toBe('dots')
    expect(resolveMask('ascii').name).toBe('ascii')
    expect(resolveMask(undefined).name).toBe('ascii')
    // 运行期拿到脏值也不炸（如 SSR 注水、旧版序列化数据）
    expect(resolveMask('nope' as never).name).toBe('ascii')
  })
})

describe('fitGrid（contain 适配）', () => {
  it('宽图按宽度铺满，超高时改按高度铺满', () => {
    expect(fitGrid(1, 10, 10, 40, 22)).toEqual({ cols: 22, rows: 22 })
    // 宽图（2:1）：40 列 → 20 行，未超上限
    expect(fitGrid(2, 10, 10, 40, 22)).toEqual({ cols: 40, rows: 20 })
  })

  it('竖图按高度收缩，保持比例', () => {
    // 1:2 竖图：40 列 → 80 行超上限 → 22 行 / 11 列
    expect(fitGrid(0.5, 10, 10, 40, 22)).toEqual({ cols: 11, rows: 22 })
  })

  it('永不越界，且至少 1 格', () => {
    for (const ratio of [0.01, 0.3, 1, 3, 100]) {
      const { cols, rows } = fitGrid(ratio, 7, 9, 30, 11)
      expect(cols).toBeGreaterThanOrEqual(1)
      expect(rows).toBeGreaterThanOrEqual(1)
      expect(cols).toBeLessThanOrEqual(30)
      expect(rows).toBeLessThanOrEqual(11)
    }
  })

  it('字符格的宽高比不正方形 → 栅格整体仍不越界', () => {
    const cellW = 8
    const cellH = 8 * 1.15
    const { cols, rows } = fitGrid(0.8, cellW, cellH, 40, 22)
    expect(cols).toBeLessThanOrEqual(40)
    expect(rows).toBeLessThanOrEqual(22)
  })
})

describe('波点几何：大小与网格占用', () => {
  it('栅格步长 = dotMax / occupancy（默认值自洽）', () => {
    const geom = dotGeometry(makeState())
    expect(geom.pitch).toBeCloseTo(DEFAULT_DOT_MAX / DEFAULT_OCCUPANCY)
    // 半径：暗部/亮部各取直径一半
    expect(geom.rMin).toBeCloseTo(DEFAULT_DOT_MIN / 2)
    expect(geom.rMax).toBeCloseTo(DEFAULT_DOT_MAX / 2)
  })

  it('占用比越小，网格越稀（步长越大），点径不变', () => {
    const tight = dotGeometry(makeState({ occupancy: 1, dotMax: 8 }))
    const loose = dotGeometry(makeState({ occupancy: 0.5, dotMax: 8 }))
    expect(tight.pitch).toBeCloseTo(8)
    expect(loose.pitch).toBeCloseTo(16)
    expect(loose.rMax).toBeCloseTo(tight.rMax)
    // 占用 1 = 最亮处波点相切（直径 = 步长）
    expect(tight.rMax * 2).toBeCloseTo(tight.pitch)
  })

  it('波点大小可调：dotMin / dotMax 直接是像素直径', () => {
    const small = dotGeometry(makeState({ dotMin: 1, dotMax: 4 }))
    const big = dotGeometry(makeState({ dotMin: 1, dotMax: 16 }))
    expect(small.rMax).toBeCloseTo(2)
    expect(big.rMax).toBeCloseTo(8)
    expect(big.pitch / small.pitch).toBeCloseTo(4) // 占用比不变 → 步长同比放大
  })

  it('density 是整体精细度倍率：网格与点径同比缩放，占用比不变', () => {
    const base = dotGeometry(makeState({ dotMax: 8, dotMin: 2, occupancy: 0.8 }))
    const finer = dotGeometry(makeState({ dotMax: 8, dotMin: 2, occupancy: 0.8, density: 2 }))
    expect(finer.pitch).toBeCloseTo(base.pitch / 2)
    expect(finer.rMax).toBeCloseTo(base.rMax / 2)
    expect(finer.rMin).toBeCloseTo(base.rMin / 2)
    // 占用比（直径 / 步长）保持
    expect((finer.rMax * 2) / finer.pitch).toBeCloseTo((base.rMax * 2) / base.pitch)
  })

  it('点径随亮度单调递增，端点等于 rMin / rMax', () => {
    const geom = dotGeometry(makeState({ dotMin: 2, dotMax: 10 }))
    expect(dotRadiusFor(0, geom)).toBeCloseTo(geom.rMin)
    expect(dotRadiusFor(1, geom)).toBeCloseTo(geom.rMax)
    let prev = -1
    for (let v = 0; v <= 1.0001; v += 0.1) {
      const r = dotRadiusFor(v, geom)
      expect(r).toBeGreaterThan(prev)
      prev = r
    }
  })

  it('容错：dotMax < dotMin 不倒挂，非法值回退默认，步长有下限', () => {
    const inverted = dotGeometry(makeState({ dotMin: 12, dotMax: 4 }))
    expect(inverted.rMax).toBeCloseTo(inverted.rMin)
    expect(dotRadiusFor(1, inverted)).toBeCloseTo(dotRadiusFor(0, inverted))

    const nan = dotGeometry(makeState({ dotMin: NaN, dotMax: NaN, occupancy: NaN }))
    expect(nan.rMin).toBeCloseTo(DEFAULT_DOT_MIN / 2)
    expect(nan.rMax).toBeCloseTo(DEFAULT_DOT_MAX / 2)

    // 极端参数（超大 density + 极细点）→ 步长夹在下限，栅格不会爆掉
    const extreme = dotGeometry(makeState({ dotMax: 0.5, density: 8 }))
    expect(extreme.pitch).toBeGreaterThanOrEqual(1.5)
  })
})

describe('波点渲染', () => {
  it('每格一个圆点，圆心落在格心，按档批量 fill', () => {
    const state = makeState({ mask: 'dots' })
    primeGrid(state, [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9], 4, 2)
    const rec = createRecordingCtx()
    imageMaskEffect.render(rec.ctx, state, 0)
    expect(rec.arcs).toHaveLength(8)
    // 首格格心 = offset + 0.5*cell
    expect(rec.arcs[0].x).toBeCloseTo(5)
    expect(rec.arcs[0].y).toBeCloseTo(5)
    // 批量：fill 次数远少于格数（每档一次）
    expect(rec.fills).toBeLessThan(8)
    expect(rec.fills).toBe(rec.beginPaths)
  })

  it('亮部波点比暗部大（同一幅图里大小连续变化）', () => {
    const state = makeState({ mask: 'dots' })
    primeGrid(state, [0.2, 0.95], 2, 1)
    const rec = createRecordingCtx()
    imageMaskEffect.render(rec.ctx, state, 0)
    expect(rec.arcs).toHaveLength(2)
    // 落笔顺序按档升序：暗格（低档）先画
    const [dark, bright] = rec.arcs
    expect(bright.r).toBeGreaterThan(dark.r)
  })

  it('极暗格不落笔（保留背景），与字符画留空档一致', () => {
    const state = makeState({ mask: 'dots' })
    primeGrid(state, [0, 0.9], 2, 1)
    const rec = createRecordingCtx()
    imageMaskEffect.render(rec.ctx, state, 0)
    expect(rec.arcs).toHaveLength(1)
  })

  it('未采样时只铺底色，不画点', () => {
    const state = makeState({ mask: 'dots' })
    imageMaskEffect.init(state)
    const rec = createRecordingCtx()
    imageMaskEffect.render(rec.ctx, state, 0)
    expect(rec.arcs).toHaveLength(0)
    expect(rec.fills).toBe(0)
  })
})

describe('蒙版切换（同一条采样管线）', () => {
  it('init 记录所用蒙版，渲染按该蒙版走', () => {
    const asciiState = makeState()
    const dotState = makeState({ mask: 'dots' })
    imageMaskEffect.init(asciiState)
    imageMaskEffect.init(dotState)
    expect((asciiState.data as { maskName: string }).maskName).toBe('ascii')
    expect((dotState.data as { maskName: string }).maskName).toBe('dots')
  })

  it('同一亮度栅格：波点画圆点、字符画写字', () => {
    const rec = createRecordingCtx()
    const fillTexts: string[] = []
    const textCtx = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'canvas') return undefined
          if (prop === 'fillText') return (ch: string) => fillTexts.push(ch)
          if (prop === 'arc') return () => (rec.arcs.push({ x: 0, y: 0, r: 0 }), undefined)
          return () => {}
        },
        set: () => true,
      }
    ) as unknown as CanvasRenderingContext2D

    const asciiState = makeState()
    primeGrid(asciiState, [0.9, 0.9, 0.9, 0.9], 2, 2)
    imageMaskEffect.render(textCtx, asciiState, 0)
    expect(fillTexts).toHaveLength(4)
    expect(rec.arcs).toHaveLength(0)

    const dotState = makeState({ mask: 'dots' })
    primeGrid(dotState, [0.9, 0.9, 0.9, 0.9], 2, 2)
    imageMaskEffect.render(rec.ctx, dotState, 0)
    expect(rec.arcs).toHaveLength(4)
    expect(fillTexts).toHaveLength(4) // 字符画那 4 笔没有被波点重复计入
  })

  it('波点蒙版的栅格步长由 dotMax / occupancy 决定（与字符画的 8/density 不同源）', () => {
    const asciiState = makeState({ density: 1 })
    const dotState = makeState({ mask: 'dots', dotMax: 10, occupancy: 1, density: 1 })
    imageMaskEffect.init(asciiState)
    imageMaskEffect.init(dotState)
    const a = asciiState.data as { maxCols: number; cellW: number; cellH: number }
    const d = dotState.data as { maxCols: number; cellW: number; cellH: number }
    expect(a.cellW).toBeCloseTo(8)
    expect(a.cellH).toBeCloseTo(8 * 1.15)
    expect(d.cellW).toBeCloseTo(10)
    expect(d.cellH).toBeCloseTo(10) // 方形格
    expect(a.maxCols).toBe(Math.floor(40 / 8))
    expect(d.maxCols).toBe(Math.floor(40 / 10))
  })
})
