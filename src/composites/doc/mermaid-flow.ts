/**
 * Mermaid flowchart → ui-frame 原生 DocFlowCanvas 图模型。
 *
 * `flowchart` / `graph` 走 NeumorphismCanvas 的布局、节点、边、缩放与主题，
 * **不使用** Mermaid 的 SVG 皮肤。其他图型（sequence / class / gantt …）没有
 * 原生实现，返回 null 由宿主保留源码——框架里已经不存在第二套皮肤。
 *
 * 返回 null 的两种情况，宿主用 `isMermaidFlowchart` 区分：
 * - 图型不支持（非 `flowchart` / `graph`）；
 * - 流程图用了超出原生能力的写法（`direction` / `click` / `style` 之外的未知语句）。
 */

import { parseProDocFlow } from './flow-parser'
import type { ProDocFlowGraph } from './types'

const HEADER_RE = /^(?:flowchart|graph)\s+(LR|RL|TB|BT)\s*$/i
const STRUCTURAL_RE = /^(?:subgraph\b.*|end|direction\b.*)$/i
const PRESENTATION_RE = /^(?:classDef\b.*|class\b.*|style\b.*|linkStyle\b.*)$/i

/** 首个有效行（跳过空行与 `%%` 注释）。 */
function firstMeaningfulLine(source: string): string {
  return (
    source
      .split('\n')
      .find(line => line.trim() && !line.trim().startsWith('%%'))
      ?.trim() ?? ''
  )
}

/**
 * 源码是否是 Mermaid 流程图（`flowchart` / `graph`）。
 *
 * 宿主据此区分**该由原生画布承担**与**该交给官方渲染器**的图型：流程图不再
 * 降级到官方 SVG 皮肤——同一份文档里两种皮肤并排是最刺眼的不一致，解析不了
 * 就保留源码；`sequenceDiagram` / `gantt` 等非流程图形型仍走官方渲染器。
 */
export function isMermaidFlowchart(source: string): boolean {
  return HEADER_RE.test(firstMeaningfulLine(source))
}

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

/**
 * 点线（dependency）→ 实线的两种写法都要认。
 *
 * Mermaid 里同一个语义有两种拼法，用的人各占一半：
 * - 展开式：`A -. "文字" .-> B`（官方文档主推）
 * - 紧凑式：`A -.-> B` / `A -.->|文字| B`（手写更常见）
 *
 * 只认展开式时，紧凑式会整行解析失败、整张图退回源码（"依赖图恰好全用紧凑
 * 写法"是很可能的）。所以先归一紧凑式，再交给展开式的规则。
 */
const DASHED_COMPACT_RE = /-\.->\s*(?:\|([^|]*)\|)?/g
const DASHED_SPACED_RE = /-\.\s*(?:"([^"]*)"|([^\.]*?))?\s*\.->/g

/** 去掉 Mermaid 节点标签里的引号与简单 HTML，保留 ProDoc 的形状括号。 */
function normalizeStatement(line: string): string {
  // 原生画布已有依赖边绘制；Mermaid 的点线提示统一映射为带标签依赖边。
  const compact = line.replace(DASHED_COMPACT_RE, (_edge, label?: string) => {
    const text = label?.trim()
    return text ? `-->|${text}|` : '-->'
  })
  const spaced = compact.replace(
    DASHED_SPACED_RE,
    (_edge, quoted: string | undefined, bare: string | undefined) =>
      `-->|${(quoted ?? bare ?? '').trim()}|`
  )
  return spaced.replace(
    /(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g,
    block => block[0] + plainLabel(block.slice(1, -1)) + block[block.length - 1]
  )
}

export function parseMermaidFlow(source: string): ProDocFlowGraph | null {
  const lines = source.split('\n')
  if (!isMermaidFlowchart(source)) return null

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
