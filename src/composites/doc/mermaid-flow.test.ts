import { describe, expect, it } from 'vitest'
import { isMermaidFlowchart, parseMermaidFlow } from './mermaid-flow'

describe('Mermaid flowchart → 原生画布', () => {
  it('解析中文节点、子图和带标签边，并去掉标签 HTML', () => {
    const graph = parseMermaidFlow(`
      flowchart BT
        subgraph Host["宿主服务"]
          LLM["llm<br/>组合根创建"]
        end
        subgraph Plugins["内置插件"]
          Loop["loop 插件"]
          Tools["tools.builtin"]
        end
        LLM -->|构造| Loop
        LLM --> Tools
    `)

    expect(graph).not.toBeNull()
    expect(graph?.direction).toBe('BT')
    expect(graph?.nodes.map(node => node.id)).toEqual(['LLM', 'Loop', 'Tools'])
    expect(graph?.nodes[0]?.label).toBe('llm · 组合根创建')
    expect(graph?.edges).toEqual([
      { from: 'LLM', to: 'Loop', label: '构造' },
      { from: 'LLM', to: 'Tools', label: undefined },
    ])
  })

  it('服务依赖图中的点线、泛型标签也能进入原生画布', () => {
    const graph = parseMermaidFlow(
      'flowchart BT\n  Single["single"] -. "先挂载者提供" .-> Loop["loop 服务<br/>Arc&lt;TurnRunner&gt;"]'
    )
    expect(graph).not.toBeNull()
    expect(graph?.nodes[1]?.label).toBe('loop 服务 · Arc<TurnRunner>')
    expect(graph?.edges[0]?.label).toBe('先挂载者提供')
  })

  it('graph LR 同样支持，菱形和圆角形状映射到原生节点', () => {
    const graph = parseMermaidFlow('graph LR\n  A[/输入/] --> B{判断}\n  B --> C(结束)')
    expect(graph?.nodes.map(node => node.shape)).toEqual(['rounded', 'diamond', 'stadium'])
  })

  it('`==>` 粗箭头进入原生画布，并保留加重语义', () => {
    const graph = parseMermaidFlow('flowchart TB\n  ROOT["根"] ==> P["人格层"]')
    expect(graph).not.toBeNull()
    expect(graph?.edges).toEqual([{ from: 'ROOT', to: 'P', label: undefined, thick: true }])
  })

  it('图型判定：流程图归原生画布独占，其他图型保留源码', () => {
    expect(isMermaidFlowchart('flowchart TB\n  A --> B')).toBe(true)
    expect(isMermaidFlowchart('graph LR\n  A --> B')).toBe(true)
    expect(isMermaidFlowchart('%% 注释\nflowchart BT\n  A --> B')).toBe(true)
    expect(isMermaidFlowchart('sequenceDiagram\n  A->>B: 请求')).toBe(false)
    expect(isMermaidFlowchart('')).toBe(false)
  })

  it('非 flowchart 或含不支持的语句时返回 null', () => {
    expect(parseMermaidFlow('sequenceDiagram\n  A->>B: 请求')).toBeNull()
    expect(parseMermaidFlow('flowchart LR\n  A --> B\n  click A "https://example.com"')).toBeNull()
  })
})
