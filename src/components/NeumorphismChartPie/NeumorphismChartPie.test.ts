import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismChartPie from './NeumorphismChartPie.vue'

const mockData = [
  { label: 'A', value: 30 },
  { label: 'B', value: 50 },
  { label: 'C', value: 20 },
]

describe('NeumorphismChartPie', () => {
  it('renders with data', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData },
    })
    expect(wrapper.find('.nm-chart--pie').exists()).toBe(true)
    expect(wrapper.find('.nm-chart__body').exists()).toBe(true)
  })

  it('renders aria-label on chart body', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData },
    })
    const body = wrapper.find('.nm-chart__body')
    expect(body.attributes('role')).toBe('img')
    expect(body.attributes('aria-label')).toContain('Pie chart')
  })

  it('renders legend when showLegend is true', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData, showLegend: true },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(true)
    expect(wrapper.findAll('.nm-chart__legend-item').length).toBe(3)
  })

  it('hides legend when showLegend is false', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData, showLegend: false },
    })
    expect(wrapper.find('.nm-chart__legend').exists()).toBe(false)
  })

  it('renders svg element', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData },
    })
    expect(wrapper.find('.nm-chart__svg').exists()).toBe(true)
  })

  it('shows empty state when data is empty', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: [] },
    })
    expect(wrapper.find('.nm-chart--pie').exists()).toBe(true)
  })

  it('renders arcs for data points', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData },
    })
    const arcs = wrapper.findAll('.nm-chart__arc')
    expect(arcs.length).toBe(3)
  })

  it('renders as donut when innerRadius > 0', () => {
    const wrapper = mount(NeumorphismChartPie, {
      props: { data: mockData, innerRadius: 50 },
    })
    expect(wrapper.find('.nm-chart--pie').exists()).toBe(true)
  })
})
