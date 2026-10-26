import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTag from './NeumorphismTag.vue'

describe('NeumorphismTag', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismTag, { slots: { default: 'Tag' } })
    expect(wrapper.classes()).toContain('nm-tag')
    expect(wrapper.classes()).toContain('nm-tag--default')
    expect(wrapper.text()).toBe('Tag')
  })

  it('should apply variant classes', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
    for (const variant of variants) {
      const wrapper = mount(NeumorphismTag, { props: { variant } })
      expect(wrapper.classes()).toContain(`nm-tag--${variant}`)
    }
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismTag, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-tag--${size}`)
    }
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismTag, { props: { size: 13 }, slots: { default: 'Tag' } })
    expect(wrapper.classes()).toContain('nm-tag--sized')
    expect(wrapper.classes().some(c => /^nm-tag--(small|medium|large)$/.test(c))).toBe(false)
    // 13 落在 12(md) 与 14(lg) 之间：位置 1.5
    expect(wrapper.attributes('style')).toContain('--nm-tag-sz-font: 13px')
    expect(wrapper.attributes('style')).toContain('--nm-tag-sz-pad-y: 5px')
    expect(wrapper.attributes('style')).toContain('--nm-tag-sz-height: 31px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 11 / medium 12 / large 14（字号）
    const anchors = [
      [11, 'small'],
      [12, 'medium'],
      [14, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismTag, { props: { size: px } })
      const byTier = mount(NeumorphismTag, { props: { size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-tag-sz-font: ${px}px`)
      // 档位路径不挂 --sized，也不带内联尺寸变量
      expect(byTier.classes()).toContain(`nm-tag--${tier}`)
      expect(byTier.classes()).not.toContain('nm-tag--sized')
      expect(byTier.attributes('style') ?? '').not.toContain('--nm-tag-sz-font')
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 12', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismTag, { props: { size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-tag-sz-font: 12px')
    }
  })

  it('should apply rounded class', () => {
    const wrapper = mount(NeumorphismTag, { props: { rounded: true } })
    expect(wrapper.classes()).toContain('nm-tag--rounded')
  })

  it('should emit close event', () => {
    const wrapper = mount(NeumorphismTag, { props: { closable: true } })
    wrapper.find('.nm-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('should not show close button when not closable', () => {
    const wrapper = mount(NeumorphismTag)
    expect(wrapper.find('.nm-tag__close').exists()).toBe(false)
  })

  it('should set aria-label on close button', () => {
    const wrapper = mount(NeumorphismTag, { props: { closable: true } })
    expect(wrapper.find('.nm-tag__close').attributes('aria-label')).toBeDefined()
  })
})
