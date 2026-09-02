import { asciiEffect } from './ascii'
import { gooEffect } from './goo'
import { particlesEffect } from './particles'
import { pixelFieldEffect } from './pixel-field'
import { wavesEffect } from './waves'
import type { ArtEffect, ArtEffectName } from './types'

export const ART_EFFECTS: Record<ArtEffectName, ArtEffect> = {
  'pixel-field': pixelFieldEffect,
  particles: particlesEffect,
  waves: wavesEffect,
  goo: gooEffect,
  ascii: asciiEffect,
}

export type { ArtEffect, ArtEffectName, ArtPointer, ArtState } from './types'
export { createRng } from './types'
