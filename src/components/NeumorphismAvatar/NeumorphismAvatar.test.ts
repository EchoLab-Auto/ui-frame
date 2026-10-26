import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAvatar from './NeumorphismAvatar.vue'

describe('NeumorphismAvatar', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'https://example.com/avatar.jpg' } })
    expect(wrapper.classes()).toContain('nm-avatar')
    expect(wrapper.classes()).toContain('nm-avatar--medium')
    expect(wrapper.classes()).toContain('nm-avatar--circle')
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismAvatar, { props: { size, src: '' } })
      expect(wrapper.classes()).toContain(`nm-avatar--${size}`)
    }
  })

  it('should apply shape classes', () => {
    const shapes = ['circle', 'rounded'] as const
    for (const shape of shapes) {
      const wrapper = mount(NeumorphismAvatar, { props: { shape, src: '' } })
      expect(wrapper.classes()).toContain(`nm-avatar--${shape}`)
    }
  })

  it('should render initials fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '', initials: 'John Doe' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('JO')
  })

  it('should render alt fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '', alt: 'Alice' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('A')
  })

  it('should render question mark when no fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('?')
  })

  it('should render fallback slot', () => {
    const wrapper = mount(NeumorphismAvatar, {
      props: { src: '' },
      slots: { fallback: '<span class="custom-fallback">@</span>' },
    })
    expect(wrapper.find('.custom-fallback').exists()).toBe(true)
  })

  it('should set alt attribute', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'test.jpg', alt: 'User avatar' } })
    expect(wrapper.find('img').attributes('alt')).toBe('User avatar')
  })

  it('should emit error on image load failure', async () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'bad.jpg' } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.emitted('error')).toBeDefined()
  })

  // ---- 数字 size（px 直径）----

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '', size: 38 } })
    expect(wrapper.classes()).toContain('nm-avatar--sized')
    expect(wrapper.classes().some(c => /^nm-avatar--(small|medium|large)$/.test(c))).toBe(false)
    // 38 落在 32(sm) 与 44(md) 之间：位置 0.5 → 字号 12→16 的中点 14
    const style = wrapper.attributes('style')
    expect(style).toContain('--nm-avatar-sz-size: 38px')
    expect(style).toContain('--nm-avatar-sz-font: 14px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [32, 'small'],
      [44, 'medium'],
      [64, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismAvatar, { props: { src: '', size: px } })
      expect(byNumber.attributes('style')).toContain(`--nm-avatar-sz-size: ${px}px`)
      const byTier = mount(NeumorphismAvatar, { props: { src: '', size: tier } })
      expect(byTier.classes()).toContain(`nm-avatar--${tier}`)
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 44', () => {
    for (const bad of [0, -20, Number.NaN]) {
      const wrapper = mount(NeumorphismAvatar, { props: { src: '', size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-avatar-sz-size: 44px')
    }
  })
})
