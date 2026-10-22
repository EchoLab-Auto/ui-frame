import { describe, expect, it } from 'vitest'
import {
  pointsToClipPath,
  pointsToPathData,
  sampleCornerOffset,
  squircleClipPath,
  squirclePoints,
  squirclePower,
  superellipseCorner,
  type SquirclePoint,
} from './squircle'

/** 屏幕左下角超椭圆（角在原点、y 向上），用来验证偏移曲线到它的距离 */
function screenArc(R: number, exponent: number, count = 2000): SquirclePoint[] {
  const s = squirclePower(exponent)
  const pts: SquirclePoint[] = []
  for (let i = 0; i <= count; i += 1) {
    const t = (i / count) * (Math.PI / 2)
    pts.push([R - R * Math.cos(t) ** s, R - R * Math.sin(t) ** s])
  }
  return pts
}

function distToPolyline(p: SquirclePoint, line: readonly SquirclePoint[]): number {
  let best = Infinity
  for (const q of line) {
    const d = Math.hypot(p[0] - q[0], p[1] - q[1])
    if (d < best) best = d
  }
  return best
}

describe('squirclePower', () => {
  it('n=2 → 1（圆弧），n 越大幂次越小（更贴角）', () => {
    expect(squirclePower(2)).toBeCloseTo(1, 10)
    expect(squirclePower(2.5)).toBeCloseTo(0.8, 10)
    expect(squirclePower(6)).toBeLessThan(squirclePower(2.5))
  })

  it('指数下限钳到 2（n<2 是星形，不是圆角语义）', () => {
    expect(squirclePower(1)).toBeCloseTo(1, 10)
    expect(squirclePower(0)).toBeCloseTo(1, 10)
  })
})

describe('superellipseCorner', () => {
  it('TL 角：起点在左边缘、终点在顶边缘', () => {
    const pts = superellipseCorner(0, 0, 20, 20, 1, 1, 2.5, 8)
    expect(pts[0][0]).toBeCloseTo(0, 6)
    expect(pts[0][1]).toBeCloseTo(20, 6)
    const last = pts[pts.length - 1]
    expect(last[0]).toBeCloseTo(20, 6)
    expect(last[1]).toBeCloseTo(0, 6)
  })

  it('全部点落在角的外接矩形内', () => {
    const pts = superellipseCorner(100, 100, 20, 30, -1, -1, 2.5, 16)
    for (const [x, y] of pts) {
      expect(x).toBeLessThanOrEqual(100.001)
      expect(x).toBeGreaterThanOrEqual(100 - 30 - 0.001)
      expect(y).toBeLessThanOrEqual(100.001)
      expect(y).toBeGreaterThanOrEqual(100 - 30 - 0.001)
    }
  })
})

describe('squirclePoints', () => {
  const opts = { width: 200, height: 120, radius: 24, exponent: 2.5, steps: 8 }

  it('点数为 4×(steps+1)，且首尾接缝闭合', () => {
    const pts = squirclePoints(opts)
    expect(pts.length).toBe(4 * (8 + 1))
    // 顺时针：首点在左边缘（TL 弧起点），末点在……同样贴近左边缘
    expect(pts[0][0]).toBeCloseTo(0, 6)
    expect(pts[0][1]).toBeCloseTo(24, 6)
  })

  it('所有点都在盒内', () => {
    for (const [x, y] of squirclePoints(opts)) {
      expect(x).toBeGreaterThanOrEqual(-0.001)
      expect(x).toBeLessThanOrEqual(opts.width + 0.001)
      expect(y).toBeGreaterThanOrEqual(-0.001)
      expect(y).toBeLessThanOrEqual(opts.height + 0.001)
    }
  })

  it('四角对称：180° 旋转后重合', () => {
    const pts = squirclePoints(opts)
    const rotated = pts.map(([x, y]) => [opts.width - x, opts.height - y] as SquirclePoint)
    for (const p of pts) {
      const near = rotated.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 2.5)
      expect(near).toBe(true)
    }
  })

  it('半径被钳到 min(w/2, h/2)', () => {
    const pts = squirclePoints({ width: 100, height: 40, radius: 999, steps: 8 })
    const ys = pts.map(p => p[1])
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-0.001)
    expect(Math.max(...ys)).toBeLessThanOrEqual(40.001)
    // 半径被钳成 20（半高）→ TL 弧起点 y = 20
    expect(pts[0][1]).toBeCloseTo(20, 6)
  })

  it('radius=0 退化为矩形（所有点都在边框上）', () => {
    const pts = squirclePoints({ width: 100, height: 40, radius: 0, steps: 4 })
    for (const [x, y] of pts) {
      const onEdge =
        Math.abs(x) < 1e-6 ||
        Math.abs(x - 100) < 1e-6 ||
        Math.abs(y) < 1e-6 ||
        Math.abs(y - 40) < 1e-6
      expect(onEdge).toBe(true)
    }
  })
})

