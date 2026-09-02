import { clamp, createRng, type ArtEffect } from './types'

interface Blob {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  colorIdx: number
}

interface GooData {
  blobs: Blob[]
  lastT: number
}

const POINTER_DIST = 160

/**
 * 融合色团：半透明色团缓慢漂移，组件层在 canvas 上叠加
 * `filter: blur + contrast` 产生 gooey 融合效果（无需 SVG filter）。
 */
export const gooEffect: ArtEffect = {
  init(state) {
    const rng = createRng(state.seed)
    const count = Math.min(8, Math.max(5, Math.round(5 * state.density)))
    const colorCount = Math.max(state.palette.length, 1)
    const blobs: Blob[] = []
    for (let i = 0; i < count; i++) {
      blobs.push({
        x: rng() * state.width,
        y: rng() * state.height,
        r: 22 + rng() * 26,
        vx: (rng() - 0.5) * 26,
        vy: (rng() - 0.5) * 26,
        colorIdx: i % colorCount,
      })
    }
    state.data = { blobs, lastT: 0 } satisfies GooData
  },

  render(ctx, state, t) {
    const d = state.data as GooData
    const dt = clamp(t - d.lastT, 0, 0.05) * state.speed
    d.lastT = t

    // goo 滤镜依赖高对比背景：填充与主题对比的底色
    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)

    for (const b of d.blobs) {
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.x < b.r || b.x > state.width - b.r) b.vx = -b.vx
      if (b.y < b.r || b.y > state.height - b.r) b.vy = -b.vy
      b.x = clamp(b.x, b.r, state.width - b.r)
      b.y = clamp(b.y, b.r, state.height - b.r)

      // 指针排斥：靠近的色团被推开
      if (state.reactive && state.pointer.active) {
        const dx = b.x - state.pointer.x
        const dy = b.y - state.pointer.y
        const dist = Math.hypot(dx, dy)
        if (dist < POINTER_DIST && dist > 1) {
          b.vx += (dx / dist) * 46 * dt
          b.vy += (dy / dist) * 46 * dt
        }
      }

      ctx.globalAlpha = 0.85
      ctx.fillStyle = state.palette[b.colorIdx]
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },
}
