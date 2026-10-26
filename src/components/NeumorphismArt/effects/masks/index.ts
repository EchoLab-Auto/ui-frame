import type { ArtMaskName } from '../types'
import type { ImageMask } from './types'
import { asciiMask } from './ascii-mask'
import { dotMask } from './dot-mask'

/**
 * 图片蒙版表。新增蒙版只需在这里登记：
 * `NeumorphismAsciiArt` 的 `mask` prop 与渲染管线无需改动。
 */
export const ART_MASKS: Record<ArtMaskName, ImageMask> = {
  ascii: asciiMask,
  dots: dotMask,
}

/** 取蒙版；未知名称回退字符画（和 `ArtEffect` 的回退策略一致） */
export function resolveMask(name: ArtMaskName | undefined): ImageMask {
  return (name && ART_MASKS[name]) || ART_MASKS.ascii
}

export type { ImageMask, MaskGrid } from './types'
export { ASCII_RAMP, CHAR_RATIO, asciiMask, charFor } from './ascii-mask'
export {
  DEFAULT_DOT_MAX,
  DEFAULT_DOT_MIN,
  DEFAULT_OCCUPANCY,
  dotGeometry,
  dotMask,
  dotRadiusFor,
} from './dot-mask'
export type { DotGeometry } from './dot-mask'