describe('path 输出', () => {
  it('pointsToPathData 以 M 开头、Z 结尾，命令数与点数一致', () => {
    const pts = squirclePoints({ width: 100, height: 60, radius: 12, steps: 4 })
    const d = pointsToPathData(pts)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect((d.match(/[ML]/g) ?? []).length).toBe(pts.length)
    expect(d).not.toMatch(/NaN|Infinity/)
  })

  it('pointsToClipPath / squircleClipPath 包成 CSS path() 函数', () => {
    expect(
      pointsToClipPath([
        [0, 0],
        [10, 0],
        [10, 10],
      ])
    ).toMatch(/^path\("M0 0 L10 0 L10 10 Z"\)$/)
    expect(squircleClipPath({ width: 100, height: 60, radius: 10 })).toMatch(/^path\("M/)
  })

  it('精度参数生效（precision=1 时最多 1 位小数）', () => {
    const d = pointsToPathData(squirclePoints({ width: 100, height: 60, radius: 7, steps: 3 }), 1)
    for (const n of d.match(/-?\d+\.\d+/g) ?? []) {
      expect(n.split('.')[1].length).toBeLessThanOrEqual(1)
    }
  })
})

describe('sampleCornerOffset', () => {
  it('曲线上每点到屏幕弧的距离恒等于 inset（这才是"等间隙"）', () => {
    const R = 74.5
    const inset = 18.73
    const arc = screenArc(R, 2.5)
    const offset = sampleCornerOffset(R, inset, 2.5, 40)
    const gaps = offset.map(p => distToPolyline(p, arc))
    expect(Math.min(...gaps)).toBeCloseTo(inset, 0)
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.3)
  })

  it('起点落在屏幕左边、终点落在屏幕底边', () => {
    const pts = sampleCornerOffset(74.5, 18.73, 2.5, 40)
    expect(pts[0][0]).toBeCloseTo(18.73, 1)
    expect(pts[pts.length - 1][1]).toBeCloseTo(18.73, 1)
  })

  it('inset 越大曲线越深入屏幕内部（单调）', () => {
    const a = sampleCornerOffset(74.5, 10, 2.5, 20)
    const b = sampleCornerOffset(74.5, 20, 2.5, 20)
    // 屏幕系里角在原点：x+y 越大 = 离角越远 = 越往屏幕内部退
    const mid = 10
    expect(b[mid][0] + b[mid][1]).toBeGreaterThan(a[mid][0] + a[mid][1])
  })

  it('用"同族超椭圆（R−inset）"近似会明显偏小 —— 证明偏移不是内切', () => {
    const R = 74.5
    const inset = 18.73
    const offset = sampleCornerOffset(R, inset, 2.5, 40)
    const naive = screenArc(R - inset, 2.5)
    const mid = offset[20]
    const dNaive = distToPolyline(mid, naive)
    // 中点处两者相差应在 1px 量级（面板实测整条曲线最大差 2.65px）
    expect(dNaive).toBeGreaterThan(0.5)
  })
})
