import { describe, it, expect } from 'vitest'
import { layoutProDocFlow } from './flow-layout'
import { parseProDocFlow } from './flow-parser'

function layout(source: string) {
  return layoutProDocFlow(parseProDocFlow(source))
}

describe('layoutProDocFlow', () => {
  it('空图返回零尺寸', () => {
    const r = layoutProDocFlow({ direction: 'LR', nodes: [], edges: [], errors: [] })
    expect(r.width).toBe(0)
    expect(r.nodes.size).toBe(0)
  })

  it('直链分层递增（LR：x 递增）', () => {
    const r = layout('graph LR\nA --> B --> C')
    const xa = r.nodes.get('A')!
    const xb = r.nodes.get('B')!
    const xc = r.nodes.get('C')!
    expect(xa.x).toBeLessThan(xb.x)
    expect(xb.x).toBeLessThan(xc.x)
  })

  it('分支同层节点不重叠', () => {
    const r = layout('graph LR\nA --> B\nA --> C\nA --> D')
    const ids = ['B', 'C', 'D']
    const rects = ids.map(id => r.nodes.get(id)!)
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const overlapX =
          Math.min(rects[i].x + rects[i].w, rects[j].x + rects[j].w) -
          Math.max(rects[i].x, rects[j].x)
        const overlapY =
          Math.min(rects[i].y + rects[i].h, rects[j].y + rects[j].h) -
          Math.max(rects[i].y, rects[j].y)
        expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(0)
      }
    }
  })

  it('菱形节点尺寸大于同文本矩形', () => {
    const r = layout('graph LR\nA[文本内容] --> B{文本内容}')
    const a = r.nodes.get('A')!
    const b = r.nodes.get('B')!
    expect(b.w).toBeGreaterThan(a.w)
    expect(b.h).toBeGreaterThan(a.h)
  })

  it('环不死循环且回边保留标记', () => {
    const r = layout('graph LR\nA --> B --> C --> A')
    expect(r.nodes.size).toBe(3)
    const back = r.edges.filter(e => e.isBackEdge)
    expect(back.length).toBeGreaterThanOrEqual(1)
    expect(back[0].to).toBe('A')
  })

  it('TB 方向：层沿 y 推进', () => {
    const r = layout('graph TB\nA --> B --> C')
    expect(r.nodes.get('A')!.y).toBeLessThan(r.nodes.get('B')!.y)
    expect(r.nodes.get('B')!.y).toBeLessThan(r.nodes.get('C')!.y)
  })

  it('RL 方向镜像：A 在 B 右侧', () => {
    const r = layout('graph RL\nA --> B')
    const a = r.nodes.get('A')!
    const b = r.nodes.get('B')!
    expect(a.x).toBeGreaterThan(b.x)
  })

  it('BT 方向镜像：A 在 B 下方', () => {
    const r = layout('graph BT\nA --> B')
    expect(r.nodes.get('A')!.y).toBeGreaterThan(r.nodes.get('B')!.y)
  })

  it('CJK 文本宽度估算大于同长 ASCII', () => {
    // 长文本越过最小宽度下限后再比较（短文本同触下限无法区分）
    const r = layout('graph LR\nA[中文文本内容样例] --> B[abcdefgh]')
    expect(r.nodes.get('A')!.w).toBeGreaterThan(r.nodes.get('B')!.w)
  })

  it('输出确定性：同输入两次结果一致', () => {
    const src = 'graph LR\nA --> B{判断}\nB -->|是| C[/圆角/]\nB -->|否| D(体育场)'
    const r1 = layout(src)
    const r2 = layout(src)
    expect(JSON.stringify([...r1.nodes.entries()])).toBe(JSON.stringify([...r2.nodes.entries()]))
    expect(r1.edges.map(e => e.path)).toEqual(r2.edges.map(e => e.path))
  })

  it('孤立节点也能落层放置', () => {
    const r = layout('graph LR\nA[孤立]\nB --> C')
    expect(r.nodes.get('A')).toBeDefined()
    expect(r.nodes.get('A')!.x).toBeGreaterThanOrEqual(0)
  })

  it('边路径为贝塞尔且标签定位在两端之间', () => {
    const r = layout('graph LR\nA -->|标签| B')
    const e = r.edges[0]
    expect(e.path).toMatch(/^M [\d.]+,[\d.]+ C /)
    const a = r.nodes.get('A')!
    const b = r.nodes.get('B')!
    expect(e.labelPos.x).toBeGreaterThan(a.x)
    expect(e.labelPos.x).toBeLessThan(b.x + b.w)
  })

  it('画布尺寸容纳所有节点', () => {
    const r = layout('graph LR\nA --> B --> C\nA --> D')
    for (const n of r.nodes.values()) {
      expect(n.x + n.w).toBeLessThanOrEqual(r.width)
      expect(n.y + n.h).toBeLessThanOrEqual(r.height)
    }
  })

  it('跨层边与回边走正交通道绕行，不穿越节点', () => {
    // 跨层边 A→D、回边 C→A 均为 L 折线通道；逐段采样不得进入任何第三方节点
    const r = layout('graph LR\nA --> B --> C --> A\nB --> D\nA --> D')
    const channel = r.edges.filter(e => e.path.includes(' L '))
    expect(channel.length).toBe(2)
    for (const e of channel) {
      const pts = [...e.path.matchAll(/[ML] ([\d.-]+),([\d.-]+)/g)].map(m => [+m[1], +m[2]])
      for (let i = 0; i < pts.length - 1; i++) {
        for (let k = 0; k <= 12; k++) {
          const x = pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * k) / 12
          const y = pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * k) / 12
          for (const n of r.nodes.values()) {
            if (n.id === e.from || n.id === e.to) continue
            const inside = x > n.x + 2 && x < n.x + n.w - 2 && y > n.y + 2 && y < n.y + n.h - 2
            expect(inside).toBe(false)
          }
        }
      }
    }
  })
})
