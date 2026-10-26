import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismCollapse from './NeumorphismCollapse.vue'

const items = [
  { key: 'a', title: '第一项' },
  { key: 'b', title: '第二项' },
]

describe('NeumorphismCollapse — size 数字通道', () => {
  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismCollapse, { props: { items, size: 14 } })
    expect(wrapper.classes()).toContain('nm-collapse--sized')
    expect(wrapper.classes().some(c => /^nm-collapse--(small|medium|large)$/.test(c))).toBe(false)
    // 14 落在 13(sm) 与 15(md) 之间：位置 0.5
    expect(wrapper.attributes('style')).toContain('--nm-collapse-sz-font: 14px')
    expect(wrapper.attributes('style')).toContain('--nm-collapse-sz-pad-y: 14px')
    expect(wrapper.attributes('style')).toContain('--nm-collapse-sz-pad-x: 18px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 13 / medium 15 / large 16（标题字号）；medium 走基础规则，没有独立 class
    const anchors = [
      [13, 'small'],
      [15, 'medium'],
      [16, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismCollapse, { props: { items, size: px } })
      const byTier = mount(NeumorphismCollapse, { props: { items, size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-collapse-sz-font: ${px}px`)
      expect(byTier.classes()).toContain(`nm-collapse--${tier}`)
      expect(byTier.classes()).not.toContain('nm-collapse--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 15', () => {
    for (const bad of [0, -15, Number.NaN]) {
      const wrapper = mount(NeumorphismCollapse, { props: { items, size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-collapse-sz-font: 15px')
    }
  })
})
