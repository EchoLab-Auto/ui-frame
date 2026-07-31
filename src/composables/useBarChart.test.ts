import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useBarChart } from './useBarChart'
import type { ChartSeries, BarRect } from './useBarChart'

// 共享事实：containerSize 默认 400×300,DEFAULT_MARGIN {24,24,40,48}
// → plot = 328 × 236

function mountBars(series: ChartSeries[], opts: Record<string, unknown> = {}) {
  let result: { bars: { value: BarRect[] } } | null = null
  const Comp = defineComponent({
    setup() {
      result = useBarChart({ containerRef: ref(null), series: ref(series), ...opts })
      return () => h('div')
    },
  })
  mount(Comp)
  return () => result!.bars.value
}

describe('useBarChart', () => {
  it('单系列分组柱状：x/width 按组宽与 gap 精确布局', () => {
    const bars = mountBars([
      {
        name: 'A',
        color: '#f00',
        data: [
          { label: 'x1', value: 10 },
          { label: 'x2', value: 20 },
        ],
      },
    ])()
    // groupWidth=164, gap=32.8, barWidth=131.2;yMin=0,yMax=20
    expect(bars).toHaveLength(2)
    expect(bars[0].x).toBeCloseTo(16.4, 5)
    expect(bars[0].y).toBeCloseTo(118, 5)
    expect(bars[0].width).toBeCloseTo(131.2, 5)
    expect(bars[0].height).toBeCloseTo(118, 5)
    expect(bars[1].x).toBeCloseTo(180.4, 5)
    expect(bars[1].y).toBeCloseTo(0, 5)
    expect(bars[1].height).toBeCloseTo(236, 5)
  })

  it('两系列同组并列：第二根柱 x 偏移一个 barWidth', () => {
    const bars = mountBars([
      { name: 'A', color: '#f00', data: [{ label: 'x', value: 10 }] },
      { name: 'B', color: '#0f0', data: [{ label: 'x', value: 20 }] },
    ])()
    // groupWidth=328, gap=65.6, barWidth=131.2
    expect(bars).toHaveLength(2)
    expect(bars[0].x).toBeCloseTo(32.8, 5)
    expect(bars[1].x).toBeCloseTo(164, 5)
    expect(bars[1].color).toBe('#0f0')
  })

  it('值域随数据变化（yMin 钳到 ≤0,yMax 取最大值）', () => {
    const bars = mountBars([
      {
        name: 'A',
        color: '#f00',
        data: [
          { label: 'a', value: -10 },
          { label: 'b', value: 30 },
        ],
      },
    ])()
    // yMin=-10,yMax=30,yRange=40
    expect(bars[1].height).toBeCloseTo(236, 5)
    expect(bars[0].height).toBeCloseTo(0, 5)
  })

  it('堆叠模式：同系列值在 y 方向累加', () => {
    const bars = mountBars(
      [
        { name: 'A', color: '#f00', data: [{ label: 'x', value: 10 }] },
        { name: 'B', color: '#0f0', data: [{ label: 'x', value: 10 }] },
      ],
      { stacked: true }
    )()
    expect(bars).toHaveLength(2)
    expect(bars[0].x).toBeCloseTo(bars[1].x, 5)
    expect(bars[1].y).toBeLessThan(bars[0].y)
    expect(bars[0].y).toBeCloseTo(236 - 118, 5)
    expect(bars[1].y).toBeCloseTo(0, 5)
  })

  it('空数据返回空数组', () => {
    expect(mountBars([])()).toEqual([])
  })

  it('显式 yMin/yMax 覆盖数据值域', () => {
    const bars = mountBars([{ name: 'A', color: '#f00', data: [{ label: 'x', value: 50 }] }], {
      yMin: 0,
      yMax: 100,
    })()
    expect(bars[0].height).toBeCloseTo(118, 5)
  })
})
