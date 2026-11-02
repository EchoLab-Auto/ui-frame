/**
 * Mermaid `sequenceDiagram` → 原生时序图模型。
 *
 * 为什么要有它：ui-frame 里流程图走原生画布、其余图型此前只能回退源码。时序图
 * 是文档里第二常用的图型（协议握手、请求链路、插件事件流都靠它），回退成源码
 * 等于让读者自己脑内演算顺序。
 *
 * 设计口径与 `./mermaid-flow.ts` 一致：
 * - **纯函数、SSR 安全、绝不抛错**：非法行收集进 `errors`；
 * - **宁可回退，不画半张图**：调用方在 `errors.length > 0` 时放弃渲染（源码可读，
 *   画错的图更糟）；
 * - **只吃 Mermaid 官方语法**，不发明方言，社交成本比便利重要。
 *
 * 支持的子集（覆盖日常 95% 的写法）：参与者声明、六种箭头、自消息、Note 三向、
 * activate/deactivate（含 `->>+` 简写）、autonumber、loop/alt/opt/par/critical/break
 * 分组与 else/and 分隔。不支持 `box`（参与者分组）、`rect`（背景着色）、
 * `%%{init}%%` 指令——遇到即记错回退。
 */

import type { ProDocFlowError } from './types.js'

const HEADER_RE = /^sequenceDiagram\s*$/i
const PARTICIPANT_RE = /^(participant|actor)\s+([^\s:]+)(?:\s+as\s+(.+))?$/i
const NOTE_RE = /^note\s+(left of|right of|over)\s+([^:]+?)\s*:\s*(.*)$/i
const ACTIVATE_RE = /^(activate|deactivate)\s+([^\s:]+)$/i
const BLOCK_START_RE = /^(loop|alt|opt|par|critical|break)\b\s*(.*)$/i
const BLOCK_SPLIT_RE = /^(else|and)\b\s*(.*)$/i
const END_RE = /^end\s*$/i
const AUTONUMBER_RE = /^autonumber\s*$/i

/**
 * 消息箭头。**长箭头必须排在短箭头前面**：`-->>` 若排在 `->>` 之后，`A-->>B`
 * 会被切成 `A-` + `->>` + `B`（惰性主体回溯到最短可行解）。
 *
 * 语义映射（Mermaid 官方语义）：
 * - `->>` 实线实心箭头 / `-->>` 虚线实心箭头（同步调用，最常用）
 * - `->` `-->` 无箭头连线（消息投递后不等待）
 * - `-)` `--)` 开放箭头（异步投递）
 * - `-x` `--x` 叉号（消息丢失/失败）
 */
const MESSAGE_ARROW_RE = /^(.+?)\s*(-->>|->>|--\)|-\)|--x|-x|-->|->)\s*([+-])?\s*(.+?)$/

export type SequenceActorKind = 'participant' | 'actor'

export type SequenceArrowKind =
  | 'solid-arrow'
  | 'dashed-arrow'
  | 'solid-open'
  | 'dashed-open'
  | 'solid-cross'
  | 'dashed-cross'
  | 'solid-line'
  | 'dashed-line'

export interface SequenceActor {
  id: string
  /** 显示名（`participant A as 别名` 取别名，否则取 id） */
  label: string
  kind: SequenceActorKind
}

export interface SequenceMessage {
  kind: 'message'
  from: string
  to: string
  label: string
  arrow: SequenceArrowKind
  /** 自消息：`A->>A:`，渲染成回环而不是零长箭头 */
  self: boolean
  /** `autonumber` 打开时由解析器补的序号 */
  number?: number
  /** `->>+B` / `->>-B` 简写：这条消息顺带激活/结束目标的生命线 */
  activate?: boolean
  deactivate?: boolean
}

export interface SequenceNote {
  kind: 'note'
  placement: 'left of' | 'right of' | 'over'
  /** `over A,B` 覆盖多个参与者；`left/right of` 只有一个 */
  actors: string[]
  label: string
}

export interface SequenceActivation {
  kind: 'activate' | 'deactivate'
  actor: string
}

export interface SequenceBlock {
  kind: 'block'
  block: 'loop' | 'alt' | 'opt' | 'par' | 'critical' | 'break'
  label: string
}

