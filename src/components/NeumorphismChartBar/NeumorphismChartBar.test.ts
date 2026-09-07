import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismChartBar from './NeumorphismChartBar.vue'
import { ConfigKey } from '@/composables/useConfig'

const mockSeries = [
  {
    name: 'Sales',
    data: [
      { label: 'Q1', value: 40 },
      { label: 'Q2', value: 70 },
      { label: 'Q3', value: 55 },
      { label: 'Q4', value: 90 },
    ],
  },
]

describe('NeumorphismChartBar', () => {
  it('renders with series data', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries },
    })
    expect(wrapper.find('.nm-chart--bar').exists()).toBe(true)
    expect(wrapper.find('.nm-chart__body').exists()).toBe(true)
  })

  it('renders aria-label on chart body', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries },
    })
    const body = wrapper.find('.nm-chart__body')
    expect(body.attributes('role')).toBe('img')
    expect(body.attributes('aria-label')).toContain('Bar chart')
  })

  it('renders legend when showLegend is true', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries, showLegend: true },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(true)
    expect(wrapper.findAll('.nm-chart__legend-item').length).toBe(1)
  })

  it('hides legend when showLegend is false', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries, showLegend: false },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(false)
  })

  it('renders title when provided', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries, title: 'Test Chart' },
    })
    expect(wrapper.find('.nm-chart__title').text()).toBe('Test Chart')
  })

  it('renders svg element', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries },
    })
    expect(wrapper.find('.nm-chart__svg').exists()).toBe(true)
  })

  it('handles empty series gracefully', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: [] },
    })
    expect(wrapper.find('.nm-chart--bar').exists()).toBe(true)
  })

  it('renders bar rects for data points', () => {
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: mockSeries },
    })
    // SVG rects for bars should exist
    const rects = wrapper.findAll('.nm-chart__bar')
    expect(rects.length).toBeGreaterThan(0)
  })

  it('全局配置 chart.bar.stacked 级联生效(两系列同 x 堆叠)', () => {
    const twoSeries = [
      { name: 'A', data: [{ label: 'x', value: 10 }] },
      { name: 'B', data: [{ label: 'x', value: 10 }] },
    ]
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: twoSeries },
      global: {
        provide: { [ConfigKey]: { value: { chart: { bar: { stacked: true } } } } },
      },
    })
    const rects = wrapper.findAll('.nm-chart__bar')
    expect(rects.length).toBe(2)
    // 堆叠模式下两根柱 x 相同、y 累加
    expect(rects[0].attributes('x')).toBe(rects[1].attributes('x'))
    expect(Number(rects[1].attributes('y'))).toBeLessThan(Number(rects[0].attributes('y')))
  })

  it('显式 prop 优先于全局配置(stacked=false 分组并列)', () => {
    const twoSeries = [
      { name: 'A', data: [{ label: 'x', value: 10 }] },
      { name: 'B', data: [{ label: 'x', value: 10 }] },
    ]
    const wrapper = mount(NeumorphismChartBar, {
      props: { series: twoSeries, stacked: false },
      global: {
        provide: { [ConfigKey]: { value: { chart: { bar: { stacked: true } } } } },
      },
    })
    const rects = wrapper.findAll('.nm-chart__bar')
    expect(rects.length).toBe(2)
    // 分组模式下两根柱 x 不同
    expect(rects[0].attributes('x')).not.toBe(rects[1].attributes('x'))
  })
})
