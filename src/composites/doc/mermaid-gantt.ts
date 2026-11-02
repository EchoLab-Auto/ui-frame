/**
 * Mermaid `gantt` → 原生甘特图模型。
 *
 * 为什么要有它：甘特图回退成源码是**信息量最大的一种损失**——它的全部意义在于
 * "谁与谁重叠、整体还要多久"，而这两件事源码里读不出来。
 *
 * 口径与 `./mermaid-sequence.ts` 一致：纯函数、绝不抛错、不认识的写法记进
 * `errors`（调用方据此回退源码，不画半张图）。
 *
 * 支持子集：
 * - `title` / `dateFormat` / `axisFormat` / `todayMarker`（最后一项只忽略）
 * - `section`
 * - 任务：`名称 :[状态,] [id,] [start,] end`，状态 `done` / `active` / `crit` /
 *   `milestone`
 * - 起始：具体日期 或 `after <id>`（省略 = 接上一个任务）
 * - 结束：具体日期 或 时长（`ms|s|m|h|d|w`）
 * - `excludes weekends` 与 `excludes <日期>`（按工作日推进时长）
 *
 * 不支持 `vert`（竖向布局）与 `%%{init}%%` 指令——遇到即记错回退。
 */

import type { ProDocFlowError } from './types.js'

const HEADER_RE = /^gantt\s*$/i
const SECTION_RE = /^section\s+(.*)$/i
const TITLE_RE = /^title\s+(.*)$/i
const DATE_FORMAT_RE = /^dateFormat\s+(.+)$/i
const AXIS_FORMAT_RE = /^axisFormat\s+(.+)$/i
const EXCLUDES_RE = /^excludes\s+(.+)$/i
const TODAY_MARKER_RE = /^todayMarker\b.*$/i
/** `标签 :a, b, c` —— 冒号前是显示名，冒号后是逗号分隔的元数据 */
const TASK_RE = /^(.+?)\s*:\s*(.+)$/

export type GanttTaskStatus = 'default' | 'done' | 'active' | 'crit' | 'milestone'

export interface GanttTask {
  id: string
  label: string
  /** 所属 section 名（无 section 时为空串） */
  section: string
  status: GanttTaskStatus
  startMs: number
  endMs: number
  /** `after X` 的来源任务 id（供渲染依赖线用） */
  after?: string
}

export interface GanttSection {
  name: string
  tasks: GanttTask[]
}

export interface GanttGraph {
  title?: string
  sections: GanttSection[]
  /** 全图时间范围 */
  startMs: number
  endMs: number
  axisFormat?: string
  errors: ProDocFlowError[]
}

export function emptyGanttGraph(): GanttGraph {
  return { sections: [], startMs: 0, endMs: 0, errors: [] }
}

export function isMermaidGantt(source: string): boolean {
  const first = source
    .split('\n')
    .find(line => line.trim() && !line.trim().startsWith('%%'))
    ?.trim()
  return !!first && HEADER_RE.test(first)
}

const MS = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
} as const

const DURATION_RE = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/i
const AFTER_RE = /^after\s+(.+)$/i

const STATUS_WORDS: Record<string, GanttTaskStatus> = {
  done: 'done',
  active: 'active',
  crit: 'crit',
  milestone: 'milestone',
}

/** 把 `YYYY-MM-DD` 这类格式串编译成正则 + 字段顺序（长 token 优先）。 */
function compileDateFormat(format: string): { re: RegExp; fields: string[] } {
  const tokens = ['YYYY', 'YY', 'MM', 'DD', 'HH', 'mm', 'ss', 'M', 'D', 'H', 'S']
  const fields: string[] = []
  let pattern = ''

  for (let i = 0; i < format.length;) {
    const token = tokens.find(t => format.startsWith(t, i))
    if (token) {
      fields.push(token)
      // 必须带捕获括号：`parseDate` 按 `match[index + 1]` 取字段，少了括号
      // 匹配仍然成功但每个字段都是 undefined（Date.UTC 得到 NaN）。
      pattern += token === 'YYYY' ? '(\\d{4})' : '(\\d{1,2})'
      i += token.length
      continue
    }
    const ch = format[i]
    pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    i += 1
  }

  return { re: new RegExp(`^${pattern}$`), fields }
}

