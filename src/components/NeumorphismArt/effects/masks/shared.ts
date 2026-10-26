import type { ArtState } from '../types'
import type { MaskGrid } from './types'

/**
 * 图片蒙版的共用部件：采样、栅格适配、呼吸相位、指针热区、上色。
 *
 * 这些逻辑对「每格画什么」无感——字符画与波点共用同一份，避免两套实现
 * 在直方图拉伸、呼吸节奏、指针半径上逐渐跑偏。
 */

/**
 * 亮度量化档数（2026-10 滚动卡顿优化）：同档字符与透明度一致，绘制按档
 * 批量下笔——canvas 状态切换从「逐格 ~4 次（含逐格拼接/解析字体串）」降为
 * 「每档 ~2 次 + 基准字体每帧 1 次」。5600 格栅格 @60fps 的逐帧主线程成本
 * 显著下降。32 档对 10 级字符梯度与连续半径/透明度均为不可感知误差
 * （透明度误差 ≤ 0.7/64，字符与逐格求值至多差一档）。
 */
export const LEVELS = 32

/** 低于该档视为空白（暗部保留背景，不画） */
export const LEVEL_BLANK = 2

/** 呼吸基频（弧度/秒）与相位步长（随位置错开形成流光） */
export const BREATH_FREQ = 1.6
export const BREATH_PHASE_STEP = 0.12

/** 指针热区半径（px） */
export const POINTER_DIST = 120
export const POINTER_DIST2 = POINTER_DIST * POINTER_DIST

/** 加载图片；失败也 resolve（保持空白背景，不打断渲染循环） */
export async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof Image === 'undefined') return null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>(resolve => {
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
  return img.width ? img : null
}

/**
 * contain 适配：按原图宽高比算栅格行列（不超过画布能容纳的上限），不拉伸。
 * 先按宽度铺满，超高则改按高度铺满。
 */
export function fitGrid(
  imgRatio: number,
  cellW: number,
  cellH: number,
  maxCols: number,
  maxRows: number
): { cols: number; rows: number } {
  let cols = maxCols
  let rows = Math.round((cols * cellW) / (cellH * imgRatio))
  if (rows > maxRows) {
    rows = maxRows
    cols = Math.round((rows * cellH * imgRatio) / cellW)
  }
  return {
    cols: Math.max(1, Math.min(cols, maxCols)),
    rows: Math.max(1, Math.min(rows, maxRows)),
  }
}

/**
 * 采样亮度：把图片缩到栅格尺寸（离屏 canvas，比例相同故无形变），
 * 逐格取 Rec.601 加权亮度，再按自身 [min, max] 直方图拉伸到 0~1
 * （中间调图片也能用满整个梯度）。
 */
export function sampleLuminance(
  img: HTMLImageElement,
  cols: number,
  rows: number
): Float32Array | null {
  if (typeof document === 'undefined') return null
  const off = document.createElement('canvas')
  off.width = cols
  off.height = rows
  const octx = off.getContext('2d')
  if (!octx) return null
  octx.drawImage(img, 0, 0, cols, rows)
  const pixels = octx.getImageData(0, 0, cols, rows).data
  const lum = new Float32Array(cols * rows)
  for (let i = 0; i < lum.length; i++) {
    const p = i * 4
    lum[i] = (0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]) / 255
  }
  let min = 1
  let max = 0
  for (let i = 0; i < lum.length; i++) {
    if (lum[i] < min) min = lum[i]
    if (lum[i] > max) max = lum[i]
  }
  const range = max - min
  if (range > 0.02) {
    for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - min) / range
  }
  return lum
}

/** 呼吸相位的三角预分解 */
export interface PhaseTrigs {
  /** (col+row)·步长 */
  phase: Float32Array
  cosPhase: Float32Array
  sinPhase: Float32Array
}

/**
 * 预计算每格的呼吸相位，并把 sin/cos 一并存下。
 *
 * 呼吸是 `sin(ω·t + phase)`，逐格算 sin 意味着每帧几千次三角调用。用和角公式
 * 展开成 `sin(ωt)·cos(phase) + cos(ωt)·sin(phase)` 后，每帧只需算一次
 * `sin(ωt)`/`cos(ωt)`，逐格退化为两次乘法一次加法——省掉 99.9% 的三角运算，
 * 且数学上完全等价（Float32 存储带来约 1e-7 的相位误差，肉眼不可见）。
 */
export function buildPhaseTrigs(cols: number, rows: number): PhaseTrigs {
  const n = Math.max(1, cols * rows)
  const phase = new Float32Array(n)
  const cosPhase = new Float32Array(n)
  const sinPhase = new Float32Array(n)
  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      const p = (c + r) * BREATH_PHASE_STEP
      phase[i] = p
      cosPhase[i] = Math.cos(p)
      sinPhase[i] = Math.sin(p)
    }
  }
  return { phase, cosPhase, sinPhase }
}

/**
 * 呼吸系数：`0.85 + 0.15·sin(ωt + phase)`。
 * `sinT`/`cosT` 是当前帧的 `sin(ωt)`/`cos(ωt)`，逐格只做乘加（见 buildPhaseTrigs）。
 */
export function breatheAt(
  sinT: number,
  cosT: number,
  cosPhase: Float32Array,
  sinPhase: Float32Array,
  i: number
): number {
  return 0.85 + 0.15 * (sinT * cosPhase[i] + cosT * sinPhase[i])
}

/** 每列 / 每行的中心坐标（px） */
export function buildCenters(grid: MaskGrid): { colX: Float32Array; rowY: Float32Array } {
  const colX = new Float32Array(Math.max(1, grid.cols))
  for (let c = 0; c < grid.cols; c++) colX[c] = grid.offsetX + (c + 0.5) * grid.cellW
  const rowY = new Float32Array(Math.max(1, grid.rows))
  for (let r = 0; r < grid.rows; r++) rowY[r] = grid.offsetY + (r + 0.5) * grid.cellH
  return { colX, rowY }
}

/** 上色：高亮用主色不透明，其余用文字色按亮度分层（两种蒙版共用，观感一致） */
export function inkFor(v: number, state: ArtState): { style: string; alpha: number } {
  const primary = state.palette[0] ?? state.fg
  if (v > 0.78) return { style: primary, alpha: 1 }
  const alpha = 0.3 + 0.7 * v
  return { style: state.fg, alpha: alpha < 0 ? 0 : alpha > 1 ? 1 : alpha }
}
