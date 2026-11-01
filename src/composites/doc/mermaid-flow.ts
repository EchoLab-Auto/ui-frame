/**
 * Mermaid flowchart → ui-frame 原生 DocFlowCanvas 图模型。
 *
 * 常见的 `flowchart` / `graph` 不经过 Mermaid 的默认 SVG 皮肤，而是复用
 * NeumorphismCanvas 的布局、节点、边、缩放与主题。其他 Mermaid 图类型
 * （sequence / class / gantt …）返回 null，仍由 Mermaid 官方渲染器兜底。
 */

import { parseProDocFlow } from './flow-parser'
import type { ProDocFlowGraph } from './types'

const HEADER_RE = /^(?:flowchart|graph)\s+(LR|RL|TB|BT)\s*$/i
const STRUCTURAL_RE = /^(?:subgraph\b.*|end|direction\b.*)$/i
const PRESENTATION_RE = /^(?:classDef\b.*|class\b.*|style\b.*|linkStyle\b.*)$/i

/** 标签只作为文本进入 Vue 节点：换行标记变分隔符，HTML 不进入图组件。 */
function plainLabel(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' · ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/^\s*(["'])([\s\S]*)\1\s*$/, '$2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 去掉 Mermaid 节点标签里的引号与简单 HTML，保留 ProDoc 的形状括号。 */
function normalizeStatement(line: string): string {
  // 原生画布已有依赖边绘制；Mermaid 的点线提示统一映射为带标签依赖边。
  const solid = line.replace(
    /-\.\s*(?:"([^"]*)"|([^\.]*?))?\s*\.->/g,
    (_edge, quoted: string | undefined, bare: string | undefined) =>
      `-->|${(quoted ?? bare ?? '').trim()}|`
  )
  return solid.replace(
    /(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g,
    block => block[0] + plainLabel(block.slice(1, -1)) + block[block.length - 1]
  )
}

export function parseMermaidFlow(source: string): ProDocFlowGraph | null {
  const lines = source.split('\n')
  const first = lines.find(line => line.trim() && !line.trim().startsWith('%%'))?.trim() ?? ''
  if (!HEADER_RE.test(first)) return null

  const normalized: string[] = []
  for (const original of lines) {
    const line = original.trim()
    if (!line || line.startsWith('%%')) {
      normalized.push('')
      continue
    }
    if (STRUCTURAL_RE.test(line)) {
      // 子图是 Mermaid 的展示分组；原生画布先展开其节点，保留完整依赖拓扑。
      if (/^direction\b/i.test(line)) return null
      normalized.push('')
      continue
    }
    if (PRESENTATION_RE.test(line)) {
      // Mermaid 自有配色不进入原生图：统一由 ui-frame 主题令牌承担。
      normalized.push('')
      continue
    }
    if (/^(?:flowchart|graph)\s+/i.test(line)) {
      normalized.push(line.replace(/^flowchart/i, 'graph'))
      continue
    }
    normalized.push(normalizeStatement(line))
  }

  const graph = parseProDocFlow(normalized.join('\n'))
  // 不把半张图当成完整结果：复杂语法交给 Mermaid 官方渲染器兜底。
  return graph.nodes.length > 0 && graph.errors.length === 0 ? graph : null
}
