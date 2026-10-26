import { gooEffect } from './goo'
import { imageMaskEffect } from './image-mask'
import { particlesEffect } from './particles'
import { pixelFieldEffect } from './pixel-field'
import { wavesEffect } from './waves'
import type { ArtEffect, ArtEffectName } from './types'

export const ART_EFFECTS: Record<ArtEffectName, ArtEffect> = {
  'pixel-field': pixelFieldEffect,
  particles: particlesEffect,
  waves: wavesEffect,
  goo: gooEffect,
  // 图片蒙版的宿主效果：具体图案由 state.mask 选择（ascii / dots）
  ascii: imageMaskEffect,
}

export type { ArtEffect, ArtEffectName, ArtMaskName, ArtPointer, ArtState } from './types'
export { createRng } from './types'
export { ART_MASKS, resolveMask } from './masks'
export type { ImageMask, MaskGrid } from './masks'
export {
  ASCII_RAMP,
  CHAR_RATIO,
  charFor,
  DEFAULT_DOT_MAX,
  DEFAULT_DOT_MIN,
  DEFAULT_OCCUPANCY,
  dotGeometry,
  dotRadiusFor,
} from './masks'
export type { DotGeometry } from './masks'
