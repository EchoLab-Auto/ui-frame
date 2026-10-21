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

/**
 * 亮度量化档数（2026-10 滚动卡顿优化）：同档字符与透明度一致，绘制按档
 * 批量下笔——canvas 状态切换从「逐格 ~4 次（含逐格拼接/解析字体串）」降为
 * 「每档 ~2 次 + 基准字体每帧 1 次」。5600 格栅格 @60fps 的逐帧主线程成本
 * 显著下降。32 档对 10 级字符梯度与连续透明度均为不可感知误差
 * （透明度误差 ≤ 0.7/64，字符与逐格求值至多差一档）。
 */
const LEVELS = 32

/** 呼吸基频（弧度/秒）与相位步长（随位置错开形成流光） */
const BREATH_FREQ = 1.6
const BREATH_PHASE_STEP = 0.12

const POINTER_DIST = 120
const POINTER_DIST2 = POINTER_DIST * POINTER_DIST

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

  // ---- 预计算与复用缓冲（渲染热路径零乘法、零分配）----
  /** 每格呼吸相位 (col+row)*0.12 */
  phase: Float32Array
  /** 每列 / 每行中心坐标 */
  colX: Float32Array
  rowY: Float32Array
  /** 分档坐标缓冲（每帧填充后复用，避免逐帧 GC） */
  lvX: number[][]
  lvY: number[][]
  /** 指针热区缓冲（容量 = 最大栅格上界） */
  hotX: Float32Array
  hotY: Float32Array
  hotV: Float32Array
  hotB: Float32Array
}

function emptyData(): AsciiData {
  return {
    maxCols: 1,
    maxRows: 1,
    cols: 0,
    rows: 0,
    cellW: 0,
    cellH: 0,
    offsetX: 0,
    offsetY: 0,
    lum: new Float32Array(0),
    ready: false,
    phase: new Float32Array(0),
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

/** 由当前几何（cols/rows/cellW/cellH/offsetX/offsetY）重建派生缓冲；
 *  prepare 显式调用一次；render 也做懒校验（测试与异常路径自愈）。 */
function buildBuffers(d: AsciiData) {
  const n = Math.max(1, d.cols * d.rows)
  d.phase = new Float32Array(n)
  for (let r = 0, i = 0; r < d.rows; r++) {
    for (let c = 0; c < d.cols; c++, i++) d.phase[i] = (c + r) * BREATH_PHASE_STEP
  }
  d.colX = new Float32Array(Math.max(1, d.cols))
  for (let c = 0; c < d.cols; c++) d.colX[c] = d.offsetX + (c + 0.5) * d.cellW
  d.rowY = new Float32Array(Math.max(1, d.rows))
  for (let r = 0; r < d.rows; r++) d.rowY[r] = d.offsetY + (r + 0.5) * d.cellH
  d.lvX = []
  d.lvY = []
  for (let l = 0; l < LEVELS; l++) {
    d.lvX.push([])
    d.lvY.push([])
  }
  d.hotX = new Float32Array(n)
  d.hotY = new Float32Array(n)
  d.hotV = new Float32Array(n)
  d.hotB = new Float32Array(n)
}

/**
 * 字符画：加载图片采样亮度映射为字符栅格；栅格保持原图宽高比
 * 适配画布（contain）并居中，不做拉伸。字符随时间轻微呼吸，
 * reactive 时指针附近的字符提亮放大。
 *
 * 渲染分三段（见 LEVELS 注释）：按亮度分档归位 → 按档批量下笔 →
 * 指针热区逐格放大。pass 1 完全不含 canvas 调用。
 */
export const asciiEffect: ArtEffect = {
  init(state) {
    const cell = clamp(8 / state.density, 5, 14)
    const d = emptyData()
    d.maxCols = Math.max(1, Math.floor(state.width / cell))
    d.maxRows = Math.max(1, Math.floor(state.height / (cell * CHAR_RATIO)))
    state.data = d
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
    buildBuffers(d)
    d.ready = true
  },

  render(ctx, state, t) {
    const d = state.data as AsciiData
    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)
    if (!d.ready) return
    // 懒校验：几何与缓冲不一致时重建（测试手工构造 data 等异常路径）
    if (d.colX.length !== d.cols || d.phase.length !== d.cols * d.rows) buildBuffers(d)

    const tt = t * state.speed
    const usePointer = state.reactive && state.pointer.active
    const pointerX = state.pointer.x
    const pointerY = state.pointer.y
    const primary = state.palette[0] ?? state.fg
    const cols = d.cols
    const rows = d.rows
    const lum = d.lum
    const phase = d.phase
    const colX = d.colX
    const rowY = d.rowY

    // ── pass 1：按亮度分档归位（指针热区单列，区域有界）──
    for (let l = 0; l < LEVELS; l++) {
      d.lvX[l].length = 0
      d.lvY[l].length = 0
    }
    let hotCount = 0
    let idx = 0
    for (let row = 0; row < rows; row++) {
      const y = rowY[row]
      for (let col = 0; col < cols; col++, idx++) {
        // 呼吸：亮度随时间轻微波动（相位随位置错开，形成缓慢流光）
        const v = lum[idx] * (0.85 + 0.15 * Math.sin(tt * BREATH_FREQ + phase[idx]))
        if (usePointer) {
          const x = colX[col]
          const dx = x - pointerX
          const dy = y - pointerY
          const dist2 = dx * dx + dy * dy
          if (dist2 < POINTER_DIST2) {
            // 指针提亮（热区：逐格字体放大，区域有界于 120px 半径）
            const boost = 1 - Math.sqrt(dist2) / POINTER_DIST
            d.hotX[hotCount] = x
            d.hotY[hotCount] = y
            d.hotV[hotCount] = v + boost * 0.35
            d.hotB[hotCount] = boost
            hotCount++
            continue
          }
        }
        const level = (v * LEVELS) | 0
        if (level < 2) continue // 空格档（与 charFor 的 ' ' 区间对齐）
        const l = level < LEVELS ? level : LEVELS - 1
        d.lvX[l].push(colX[col])
        d.lvY[l].push(y)
      }
    }

    // ── pass 2：按档批量下笔（每档一次状态切换；基准字体每帧一次）──
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${d.cellH}px ui-monospace, monospace`
    for (let l = 2; l < LEVELS; l++) {
      const xs = d.lvX[l]
      const count = xs.length
      if (count === 0) continue
      const vv = (l + 0.5) / LEVELS
      const ch = charFor(vv)
      if (ch === ' ') continue
      if (vv > 0.78) {
        ctx.fillStyle = primary
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = state.fg
        ctx.globalAlpha = clamp(0.3 + 0.7 * vv, 0, 1)
      }
      const ys = d.lvY[l]
      for (let i = 0; i < count; i++) ctx.fillText(ch, xs[i], ys[i])
    }

    // ── pass 3：指针热区（提亮 + 放大字形）──
    if (hotCount > 0) {
      for (let i = 0; i < hotCount; i++) {
        const v = d.hotV[i]
        const ch = charFor(v)
        if (ch === ' ') continue
        if (v > 0.78) {
          ctx.fillStyle = primary
          ctx.globalAlpha = 1
        } else {
          ctx.fillStyle = state.fg
          ctx.globalAlpha = clamp(0.3 + 0.7 * v, 0, 1)
        }
        ctx.font = `${d.cellH * (1 + d.hotB[i] * 0.25)}px ui-monospace, monospace`
        ctx.fillText(ch, d.hotX[i], d.hotY[i])
      }
    }
    ctx.globalAlpha = 1
  },
}
