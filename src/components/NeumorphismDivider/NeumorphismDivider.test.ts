import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import NeumorphismDivider from './NeumorphismDivider.vue'
import { ConfigKey } from '@/composables/useConfig'

describe('NeumorphismDivider', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismDivider)
    expect(wrapper.classes()).toContain('nm-divider')
    expect(wrapper.classes()).toContain('nm-divider--horizontal')
  })

  it('should apply direction class', () => {
    const directions = ['horizontal', 'vertical'] as const
    for (const direction of directions) {
      const wrapper = mount(NeumorphismDivider, { props: { direction } })
      expect(wrapper.classes()).toContain(`nm-divider--${direction}`)
    }
  })

  it('should render with text content', () => {
    const wrapper = mount(NeumorphismDivider, {
      slots: { default: 'Section' },
    })
    expect(wrapper.text()).toContain('Section')
  })

  it('should apply dashed class', () => {
    const wrapper = mount(NeumorphismDivider, { props: { dashed: true } })
    expect(wrapper.classes()).toContain('nm-divider--dashed')
  })

  it('should apply inset class', () => {
    const wrapper = mount(NeumorphismDivider, { props: { inset: true } })
    expect(wrapper.classes()).toContain('nm-divider--inset')
  })

  // inset 回归：此前该 prop 只挂类、无任何样式（死 prop），
  // 现组件内置水平左右 / 垂直上下内缩规则（--nm-spacing-lg）
  it('should define inset style rules for both directions', () => {
    const source = readFileSync('src/components/NeumorphismDivider/NeumorphismDivider.vue', 'utf-8')
    const insetBlock = source.match(/&--inset\s*\{[\s\S]*?\n  \}/)?.[0] ?? ''
    expect(insetBlock).toContain('&.nm-divider--horizontal')
    expect(insetBlock).toContain('&.nm-divider--vertical')
    expect(insetBlock).toMatch(
      /&\.nm-divider--horizontal\s*\{[^}]*margin:\s*var\(--nm-spacing-md\)\s+var\(--nm-spacing-lg\)/
    )
    expect(insetBlock).toMatch(/&\.nm-divider--vertical\s*\{[^}]*margin:\s*var\(--nm-spacing-lg\)/)
  })

  it('should apply inset from global config', () => {
    const wrapper = mount(NeumorphismDivider, {
      global: {
        provide: {
          [ConfigKey]: { value: { divider: { inset: true } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-divider--inset')
  })
})
