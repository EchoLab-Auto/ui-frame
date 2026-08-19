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

  it('应用尺寸修饰类', () => {
    const wrapper = mount(NeumorphismStatusDot, { props: { size: 'large' } })
    expect(wrapper.classes()).toContain('nm-status-dot--large')
  })
})
