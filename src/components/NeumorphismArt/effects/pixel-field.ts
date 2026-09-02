import { createRng, type ArtEffect } from './types'

interface PixelFieldData {
  cols: number
  rows: number
  spacing: number
  /** 每个像素点的随机相位（0~2π），由 seed 决定 */
  phases: Float32Array
  /** 每个点使用的调色板索引 */
  colorIdx: Uint8Array
}

/** 单个像素点的亮度（0~1）：径向波 + 随机相位；指针激活时改为相对指针的距离场 */
export function pixelBrightness(
  x: number,
  y: number,
  cx: number,
  cy: number,
  phase: number,
  t: number
): number {
  const d = Math.hypot(x - cx, y - cy)
  return 0.5 + 0.5 * Math.sin(d * 0.045 - t * 2 + phase)
}

export const pixelFieldEffect: ArtEffect = {
  init(state) {
    const spacing = Math.max(18, 26 / state.density)
    const cols = Math.ceil(state.width / spacing) + 1
    const rows = Math.ceil(state.height / spacing) + 1
    const rng = createRng(state.seed)
    const count = cols * rows
    const phases = new Float32Array(count)
    const colorIdx = new Uint8Array(count)
    for (let i = 0; i < count; i++) {
      phases[i] = rng() * Math.PI * 2
      colorIdx[i] = rng() < 0.8 ? 0 : 1 % Math.max(state.palette.length, 1)
    }
    state.data = { cols, rows, spacing, phases, colorIdx } satisfies PixelFieldData
  },

  render(ctx, state, t) {
    const d = state.data as PixelFieldData
    const tt = t * state.speed
    const cx = state.reactive && state.pointer.active ? state.pointer.x : state.width / 2
    const cy = state.reactive && state.pointer.active ? state.pointer.y : state.height / 2
    const colorCount = Math.max(state.palette.length, 1)

    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)

    for (let row = 0; row < d.rows; row++) {
      for (let col = 0; col < d.cols; col++) {
        const i = row * d.cols + col
        const v = pixelBrightness(col * d.spacing, row * d.spacing, cx, cy, d.phases[i], tt)
        const r = d.spacing * 0.14 * (0.4 + 0.8 * v)
        ctx.globalAlpha = 0.35 + 0.6 * v
        ctx.fillStyle = state.palette[d.colorIdx[i] % colorCount]
        ctx.beginPath()
        ctx.arc(col * d.spacing, row * d.spacing, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  },
}
