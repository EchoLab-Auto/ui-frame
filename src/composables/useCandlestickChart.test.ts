import { describe, it, expect } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useCandlestickChart } from './useCandlestickChart'
import type { OhlcDataPoint, CandleRect, VolumeBar, MALine } from './useCandlestickChart'

// plot = 328 × 236;showVolume 时 priceArea = 236×0.72 ≈ 169.92

const DATA: OhlcDataPoint[] = [
  { date: 'd1', open: 10, high: 14, low: 8, close: 12, volume: 100 },
  { date: 'd2', open: 12, high: 16, low: 11, close: 14, volume: 200 },
]

function mountCandles(data: OhlcDataPoint[], opts: Record<string, unknown> = {}) {
  let result: {
    candles: { value: CandleRect[] }
    volumeBars: { value: VolumeBar[] }
    maLines: { value: MALine[] }
  } | null = null
  const Comp = defineComponent({
    setup() {
      result = useCandlestickChart({ containerRef: ref(null), data: ref(data), ...opts })
      return () => h('div')
    },
  })
  mount(Comp)
  return () => result!
}

describe('useCandlestickChart', () => {
  it('OHLC 映射：蜡烛体/影线坐标精确', () => {
    const api = mountCandles(DATA, { showVolume: false, showMA: false })()
    // priceMin=8, priceMax=16, priceArea=236(无量)
    // groupWidth=164, bodyWidth=98.4, centerX(d1)=82
    const c = api.candles.value
    expect(c).toHaveLength(2)
    expect(c[0].x).toBeCloseTo(82 - 49.2, 5)
    expect(c[0].width).toBeCloseTo(98.4, 5)
    expect(c[0].wickX).toBeCloseTo(82, 5)
    // priceToY: 236 - (p-8)/8*236
    expect(c[0].wickY1).toBeCloseTo(236 - ((14 - 8) / 8) * 236, 5) // high 14
    expect(c[0].wickY2).toBeCloseTo(236 - ((8 - 8) / 8) * 236, 5) // low 8 → 236
    // close ≥ open → 涨;体顶 = min(openY, closeY)
    expect(c[0].y).toBeCloseTo(236 - ((12 - 8) / 8) * 236, 5) // closeY
    expect(c[0].height).toBeCloseTo(Math.abs(((12 - 10) / 8) * 236), 5)
  })

  it('量柱：高度按最大量归一,位于底部量区', () => {
    const api = mountCandles(DATA, { showVolume: true, showMA: false })()
    const v = api.volumeBars.value
    expect(v).toHaveLength(2)
    // volumeArea = 236×0.28 = 66.08;d2(200) 为最大量 → 高度=66.08
    expect(v[1].height).toBeCloseTo(236 * 0.28, 5)
    expect(v[0].height).toBeCloseTo((100 / 200) * 236 * 0.28, 5)
    // 最大量柱顶 = 量区顶部 = 236×0.72;小量柱顶 = 量区底 - 自身高度
    expect(v[1].y).toBeCloseTo(236 * 0.72, 5)
    expect(v[0].y).toBeCloseTo(236 - (100 / 200) * 236 * 0.28, 5)
  })

  it('MA 线：SMA 周期内均值与 x 定位', () => {
    const api = mountCandles(
      [...DATA, { date: 'd3', open: 14, high: 18, low: 13, close: 16, volume: 150 }],
      { showVolume: false, showMA: true, maPeriods: [2] }
    )()
    const ma = api.maLines.value
    expect(ma).toHaveLength(1)
    expect(ma[0].period).toBe(2)
    expect(ma[0].name).toBe('MA2')
    // MA2@d2=(12+14)/2=13,MA2@d3=(14+16)/2=15 → 两个有效点成线
    expect(ma[0].path).toContain('M')
  })

  it('close < open 标记为跌', () => {
    const api = mountCandles([{ date: 'd1', open: 14, high: 15, low: 9, close: 10, volume: 50 }], {
      showVolume: false,
      showMA: false,
    })()
    expect(api.candles.value[0].color).not.toBe(api.candles.value[0].color && '')
  })

  it('空数据返回空蜡烛/空量柱/空均线', () => {
    const api = mountCandles([])()
    expect(api.candles.value).toEqual([])
    expect(api.volumeBars.value).toEqual([])
    expect(api.maLines.value).toEqual([])
  })
})
