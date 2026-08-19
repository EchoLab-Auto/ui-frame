/**
 * ProDoc Flow —— prodoc-flow 代码块语法解析器
 *
 * 纯函数、SSR 安全、绝不抛错：非法行收集进 graph.errors，其余内容照常解析。
 *
 * 语法约定（见 DocRenderer docs/guide/prodoc-format.md）：
 * ```
 * graph LR                      // 方向：LR / RL / TB / BT（缺省 LR + 容错记录）
 * A[开始] --> B{判断}            // []矩形 [/x/]圆角 ()体育场 {}菱形
 * B -->|是| C[处理1|/a/b.md]     // 边标签 |文本|；"显示文本|路径.md" 即文档链接
 * A --> C                       // 裸 id 引用（自动登记矩形节点）
 * ```
 */

import type {
  ProDocFlowDirection,
  ProDocFlowEdge,
  ProDocFlowGraph,
  ProDocFlowNode,
  ProDocFlowNodeShape,
} from './types.js'

/** 方向声明行 */
const GRAPH_RE = /^graph\s+(LR|RL|TB|BT)\s*$/i
/** 节点 token：id + 可选形状括号（sticky，配合 lastIndex 分词） */
const NODE_RE = /([A-Za-z_][\w-]*)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))?/y
/** 边 token：--> 带可选 |标签|（sticky） */
const ARROW_RE = /-->\s*(?:\|([^|]*)\|)?/y
/** 手动排版标注：`@ x, y`（仅允许出现在行尾，绑定到该行最后一个节点） */
const POS_RE = /@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/y
/** 文档链接路径形态：以 /、./、../ 开头且 .md 结尾（防误吞含竖线普通文本） */
const DOC_PATH_RE = /^(\/|\.\/|\.\.\/)[^\s]*\.md$/

/** 从 markdown 正文提取全部 prodoc-flow 代码块源码 */
const FLOW_BLOCK_RE = /^```prodoc-flow\s*\n([\s\S]*?)^```/gm

export function extractFlowBlocks(body: string): string[] {
  const blocks: string[] = []
  FLOW_BLOCK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FLOW_BLOCK_RE.exec(body)) !== null) {
    blocks.push(match[1])
  }
  return blocks
}

/**
 * 把节点的手动排版坐标写回 markdown 正文中的指定 prodoc-flow 块。
 *
 * 定位：与 blockSource 内容一致的围栏块（忽略首尾空白）。
 * 写回：节点有独立声明行时就地替换/追加 `@ x, y`（保留行尾 %% 注释）；
 * 仅出现在边链中的节点，在块尾新增 `id @ x, y` 行。
 * 找不到匹配块时原样返回。
 */
export function writeFlowNodePosition(
  body: string,
  blockSource: string,
  nodeId: string,
  x: number,
  y: number
): string {
  FLOW_BLOCK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FLOW_BLOCK_RE.exec(body)) !== null) {
    const inner = match[1]
    if (inner.trim() !== blockSource.trim()) continue

    const nodeRe = new RegExp(
      `^${nodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s\\[\\{\\(@]|$)`
    )
    const lines = inner.split('\n')
    let written = false
    for (let i = 0; i < lines.length; i++) {
      const commentAt = lines[i].indexOf('%%')
      const code = commentAt >= 0 ? lines[i].slice(0, commentAt) : lines[i]
      const comment = commentAt >= 0 ? lines[i].slice(commentAt) : ''
      const trimmed = code.trim()
      // 只写独立声明行（含 --> 的边链行跳过：行尾标注会绑定到链尾节点）
      if (trimmed.includes('-->') || !nodeRe.test(trimmed)) continue
      const stripped = trimmed.replace(/\s*@\s*-?[\d.]+\s*,\s*-?[\d.]+\s*$/, '')
      lines[i] = `${stripped} @ ${x}, ${y}${comment ? `  ${comment}` : ''}`
      written = true
      break
    }
    if (!written) {
      // 块尾追加（inner 通常以换行结尾）
      const entry = `${nodeId} @ ${x}, ${y}`
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.splice(lines.length - 1, 0, entry)
      } else {
        lines.push(entry)
      }
    }

    const newInner = lines.join('\n')
    const start = match.index + match[0].indexOf(inner)
    return body.slice(0, start) + newInner + body.slice(start + inner.length)
  }
  return body
}

/** 形状括号 → 形状 + 内部文本 */
function parseShape(bracket: string | undefined): { shape: ProDocFlowNodeShape; text: string } {
  if (!bracket) return { shape: 'rect', text: '' }
  if (bracket.startsWith('[/') && bracket.endsWith('/]')) {
    return { shape: 'rounded', text: bracket.slice(2, -2) }
  }
  if (bracket.startsWith('{')) {
    return { shape: 'diamond', text: bracket.slice(1, -1) }
  }
  if (bracket.startsWith('(')) {
    return { shape: 'stadium', text: bracket.slice(1, -1) }
  }
  return { shape: 'rect', text: bracket.slice(1, -1) }
}

