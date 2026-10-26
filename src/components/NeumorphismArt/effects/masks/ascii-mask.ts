import { clamp, type ArtState } from '../types'
import type { ImageMask } from './types'
import {
  LEVELS,
  LEVEL_BLANK,
  POINTER_DIST,
  POINTER_DIST2,
  BREATH_FREQ,
  buildCenters,
  buildPhaseTrigs,
  breatheAt,
  inkFor,
} from './shared'

/** 字符亮度梯度（从空到密） */
export const ASCII_RAMP = ' .·:-=+*#%@'

/** 亮度（0~1）映射到字符 */
export function charFor(v: number): string {
  const idx = Math.round(clamp(v, 0, 1) * (ASCII_RAMP.length - 1))
  return ASCII_RAMP[idx]
}

/** 等宽字体字符的宽高比修正（字符高约为宽的 1.15 倍） */
export const CHAR_RATIO = 1.15

interface AsciiScratch {
  /** 每格呼吸相位 (col+row)*0.12 */
  phase: Float32Array
  /** 相位的 sin/cos 预分解（每帧只算一次 sin(ωt)，逐格退化为乘加） */
  cosPhase: Float32Array
  sinPhase: Float32Array
  /** 每列 / 每行中心坐标 */
  colX: Float32Array
  rowY: Float32Array
  /** 分档坐标缓冲（每帧填充后复用，避免逐帧 GC） */
  lvX: number[][]
  lvY: number[][]
  /** 指针热区缓冲（容量 = 栅格上界） */
  hotX: Float32Array
  hotY: Float32Array
  hotV: Float32Array
  hotB: Float32Array
}

function emptyScratch(): AsciiScratch {
  return {
    phase: new Float32Array(0),
    cosPhase: new Float32Array(0),
    sinPhase: new Float32Array(0),
    colX: new Float32Array(0),
    rowY: new Float32Array(0),
    lvX: [],
    lvY: [],
    hotX: new Float32Array(0),
    hotY: new Float32Array(0),
    hotV: new Float32Array(0),
    hotB: new Float32Array(0),
  }
}

/**
 * 字符画蒙版：亮度 → 字符梯度（` .·:-=+*#%@`）。
 *
 * 渲染分三段：按亮度分档归位 → 按档批量下笔 → 指针热区逐格放大。
 * pass 1 完全不含 canvas 调用；状态切换从「逐格」降为「每档」。
 */
export const asciiMask: ImageMask = {
  name: 'ascii',

  cell(state) {
    const w = clamp(8 / state.density, 5, 14)
    return { w, h: w * CHAR_RATIO }
  },

  create() {
    return emptyScratch()
  },

  build(grid, scratch) {
    const s = scratch as AsciiScratch
    const n = Math.max(1, grid.cols * grid.rows)
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
    s.hotX = new Float32Array(n)
    s.hotY = new Float32Array(n)
    s.hotV = new Float32Array(n)
    s.hotB = new Float32Array(n)
  },

  draw(ctx, grid, state: ArtState, scratch, t) {
    const s = scratch as AsciiScratch
    // 懒校验：几何与缓冲不一致时重建（测试手工构造 data 等异常路径）
    if (s.colX.length !== grid.cols || s.phase.length !== grid.cols * grid.rows) {
      asciiMask.build(grid, s)
    }

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

    // ── pass 1：按亮度分档归位（指针热区单列，区域有界）──
    for (let l = 0; l < LEVELS; l++) {
      s.lvX[l].length = 0
      s.lvY[l].length = 0
    }
    let hotCount = 0
    let idx = 0
    for (let row = 0; row < rows; row++) {
      const y = rowY[row]
      for (let col = 0; col < cols; col++, idx++) {
        // 呼吸：亮度随时间轻微波动（相位随位置错开，形成缓慢流光）
        const v = lum[idx] * breatheAt(sinT, cosT, cosPhase, sinPhase, idx)
        if (usePointer) {
          const x = colX[col]
          const dx = x - pointerX
          const dy = y - pointerY
          const dist2 = dx * dx + dy * dy
          if (dist2 < POINTER_DIST2) {
            // 指针提亮（热区：逐格字体放大，区域有界于 POINTER_DIST 半径）
            const boost = 1 - Math.sqrt(dist2) / POINTER_DIST
            s.hotX[hotCount] = x
            s.hotY[hotCount] = y
            s.hotV[hotCount] = v + boost * 0.35
            s.hotB[hotCount] = boost
            hotCount++
            continue
          }
        }
        const level = (v * LEVELS) | 0
        if (level < LEVEL_BLANK) continue // 空格档（与 charFor 的 ' ' 区间对齐）
        const l = level < LEVELS ? level : LEVELS - 1
        s.lvX[l].push(colX[col])
        s.lvY[l].push(y)
      }
    }

    // ── pass 2：按档批量下笔（每档一次状态切换；基准字体每帧一次）──
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${grid.cellH}px ui-monospace, monospace`
    for (let l = LEVEL_BLANK; l < LEVELS; l++) {
      const xs = s.lvX[l]
      const count = xs.length
      if (count === 0) continue
      const vv = (l + 0.5) / LEVELS
      const ch = charFor(vv)
      if (ch === ' ') continue
      const ink = inkFor(vv, state)
      ctx.fillStyle = ink.style
      ctx.globalAlpha = ink.alpha
      const ys = s.lvY[l]
      for (let i = 0; i < count; i++) ctx.fillText(ch, xs[i], ys[i])
    }

    // ── pass 3：指针热区（提亮 + 放大字形）──
    if (hotCount > 0) {
      for (let i = 0; i < hotCount; i++) {
        const v = s.hotV[i]
        const ch = charFor(v)
        if (ch === ' ') continue
        const ink = inkFor(v, state)
        ctx.fillStyle = ink.style
        ctx.globalAlpha = ink.alpha
        ctx.font = `${grid.cellH * (1 + s.hotB[i] * 0.25)}px ui-monospace, monospace`
        ctx.fillText(ch, s.hotX[i], s.hotY[i])
      }
    }
    ctx.globalAlpha = 1
  },
}
