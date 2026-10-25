import { describe, it, expect } from 'vitest'
import { DEFAULT_FORCE_SETTINGS, ForceLayout } from './forceLayout'
import { seedPosition } from './graphMath'
import type { GraphLink, GraphNode } from './types'

function makeLayout(nodes: GraphNode[], links: GraphLink[], nodeRadius = 7): ForceLayout {
  const layout = new ForceLayout()
  layout.setData(nodes, links, { nodeRadius })
  return layout
}

function dist(layout: ForceLayout, a: string, b: string): number {
  const na = layout.getNode(a)!
  const nb = layout.getNode(b)!
  return Math.hypot(na.x - nb.x, na.y - nb.y)
}

describe('ForceLayout', () => {
  it('exposes the documented defaults', () => {
    const layout = new ForceLayout()
    expect(layout.settings).toEqual(DEFAULT_FORCE_SETTINGS)
  })

  it('seeds missing positions deterministically from the node index', () => {
    const nodes: GraphNode[] = [{ id: 'a' }, { id: 'b' }]
    const first = makeLayout(nodes, [])
    const second = makeLayout(nodes, [])
    expect(first.getNode('a')).toBeDefined()
    // 首节点 = 0 号种子
    const seed = seedPosition(0, DEFAULT_FORCE_SETTINGS.linkDistance * 0.62)
    expect(first.getNode('a')!.x).toBeCloseTo(seed.x)
    expect(first.getNode('a')!.y).toBeCloseTo(seed.y)
    expect(second.getNode('b')!.x).toBeCloseTo(first.getNode('b')!.x)
  })

  it('respects explicit coordinates', () => {
    const layout = makeLayout([{ id: 'a', x: 42, y: -8 }], [])
    expect(layout.getNode('a')).toMatchObject({ x: 42, y: -8 })
  })

  it('keeps positions of surviving nodes when data is refreshed', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.warmup(40)
    const before = { ...layout.getNode('a')! }
    layout.setData([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [], { nodeRadius: 7 })
    expect(layout.getNode('a')!.x).toBeCloseTo(before.x)
    expect(layout.getNode('a')!.y).toBeCloseTo(before.y)
  })

  it('re-seeds everything when preservePositions is off', () => {
    const layout = makeLayout([{ id: 'a' }], [])
    layout.warmup(40)
    const before = { x: layout.getNode('a')!.x, y: layout.getNode('a')!.y }
    layout.setData([{ id: 'a' }], [], { nodeRadius: 7, preservePositions: false })
    expect(layout.getNode('a')!.x).toBeCloseTo(seedPosition(0, 78 * 0.62).x)
    expect(before.x).not.toBe(layout.getNode('a')!.x)
  })

  it('drops dangling links and self loops', () => {
    const layout = makeLayout(
      [{ id: 'a' }, { id: 'b' }],
      [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'ghost' },
        { source: 'b', target: 'b' },
      ]
    )
    expect(layout.links).toHaveLength(1)
  })

  it('counts degrees and grows node radius by degree', () => {
    const layout = makeLayout(
      [{ id: 'hub' }, { id: 'x' }, { id: 'y' }],
      [
        { source: 'hub', target: 'x' },
        { source: 'hub', target: 'y' },
      ],
      6
    )
    expect(layout.getNode('hub')!.degree).toBe(2)
    expect(layout.getNode('x')!.degree).toBe(1)
    expect(layout.getNode('hub')!.radius).toBeGreaterThan(layout.getNode('x')!.radius)
  })

  it('honours an explicit node size over the degree heuristic', () => {
    const layout = makeLayout(
      [{ id: 'a', size: 20 }, { id: 'b' }],
      [{ source: 'a', target: 'b' }],
      6
    )
    expect(layout.getNode('a')!.radius).toBe(20)
  })

  it('settles links near the configured distance', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.warmup(600)
    const d = dist(layout, 'a', 'b')
    expect(d).toBeGreaterThan(DEFAULT_FORCE_SETTINGS.linkDistance * 0.8)
    expect(d).toBeLessThan(DEFAULT_FORCE_SETTINGS.linkDistance * 1.8)
  })

  it('spreads unconnected nodes apart', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [])
    layout.warmup(600)
    expect(dist(layout, 'a', 'b')).toBeGreaterThan(DEFAULT_FORCE_SETTINGS.linkDistance)
  })

  it('never moves a fixed node', () => {
    const layout = makeLayout(
      [{ id: 'pinned', x: 0, y: 0, fixed: true }, { id: 'free' }],
      [{ source: 'pinned', target: 'free' }]
    )
    layout.warmup(200)
    expect(layout.getNode('pinned')).toMatchObject({ x: 0, y: 0 })
    expect(layout.getNode('free')!.x).not.toBe(0)
  })

  it('stops ticking once the layout settles', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.warmup(1200)
    expect(layout.settled).toBe(true)
    const before = { x: layout.getNode('a')!.x, y: layout.getNode('a')!.y }
    expect(layout.tick()).toBe(false)
    expect(layout.getNode('a')!.x).toBe(before.x)
  })

  it('reports neighbours including the node itself', () => {
    const layout = makeLayout(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [{ source: 'a', target: 'b' }]
    )
    expect([...layout.neighborsOf('a')].sort()).toEqual(['a', 'b'])
    expect([...layout.neighborsOf('c')]).toEqual(['c'])
    expect([...layout.neighborsOf('ghost')]).toEqual(['ghost'])
  })

  it('pins a node on demand and releases it back to the simulation', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.pin('a', 120, 60)
    layout.warmup(80)
    expect(layout.getNode('a')).toMatchObject({ x: 120, y: 60, fixed: true })
    layout.release('a')
    expect(layout.getNode('a')!.fixed).toBe(false)
    layout.warmup(240)
    // 引力把钉子放开后节点会挪位
    expect(layout.getNode('a')!.x).not.toBe(120)
  })

  it('reheat wakes a settled layout with deterministic velocities', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.warmup(1200)
    expect(layout.settled).toBe(true)
    layout.reheat(0.6)
    expect(layout.settled).toBe(false)
    expect(layout.tick()).toBe(true)
  })

  it('exposes alpha as read-only and decays it to zero', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    expect(layout.alpha).toBe(1)
    layout.warmup(60)
    expect(layout.alpha).toBeGreaterThan(0)
    expect(layout.alpha).toBeLessThan(1)
    layout.warmup(600)
    expect(layout.alpha).toBe(0)
    // 只读：外部赋值不应改变内部状态
    expect(() => {
      ;(layout as unknown as { alpha: number }).alpha = 99
    }).toThrow()
    expect(layout.alpha).toBe(0)
  })

  it('settles immediately for an empty graph', () => {
    const layout = makeLayout([], [])
    expect(layout.tick()).toBe(false)
    expect(layout.settled).toBe(true)
  })

  it('wakes up when settings change', () => {
    const layout = makeLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    layout.warmup(1200)
    expect(layout.settled).toBe(true)
    layout.setSettings({ linkDistance: 200 })
    expect(layout.settled).toBe(false)
    layout.warmup(600)
    expect(dist(layout, 'a', 'b')).toBeGreaterThan(DEFAULT_FORCE_SETTINGS.linkDistance * 1.5)
  })
})
