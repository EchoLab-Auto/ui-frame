import { describe, it, expect } from 'vitest'
import {
  GOLDEN_ANGLE,
  boundsOf,
  clampScale,
  distance,
  fitTransform,
  screenToWorld,
  seedPosition,
  worldToScreen,
  zoomAt,
} from './graphMath'

describe('graphMath', () => {
  describe('seedPosition', () => {
    it('is deterministic for the same index', () => {
      expect(seedPosition(7, 40)).toEqual(seedPosition(7, 40))
    })

    it('spreads indices outward (radius grows with sqrt(i))', () => {
      const spacing = 40
      const r0 = Math.hypot(...Object.values(seedPosition(0, spacing)))
      const r9 = Math.hypot(...Object.values(seedPosition(9, spacing)))
      const r36 = Math.hypot(...Object.values(seedPosition(36, spacing)))
      expect(r0).toBeLessThan(r9)
      expect(r9).toBeLessThan(r36)
      // r ∝ √i × spacing（0 号种子带 +0.5 偏移）
      expect(r36 / r9).toBeCloseTo(Math.sqrt(36.5 / 9.5), 2)
    })

    it('uses the golden angle between consecutive seeds', () => {
      const a = seedPosition(3, 10)
      const b = seedPosition(4, 10)
      const angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)
      const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      expect(normalized).toBeCloseTo(GOLDEN_ANGLE, 6)
    })
  })

  describe('boundsOf', () => {
    it('returns a padded box around the points', () => {
      expect(
        boundsOf(
          [
            { x: 0, y: 0 },
            { x: 10, y: 20 },
          ],
          5
        )
      ).toEqual({
        minX: -5,
        minY: -5,
        maxX: 15,
        maxY: 25,
      })
    })

    it('handles an empty point set', () => {
      expect(boundsOf([], 8)).toEqual({ minX: -8, minY: -8, maxX: 8, maxY: 8 })
    })
  })

  describe('clampScale', () => {
    it('clamps into range', () => {
      expect(clampScale(0.5, 1, 4)).toBe(1)
      expect(clampScale(9, 1, 4)).toBe(4)
      expect(clampScale(2, 1, 4)).toBe(2)
    })

    it('falls back to min for invalid input', () => {
      expect(clampScale(Number.NaN, 0.5, 4)).toBe(0.5)
      expect(clampScale(0, 0.5, 4)).toBe(0.5)
    })
  })

  describe('fitTransform', () => {
    it('centres the bounding box inside the viewport', () => {
      const view = fitTransform(
        { minX: -50, minY: -50, maxX: 50, maxY: 50 },
        { width: 400, height: 300 },
        0,
        0.1,
        4
      )
      // 300/100 = 3 是受限方向
      expect(view.scale).toBe(3)
      // 中心点落在视口中心
      const centre = worldToScreen({ x: 0, y: 0 }, view)
      expect(centre.x).toBeCloseTo(200)
      expect(centre.y).toBeCloseTo(150)
    })

    it('honours the padding', () => {
      const view = fitTransform(
        { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        { width: 200, height: 200 },
        50,
        0.1,
        4
      )
      // 可用区域 100×100
      expect(view.scale).toBe(1)
    })

    it('clamps the scale for degenerate boxes', () => {
      const view = fitTransform(
        { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        { width: 800, height: 600 },
        0,
        0.1,
        4
      )
      expect(view.scale).toBe(4)
    })
  })

  describe('coordinate transforms', () => {
    it('round-trips screen ↔ world', () => {
      const view = { scale: 2.5, tx: 30, ty: -12 }
      const world = { x: 17, y: -43 }
      const screen = worldToScreen(world, view)
      const back = screenToWorld(screen, view)
      expect(back.x).toBeCloseTo(world.x)
      expect(back.y).toBeCloseTo(world.y)
    })
  })

  describe('zoomAt', () => {
    it('keeps the anchor point pinned while zooming', () => {
      const view = { scale: 1, tx: 0, ty: 0 }
      const anchor = { x: 120, y: 80 }
      const before = screenToWorld(anchor, view)
      const zoomed = zoomAt(view, 2, anchor, 0.1, 4)
      const after = screenToWorld(anchor, zoomed)
      expect(zoomed.scale).toBe(2)
      expect(after.x).toBeCloseTo(before.x)
      expect(after.y).toBeCloseTo(before.y)
    })

    it('clamps at the scale limits without moving the anchor', () => {
      const view = { scale: 3.9, tx: 10, ty: 10 }
      const anchor = { x: 50, y: 50 }
      const zoomed = zoomAt(view, 4, anchor, 0.1, 4)
      expect(zoomed.scale).toBe(4)
      expect(screenToWorld(anchor, zoomed).x).toBeCloseTo(screenToWorld(anchor, view).x)
    })
  })

  describe('distance', () => {
    it('measures euclidean distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })
  })
})
