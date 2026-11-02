/**
 * Mermaid 代码块的**图型分发**（纯函数，渲染端与解析端都不认识彼此）。
 *
 * 为什么单独一层：宿主只需要问一个问题——"这段源码该画成什么、还是只能给源码"。
 * 把判定与解析收在这里，`MarkdownRenderer` 就只剩"拿到模型 → 挂组件"，新增图型
 * 也不用改渲染器里的条件分支链。
 *
 * 失败语义：**图型对但写法超界**与**图型不支持**都返回 `diagram: undefined`，但
 * `type` 不同——宿主据此落 `data-mermaid-graph`，让"改写法就有图"和"这图型还没
 * 实现"在 DOM 上可区分（否则用户只能看到一段源码，猜不出为什么）。
 */

import { isMermaidGantt, parseMermaidGantt, type GanttGraph } from './mermaid-gantt'
import { isMermaidFlowchart, parseMermaidFlow } from './mermaid-flow'
import { isMermaidSequence, parseMermaidSequence, type SequenceGraph } from './mermaid-sequence'
import type { MermaidDiagramKind } from './mermaid'
import type { ProDocFlowGraph } from './types.js'

export type MermaidDiagram =
  | { kind: 'flowchart'; graph: ProDocFlowGraph }
  | { kind: 'sequence'; graph: SequenceGraph }
  | { kind: 'gantt'; graph: GanttGraph }

export interface MermaidDiagramResult {
  /** 判定出的图型（写进 `data-mermaid-graph`，用于诊断与样式） */
  type: MermaidDiagramKind
  /** 解析成功才有的模型；`undefined` = 宿主保留源码 */
  diagram?: MermaidDiagram
}

/**
 * 解析一段 `mermaid` 代码块源码。
 *
 * 顺序有意义：三个判定函数各自只看首个有效行，互斥；`flowchart` 先判是因为它最
 * 常用（判定成本最低的路径先走）。
 */
export function parseMermaidDiagram(source: string): MermaidDiagramResult {
  if (isMermaidFlowchart(source)) {
    const graph = parseMermaidFlow(source)
    return graph
      ? { type: 'flowchart', diagram: { kind: 'flowchart', graph } }
      : { type: 'flowchart' }
  }

  if (isMermaidSequence(source)) {
    const graph = parseMermaidSequence(source)
    // 时序图半张 = 错误时序（少一条消息就是另一条链路），所以 errors 非空即回退
    return graph.errors.length === 0 && graph.actors.length > 0
      ? { type: 'sequence', diagram: { kind: 'sequence', graph } }
      : { type: 'sequence' }
  }

  if (isMermaidGantt(source)) {
    const graph = parseMermaidGantt(source)
    return graph.errors.length === 0 && graph.sections.length > 0
      ? { type: 'gantt', diagram: { kind: 'gantt', graph } }
      : { type: 'gantt' }
  }

  // 兜底：`graph LR` 这类写法已被 flowchart 分支吃掉，走到这里的都是真不认识的
  // 图型（class / state / pie / mindmap …）。
  return { type: 'other' }
}
