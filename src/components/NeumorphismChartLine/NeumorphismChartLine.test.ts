import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
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

  describe('tooltip valueFormatter', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    // happy-dom 下无布局，手动接管 rAF 队列以便悬停后合帧执行
    function stubManualRaf() {
      const queue: FrameRequestCallback[] = []
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        queue.push(cb)
        return queue.length
      })
      vi.stubGlobal('cancelAnimationFrame', () => {})
      return queue
    }

    // 悬停到第 0 个数据点（clientX 48 = marginLeft → svgX 0）
    function hoverFirstPoint(wrapper: VueWrapper) {
      const body = wrapper.find('.nm-chart__body')
      ;(body.element as HTMLElement).getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: 400,
          bottom: 300,
          width: 400,
          height: 300,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
      body.element.dispatchEvent(new MouseEvent('mousemove', { clientX: 48, clientY: 100 }))
    }

    it('renders formatted value in tooltip when valueFormatter is provided', async () => {
      const rafQueue = stubManualRaf()
      const wrapper = mount(NeumorphismChartLine, {
        props: {
          series: mockSeries,
          valueFormatter: (value: number) => `$${(value / 1000).toFixed(1)}K`,
        },
      })
      await nextTick()
      hoverFirstPoint(wrapper)
      rafQueue.forEach(cb => cb(0))
      await nextTick()

      const tooltip = wrapper.find('.nm-chart__tooltip')
      expect(tooltip.exists()).toBe(true)
      expect(tooltip.text()).toContain('Visitors: $0.1K')
    })

    it('keeps raw value display when valueFormatter is omitted', async () => {
      const rafQueue = stubManualRaf()
      const wrapper = mount(NeumorphismChartLine, {
        props: { series: mockSeries },
      })
      await nextTick()
      hoverFirstPoint(wrapper)
      rafQueue.forEach(cb => cb(0))
      await nextTick()

      const tooltip = wrapper.find('.nm-chart__tooltip')
      expect(tooltip.exists()).toBe(true)
      expect(tooltip.text()).toContain('Visitors: 100')
    })
  })
})
