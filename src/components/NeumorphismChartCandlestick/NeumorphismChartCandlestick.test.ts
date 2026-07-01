import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismChartCandlestick from './NeumorphismChartCandlestick.vue'

const mockData = [
  { date: '2024-01-02', open: 100, high: 105, low: 98, close: 103, volume: 50000 },
  { date: '2024-01-03', open: 103, high: 108, low: 101, close: 106, volume: 60000 },
  { date: '2024-01-04', open: 106, high: 107, low: 102, close: 104, volume: 45000 },
  { date: '2024-01-05', open: 104, high: 110, low: 103, close: 109, volume: 70000 },
  { date: '2024-01-06', open: 109, high: 112, low: 107, close: 110, volume: 55000 },
]

describe('NeumorphismChartCandlestick', () => {
  it('renders with OHLC data', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData },
    })
    expect(wrapper.find('.nm-chart--candlestick').exists()).toBe(true)
    expect(wrapper.find('.nm-chart__body').exists()).toBe(true)
  })

  it('renders aria-label on chart body', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData },
    })
    const body = wrapper.find('.nm-chart__body')
    expect(body.attributes('role')).toBe('img')
    expect(body.attributes('aria-label')).toContain('Candlestick chart')
  })

  it('renders svg element', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData },
    })
    expect(wrapper.find('.nm-chart__svg').exists()).toBe(true)
  })

  it('renders candle bodies', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData },
    })
    const candles = wrapper.findAll('.nm-chart__candle-body')
    expect(candles.length).toBe(5)
  })

  it('renders volume bars when showVolume is true', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData, showVolume: true },
    })
    const bars = wrapper.findAll('.nm-chart__volume-bar')
    expect(bars.length).toBe(5)
  })

  it('hides volume bars when showVolume is false', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData, showVolume: false },
    })
    expect(wrapper.findAll('.nm-chart__volume-bar').length).toBe(0)
  })

  it('renders MA lines when showMA is true', () => {
    const maData = [
      { date: '2024-01-02', open: 100, high: 105, low: 98, close: 103, volume: 50000 },
      { date: '2024-01-03', open: 103, high: 108, low: 101, close: 106, volume: 60000 },
      { date: '2024-01-04', open: 106, high: 107, low: 102, close: 104, volume: 45000 },
      { date: '2024-01-05', open: 104, high: 110, low: 103, close: 109, volume: 70000 },
      { date: '2024-01-06', open: 109, high: 112, low: 107, close: 110, volume: 55000 },
      { date: '2024-01-07', open: 110, high: 115, low: 109, close: 114, volume: 80000 },
      { date: '2024-01-08', open: 114, high: 117, low: 112, close: 115, volume: 65000 },
      { date: '2024-01-09', open: 115, high: 118, low: 113, close: 116, volume: 72000 },
      { date: '2024-01-10', open: 116, high: 120, low: 115, close: 119, volume: 68000 },
      { date: '2024-01-11', open: 119, high: 121, low: 117, close: 120, volume: 75000 },
      { date: '2024-01-12', open: 120, high: 123, low: 119, close: 122, volume: 90000 },
    ]
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: maData, showMA: true, maPeriods: [5] },
    })
    const lines = wrapper.findAll('.nm-chart__ma-line')
    expect(lines.length).toBe(1)
  })

  it('handles empty data gracefully', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: [] },
    })
    expect(wrapper.find('.nm-chart--candlestick').exists()).toBe(true)
  })

  it('renders title when provided', () => {
    const wrapper = mount(NeumorphismChartCandlestick, {
      props: { data: mockData, title: 'Stock Price' },
    })
    expect(wrapper.find('.nm-chart__title').text()).toBe('Stock Price')
  })
})
