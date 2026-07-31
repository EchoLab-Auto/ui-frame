import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { usePieChart } from './usePieChart'
import type { ChartDataPoint } from './usePieChart'
import type { PieArc } from './usePieChart'

// 饼图用对称 PIE_MARGIN=24 → plot = 352 × 252 → cx=176, cy=126, outerRadius=min(352,252)/2=126

function mountArcs(data: ChartDataPoint[], opts: Record<string, unknown> = {}) {
  let result: { arcs: { value: PieArc[] } } | null = null
  const Comp = defineComponent({
    setup() {
      result = usePieChart({ containerRef: ref(null), data: ref(data), ...opts })
      return () => h('div')
    },
  })
  mount(Comp)
  return () => result!.arcs.value
}

describe('usePieChart', () => {
  it('两等分切片：角度/质心/标签位置精确', () => {
    const arcs = mountArcs(
      [
        { label: 'a', value: 50 },
        { label: 'b', value: 50 },
      ],
      { innerRadius: 0, padAngle: 0, startAngle: 0, labelPosition: 'outside' }
    )()
    expect(arcs).toHaveLength(2)

    // 第一片：0 → π;质心角 π/2，质心半径 (126+0)/2=63
    expect(arcs[0].percentage).toBeCloseTo(50, 5) // percentage 为 0-100 制
    expect(arcs[0].centroidX).toBeCloseTo(176, 1)
    expect(arcs[0].centroidY).toBeCloseTo(126 + 63, 5)
    // 外标签：labelRadius = 126+20 = 146
    expect(arcs[0].labelX).toBeCloseTo(176, 1)
    expect(arcs[0].labelY).toBeCloseTo(126 + 146, 5)
    expect(arcs[0].labelAnchor).toBe('start')

    // 第二片：π → 2π;质心角 3π/2,anchor = end(cos<0)
    expect(arcs[1].percentage).toBeCloseTo(50, 5)
    expect(arcs[1].labelAnchor).toBe('end')
  })

  it('percentage 按总值归一', () => {
    const arcs = mountArcs(
      [
        { label: 'a', value: 30 },
        { label: 'b', value: 10 },
      ],
      { padAngle: 0 }
    )()
    expect(arcs[0].percentage).toBeCloseTo(75, 5)
    expect(arcs[1].percentage).toBeCloseTo(25, 5)
  })

  it('startAngle 以角度制转换为弧度起点', () => {
    const arcs = mountArcs(
      [
        { label: 'a', value: 50 },
        { label: 'b', value: 50 },
      ],
      { padAngle: 0, startAngle: -90 }
    )()
    // 起点 -π/2：第一片质心角 = -π/2 + π/2 = 0 → centroidY = cy
    expect(arcs[0].centroidY).toBeCloseTo(126, 5)
    expect(arcs[0].centroidX).toBeCloseTo(176 + 63, 5)
  })

  it('内半径生效（甜甜圈质心半径为 (r+ir)/2）', () => {
    const arcs = mountArcs(
      [
        { label: 'a', value: 50 },
        { label: 'b', value: 50 },
      ],
      { innerRadius: 40, padAngle: 0, startAngle: 0 }
    )()
    // midRadius = (126+40)/2 = 83
    expect(arcs[0].centroidY).toBeCloseTo(126 + 83, 5)
  })

  it('总值为 0 / 空数据返回空数组', () => {
    expect(mountArcs([])()).toEqual([])
    expect(mountArcs([{ label: 'a', value: 0 }])()).toEqual([])
  })
})
