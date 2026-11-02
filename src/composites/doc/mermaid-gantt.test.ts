import { describe, expect, it } from 'vitest'
import { formatGanttTick, isMermaidGantt, parseMermaidGantt } from './mermaid-gantt'

const utc = (y: number, m: number, d: number, h = 0) => Date.UTC(y, m - 1, d, h)

describe('Mermaid gantt → 原生甘特图', () => {
  it('section + 显式日期 + 时长，标签与状态落在正确的桶里', () => {
    const graph = parseMermaidGantt(`
      gantt
        title 迭代计划
        dateFormat YYYY-MM-DD
        section 设计
        需求梳理 :done, req, 2026-01-01, 5d
        原型 :active, proto, after req, 3d
        section 开发
        实现 :crit, impl, 2026-01-12, 10d
        发布 :milestone, m1, 2026-01-22, 0d
    `)

    expect(graph.errors).toEqual([])
    expect(graph.title).toBe('迭代计划')
    expect(graph.sections.map(s => s.name)).toEqual(['设计', '开发'])
    expect(graph.sections[0].tasks.map(t => [t.label, t.status])).toEqual([
      ['需求梳理', 'done'],
      ['原型', 'active'],
    ])
    expect(graph.sections[1].tasks.map(t => [t.label, t.status])).toEqual([
      ['实现', 'crit'],
      ['发布', 'milestone'],
    ])
    // after req：接在需求梳理结束（2026-01-06）之后
    expect(graph.sections[0].tasks[1].startMs).toBe(utc(2026, 1, 6))
    expect(graph.sections[0].tasks[1].endMs).toBe(utc(2026, 1, 9))
    expect(graph.sections[0].tasks[1].after).toBe('req')
    expect(graph.startMs).toBe(utc(2026, 1, 1))
    expect(graph.endMs).toBe(utc(2026, 1, 22))
  })

  it('省略起始 = 接上一个任务结束（顺序执行）', () => {
    const graph = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD
        第一步 :a, 2026-02-01, 2d
        第二步 :b, 3d
    `)
    expect(graph.errors).toEqual([])
    const [, second] = graph.sections[0].tasks
    expect(second.startMs).toBe(utc(2026, 2, 3))
    expect(second.endMs).toBe(utc(2026, 2, 6))
  })

  it('excludes weekends：时长按工作日推进，跨过周末', () => {
    const graph = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD
        excludes weekends
        五天工单 :t, 2026-01-01, 5d
    `)
    expect(graph.errors).toEqual([])
    const task = graph.sections[0].tasks[0]
    // 2026-01-01 是周四：5 个工作日 → 周五、周一、周二、周三 = 结束于 01-07
    expect(task.startMs).toBe(utc(2026, 1, 1))
    expect(task.endMs).toBe(utc(2026, 1, 7))
  })

  it('dateFormat 可自定义（含时刻）与 axisFormat 透传', () => {
    const graph = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD HH:mm
        axisFormat %H:%M
        压测 :load, 2026-03-01 08:00, 6h
    `)
    expect(graph.errors).toEqual([])
    const task = graph.sections[0].tasks[0]
    expect(task.startMs).toBe(utc(2026, 3, 1, 8))
    expect(task.endMs - task.startMs).toBe(6 * 3_600_000)
    expect(formatGanttTick(task.startMs, graph.axisFormat)).toBe('08:00')
  })

  it('里程碑是零时长任务，渲染层据此画菱形', () => {
    const graph = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD
        上线 :milestone, m, 2026-04-01, 0d
    `)
    expect(graph.errors).toEqual([])
    const task = graph.sections[0].tasks[0]
    expect(task.startMs).toBe(task.endMs)
  })

  it('未定义 after、日期格式不符、无任务都进 errors', () => {
    const badAfter = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD
        任务 :t, after nope, 2d
    `)
    expect(badAfter.errors.map(e => e.message).join()).toContain('after 引用了未定义')

    const badDate = parseMermaidGantt(`
      gantt
        dateFormat YYYY-MM-DD
        任务 :t, 2026/01/01, 2d
    `)
    expect(badDate.errors.map(e => e.message).join()).toContain('不符合 dateFormat')

    const empty = parseMermaidGantt('gantt\n  dateFormat YYYY-MM-DD')
    expect(empty.errors.map(e => e.message)).toContain('没有任何任务')
  })

  it('图型判定只看首个有效行', () => {
    expect(isMermaidGantt('gantt\n  任务 :t, 2026-01-01, 1d')).toBe(true)
    expect(isMermaidGantt('%% x\ngantt\n  任务 :t, 2026-01-01, 1d')).toBe(true)
    expect(isMermaidGantt('sequenceDiagram\n  A->>B: x')).toBe(false)
    expect(isMermaidGantt('')).toBe(false)
  })

  it('缺省 axisFormat 按是否带时刻选择精度', () => {
    expect(formatGanttTick(utc(2026, 1, 2))).toBe('01-02')
    expect(formatGanttTick(utc(2026, 1, 2, 8))).toBe('01-02 08:00')
  })
})
