import { clamp, createRng, type ArtEffect } from './types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

interface ParticlesData {
  particles: Particle[]
  lastT: number
}

/** 两个粒子是否连线（距离阈值内） */
export function shouldLink(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  threshold: number
): boolean {
  return Math.hypot(ax - bx, ay - by) < threshold
}

const LINK_DIST = 110
const POINTER_DIST = 140

export const particlesEffect: ArtEffect = {
  init(state) {
    const rng = createRng(state.seed)
    const count = Math.round(48 * clamp(state.density, 0.5, 3))
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rng() * state.width,
        y: rng() * state.height,
        vx: (rng() - 0.5) * 36,
        vy: (rng() - 0.5) * 36,
      })
    }
    state.data = { particles, lastT: 0 } satisfies ParticlesData
  },

  render(ctx, state, t) {
    const d = state.data as ParticlesData
    const dt = clamp(t - d.lastT, 0, 0.05) * state.speed
    d.lastT = t
    const primary = state.palette[0] ?? '#888'

    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, state.width, state.height)

    for (const p of d.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.x < 0 || p.x > state.width) p.vx = -p.vx
      if (p.y < 0 || p.y > state.height) p.vy = -p.vy
      p.x = clamp(p.x, 0, state.width)
      p.y = clamp(p.y, 0, state.height)

      // 指针吸附：靠近的粒子被缓慢牵引
      if (state.reactive && state.pointer.active) {
        const dx = state.pointer.x - p.x
        const dy = state.pointer.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < POINTER_DIST && dist > 1) {
          p.vx += (dx / dist) * 30 * dt
          p.vy += (dy / dist) * 30 * dt
        }
      }
    }

    // 连线（透明度随距离衰减）
    ctx.strokeStyle = primary
    ctx.lineWidth = 1
    const ps = d.particles
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const dist = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y)
        if (dist < LINK_DIST) {
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.45
          ctx.beginPath()
          ctx.moveTo(ps[i].x, ps[i].y)
          ctx.lineTo(ps[j].x, ps[j].y)
          ctx.stroke()
        }
      }
    }

    // 粒子本体
    ctx.globalAlpha = 0.9
    ctx.fillStyle = primary
    for (const p of ps) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },
}
