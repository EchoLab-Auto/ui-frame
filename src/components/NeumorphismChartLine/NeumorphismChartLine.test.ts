import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismChartLine from './NeumorphismChartLine.vue'

const mockSeries = [
  {
    name: 'Visitors',
    data: [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
      { label: 'Mar', value: 150 },
    ],
  },
]

describe('NeumorphismChartLine', () => {
  it('renders with series data', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries },
    })
    expect(wrapper.find('.nm-chart--line').exists()).toBe(true)
    expect(wrapper.find('.nm-chart__body').exists()).toBe(true)
  })

  it('renders aria-label on chart body', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries },
    })
    const body = wrapper.find('.nm-chart__body')
    expect(body.attributes('role')).toBe('img')
    expect(body.attributes('aria-label')).toContain('Line chart')
  })

  it('renders legend when showLegend is true', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries, showLegend: true },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(true)
  })

  it('hides legend when showLegend is false', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries, showLegend: false },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(false)
  })

  it('renders svg element', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries },
    })
    expect(wrapper.find('.nm-chart__svg').exists()).toBe(true)
  })

  it('handles empty series gracefully', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: [] },
    })
    expect(wrapper.find('.nm-chart--line').exists()).toBe(true)
  })

  it('renders line paths for data', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries },
    })
    const lines = wrapper.findAll('.nm-chart__line')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('renders data points when showPoints is true', () => {
    const wrapper = mount(NeumorphismChartLine, {
      props: { series: mockSeries, showPoints: true },
    })
    const points = wrapper.findAll('.nm-chart__point')
    expect(points.length).toBeGreaterThan(0)
  })
})
