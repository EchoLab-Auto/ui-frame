import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DocSequenceChart from './DocSequenceChart.vue'
import { parseMermaidSequence } from './mermaid-sequence'

function mountSeq(source: string) {
  const graph = parseMermaidSequence(source)
  expect(graph.errors).toEqual([])
  return mount(DocSequenceChart, { props: { graph } })
}

describe('DocSequenceChart', () => {
  it('每个参与者一个头 + 一条生命线，消息数 = 实际条数', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        participant A as 客户端
        participant B as 服务端
        A->>B: 请求
        B-->>A: 响应`
    )

    expect(wrapper.findAll('.nm-seq__head')).toHaveLength(2)
    expect(wrapper.text()).toContain('客户端')
    expect(wrapper.findAll('.nm-seq__lifeline')).toHaveLength(2)
    expect(wrapper.findAll('.nm-seq__message')).toHaveLength(2)
    // 一条实线一条虚线：线型是"是否等待"的语义，不能被统一
    expect(wrapper.findAll('.nm-seq__message--dashed')).toHaveLength(1)
  })

  it('自消息画成回环（路径含两个折点以上），不是零长箭头', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        participant A
        A->>A: 重试`
    )
    const path = wrapper.find('.nm-seq__message').attributes('d') ?? ''
    expect(path.split('L')).toHaveLength(4)
    expect(wrapper.find('.nm-seq__message-label--self').exists()).toBe(true)
  })

  it('Note 三向定位：左侧贴列左边、右侧贴列右边、over 居中跨越', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        Note left of A: 左
        Note right of B: 右
        Note over A,B: 跨列`
    )
    const notes = wrapper.findAll('.nm-seq__note')
    expect(notes).toHaveLength(3)
    const left = Number.parseFloat(notes[0].attributes('style')!.match(/left: ([-\d.]+)px/)![1])
    const right = Number.parseFloat(notes[1].attributes('style')!.match(/left: ([-\d.]+)px/)![1])
    expect(left).toBeGreaterThanOrEqual(8)
    expect(right).toBeGreaterThan(left)
    expect(notes[2].attributes('style')).toContain('width')
  })

  it('activate/deactivate 生成激活条，未闭合的延伸到生命线末端', () => {
    const closed = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        A->>+B: 调用
        B-->>-A: 返回`
    )
    expect(closed.findAll('.nm-seq__activation')).toHaveLength(1)

    const open = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        A->>B: 请求
        activate B`
    )
    expect(open.findAll('.nm-seq__activation')).toHaveLength(1)
  })

  it('alt/else 画出分组框与分隔线（分隔线有独立标签）', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        alt 命中
          A->>B: 读缓存
        else 未命中
          A->>B: 查库
        end`
    )
    expect(wrapper.findAll('.nm-seq__frame')).toHaveLength(1)
    expect(wrapper.findAll('.nm-seq__frame-split')).toHaveLength(1)
    expect(wrapper.text()).toContain('命中')
    expect(wrapper.text()).toContain('[未命中]')
  })

  it('autonumber 把序号渲染成圆角徽标', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        autonumber
        participant A
        participant B
        A->>B: 一
        B->>A: 二`
    )
    expect(wrapper.findAll('.nm-seq__number').map(el => el.text())).toEqual(['1', '2'])
  })

  it('actor 与 participant 在样式上可区分', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        actor U
        participant S
        U->>S: hi`
    )
    expect(wrapper.findAll('.nm-seq__head--actor')).toHaveLength(1)
  })

  it('是图表不是画布：没有视口控件/网格，宽度跟随容器', () => {
    const wrapper = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        A->>B: 请求`
    )
    // NeumorphismCanvas 的根 class 是 .nm-canvas —— 图表里不该出现
    expect(wrapper.find('.nm-canvas').exists()).toBe(false)
    expect(wrapper.find('.nm-canvas__controls').exists()).toBe(false)
    // 容器宽度测量层存在（图表宽度由它决定）
    expect(wrapper.find('.nm-seq__scroll').exists()).toBe(true)
    // 高度由内容决定：stage 高度是正数且写成内联样式
    const stage = wrapper.find('.nm-seq__stage')
    expect(stage.attributes('style')).toMatch(/height: \d+px/)
  })

  it('列数少时列宽封顶（图不虚胖），列数多时可横向滚动', () => {
    const two = mountSeq(
      `sequenceDiagram
        participant A
        participant B
        A->>B: x`
    )
    // minWidth 兜底 360：两列情形不会撑出横向滚动
    expect(two.find('.nm-seq__scroll--x').exists()).toBe(false)

    const many = Array.from({ length: 12 }, (_, i) => `participant P${i}`).join('\n')
    const wide = mount(DocSequenceChart, {
      props: { graph: parseMermaidSequence(`sequenceDiagram\n${many}`) },
    })
    expect(wide.find('.nm-seq__scroll--x').exists()).toBe(true)
  })
})
