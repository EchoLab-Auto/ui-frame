import type { ArtEffect, ArtMaskName, ArtState } from './types'
import { ART_MASKS, resolveMask, type MaskGrid } from './masks'
import { fitGrid, loadImage, sampleLuminance } from './masks/shared'

/**
 * 图片蒙版渲染管线：图片 → 亮度栅格（contain 适配 + 直方图拉伸）→ 蒙版逐格绘制。
 *
 * 「每格画什么」交给蒙版（`masks/`）：字符画、波点，以及以后新增的任意点阵图案。
 * 这一层只做与图案无关的事：采样、居中、呼吸、指针、上色顺序。
 */

interface MaskData extends MaskGrid {
  /** 画布能容纳的栅格上界（init 时按单元格尺寸算出） */
  maxCols: number
  maxRows: number
  /** 建此 data 时使用的蒙版（蒙版切换需重新 init） */
  maskName: ArtMaskName
  /** 蒙版私有缓冲 */
  scratch: unknown
  /** 当前缓冲对应的几何签名；变化时重建 */
  builtFor: string
}

/** 几何签名：任一维度变化都需要重建派生缓冲（坐标、相位、分档数组） */
function signature(d: MaskData): string {
  return `${d.cols}|${d.rows}|${d.cellW}|${d.cellH}|${d.offsetX}|${d.offsetY}`
}

function ensureBuilt(maskName: ArtMaskName, d: MaskData) {
  const sig = signature(d)
  if (d.builtFor === sig) return
  ART_MASKS[maskName].build(d, d.scratch)
  d.builtFor = sig
}

function asData(state: ArtState): MaskData | null {
  const d = state.data as MaskData | null
  return d && typeof d === 'object' && 'maxCols' in d ? d : null
}

/**
 * 图片蒙版效果（`effect: 'ascii'`）。
 *
 * 名字沿用 `ascii` 是因为它最先只有字符画；现在它是「图片 → 蒙版」管线，
 * 具体图案由 `state.mask` 决定（`ascii` / `dots`）。
 */
export const imageMaskEffect: ArtEffect = {
  init(state) {
    const mask = resolveMask(state.mask)
    const cell = mask.cell(state)
    state.data = {
      maxCols: Math.max(1, Math.floor(state.width / cell.w)),
      maxRows: Math.max(1, Math.floor(state.height / cell.h)),
      cols: 0,
      rows: 0,
      cellW: cell.w,
      cellH: cell.h,
      offsetX: 0,
      offsetY: 0,
      lum: new Float32Array(0),
      ready: false,
      maskName: mask.name,
      scratch: mask.create(),
      builtFor: '',
    } satisfies MaskData
  },

  async prepare(state) {
    const d = asData(state)
    if (!d || !state.src) return
    const img = await loadImage(state.src)
    if (!img) return

    // contain 适配：保持原图宽高比，栅格居中，不拉伸
    const { cols, rows } = fitGrid(img.width / img.height, d.cellW, d.cellH, d.maxCols, d.maxRows)
    d.cols = cols
    d.rows = rows
    d.offsetX = (state.width - cols * d.cellW) / 2
    d.offsetY = (state.height - rows * d.cellH) / 2

    const lum = sampleLuminance(img, cols, rows)
    if (!lum) return
    d.lum = lum
    ensureBuilt(d.maskName, d)
    d.ready = true
  },

  render(ctx, state, t) {
    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)
    const d = asData(state)
    if (!d || !d.ready) return
    // 懒校验：测试手工构造 data、或几何被外部改动时自愈
    ensureBuilt(d.maskName, d)
    ART_MASKS[d.maskName].draw(ctx, d, state, d.scratch, t)
  },
}