/**
 * 分组内的分隔线（`alt` 的 `else` / `par` 的 `and`）。
 *
 * 作为**独立 item** 而不是 `SequenceBlock.splits` 的元素：它的位置就是"出现在
 * 第几行"，塞进 block 里会让渲染端不得不回头重扫 items 猜位置（第一版就这么写，
 * 结果两处游标各算一遍，必然漂移）。
 */
export interface SequenceBlockSplit {
  kind: 'block-split'
  label: string
}

export type SequenceItem =
  | SequenceMessage
  | SequenceNote
  | SequenceActivation
  | SequenceBlock
  | SequenceBlockSplit
  | { kind: 'block-end' }

export interface SequenceGraph {
  title?: string
  actors: SequenceActor[]
  items: SequenceItem[]
  errors: ProDocFlowError[]
}

/** 空模型（无参与者、无内容）——调用方据此判"没什么可画"。 */
export function emptySequenceGraph(): SequenceGraph {
  return { actors: [], items: [], errors: [] }
}

/** 源码是否是 Mermaid 时序图（首个有效行判定，跳过空行与 `%%` 注释）。 */
export function isMermaidSequence(source: string): boolean {
  const first = source
    .split('\n')
    .find(line => line.trim() && !line.trim().startsWith('%%'))
    ?.trim()
  return !!first && HEADER_RE.test(first)
}

interface ParseState {
  actors: SequenceActor[]
  actorIds: Set<string>
  items: SequenceItem[]
  errors: ProDocFlowError[]
  autonumber: boolean
  counter: number
  openBlocks: SequenceBlock[]
  title?: string
}

function ensureActor(
  state: ParseState,
  id: string,
  kind: SequenceActorKind = 'participant'
): string {
  const trimmed = id.trim()
  if (!trimmed) return trimmed
  if (!state.actorIds.has(trimmed)) {
    state.actorIds.add(trimmed)
    state.actors.push({ id: trimmed, label: trimmed, kind })
  }
  return trimmed
}

/** 语义别名：`->>` 与 `-->>` 等只差虚线，颜色交给主题，形状表达"是否等待"。 */
function arrowKind(arrow: string): SequenceArrowKind {
  const dashed = arrow.startsWith('--')
  if (arrow.endsWith('>>')) return dashed ? 'dashed-arrow' : 'solid-arrow'
  if (arrow.endsWith(')')) return dashed ? 'dashed-open' : 'solid-open'
  if (arrow.endsWith('x')) return dashed ? 'dashed-cross' : 'solid-cross'
  return dashed ? 'dashed-line' : 'solid-line'
}

/**
 * 解析 `sequenceDiagram` 源码。
 *
 * 容错：任何无法识别的行都进 `errors`（带行号与原文），解析继续——但调用方看到
 * `errors` 非空就不该渲染（半张时序图比源码更难懂：缺一条消息的时序是**错误**的
 * 时序，不是不完整的时序）。
 */
export function parseMermaidSequence(source: string): SequenceGraph {
  const state: ParseState = {
    actors: [],
    actorIds: new Set(),
    items: [],
    errors: [],
    autonumber: false,
    counter: 0,
    openBlocks: [],
  }

  const lines = source.split('\n')
  let headerSeen = false

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    // `%%` 注释：行首整行 / 行中截断（与 Mermaid 一致）
    const commentAt = lines[i].indexOf('%%')
    const raw = (commentAt >= 0 ? lines[i].slice(0, commentAt) : lines[i]).trim()
    if (!raw) continue

    if (!headerSeen) {
      if (HEADER_RE.test(raw)) {
        headerSeen = true
        continue
      }
      state.errors.push({ line: lineNo, source: raw, message: '期望 sequenceDiagram 声明' })
      return { ...snapshot(state), errors: state.errors }
    }

    if (parseOne(state, raw)) continue
    state.errors.push({ line: lineNo, source: raw, message: '无法识别的语句' })
  }

  // 未闭合分组：Mermaid 自己也会报错；这里补一条，让调用方回退源码。
  if (state.openBlocks.length > 0) {
    state.errors.push({
      line: lines.length,
      source: '',
      message: `分组 ${state.openBlocks.map(b => b.block).join(', ')} 缺少 end`,
    })
  }
  return snapshot(state)
}