/** 按 `dateFormat` 把日期串解成 UTC 毫秒；不合法返回 null。 */
function parseDate(value: string, format: { re: RegExp; fields: string[] }): number | null {
  const match = format.re.exec(value.trim())
  if (!match) return null
  const parts: Record<string, number> = {}
  format.fields.forEach((field, index) => {
    parts[field] = Number.parseInt(match[index + 1], 10)
  })
  const year = parts.YYYY ?? (parts.YY !== undefined ? 2000 + parts.YY : 1970)
  const month = (parts.MM ?? parts.M ?? 1) - 1
  const day = parts.DD ?? parts.D ?? 1
  const hour = parts.HH ?? parts.H ?? 0
  const minute = parts.mm ?? 0
  const second = parts.ss ?? parts.S ?? 0
  const ms = Date.UTC(year, month, day, hour, minute, second)
  return Number.isFinite(ms) ? ms : null
}

function isWeekend(ms: number): boolean {
  const day = new Date(ms).getUTCDay()
  return day === 0 || day === 6
}

/** 某时刻所在 UTC 日零点（排除规则的键）。 */
function dayStartOf(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function isWorkday(ms: number, excluded: Set<number>): boolean {
  return !isWeekend(ms) && !excluded.has(dayStartOf(ms))
}

/**
 * 从 start 起推进 `days` 个工作日，返回结束时刻。
 *
 * 口径：**起始日算第 1 个工作日**（"5 个工作日"从周一开始就结束在周五，这是文档
 * 作者与 Mermaid 一致的直觉）。但长度至少落在一个可用日上——`1d` 从周五开始应
 * 结束在周一，而不是零长度（零长度是里程碑的语义，不该被时长撞出来）。
 */
function addWorkdays(startMs: number, days: number, excluded: Set<number>): number {
  let remaining = Math.max(0, Math.round(days))
  let cursor = startMs
  if (remaining === 0) return cursor

  // 起始日若本身是工作日，它就是第 1 天
  if (isWorkday(cursor, excluded)) remaining -= 1

  // 上界护栏：排除规则写错（比如整周都被排除）时不至于死循环。
  for (let guard = 0; guard < 4000; guard++) {
    if (remaining <= 0 && cursor > startMs) break
    cursor += MS.d
    if (!isWorkday(cursor, excluded)) continue
    remaining -= 1
  }
  return cursor
}

/** 把时长换算成毫秒；`d` / `w` 在有排除规则时按工作日推进。 */
function resolveDuration(
  amount: number,
  unit: keyof typeof MS,
  startMs: number,
  excludeWeekends: boolean,
  excluded: Set<number>
): number {
  if ((unit === 'd' || unit === 'w') && (excludeWeekends || excluded.size > 0)) {
    const days = unit === 'w' ? amount * 5 : amount
    return addWorkdays(startMs, days, excluded) - startMs
  }
  return amount * MS[unit]
}

interface RawMetadata {
  status: GanttTaskStatus
  id?: string
  start?: { kind: 'date'; value: string } | { kind: 'after'; id: string }
  end?:
    { kind: 'date'; value: string } | { kind: 'duration'; amount: number; unit: keyof typeof MS }
}

/** `2026-01-01` / `2026/01/01` / `2026-01-01 08:00` 都算日期形态（合法性由 dateFormat 判）。 */
function looksLikeDate(value: string): boolean {
  return /^\d{1,4}[-/.]\d{1,2}([-/.]\d{1,4})?([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(value)
}

/**
 * 解析冒号后的元数据串。
 *
 * **顺序敏感**：Mermaid 的元数据是位置语义（`状态, id, 起始, 结束`），不是键值对。
 * 所以判断必须是"先认形态、再按位置落位"：日期出现在 id 之后是起始，出现在起始
 * 之后是结束。判反了会把 `:done, req, 2026-01-01, 5d` 解成 "id=2026-01-01"。
 */
function parseMetadata(parts: string[]): RawMetadata {
  const meta: RawMetadata = { status: 'default' }
  for (const raw of parts) {
    const part = raw.trim()
    if (!part) continue

    const lower = part.toLowerCase()
    // 状态词只认第一个：后续同名 token 是 id（作者可能真给任务起名 done）
    if (meta.status === 'default' && STATUS_WORDS[lower]) {
      meta.status = STATUS_WORDS[lower]
      continue
    }

    const after = AFTER_RE.exec(part)
    if (after) {
      meta.start = { kind: 'after', id: after[1].trim() }
      continue
    }

    const duration = DURATION_RE.exec(part)
    if (duration) {
      // 时长只能表达"结束"；出现在起始位置说明作者省略了起始（接上一任务）
      meta.end = {
        kind: 'duration',
        amount: Number.parseFloat(duration[1]),
        unit: duration[2].toLowerCase() as keyof typeof MS,
      }
      continue
    }

    if (looksLikeDate(part)) {
      if (!meta.start) meta.start = { kind: 'date', value: part }
      else if (!meta.end) meta.end = { kind: 'date', value: part }
      else meta.end = { kind: 'date', value: part }
      continue
    }

    if (!meta.id) {
      meta.id = part
      continue
    }

    if (!meta.end) meta.end = { kind: 'date', value: part }
  }
  return meta
}

interface PendingTask {
  label: string
  section: string
  meta: RawMetadata
  line: number
  source: string
}

/**
 * 解析 `gantt` 源码。
 *
 * 两遍：先按出现顺序收集任务（id 在行内位置不固定），再顺序结算时间——`after`
 * 只能引用**已结算**的任务，这与 Mermaid 的语义一致（跨行乱序引用它自己也会拒绝）。
 */
export function parseMermaidGantt(source: string): GanttGraph {
  const errors: ProDocFlowError[] = []
  const pending: PendingTask[] = []
  const excluded = new Set<number>()
  let excludeWeekends = false
  let dateFormatRaw = 'YYYY-MM-DD'
  let axisFormat: string | undefined
  let title: string | undefined
  let headerSeen = false
  let section = ''

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    const commentAt = lines[i].indexOf('%%')
    const raw = (commentAt >= 0 ? lines[i].slice(0, commentAt) : lines[i]).trim()
    if (!raw) continue

    if (!headerSeen) {
      if (HEADER_RE.test(raw)) {
        headerSeen = true
        continue
      }
      errors.push({ line: lineNo, source: raw, message: '期望 gantt 声明' })
      return { ...emptyGanttGraph(), errors }
    }

    const t = TITLE_RE.exec(raw)
    if (t) {
      title = t[1].trim()
      continue
    }
    const df = DATE_FORMAT_RE.exec(raw)
    if (df) {
      dateFormatRaw = df[1].trim()
      continue
    }
    const af = AXIS_FORMAT_RE.exec(raw)
    if (af) {
      axisFormat = af[1].trim()
      continue
    }
    const ex = EXCLUDES_RE.exec(raw)
    if (ex) {
      for (const token of ex[1].split(/[, ]+/).filter(Boolean)) {
        if (/^weekends?$/i.test(token)) {
          excludeWeekends = true
          continue
        }
        const day = Date.parse(token)
        if (Number.isFinite(day)) {
          const date = new Date(day)
          excluded.add(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
        } else {
          errors.push({ line: lineNo, source: raw, message: `无法识别的 excludes 项 ${token}` })
        }
      }
      continue
    }
    if (TODAY_MARKER_RE.test(raw)) continue
    if (/^vert\b/i.test(raw)) {
      errors.push({ line: lineNo, source: raw, message: '不支持竖向布局 vert' })
      continue
    }

    const s = SECTION_RE.exec(raw)
    if (s) {
      section = s[1].trim()
      continue
    }

    const task = TASK_RE.exec(raw)
    if (task) {
      pending.push({
        label: task[1].trim(),
        section,
        meta: parseMetadata(task[2].split(',')),
        line: lineNo,
        source: raw,
      })
      continue
    }

    errors.push({ line: lineNo, source: raw, message: '无法识别的语句' })
  }

  const dateFormat = compileDateFormat(dateFormatRaw)

  // ── 第二遍：顺序结算时间 ──
  const byId = new Map<string, GanttTask>()
  const sections: GanttSection[] = []
  const sectionIndex = new Map<string, GanttSection>()
  let cursorEnd: number | undefined
  let firstStart = Number.POSITIVE_INFINITY
  let lastEnd = Number.NEGATIVE_INFINITY
  let taskCount = 0

  pending.forEach((entry, index) => {
    const id = entry.meta.id?.trim() || `task-${index}`
    if (byId.has(id)) {
      errors.push({ line: entry.line, source: entry.source, message: `任务 id ${id} 重复` })
      return
    }

    let startMs: number | undefined
    if (entry.meta.start?.kind === 'date') {
      const parsed = parseDate(entry.meta.start.value, dateFormat)
      if (parsed === null) {
        errors.push({
          line: entry.line,
          source: entry.source,
          message: `日期 ${entry.meta.start.value} 不符合 dateFormat ${dateFormatRaw}`,
        })
        return
      }
      startMs = parsed
    } else if (entry.meta.start?.kind === 'after') {
      const target = byId.get(entry.meta.start.id)
      if (!target) {
        errors.push({
          line: entry.line,
          source: entry.source,
          message: `after 引用了未定义或尚未结算的任务 ${entry.meta.start.id}`,
        })
        return
      }
      startMs = target.endMs
    } else {
      // 省略起始 = 接上一个任务（顺序执行），这是 Mermaid 的默认语义
      startMs = cursorEnd ?? 0
    }

    let endMs: number
    if (entry.meta.end?.kind === 'duration') {
      endMs =
        startMs +
        resolveDuration(
          entry.meta.end.amount,
          entry.meta.end.unit,
          startMs,
          excludeWeekends,
          excluded
        )
    } else if (entry.meta.end?.kind === 'date') {
      const parsed = parseDate(entry.meta.end.value, dateFormat)
      if (parsed === null) {
        errors.push({
          line: entry.line,
          source: entry.source,
          message: `日期 ${entry.meta.end.value} 不符合 dateFormat ${dateFormatRaw}`,
        })
        return
      }
      endMs = parsed
    } else {
      // 只有一个日期且无时长：Mermaid 视作 1 天
      endMs = startMs + MS.d
    }

    if (endMs < startMs) {
      errors.push({ line: entry.line, source: entry.source, message: '结束时间早于开始时间' })
      return
    }

    const task: GanttTask = {
      id,
      label: entry.label,
      section: entry.section,
      status: entry.meta.status,
      startMs,
      endMs,
      ...(entry.meta.start?.kind === 'after' ? { after: entry.meta.start.id } : {}),
    }
    byId.set(id, task)
    taskCount += 1

    cursorEnd = endMs
    firstStart = Math.min(firstStart, startMs)
    lastEnd = Math.max(lastEnd, endMs)

    let bucket = sectionIndex.get(entry.section)
    if (!bucket) {
      bucket = { name: entry.section, tasks: [] }
      sectionIndex.set(entry.section, bucket)
      sections.push(bucket)
    }
    bucket.tasks.push(task)
  })

  if (taskCount === 0) {
    errors.push({ line: 0, source: '', message: '没有任何任务' })
    return { ...emptyGanttGraph(), errors }
  }

  return {
    ...(title ? { title } : {}),
    sections,
    startMs: firstStart,
    endMs: lastEnd,
    ...(axisFormat ? { axisFormat } : {}),
    errors,
  }
}

/**
 * 按 `axisFormat`（Mermaid 的 strftime 子集）格式化刻度。
 *
 * 只认文档里真正用得上的几个 token（`%Y %m %d %H %M %S`），其余原样输出：猜错的
 * 格式比不格式化更误导。缺省格式按跨度决定是否带时刻。
 */
export function formatGanttTick(ms: number, format?: string): string {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = format?.trim()
  if (!fmt) {
    const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0
    return formatGanttTick(ms, hasTime ? '%m-%d %H:%M' : '%m-%d')
  }
  return fmt.replace(/%[YmdHMS]/g, token => {
    switch (token) {
      case '%Y':
        return String(date.getUTCFullYear())
      case '%m':
        return pad(date.getUTCMonth() + 1)
      case '%d':
        return pad(date.getUTCDate())
      case '%H':
        return pad(date.getUTCHours())
      case '%M':
        return pad(date.getUTCMinutes())
      case '%S':
        return pad(date.getUTCSeconds())
      default:
        return token
    }
  })
}
