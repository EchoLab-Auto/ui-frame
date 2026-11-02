import { describe, expect, it } from 'vitest'
import { parseMermaidDiagram } from './mermaid-diagram'

describe('parseMermaidDiagram 图型分发', () => {
  it('flowchart 交给原生流程图模型', () => {
    const result = parseMermaidDiagram('flowchart LR\n  A[开始] --> B[结束]')
    expect(result.type).toBe('flowchart')
    expect(result.diagram?.kind).toBe('flowchart')
  })

  it('sequenceDiagram 交给时序图模型', () => {
    const result = parseMermaidDiagram(
      'sequenceDiagram\n  participant A\n  participant B\n  A->>B: x'
    )
    expect(result.type).toBe('sequence')
    expect(result.diagram?.kind).toBe('sequence')
  })

  it('gantt 交给甘特图模型', () => {
    const result = parseMermaidDiagram('gantt\n  dateFormat YYYY-MM-DD\n  任务 :a, 2026-01-01, 2d')
    expect(result.type).toBe('gantt')
    expect(result.diagram?.kind).toBe('gantt')
  })

  it('图型有实现但写法超界：type 保留、diagram 缺席（宿主回退源码）', () => {
    const flowchart = parseMermaidDiagram('flowchart LR\n  A --> B\n  direction BT')
    expect(flowchart.type).toBe('flowchart')
    expect(flowchart.diagram).toBeUndefined()

    const sequence = parseMermaidDiagram('sequenceDiagram\n  box 组\n  participant A\n  end')
    expect(sequence.type).toBe('sequence')
    expect(sequence.diagram).toBeUndefined()

    const gantt = parseMermaidDiagram('gantt\n  dateFormat YYYY-MM-DD\n  任务 :a, after ghost, 2d')
    expect(gantt.type).toBe('gantt')
    expect(gantt.diagram).toBeUndefined()
  })

  it('未知图型标成 other（class / pie / mindmap …）', () => {
    expect(parseMermaidDiagram('classDiagram\n  A --> B').type).toBe('other')
    expect(parseMermaidDiagram('pie\n  "A": 1').type).toBe('other')
    expect(parseMermaidDiagram('').type).toBe('other')
  })
})
