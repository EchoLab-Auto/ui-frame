/**
 * Shared SVG smooth-path helpers for chart composables.
 *
 * Used by useLineChart (series lines / areas) and useCandlestickChart (MA
 * lines) so the Catmull-Rom → cubic Bézier smoothing logic isn't duplicated
 * between them.
 */

export interface Vec2 {
  x: number
  y: number
}

/**
 * Convert a Catmull-Rom segment (four control points) into a cubic Bézier
 * control-point triplet string (`cp1 cp2 p2`) suitable for an SVG `C` command.
 */
export function catmullRomToBezier(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  tension: number = 0.5
): string {
  const t = tension
  const d = 1 / 6

  const cp1x = p1.x + (p2.x - p0.x) * t * d
  const cp1y = p1.y + (p2.y - p0.y) * t * d
  const cp2x = p2.x - (p3.x - p1.x) * t * d
  const cp2y = p2.y - (p3.y - p1.y) * t * d

  return `${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
}

/**
 * Build a smooth (Catmull-Rom splined) SVG path through the given points.
 * Handles 0/1/2-point edge cases so callers don't need to pre-guard.
 */
export function buildSmoothPath(pts: Vec2[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`

  let d = `M${pts[0].x},${pts[0].y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const bez = catmullRomToBezier(p0, p1, p2, p3, 0.5)
    if (i === 0) {
      d += ` L${p1.x},${p1.y} C${bez}`
    } else {
      d += ` C${bez}`
    }
  }

  return d
}
