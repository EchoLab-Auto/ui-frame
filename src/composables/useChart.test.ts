import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useChart } from './useChart'

function mountChart(opts: Record<string, unknown> = {}) {
  let result: ReturnType<typeof useChart> | null = null
  const Comp = defineComponent({
    setup() {
      result = useChart({ containerRef: ref(null), series: ref([]), ...opts })
      return () => h('div')
    },
  })
  mount(Comp)
  return () => result!
}

describe('useChart', () => {
  it('containerSize 缺省 400×300,plotSize 按边距计算', () => {
    const chart = mountChart()()
    // DEFAULT_MARGIN {24,24,40,48} → plot = 328 × 236
    expect(chart.containerSize.value).toEqual({ width: 400, height: 300 })
    expect(chart.plotSize.value.width).toBeCloseTo(328, 5)
    expect(chart.plotSize.value.height).toBeCloseTo(236, 5)
  })

  it('自定义 margin 生效', () => {
    const chart = mountChart({ margin: { top: 0, right: 0, bottom: 0, left: 0 } })()
    expect(chart.plotSize.value.width).toBe(400)
    expect(chart.plotSize.value.height).toBe(300)
  })

  it('niceTicks 生成整齐刻度（步长取 1/2/5×10ⁿ 中的"好看"值）', () => {
    const chart = mountChart()()
    expect(chart.niceTicks(0, 100)).toEqual([0, 20, 40, 60, 80, 100])
    expect(chart.niceTicks(3, 97)).toEqual([0, 20, 40, 60, 80, 100])
    expect(chart.niceTicks(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })

  it('niceTicks 含负值范围（边界向整齐刻度外扩）', () => {
    const chart = mountChart()()
    const ticks = chart.niceTicks(-50, 50)
    expect(ticks).toEqual([-60, -40, -20, 0, 20, 40, 60])
  })

  it('formatValue 千/百万缩写', () => {
    const chart = mountChart()()
    expect(chart.formatValue(999)).toBe('999')
    expect(chart.formatValue(1500)).toBe('1.5K')
    expect(chart.formatValue(2500000)).toBe('2.5M')
  })
})
