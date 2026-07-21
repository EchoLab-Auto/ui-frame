import { ref, computed, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

export type LogoMode = 'pulse' | 'liquid' | 'wave' | 'pointer'

export interface UsePixelLogoAnimationOptions {
  /** SVG <g> element that holds the link <line> elements. */
  linksGroupRef: Ref<SVGGElement | null>
  /** SVG <g> element that holds the pixel <rect> elements. */
  pixelsGroupRef: Ref<SVGGElement | null>
  /** SVG <g> element that holds the spark <circle> elements. */
  sparksGroupRef: Ref<SVGGElement | null>
  /** SVG root element used for pointer coordinate mapping. */
  svgRef: Ref<SVGSVGElement | null>
  /** Initial animation mode. */
  mode?: LogoMode
  /** Whether the gooey filter is enabled. */
  goo?: boolean
  /** Whether to play the intro convergence animation. */
  autoplay?: boolean
}

export interface UsePixelLogoAnimationReturn {
  /** Current animation mode. */
  mode: Ref<LogoMode>
  /** Whether the user has requested reduced motion. */
  isReducedMotion: Ref<boolean>
  /** Switch to a new animation mode. */
  setMode: (value: LogoMode) => void
  /** Replay the intro convergence animation. */
  replay: () => void
  /** Handle pointer move events (for pointer mode). */
  handlePointerMove: (event: PointerEvent) => void
  /** Handle pointer leave events. */
  handlePointerLeave: () => void
}

interface Block {
  el: SVGRectElement
  cx: number
  cy: number
  dist: number
  rand: number
  p1: number
  p2: number
  p3: number
  p4: number
  ox: number
  oy: number
  s: number
  b: number
  rot: number
  pIn: number
}

interface Link {
  el: SVGLineElement
  a: number
  b: number
  w: number
  br: number
  grow: number
  ph: number
}

/* —— 从原图提取的 8×8 像素布局与 10 条对角桥接 —— */
const GX = [56, 108, 159, 210, 261, 312, 364, 415]
const GY = [56, 108, 159, 210, 261, 312, 369, 420]
const GRID = [
  [1, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 0, 0, 0],
  [1, 0, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 0, 0, 1],
  [0, 0, 0, 0, 1, 0, 0, 1],
  [0, 0, 0, 0, 1, 1, 1, 1],
]
const LINKS = [
  [1, 4],
  [2, 6],
  [5, 8],
  [7, 13],
  [9, 14],
  [10, 15],
  [16, 22],
  [18, 23],
  [19, 24],
  [25, 28],
]
const SIZE = 41
const RX = 9
const C = 256
const LINK_W = 9
const LINK_INSET = 26
const BASE = [191, 253, 10]
const HI = [234, 255, 168]
const NS = 'http://www.w3.org/2000/svg'

const easeOutBack = (p: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const mixc = (t: number): string =>
  `rgb(${Math.round(lerp(BASE[0], HI[0], t))},${Math.round(lerp(BASE[1], HI[1], t))},${Math.round(
    lerp(BASE[2], HI[2], t)
  )})`
const spike = (t: number): number => (t < 0 ? 0 : Math.min(1, t / 45) * Math.exp(-t / 300))

export function usePixelLogoAnimation(
  options: UsePixelLogoAnimationOptions
): UsePixelLogoAnimationReturn {
  const { linksGroupRef, pixelsGroupRef, sparksGroupRef, svgRef } = options
  const mode = ref<LogoMode>(options.mode ?? 'pulse')
  const goo = computed(() => options.goo ?? true)
  const autoplay = computed(() => options.autoplay ?? true)

  const blocks: Block[] = []
  const links: Link[] = []
  const sparks: SVGCircleElement[] = []

  let introT0 = performance.now()
  let pulses: { t0: number; arrive: number[]; cross: number[] }[] = []
  let nextPulse = performance.now() + 1400
  const pointer = ref({ x: -9999, y: -9999, on: false })
  const isReducedMotion = ref(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  let rafId: number | null = null
  let mounted = false

  function createElements() {
    const gPx = pixelsGroupRef.value
    const gLk = linksGroupRef.value
    const gSp = sparksGroupRef.value
    if (!gPx || !gLk || !gSp) return

    // Clear previous elements (for replay / re-mount)
    gPx.innerHTML = ''
    gLk.innerHTML = ''
    gSp.innerHTML = ''
    blocks.length = 0
    links.length = 0
    sparks.length = 0

    // Blocks
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!GRID[r][c]) continue
        const el = document.createElementNS(NS, 'rect')
        el.setAttribute('x', String(GX[c]))
        el.setAttribute('y', String(GY[r]))
        el.setAttribute('width', String(SIZE))
        el.setAttribute('height', String(SIZE))
        el.setAttribute('rx', String(RX))
        gPx.appendChild(el)

        const cx = GX[c] + SIZE / 2
        const cy = GY[r] + SIZE / 2
        blocks.push({
          el,
          cx,
          cy,
          dist: Math.hypot(cx - C, cy - C),
          rand: Math.random(),
          p1: Math.random() * 6.28,
          p2: Math.random() * 6.28,
          p3: Math.random() * 6.28,
          p4: Math.random() * 6.28,
          ox: 0,
          oy: 0,
          s: 1,
          b: 0,
          rot: 0,
          pIn: 0,
        })
      }
    }

    // Links
    for (const [a, b] of LINKS) {
      const el = document.createElementNS(NS, 'line')
      el.setAttribute('stroke-linecap', 'round')
      gLk.appendChild(el)
      links.push({ el, a, b, w: 0, br: 0, grow: 0, ph: Math.random() * 6.28 })
    }

    // Sparks
    for (let i = 0; i < 10; i++) {
      const el = document.createElementNS(NS, 'circle')
      el.setAttribute('r', '4')
      el.setAttribute('fill', '#f2ffc4')
      el.setAttribute('opacity', '0')
      gSp.appendChild(el)
      sparks.push(el)
    }
  }

  function setMode(value: LogoMode) {
    mode.value = value
    if (value === 'pulse') {
      pulses = []
      nextPulse = performance.now() + 250
    }
  }

  function replay() {
    introT0 = performance.now()
    pulses = []
    nextPulse = performance.now() + 1e9
    blocks.forEach(b => {
      b.rand = Math.random()
      b.ox = 0
      b.oy = 0
      b.s = 1
      b.b = 0
      b.rot = 0
      b.pIn = 0
    })
    links.forEach(l => {
      l.grow = 0
      l.w = 0
    })
    setMode(mode.value)
  }

  function updatePointer(event: PointerEvent | TouchEvent) {
    const svg = svgRef.value
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const p = 'touches' in event ? event.touches[0] : event
    const x = ((p.clientX - r.left) / r.width) * 512
    const y = ((p.clientY - r.top) / r.height) * 512
    pointer.value = {
      x,
      y,
      on: x >= 0 && x <= 512 && y >= 0 && y <= 512,
    }
  }

  function handlePointerMove(event: PointerEvent) {
    updatePointer(event)
  }

  function handlePointerLeave() {
    pointer.value = { x: -9999, y: -9999, on: false }
  }

  function frame(now: number) {
    if (!mounted) return
    const t = now / 1000
    const introEl = now - introT0

    // Generate new pulses
    if (mode.value === 'pulse' && now >= nextPulse && !isReducedMotion.value) {
      const origin = blocks[Math.floor(Math.random() * blocks.length)]
      const speed = 0.5 + Math.random() * 0.15
      const arrive = blocks.map(b => Math.hypot(b.cx - origin.cx, b.cy - origin.cy) / speed)
      pulses.push({
        t0: now,
        arrive,
        cross: links.map(l => (arrive[l.a] + arrive[l.b]) / 2),
      })
      if (pulses.length > 3) pulses.shift()
      nextPulse = now + 1900 + Math.random() * 900
    }
    pulses = pulses.filter(p => now - p.t0 < 2600)

    const waveR = ((t * 150) % (460 + 140)) - 70

    // Blocks
    for (const b of blocks) {
      let tOx = 0
      let tOy = 0
      let tS = 1
      let tB = 0
      let tRot = 0
      let op = 1

      const delay = b.dist * 1.5 + b.rand * 260
      const dur = 720
      const p = Math.min(1, Math.max(0, (introEl - delay) / dur))
      b.pIn = p
      if (p < 1) {
        const e = easeOutBack(p)
        const R = 320 + b.rand * 260
        const ang = b.p1
        tOx = Math.cos(ang) * R * (1 - e)
        tOy = Math.sin(ang) * R * (1 - e) + 60 * (1 - e)
        tS = Math.max(0.001, e)
        tRot = (b.rand - 0.5) * 300 * (1 - e)
        op = Math.min(1, p * 2.2)
      }

      if (p >= 1 && !isReducedMotion.value) {
        if (mode.value === 'pulse') {
          for (const pu of pulses) {
            const k = spike(now - pu.t0 - pu.arrive[blocks.indexOf(b)])
            tB += k * 0.95
            tS *= 1 + 0.14 * k
          }
          tB += 0.05 + 0.04 * Math.sin(t * 1.8 + b.p1)
        }
        if (mode.value === 'liquid') {
          tOx = Math.sin(t * 0.9 + b.p1) * 4.6
          tOy = Math.cos(t * 0.72 + b.p2) * 4.6
          tRot = Math.sin(t * 0.5 + b.p3) * 5
          tS = 1 + 0.05 * Math.sin(t * 0.8 + b.p4)
          tB = 0.1 + 0.09 * Math.sin(t * 0.6 + b.p2)
        }
        if (mode.value === 'wave') {
          const d = b.dist - waveR
          const k = Math.exp(-(d * d) / (2 * 42 * 42))
          tS *= 1 + 0.16 * k
          tB += k * 0.95
          tOx = ((b.cx - C) / b.dist) * k * 6
          tOy = ((b.cy - C) / b.dist) * k * 6
        }
        if (pointer.value.on) {
          const w = mode.value === 'pointer' ? 1 : 0.32
          const dx = b.cx - pointer.value.x
          const dy = b.cy - pointer.value.y
          const len = Math.hypot(dx, dy) || 0.001
          const R0 = 150
          if (len < R0) {
            let f = 1 - len / R0
            f *= f
            tOx -= (dx / len) * f * 30 * w
            tOy -= (dy / len) * f * 30 * w
            tS *= 1 + 0.28 * f * w
            tB += 0.75 * f * w
          }
        }
      }

      const k = 0.16
      b.ox += (tOx - b.ox) * k
      b.oy += (tOy - b.oy) * k
      b.s += (tS - b.s) * k
      b.b += (clamp01(tB) - b.b) * k
      b.rot += (tRot - b.rot) * k

      b.el.setAttribute(
        'transform',
        `translate(${(b.cx + b.ox).toFixed(2)} ${(b.cy + b.oy).toFixed(2)}) ` +
          `rotate(${b.rot.toFixed(2)}) scale(${b.s.toFixed(3)}) ` +
          `translate(${(-b.cx).toFixed(2)} ${(-b.cy).toFixed(2)})`
      )
      b.el.setAttribute('fill', mixc(clamp01(b.b)))
      b.el.setAttribute('opacity', op.toFixed(3))
    }

    // Links
    const introDone = blocks.every(b => b.pIn >= 1)
    let si = 0
    for (const l of links) {
      const A = blocks[l.a]
      const B = blocks[l.b]
      if (!A || !B) continue
      const gT = introDone ? 1 : clamp01((Math.min(A.pIn, B.pIn) - 0.72) / 0.28)
      l.grow += (gT - l.grow) * 0.2

      let tB = Math.max(A.b, B.b) * 0.82
      let addW = 0
      if (mode.value === 'liquid' && !isReducedMotion.value) addW = 1.4 * Math.sin(t * 1.1 + l.ph)
      if (mode.value === 'pulse' && !isReducedMotion.value) {
        for (const pu of pulses) {
          const ct = pu.t0 + pu.cross[links.indexOf(l)]
          const k = spike(now - ct)
          tB = Math.max(tB, k)
          addW += 4 * k

          const st = ct - 90
          const dur = 210
          if (now >= st && now <= st + dur && si < sparks.length) {
            const pr = (now - st) / dur
            const fwd = pu.arrive[l.a] <= pu.arrive[l.b]
            const x1 = fwd ? A.cx + A.ox : B.cx + B.ox
            const y1 = fwd ? A.cy + A.oy : B.cy + B.oy
            const x2 = fwd ? B.cx + B.ox : A.cx + A.ox
            const y2 = fwd ? B.cy + B.oy : A.cy + A.oy
            const sp = sparks[si++]
            sp.setAttribute('cx', lerp(x1, x2, pr).toFixed(1))
            sp.setAttribute('cy', lerp(y1, y2, pr).toFixed(1))
            sp.setAttribute('opacity', (Math.sin(pr * Math.PI) * 0.95).toFixed(2))
          }
        }
      }
      l.br += (clamp01(tB) - l.br) * 0.2
      const w = (LINK_W + addW) * l.grow
      const ax = A.cx + A.ox
      const ay = A.cy + A.oy
      const bx = B.cx + B.ox
      const by = B.cy + B.oy
      const dl = Math.hypot(bx - ax, by - ay) || 0.001
      const ux = (bx - ax) / dl
      const uy = (by - ay) / dl
      const inset = Math.min(LINK_INSET, (dl - 4) / 2)
      l.el.setAttribute('x1', (ax + ux * inset).toFixed(2))
      l.el.setAttribute('y1', (ay + uy * inset).toFixed(2))
      l.el.setAttribute('x2', (bx - ux * inset).toFixed(2))
      l.el.setAttribute('y2', (by - uy * inset).toFixed(2))
      l.el.setAttribute('stroke-width', Math.max(0.1, w).toFixed(2))
      l.el.setAttribute('stroke', mixc(clamp01(l.br)))
      l.el.setAttribute('stroke-opacity', (l.grow * 0.98).toFixed(3))
    }
    for (; si < sparks.length; si++) sparks[si].setAttribute('opacity', '0')

    rafId = requestAnimationFrame(frame)
  }

  let reducedMotionMql: MediaQueryList | null = null

  onMounted(() => {
    mounted = true
    createElements()

    if (!autoplay.value || isReducedMotion.value) {
      introT0 = -1e9
      links.forEach(l => (l.grow = 1))
    }

    setMode(mode.value)
    rafId = requestAnimationFrame(frame)

    if (typeof window !== 'undefined') {
      reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handler = (e: MediaQueryListEvent) => {
        isReducedMotion.value = e.matches
      }
      reducedMotionMql.addEventListener('change', handler)
    }
  })

  onBeforeUnmount(() => {
    mounted = false
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (reducedMotionMql) {
      reducedMotionMql.removeEventListener('change', () => {})
      reducedMotionMql = null
    }
  })

  watch(goo, value => {
    const svg = svgRef.value
    if (!svg) return
    const gooroot = svg.querySelector('#gooroot')
    if (gooroot) {
      if (value) gooroot.setAttribute('filter', 'url(#goo)')
      else gooroot.removeAttribute('filter')
    }
  })

  return {
    mode,
    isReducedMotion,
    setMode,
    replay,
    handlePointerMove,
    handlePointerLeave,
  }
}

export default usePixelLogoAnimation