/** 节点文本 → 显示文本 + 文档链接（统一无前导斜杠存储） */
function parseLabel(text: string): { label: string; docPath?: string } {
  const trimmed = text.trim()
  const parts = trimmed.split('|')
  if (parts.length > 1) {
    const last = parts[parts.length - 1].trim()
    if (DOC_PATH_RE.test(last)) {
      return {
        label: parts.slice(0, -1).join('|').trim(),
        // 归一化为无前导斜杠：`/a/b.md` / `./b.md` / `../b.md` → `a/b.md` / `b.md`
        docPath: last.replace(/^(?:\.\.\/|\.\/|\/)/, ''),
      }
    }
  }
  return { label: trimmed }
}

/**
 * 解析 prodoc-flow 源码为流程图。
 * 容错优先：任何非法输入都不会抛错，而是记录到 graph.errors。
 */
export function parseProDocFlow(source: string): ProDocFlowGraph {
  const errors: ProDocFlowGraph['errors'] = []
  const nodeMap = new Map<string, ProDocFlowNode>()
  const edgeKeys = new Set<string>()
  const edges: ProDocFlowEdge[] = []
  let direction: ProDocFlowDirection = 'LR'
  let directionDeclared = false

  function registerNode(id: string, bracket?: string): void {
    const { shape, text } = parseShape(bracket)
    const { label, docPath } = bracket ? parseLabel(text) : { label: id, docPath: undefined }
    const existing = nodeMap.get(id)
    if (!existing) {
      nodeMap.set(id, { id, label, shape, docPath })
    } else if (bracket) {
      // 后出现的完整声明合并升级（后者优先），行为可预测
      existing.label = label
      existing.shape = shape
      if (docPath !== undefined) existing.docPath = docPath
    }
  }

  /** 手动排版标注：设置节点坐标（后者覆盖前者） */
  function setNodePos(id: string, x: number, y: number): void {
    const node = nodeMap.get(id)
    if (node) {
      node.x = x
      node.y = y
    }
  }

  function registerEdge(from: string, to: string, label?: string): void {
    const key = `${from}→${to}${label ?? ''}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push({ from, to, label })
  }

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    // %% 注释：行首整行 / 行中截断（与 mermaid 一致）
    const commentAt = lines[i].indexOf('%%')
    const raw = (commentAt >= 0 ? lines[i].slice(0, commentAt) : lines[i]).trim()
    if (!raw) continue

    // 方向声明（仅首有效行）
    if (!directionDeclared) {
      const m = GRAPH_RE.exec(raw)
      if (m) {
        direction = m[1].toUpperCase() as ProDocFlowDirection
      } else {
        errors.push({
          line: lineNo,
          source: lines[i].trim(),
          message: '缺少方向声明 graph LR|RL|TB|BT，已按 LR 处理',
        })
        // 容错：该行仍按普通语句解析
        parseStatement(raw, lineNo, lines[i].trim())
      }
      directionDeclared = true
      continue
    }

    parseStatement(raw, lineNo, lines[i].trim())
  }

  function parseStatement(raw: string, lineNo: number, original: string): boolean {
    let pos = 0
    NODE_RE.lastIndex = 0
    ARROW_RE.lastIndex = 0

    NODE_RE.lastIndex = pos
    let nodeMatch = NODE_RE.exec(raw)
    if (!nodeMatch || nodeMatch.index !== 0) {
      errors.push({ line: lineNo, source: original, message: '无法识别的语句' })
      return false
    }

    let fromId = nodeMatch[1]
    registerNode(nodeMatch[1], nodeMatch[2])
    pos = NODE_RE.lastIndex

    // (ARROW NODE)*，行尾可带 `@ x, y` 手动排版标注（绑定最后一个节点）
    while (true) {
      // 跳过空白
      while (pos < raw.length && /\s/.test(raw[pos])) pos++
      if (pos >= raw.length) break

      // 手动排版标注（仅行尾）：@ x, y
      if (raw[pos] === '@') {
        POS_RE.lastIndex = pos
        const posMatch = POS_RE.exec(raw)
        if (posMatch && posMatch.index === pos) {
          setNodePos(fromId, parseFloat(posMatch[1]), parseFloat(posMatch[2]))
          return true
        }
        errors.push({
          line: lineNo,
          source: original,
          message: '无法识别的排版标注（应为行尾 @ x, y）',
        })
        return false
      }

      ARROW_RE.lastIndex = pos
      const arrowMatch = ARROW_RE.exec(raw)
      if (!arrowMatch || arrowMatch.index !== pos) {
        errors.push({
          line: lineNo,
          source: original,
          message: `无法识别的内容: "${raw.slice(pos)}"`,
        })
        return false
      }
      const edgeLabel = arrowMatch[1]?.trim() || undefined
      pos = ARROW_RE.lastIndex

      while (pos < raw.length && /\s/.test(raw[pos])) pos++
      NODE_RE.lastIndex = pos
      nodeMatch = NODE_RE.exec(raw)
      if (!nodeMatch || nodeMatch.index !== pos) {
        errors.push({ line: lineNo, source: original, message: '箭头后缺少目标节点' })
        return false
      }
      const toId = nodeMatch[1]
      registerNode(nodeMatch[1], nodeMatch[2])
      registerEdge(fromId, toId, edgeLabel)
      fromId = toId
      pos = NODE_RE.lastIndex
    }
    return true
  }

  return {
    direction,
    nodes: [...nodeMap.values()],
    edges,
    errors,
  }
}
