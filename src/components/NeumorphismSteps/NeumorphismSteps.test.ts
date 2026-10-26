import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSteps from './NeumorphismSteps.vue'

const steps = [
  { key: '1', title: 'Step 1', description: 'First step' },
  { key: '2', title: 'Step 2', description: 'Second step' },
  { key: '3', title: 'Step 3', description: 'Third step' },
]

describe('NeumorphismSteps', () => {
  it('renders all three steps', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.findAll('.nm-steps__item')).toHaveLength(3)
  })

  it('marks first step as active when current is 0', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.find('.nm-steps__item--active').exists()).toBe(true)
  })

  it('renders step titles', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.text()).toContain('Step 1')
    expect(wrapper.text()).toContain('Step 3')
  })

  it('renders step descriptions', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.text()).toContain('First step')
  })

  it('supports horizontal direction by default', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.find('.nm-steps').exists()).toBe(true)
  })

  it('supports vertical direction', () => {
    const wrapper = mount(NeumorphismSteps, {
      props: { steps, current: 0, direction: 'vertical' },
    })
    expect(wrapper.find('.nm-steps--vertical').exists()).toBe(true)
  })

  it('applies error status from step config', () => {
    const stepsWithError = [
      { key: '1', title: 'S1', status: 'error' as const },
      { key: '2', title: 'S2' },
    ]
    const wrapper = mount(NeumorphismSteps, {
      props: { steps: stepsWithError, current: -1 },
    })
    expect(wrapper.find('.nm-steps__circle--error').exists()).toBe(true)
  })

  // ---- 数字 size（px 序号圆直径）----

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0, size: 32 } })
    const root = wrapper.find('.nm-steps')
    expect(root.classes()).toContain('nm-steps--sized')
    expect(root.classes().some(c => /^nm-steps--(small|medium|large)$/.test(c))).toBe(false)
    // 32 落在 28(sm) 与 36(md) 之间：位置 0.5 → 字号 12→14 的中点 13
    const style = root.attributes('style')
    expect(style).toContain('--nm-steps-sz-circle: 32px')
    expect(style).toContain('--nm-steps-sz-font: 13px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [28, 'small'],
      [36, 'medium'],
      [48, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismSteps, { props: { steps, current: 0, size: px } })
      expect(byNumber.find('.nm-steps').attributes('style')).toContain(
        `--nm-steps-sz-circle: ${px}px`
      )
      const byTier = mount(NeumorphismSteps, { props: { steps, current: 0, size: tier } })
      expect(byTier.find('.nm-steps').classes()).toContain(`nm-steps--${tier}`)
      expect(byTier.find('.nm-steps').attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 36', () => {
    for (const bad of [0, -8, Number.NaN]) {
      const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0, size: bad } })
      expect(wrapper.find('.nm-steps').attributes('style')).toContain('--nm-steps-sz-circle: 36px')
    }
  })
})
