import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismStatusDot from './NeumorphismStatusDot.vue'

describe('NeumorphismStatusDot', () => {
  it('默认渲染 online 状态与 status 角色', () => {
    const wrapper = mount(NeumorphismStatusDot)
    expect(wrapper.classes()).toContain('nm-status-dot')
    expect(wrapper.classes()).toContain('nm-status-dot--online')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('在线')
  })

  it('按状态应用修饰类与 locale 标签', () => {
    const cases = [
      ['offline', '离线'],
      ['busy', '忙碌'],
      ['connecting', '连接中'],
    ] as const
    for (const [status, label] of cases) {
      const wrapper = mount(NeumorphismStatusDot, { props: { status } })
      expect(wrapper.classes()).toContain(`nm-status-dot--${status}`)
      expect(wrapper.attributes('aria-label')).toBe(label)
    }
  })

  it('过渡态（connecting/busy）默认带脉冲，稳态不带', () => {
    expect(mount(NeumorphismStatusDot, { props: { status: 'connecting' } }).classes()).toContain(
      'nm-status-dot--pulse'
    )
    expect(mount(NeumorphismStatusDot, { props: { status: 'busy' } }).classes()).toContain(
      'nm-status-dot--pulse'
    )
    expect(mount(NeumorphismStatusDot, { props: { status: 'online' } }).classes()).not.toContain(
      'nm-status-dot--pulse'
    )
    expect(mount(NeumorphismStatusDot, { props: { status: 'offline' } }).classes()).not.toContain(
      'nm-status-dot--pulse'
    )
  })

  it('pulse 可显式关闭', () => {
    const wrapper = mount(NeumorphismStatusDot, {
      props: { status: 'connecting', pulse: false },
    })
    expect(wrapper.classes()).not.toContain('nm-status-dot--pulse')
  })

  it('尺寸是 px 数字：内联 width/height 直接就是像素值', () => {
    const wrapper = mount(NeumorphismStatusDot, { props: { size: 14 } })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('width: 14px')
    expect(style).toContain('height: 14px')
    // 不再切成三档 class
    expect(wrapper.classes().some(c => /--(small|medium|large)$/.test(c))).toBe(false)
  })

  it('默认直径 10px', () => {
    const wrapper = mount(NeumorphismStatusDot)
    expect(wrapper.attributes('style')).toContain('width: 10px')
  })

  it('旧字符串档位仍兼容映射（small=8 / medium=10 / large=12）', () => {
    const cases = [
      ['small', 8],
      ['medium', 10],
      ['large', 12],
    ] as const
    for (const [size, px] of cases) {
      const wrapper = mount(NeumorphismStatusDot, { props: { size } })
      expect(wrapper.attributes('style')).toContain(`width: ${px}px`)
    }
  })

  it('容错：0 或负数夹到 4px 下限，NaN 退回默认 10px', () => {
    expect(mount(NeumorphismStatusDot, { props: { size: 0 } }).attributes('style')).toContain(
      'width: 4px'
    )
    expect(mount(NeumorphismStatusDot, { props: { size: -3 } }).attributes('style')).toContain(
      'width: 4px'
    )
    expect(
      mount(NeumorphismStatusDot, { props: { size: Number.NaN } }).attributes('style')
    ).toContain('width: 10px')
  })
})
