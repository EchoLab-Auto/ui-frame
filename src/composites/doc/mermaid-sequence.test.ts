import { describe, expect, it } from 'vitest'
import { isMermaidSequence, parseMermaidSequence } from './mermaid-sequence'

describe('Mermaid sequenceDiagram → 原生时序图', () => {
  it('声明参与者与别名，消息按出现顺序保序', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant C as 客户端
        actor S as 服务端
        C->>S: POST /login
        S-->>C: 200 OK
    `)

    expect(graph.errors).toEqual([])
    expect(graph.actors).toEqual([
      { id: 'C', label: '客户端', kind: 'participant' },
      { id: 'S', label: '服务端', kind: 'actor' },
    ])
    expect(graph.items).toEqual([
      {
        kind: 'message',
        from: 'C',
        to: 'S',
        label: 'POST /login',
        arrow: 'solid-arrow',
        self: false,
      },
      {
        kind: 'message',
        from: 'S',
        to: 'C',
        label: '200 OK',
        arrow: 'dashed-arrow',
        self: false,
      },
    ])
  })

  it('八种箭头各自映射到线型 + 端点形状', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant A
        participant B
        A->>B: solid-arrow
        A-->>B: dashed-arrow
        A->B: solid-line
        A-->B: dashed-line
        A-)B: solid-open
        A--)B: dashed-open
        A-xB: solid-cross
        A--xB: dashed-cross
    `)
    expect(graph.errors).toEqual([])
    expect(graph.items.map(item => (item.kind === 'message' ? item.arrow : item.kind))).toEqual([
      'solid-arrow',
      'dashed-arrow',
      'solid-line',
      'dashed-line',
      'solid-open',
      'dashed-open',
      'solid-cross',
      'dashed-cross',
    ])
  })

  it('自消息标记为 self，说明图里要画回环而不是零长箭头', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant A
        A->>A: 重试
    `)
    expect(graph.errors).toEqual([])
    expect(graph.items[0]).toMatchObject({ from: 'A', to: 'A', self: true, label: '重试' })
  })

  it('Note 三向定位：left of / right of / over 多个参与者', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant A
        participant B
        Note right of A: 客户端侧
        Note left of B: 服务端侧
        Note over A,B: 这段握手
    `)
    expect(graph.errors).toEqual([])
    expect(graph.items).toEqual([
      { kind: 'note', placement: 'right of', actors: ['A'], label: '客户端侧' },
      { kind: 'note', placement: 'left of', actors: ['B'], label: '服务端侧' },
      { kind: 'note', placement: 'over', actors: ['A', 'B'], label: '这段握手' },
    ])
  })

  it('activate/deactivate 与 `->>+` / `->>-` 简写等价', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant A
        participant B
        A->>+B: 调用
        B-->>-A: 返回
        activate A
        deactivate A
    `)
    expect(graph.errors).toEqual([])
    expect(graph.items.map(item => item.kind)).toEqual([
      'message',
      'activate',
      'message',
      'deactivate',
      'activate',
      'deactivate',
    ])
  })

  it('autonumber 给消息编号', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        autonumber
        participant A
        participant B
        A->>B: 一
        B->>A: 二
    `)
    expect(graph.errors).toEqual([])
    expect(graph.items.map(item => (item.kind === 'message' ? item.number : undefined))).toEqual([
      1, 2,
    ])
  })

  it('alt/else/end 归成带分隔线的分组', () => {
    const graph = parseMermaidSequence(`
      sequenceDiagram
        participant A
        participant B
        alt 命中缓存
          A->>B: 读缓存
        else 未命中
          A->>B: 查数据库
        end
    `)
    expect(graph.errors).toEqual([])
    const block = graph.items.find(item => item.kind === 'block')
    expect(block).toMatchObject({ block: 'alt', label: '命中缓存' })
    expect(graph.items[graph.items.length - 1]).toEqual({ kind: 'block-end' })
  })

  it('未闭合分组、未知语句都进 errors（调用方据此回退源码）', () => {
    const unclosed = parseMermaidSequence(`
      sequenceDiagram
        participant A
        participant B
        loop 每秒
          A->>B: ping
    `)
    expect(unclosed.errors.map(e => e.message)).toContain('分组 loop 缺少 end')

    const unknown = parseMermaidSequence(`
      sequenceDiagram
        box 后端
        participant A
        end
    `)
    expect(unknown.errors.length).toBeGreaterThan(0)
  })

  it('图型判定只看首个有效行（跳过注释与空行）', () => {
    expect(isMermaidSequence('sequenceDiagram\n  A->>B: x')).toBe(true)
    expect(isMermaidSequence('%% 说明\nsequenceDiagram\n  A->>B: x')).toBe(true)
    expect(isMermaidSequence('flowchart LR\n  A --> B')).toBe(false)
    expect(isMermaidSequence('')).toBe(false)
  })
})
