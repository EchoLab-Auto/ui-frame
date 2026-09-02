import { clamp, type ArtEffect } from './types'

/** 字符亮度梯度（从空到密） */
export const ASCII_RAMP = ' .·:-=+*#%@'

/** 亮度（0~1）映射到字符 */
export function charFor(v: number): string {
  const idx = Math.round(clamp(v, 0, 1) * (ASCII_RAMP.length - 1))
  return ASCII_RAMP[idx]
}

/** 等宽字体字符的宽高比修正（字符高约为宽的 1.15 倍） */
const CHAR_RATIO = 1.15

interface AsciiData {
  /** 按密度算出的最大栅格（画布铺满时的上限） */
  maxCols: number
  maxRows: number
  /** 实际使用的栅格（按原图比例适配后） */
  cols: number
  rows: number
  cellW: number
  cellH: number
  /** 居中偏移 */
  offsetX: number
  offsetY: number
  /** 每格亮度（0~1） */
  lum: Float32Array
  ready: boolean
}

const POINTER_DIST = 120

/**
 * 字符画：加载图片采样亮度映射为字符栅格；栅格保持原图宽高比
 * 适配画布（contain）并居中，不做拉伸。字符随时间轻微呼吸，
 * reactive 时指针附近的字符提亮放大。
 */
export const asciiEffect: ArtEffect = {
  init(state) {
    const cell = clamp(8 / state.density, 5, 14)
    state.data = {
      maxCols: Math.max(1, Math.floor(state.width / cell)),
      maxRows: Math.max(1, Math.floor(state.height / (cell * CHAR_RATIO))),
      cols: 0,
      rows: 0,
      cellW: 0,
      cellH: 0,
      offsetX: 0,
      offsetY: 0,
      lum: new Float32Array(0),
      ready: false,
    } satisfies AsciiData
  },

  async prepare(state) {
    const d = state.data as AsciiData
    if (!state.src || typeof Image === 'undefined') return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>(resolve => {
      img.onload = () => resolve()
      img.onerror = () => resolve() // 加载失败保持空白背景，不中断渲染
      img.src = state.src as string
    })
    if (!img.width) return

    // 按原图宽高比适配（contain）：先按宽度适配，超高则改按高度适配
    const imgRatio = img.width / img.height
    const cellW = state.width / d.maxCols
    const cellH = cellW * CHAR_RATIO
    let cols = d.maxCols
    let rows = Math.round(cols / (CHAR_RATIO * imgRatio))
    if (rows > d.maxRows) {
      rows = d.maxRows
      cols = Math.round((rows * CHAR_RATIO * imgRatio) / 1)
    }
    d.cols = Math.max(1, Math.min(cols, d.maxCols))
    d.rows = Math.max(1, rows)
    d.cellW = cellW
    d.cellH = cellH
    d.offsetX = (state.width - d.cols * cellW) / 2
    d.offsetY = (state.height - d.rows * cellH) / 2

    const off = document.createElement('canvas')
    off.width = d.cols
    off.height = d.rows
    const octx = off.getContext('2d')
    if (!octx) return
    // 离屏尺寸与栅格一致（比例相同），drawImage 不产生形变
    octx.drawImage(img, 0, 0, d.cols, d.rows)
    const pixels = octx.getImageData(0, 0, d.cols, d.rows).data
    const lum = new Float32Array(d.cols * d.rows)
    for (let i = 0; i < lum.length; i++) {
      const p = i * 4
      lum[i] = (0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]) / 255
    }
    // 亮度归一化（直方图拉伸）：图片自身的最暗/最亮映射到梯度两端，
    // 避免中间调为主的图片只剩稀疏中段字符
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
    d.lum = lum
    d.ready = true
  },

  render(ctx, state, t) {
    const d = state.data as AsciiData
    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)
    if (!d.ready) return

    const tt = t * state.speed
    const usePointer = state.reactive && state.pointer.active
    const primary = state.palette[0] ?? state.fg

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let row = 0; row < d.rows; row++) {
      for (let col = 0; col < d.cols; col++) {
        const x = d.offsetX + (col + 0.5) * d.cellW
        const y = d.offsetY + (row + 0.5) * d.cellH
        let v = d.lum[row * d.cols + col]

        // 呼吸：亮度随时间轻微波动（相位随位置错开，形成缓慢流光）
        v *= 0.85 + 0.15 * Math.sin(tt * 1.6 + (col + row) * 0.12)

        // 指针提亮
        let boost = 0
        if (usePointer) {
          const dist = Math.hypot(x - state.pointer.x, y - state.pointer.y)
          if (dist < POINTER_DIST) boost = 1 - dist / POINTER_DIST
          v += boost * 0.35
        }

        const ch = charFor(v)
        if (ch === ' ') continue
        if (v > 0.78) {
          ctx.fillStyle = primary
          ctx.globalAlpha = 1
        } else {
          ctx.fillStyle = state.fg
          ctx.globalAlpha = clamp(0.3 + 0.7 * v, 0, 1)
        }
        ctx.font = `${d.cellH * (1 + boost * 0.25)}px ui-monospace, monospace`
        ctx.fillText(ch, x, y)
      }
    }
    ctx.globalAlpha = 1
  },
}
