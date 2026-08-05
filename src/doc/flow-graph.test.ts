import { describe, it, expect } from 'vitest'
import { resolveCanvasGraph, buildHierarchyGraph } from './flow-graph'
import { createNode } from './parser'
import type { ProDocNode } from './types'

function makeNode(path: string, body: string, children: ProDocNode[] = []): ProDocNode {
  const node = createNode(path, body)
  node.children = children
  return node
}

describe('resolveCanvasGraph', () => {
  it('正文含有效 prodoc-flow 时优先返回显式流程', () => {
    const node = makeNode('a.md', '# A\n\n```prodoc-flow\ngraph LR\nX --> Y\n```', [
      makeNode('a/b.md', '# B'),
    ])
    const g = resolveCanvasGraph(node)
    expect(g).not.toBeNull()
    expect(g!.nodes.map(n => n.id)).toEqual(['X', 'Y'])
  })

  it('流程块无有效节点时回退层级地图', () => {
    const node = makeNode('a.md', '# A\n\n```prodoc-flow\n全是非法!!\n```', [
      makeNode('a/b.md', '# B'),
    ])
    const g = resolveCanvasGraph(node)
    expect(g).not.toBeNull()
    // 层级地图：根卡片 + 子卡片
    expect(g!.nodes.length).toBe(2)
    expect(g!.nodes[1].label).toBe('B')
  })

  it('无流程时由 children 合成层级地图', () => {
    const child1 = makeNode('a/b.md', '# B')
    const child2 = makeNode('a/c.md', '# C', [makeNode('a/c/d.md', '# D')])
    const g = resolveCanvasGraph(makeNode('a.md', '# A', [child1, child2]))
    expect(g).not.toBeNull()
    expect(g!.nodes).toHaveLength(3)
    // 有子级的子卡片 = rounded（可继续钻取），叶子 = rect
    const c = g!.nodes.find(n => n.label === 'C')
    const b = g!.nodes.find(n => n.label === 'B')
    expect(c?.shape).toBe('rounded')
    expect(b?.shape).toBe('rect')
    // 卡片均带文档链接
    expect(g!.nodes.every(n => n.docPath !== undefined)).toBe(true)
    // 边：根 → 各子
    expect(g!.edges).toHaveLength(2)
  })

  it('子项 ≤5 用 LR，>5 用 TB', () => {
    const few = Array.from({ length: 3 }, (_, i) => makeNode(`a/${i}.md`, `# ${i}`))
    expect(buildHierarchyGraph(makeNode('a.md', '# A', few)).direction).toBe('LR')

    const many = Array.from({ length: 7 }, (_, i) => makeNode(`a/${i}.md`, `# ${i}`))
    expect(buildHierarchyGraph(makeNode('a.md', '# A', many)).direction).toBe('TB')
  })

  it('叶子且无流程返回 null', () => {
    expect(resolveCanvasGraph(makeNode('a.md', '# A'))).toBeNull()
  })
})
