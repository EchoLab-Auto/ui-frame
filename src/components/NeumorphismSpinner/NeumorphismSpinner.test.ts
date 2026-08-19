import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSpinner from './NeumorphismSpinner.vue'

describe('NeumorphismSpinner', () => {
  it('默认渲染 status 角色与无障碍标签', () => {
    const wrapper = mount(NeumorphismSpinner)
    expect(wrapper.classes()).toContain('nm-spinner')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('加载中')
  })

  it('支持自定义标签', () => {
    const wrapper = mount(NeumorphismSpinner, { props: { label: '分支运行中' } })
    expect(wrapper.attributes('aria-label')).toBe('分支运行中')
  })

  it('像素尺寸映射到 CSS 变量', () => {
    const wrapper = mount(NeumorphismSpinner, { props: { size: 32 } })
    expect(wrapper.attributes('style')).toContain('--nm-spinner-size: 32px')
  })

  it('档位尺寸映射为像素', () => {
    const wrapper = mount(NeumorphismSpinner, { props: { size: 'large' } })
    expect(wrapper.attributes('style')).toContain('--nm-spinner-size: 28px')
  })
})
