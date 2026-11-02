import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DocGanttChart from './DocGanttChart.vue'
import { parseMermaidGantt } from './mermaid-gantt'

function mountGantt(source: string) {
  const graph = parseMermaidGantt(source)
  expect(graph.errors).toEqual([])
  return mount(DocGanttChart, { props: { graph } })
}

function leftOf(el: { attributes: (name: string) => string | undefined }): number {
  return Number.parseFloat(el.attributes('style')!.match(/left: ([-\d.]+)px/)![1])
}

function widthOf(el: { attributes: (name: string) => string | undefined }): number {
  return Number.parseFloat(el.attributes('style')!.match(/width: ([-\d.]+)px/)![1])
}

describe('DocGanttChart', () => {
  it('每个任务一条，条形宽度与时长成正比', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        两天 :a, 2026-01-01, 2d
        四天 :b, 2026-01-01, 4d`
    )
    const bars = wrapper.findAll('.nm-gantt__bar')
    expect(bars).toHaveLength(2)
    const [two, four] = bars.map(bar => widthOf(bar))
    expect(four / two).toBeGreaterThan(1.7)
    expect(four / two).toBeLessThan(2.3)
    // 同起点：left 相同
    expect(leftOf(bars[0])).toBeCloseTo(leftOf(bars[1]), 0)
  })

  it('after 依赖画折线，起于源条右端、止于目标条左端', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        设计 :a, 2026-01-01, 3d
        实现 :b, after a, 4d`
    )
    const dep = wrapper.find('.nm-gantt__dep')
    expect(dep.exists()).toBe(true)
    expect((dep.attributes('d') ?? '').startsWith('M ')).toBe(true)

    const bars = wrapper.findAll('.nm-gantt__bar')
    // 第二个任务的起点 = 第一个的终点（after 语义）
    expect(leftOf(bars[1])).toBeCloseTo(leftOf(bars[0]) + widthOf(bars[0]), 0)
  })

  it('section 渲染成小标题行，任务名前缀缩进在左列', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        section 设计
        原型 :p, 2026-01-01, 2d
        section 开发
        实现 :i, 2026-01-03, 3d`
    )
    expect(wrapper.findAll('.nm-gantt__section').map(el => el.text())).toEqual(['设计', '开发'])
    expect(wrapper.findAll('.nm-gantt__task-label')).toHaveLength(2)
  })

  it('里程碑画成菱形并带独立标签（不靠条形表达零时长）', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        上线 :milestone, m, 2026-02-01, 0d`
    )
    const bar = wrapper.find('.nm-gantt__bar')
    expect(bar.classes()).toContain('nm-gantt__bar--milestone')
    expect(wrapper.find('.nm-gantt__milestone-label').text()).toBe('上线')
  })

  it('状态类各自落到条形上：done / active / crit', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        已完成 :done, a, 2026-01-01, 2d
        进行中 :active, b, 2026-01-01, 2d
        关键 :crit, c, 2026-01-01, 2d`
    )
    const classes = wrapper.findAll('.nm-gantt__bar').map(bar => bar.classes().join(' '))
    expect(classes[0]).toContain('nm-gantt__bar--done')
    expect(classes[1]).toContain('nm-gantt__bar--active')
    expect(classes[2]).toContain('nm-gantt__bar--crit')
  })

  it('刻度按跨度选单位：两周内出日刻度，跨度大则放宽', () => {
    const short = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        短 :a, 2026-01-01, 10d`
    )
    const long = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        长 :a, 2026-01-01, 200d`
    )
    const shortTicks = short.findAll('.nm-gantt__tick').length
    const longTicks = long.findAll('.nm-gantt__tick').length
    expect(shortTicks).toBeGreaterThan(5)
    expect(longTicks).toBeLessThan(shortTicks * 2)
    expect(longTicks).toBeGreaterThan(0)
  })

  it('是图表不是画布：没有视口控件/网格，右边界贴着容器宽度', () => {
    const wrapper = mountGantt(
      `gantt
        dateFormat YYYY-MM-DD
        任务 :a, 2026-01-01, 5d`
    )
    expect(wrapper.find('.nm-canvas').exists()).toBe(false)
    expect(wrapper.find('.nm-canvas__controls').exists()).toBe(false)
    expect(wrapper.find('.nm-gantt__scroll').exists()).toBe(true)

    const stage = wrapper.find('.nm-gantt__stage')
    const stageWidth = Number.parseFloat(stage.attributes('style')!.match(/width: ([\d.]+)px/)![1])
    const bar = wrapper.find('.nm-gantt__bar')
    // 条形不越出舞台（时间轴没有溢出）
    expect(leftOf(bar) + widthOf(bar)).toBeLessThanOrEqual(stageWidth + 1)
  })
})
