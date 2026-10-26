import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismEmpty from './NeumorphismEmpty.vue'

describe('NeumorphismEmpty', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismEmpty)
    expect(wrapper.classes()).toContain('nm-empty')
  })

  it('should render description', () => {
    const wrapper = mount(NeumorphismEmpty, {
      props: { description: 'No data available' },
    })
    expect(wrapper.text()).toContain('No data available')
  })

  it('should apply size class', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismEmpty, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-empty--${size}`)
    }
  })

  it('should render custom slot content', () => {
    const wrapper = mount(NeumorphismEmpty, {
      slots: { default: '<div class="custom-empty">Custom</div>' },
    })
    expect(wrapper.find('.custom-empty').exists()).toBe(true)
  })

  // ---- 数字 size（px 插图边长）----

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismEmpty, { props: { size: 80, description: 'No data' } })
    expect(wrapper.classes()).toContain('nm-empty--sized')
    expect(wrapper.classes().some(c => /^nm-empty--(small|medium|large)$/.test(c))).toBe(false)
    // 80 落在 60(sm) 与 100(md) 之间：位置 0.5 → 字号 12→14 的中点 13
    const style = wrapper.attributes('style')
    expect(style).toContain('--nm-empty-sz-illustration: 80px')
    expect(style).toContain('--nm-empty-sz-font: 13px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [60, 'small'],
      [100, 'medium'],
      [140, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismEmpty, { props: { size: px } })
      expect(byNumber.attributes('style')).toContain(`--nm-empty-sz-illustration: ${px}px`)
      const byTier = mount(NeumorphismEmpty, { props: { size: tier } })
      expect(byTier.classes()).toContain(`nm-empty--${tier}`)
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 100', () => {
    for (const bad of [0, -40, Number.NaN]) {
      const wrapper = mount(NeumorphismEmpty, { props: { size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-empty-sz-illustration: 100px')
    }
  })
})
