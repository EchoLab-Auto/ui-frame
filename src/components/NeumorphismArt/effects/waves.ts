import { createRng, type ArtEffect } from './types'

interface WaveLayer {
  amplitude: number
  frequency: number
  speed: number
  phase: number
  yRatio: number
  alpha: number
}

interface WavesData {
  layers: WaveLayer[]
}

/** 波浪在某一点的位移：主谐波 + 次级谐波；指针激活时在指针附近隆起 */
export function waveY(
  x: number,
  base: number,
  layer: WaveLayer,
  t: number,
  pointer?: { x: number; active: boolean }
): number {
  let y =
    base +
    layer.amplitude * Math.sin(x * layer.frequency + t * layer.speed + layer.phase) +
    layer.amplitude * 0.35 * Math.sin(x * layer.frequency * 2.7 + t * layer.speed * 1.4)
  if (pointer?.active) {
    const dx = x - pointer.x
    y -= 18 * Math.exp(-(dx * dx) / (2 * 90 * 90))
  }
  return y
}

export const wavesEffect: ArtEffect = {
  init(state) {
    const rng = createRng(state.seed)
    const layerCount = Math.min(5, Math.max(3, Math.round(3 * state.density)))
    const layers: WaveLayer[] = []
    for (let i = 0; i < layerCount; i++) {
      layers.push({
        amplitude: state.height * 0.07 * (1 + i * 0.45),
        frequency: 0.008 / (1 + i * 0.3),
        speed: 0.5 + i * 0.28,
        phase: rng() * Math.PI * 2,
        yRatio: 0.5 + 0.13 * i,
        alpha: 0.16,
      })
    }
    state.data = { layers } satisfies WavesData
  },

  render(ctx, state, t) {
    const d = state.data as WavesData
    const tt = t * state.speed
    const colorCount = Math.max(state.palette.length, 1)
    const pointer = state.reactive ? state.pointer : undefined

    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)

    d.layers.forEach((layer, i) => {
      const base = state.height * layer.yRatio
      ctx.globalAlpha = layer.alpha
      ctx.fillStyle = state.palette[i % colorCount]
      ctx.beginPath()
      ctx.moveTo(0, state.height)
      for (let x = 0; x <= state.width; x += 8) {
        ctx.lineTo(x, waveY(x, base, layer, tt, pointer))
      }
      ctx.lineTo(state.width, state.height)
      ctx.closePath()
      ctx.fill()
    })
    ctx.globalAlpha = 1
  },
}
