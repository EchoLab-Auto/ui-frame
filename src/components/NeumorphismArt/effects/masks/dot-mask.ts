import { clamp, type ArtState } from '../types'
import type { ImageMask } from './types'
import {
  BREATH_FREQ,
  LEVELS,
  LEVEL_BLANK,
  POINTER_DIST,
  POINTER_DIST2,
  buildCenters,
  buildPhaseTrigs,
  breatheAt,
  inkFor,
} from './shared'

/** 波点直径默认值（px，density=1 时）：暗部 / 亮部 */
export const DEFAULT_DOT_MIN = 1
export const DEFAULT_DOT_MAX = 8
/** 网格占用默认值：0.92 ≈ 最亮处波点几乎相切而不重叠 */
export const DEFAULT_OCCUPANCY = 0.92
/** 波点直径上限（px）：纯防呆，避免误传 10⁴ 让栅格爆掉 */
const DOT_LIMIT = 200
/**
 * 单元格边长下限（px）。低于此值栅格过密（2000px 宽 → 上千列），
 * 采样与逐格绘制的成本失去意义，故夹住。
 */
const PITCH_MIN = 1.5

export interface DotGeometry {
  /** 单元格边长（px） */
  pitch: number
  /** 暗部 / 亮部波点半径（px） */
  rMin: number
  rMax: number
}

function finite(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/**
 * 波点蒙版的几何：波点大小与「网格占用」。
 *
 * - `dotMin` / `dotMax` 是波点直径（px）：暗部用 dotMin、亮部用 dotMax，
 *   中间按亮度线性过渡——所以一幅图里波点是**连续变化的大小**；
 * - `occupancy` 是网格占用：最大波点直径占单元格边长的比例，
 *   于是栅格步长 `pitch = dotMax / occupancy`；占用 1 → 最亮处波点相切，
 *   0.5 → 波点只占半格（稀疏网格），越小点越稀；
 * - `density` 是整体精细度倍率，把网格与点径**同比缩放**（占用比不变）。
 */
export function dotGeometry(state: ArtState): DotGeometry {
  const density = clamp(finite(state.density, 1), 0.1, 8)
  const dotMin = clamp(finite(state.dotMin, DEFAULT_DOT_MIN), 0, DOT_LIMIT)
  const dotMax = clamp(finite(state.dotMax, DEFAULT_DOT_MAX), 0.5, DOT_LIMIT)
  const occupancy = clamp(finite(state.occupancy, DEFAULT_OCCUPANCY), 0.05, 2)
  const rMin = dotMin / 2 / density
  // dotMax < dotMin 时按同尺寸处理，避免「越亮越小」的倒挂
  const rMax = Math.max(rMin, dotMax / 2 / density)
  const pitch = Math.max(PITCH_MIN, dotMax / occupancy / density)
  return { pitch, rMin, rMax }
}

/** 亮度（0~1）→ 波点半径（px） */
export function dotRadiusFor(v: number, geom: DotGeometry): number {
  return geom.rMin + (geom.rMax - geom.rMin) * clamp(v, 0, 1)
}

interface DotScratch {
  /** 每格呼吸相位 (col+row)*0.12 */
  phase: Float32Array
  /** 相位的 sin/cos 预分解（每帧只算一次 sin(ωt)，逐格退化为乘加） */
  cosPhase: Float32Array
  sinPhase: Float32Array
  colX: Float32Array
  rowY: Float32Array
  /** 分档坐标缓冲（每帧复用，避免逐帧 GC） */
  lvX: number[][]
  lvY: number[][]
}

function emptyScratch(): DotScratch {
  return {
    phase: new Float32Array(0),
    cosPhase: new Float32Array(0),
    sinPhase: new Float32Array(0),
    colX: new Float32Array(0),
    rowY: new Float32Array(0),
    lvX: [],
    lvY: [],
  }
}

const TAU = Math.PI * 2

/**
 * 波点蒙版：亮度 → 圆点直径（半调网点的数码版）。
 *
 * 与字符画共用采样与呼吸，差异只在「每格画什么」：圆点没有字形，
 * 因此指针热区也能留在同一套分档批处理里（提亮 = 升档 = 变大），
 * 不需要字符画那趟逐格改字号的第三遍。
 */
export const dotMask: ImageMask = {
  name: 'dots',

  cell(state) {
    const { pitch } = dotGeometry(state)
    return { w: pitch, h: pitch }
  },

  create() {
    return emptyScratch()
  },

  build(grid, scratch) {
    const s = scratch as DotScratch
    const trigs = buildPhaseTrigs(grid.cols, grid.rows)
    s.phase = trigs.phase
    s.cosPhase = trigs.cosPhase
    s.sinPhase = trigs.sinPhase
    const centers = buildCenters(grid)
    s.colX = centers.colX
    s.rowY = centers.rowY
    s.lvX = []
    s.lvY = []
    for (let l = 0; l < LEVELS; l++) {
      s.lvX.push([])
      s.lvY.push([])
    }
  },

  draw(ctx, grid, state: ArtState, scratch, t) {
    const s = scratch as DotScratch
    if (s.colX.length !== grid.cols || s.phase.length !== grid.cols * grid.rows) {
      dotMask.build(grid, s)
    }
    const geom = dotGeometry(state)
    const tt = t * state.speed
    // 每帧只算一次 sin/cos(ωt)，逐格用和角公式展开（见 buildPhaseTrigs）
    const th = tt * BREATH_FREQ
    const sinT = Math.sin(th)
    const cosT = Math.cos(th)
    const cosPhase = s.cosPhase
    const sinPhase = s.sinPhase
    const usePointer = state.reactive && state.pointer.active
    const pointerX = state.pointer.x
    const pointerY = state.pointer.y
    const cols = grid.cols
    const rows = grid.rows
    const lum = grid.lum
    const colX = s.colX
    const rowY = s.rowY

    // ── pass 1：按亮度分档归位（指针热区靠升档变大，与普通格同批）──
    for (let l = 0; l < LEVELS; l++) {
      s.lvX[l].length = 0
      s.lvY[l].length = 0
    }
    let idx = 0
    for (let row = 0; row < rows; row++) {
      const y = rowY[row]
      for (let col = 0; col < cols; col++, idx++) {
        let v = lum[idx] * breatheAt(sinT, cosT, cosPhase, sinPhase, idx)
        if (usePointer) {
          const x = colX[col]
          const dx = x - pointerX
          const dy = y - pointerY
          const dist2 = dx * dx + dy * dy
          if (dist2 < POINTER_DIST2) v += (1 - Math.sqrt(dist2) / POINTER_DIST) * 0.45
        }
        const level = (v * LEVELS) | 0
        if (level < LEVEL_BLANK) continue
        const l = level < LEVELS ? level : LEVELS - 1
        s.lvX[l].push(colX[col])
        s.lvY[l].push(y)
      }
    }

    // ── pass 2：按档批量落笔（每档一次状态切换 + 一次 fill）──
    for (let l = LEVEL_BLANK; l < LEVELS; l++) {
      const xs = s.lvX[l]
      const count = xs.length
      if (count === 0) continue
      const vv = (l + 0.5) / LEVELS
      const r = dotRadiusFor(vv, geom)
      if (r <= 0) continue
      const ink = inkFor(vv, state)
      ctx.fillStyle = ink.style
      ctx.globalAlpha = ink.alpha
      const ys = s.lvY[l]
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const x = xs[i]
        const y = ys[i]
        // moveTo 到圆周起点再 arc：避免 arc 隐式连线产生跨点直达的怪形
        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, TAU)
      }
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },
}
