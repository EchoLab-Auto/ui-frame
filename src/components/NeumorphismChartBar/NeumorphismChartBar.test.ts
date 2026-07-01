import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismChartBar from './NeumorphismChartBar.vue'

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
})
