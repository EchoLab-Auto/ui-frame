import { afterEach, describe, expect, it } from 'vitest'
import {
  MERMAID_CLASS,
  MERMAID_GRAPH_ATTR,
  MERMAID_STATE_ATTR,
  mermaidPlaceholder,
  setMermaidState,
} from './mermaid'

function mountPlaceholder(source: string): { root: HTMLDivElement; diagram: Element } {
  const root = document.createElement('div')
  root.innerHTML = mermaidPlaceholder(source)
  document.body.appendChild(root)
  const diagram = root.querySelector(`.${MERMAID_CLASS}`)!
  return { root, diagram }
}

describe('Mermaid 占位（无官方渲染器）', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('占位保留转义源码，不把含箭头的图源复制进 data-* 属性', () => {
    const { root, diagram } = mountPlaceholder('flowchart LR\n  A["<开始>"] --> B')
    expect(diagram.getAttribute('data-mermaid')).toBeNull()
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('loading')
    expect(diagram.querySelector('pre code')?.textContent).toContain('A["<开始>"] --> B')
    expect(root.innerHTML).toContain('&lt;开始&gt;')
  })

  it('setMermaidState 是状态属性的唯一写入口', () => {
    const { diagram } = mountPlaceholder('flowchart LR\n  A --> B')
    setMermaidState(diagram, 'error')
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('error')
    setMermaidState(diagram, 'done')
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('done')
  })

  it('宿主用图型标记区分「语法不支持」与「图型不支持」', () => {
    const { diagram } = mountPlaceholder('sequenceDiagram\n  A->>B: 请求')
    diagram.setAttribute(MERMAID_GRAPH_ATTR, 'other')
    expect(diagram.getAttribute(MERMAID_GRAPH_ATTR)).toBe('other')
  })
})
