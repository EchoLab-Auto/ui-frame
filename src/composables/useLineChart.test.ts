import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useLineChart } from './useLineChart'
import type { ChartSeries, ChartPoint } from './useLineChart'

// plot = 328 × 236

function mountChart(series: ChartSeries[], opts: Record<string, unknown> = {}) {
  let result: {
    points: { value: ChartPoint[] }
    lines: { value: { path: string }[] }
  } | null = null
  const Comp = defineComponent({
    setup() {
      result = useLineChart({ containerRef: ref(null), series: ref(series), ...opts })
      return () => h('div')
    },
  })
  mount(Comp)
  return () => result!
}

describe('useLineChart', () => {
  it('点坐标：x 等距铺满,y 按值域线性映射', () => {
    const api = mountChart([
      {
        name: 'A',
        color: '#f00',
        data: [
          { label: 'a', value: 10 },
          { label: 'b', value: 20 },
          { label: 'c', value: 30 },
        ],
      },
    ])()
    // dataMin=10? — dataMin = min(0, 10) = 0(钳到 0);yMax=30 → yRange=30
    const pts = api.points.value
    expect(pts).toHaveLength(3)
    expect(pts[0].cx).toBeCloseTo(0, 5) // xStep = 328/2 = 164
    expect(pts[1].cx).toBeCloseTo(164, 5)
    expect(pts[2].cx).toBeCloseTo(328, 5)
    // y = plotH - (value/30)*236
    expect(pts[0].cy).toBeCloseTo(236 - (10 / 30) * 236, 5)
    expect(pts[1].cy).toBeCloseTo(236 - (20 / 30) * 236, 5)
    expect(pts[2].cy).toBeCloseTo(0, 5)
  })

  it('单点数据：x 取绘图区中点', () => {
    const api = mountChart([{ name: 'A', color: '#f00', data: [{ label: 'a', value: 5 }] }])()
    expect(api.points.value[0].cx).toBeCloseTo(164, 5)
  })

  it('linear 曲线生成 M/L 路径', () => {
    const api = mountChart(
      [
        {
          name: 'A',
          color: '#f00',
          data: [
            { label: 'a', value: 10 },
            { label: 'b', value: 20 },
            { label: 'c', value: 30 },
          ],
        },
      ],
      { curve: 'linear' }
    )()
    const path = api.lines.value[0].path
    expect(path.startsWith('M')).toBe(true)
    expect((path.match(/L/g) || []).length).toBe(2)
  })

  it('负值与零值混合不抛错且值域含 0', () => {
    const api = mountChart([
      {
        name: 'A',
        color: '#f00',
        data: [
          { label: 'a', value: -20 },
          { label: 'b', value: 0 },
          { label: 'c', value: 20 },
        ],
      },
    ])()
    // yMin=-20,yMax=20 → cy(b) = plotH - (0-(-20))/40*236 = 118
    expect(api.points.value[1].cy).toBeCloseTo(118, 5)
  })

  it('空系列返回空点/空路径', () => {
    const api = mountChart([])()
    expect(api.points.value).toEqual([])
    expect(api.lines.value).toEqual([])
  })
})