function snapshot(state: ParseState): SequenceGraph {
  return {
    ...(state.title ? { title: state.title } : {}),
    actors: [...state.actors],
    items: [...state.items],
    errors: [...state.errors],
  }
}

/** 解析一行；返回 false 表示这一行不认识（由调用方记错）。 */
function parseOne(state: ParseState, raw: string): boolean {
  if (AUTONUMBER_RE.test(raw)) {
    state.autonumber = true
    return true
  }

  if (END_RE.test(raw)) {
    // 弹到最近的分组；没有则认为是错误（多出来的 end）
    if (state.openBlocks.length === 0) return false
    state.openBlocks.pop()
    state.items.push({ kind: 'block-end' })
    return true
  }

  const participant = PARTICIPANT_RE.exec(raw)
  if (participant) {
    const kind: SequenceActorKind =
      participant[1].toLowerCase() === 'actor' ? 'actor' : 'participant'
    const id = participant[2]
    const label = participant[3]?.trim() || id
    ensureActor(state, id, kind)
    const actor = state.actors.find(a => a.id === id)
    if (actor) {
      actor.label = label
      actor.kind = kind
    }
    return true
  }

  const note = NOTE_RE.exec(raw)
  if (note) {
    const placement = note[1].toLowerCase().replace(/\s+/g, ' ') as SequenceNote['placement']
    const actors = note[2]
      .split(',')
      .map(a => ensureActor(state, a))
      .filter(Boolean)
    state.items.push({ kind: 'note', placement, actors, label: note[3].trim() })
    return true
  }

  const activation = ACTIVATE_RE.exec(raw)
  if (activation) {
    const actor = ensureActor(state, activation[2])
    state.items.push({
      kind: activation[1].toLowerCase() === 'activate' ? 'activate' : 'deactivate',
      actor,
    })
    return true
  }

  const blockStart = BLOCK_START_RE.exec(raw)
  if (blockStart) {
    const block: SequenceBlock = {
      kind: 'block',
      block: blockStart[1].toLowerCase() as SequenceBlock['block'],
      label: blockStart[2].trim(),
    }
    state.items.push(block)
    state.openBlocks.push(block)
    return true
  }

  const blockSplit = BLOCK_SPLIT_RE.exec(raw)
  if (blockSplit) {
    const open = state.openBlocks[state.openBlocks.length - 1]
    // `else` 只能出现在 alt 内、`and` 只能出现在 par 内（Mermaid 也这么要求）
    const expected = blockSplit[1].toLowerCase() === 'else' ? 'alt' : 'par'
    if (!open || open.block !== expected) return false
    state.items.push({ kind: 'block-split', label: blockSplit[2].trim() })
    return true
  }

  const message = MESSAGE_ARROW_RE.exec(raw)
  if (message) {
    const colonAt = raw.lastIndexOf(':')
    // 消息必须带 `: 文本`；没有冒号的形态是别的语法（如 `A->>B` 其实也合法，
    // Mermaid 允许无文本，这里同样接受）。
    const head = colonAt >= 0 ? raw.slice(0, colonAt) : raw
    const label = colonAt >= 0 ? raw.slice(colonAt + 1).trim() : ''
    const parsed = MESSAGE_ARROW_RE.exec(head)
    if (!parsed) return false

    const from = ensureActor(state, parsed[1])
    const to = ensureActor(state, parsed[4])
    if (!from || !to) return false

    const item: SequenceMessage = {
      kind: 'message',
      from,
      to,
      label,
      arrow: arrowKind(parsed[2]),
      self: from === to,
    }
    if (state.autonumber) item.number = ++state.counter
    if (parsed[3] === '+') item.activate = true
    if (parsed[3] === '-') item.deactivate = true
    state.items.push(item)

    // `->>+B` 同时开一段激活，`->>-B` 同时结束——Mermaid 的简写语义。
    if (item.activate) state.items.push({ kind: 'activate', actor: to })
    if (item.deactivate) state.items.push({ kind: 'deactivate', actor: to })
    return true
  }

  // `title` 在 sequenceDiagram 里不是官方语法（那是 gantt 的），但文档作者常写；
  // 接受它并把标题渲染在图上方，不因一个装饰性字段把整张图退回源码。
  const title = /^title\s+(.*)$/i.exec(raw)
  if (title) {
    state.title = title[1].trim()
    return true
  }

  return false
}
