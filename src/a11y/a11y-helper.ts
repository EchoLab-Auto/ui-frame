import { mount, type MountingOptions } from '@vue/test-utils'
import { run as axeRun } from 'axe-core'
import type { Component } from 'vue'

/** axe 结果中的单条违规 */
export interface A11yViolation {
  id: string
  impact: string | null
  description: string
  nodes: { html: string }[]
}

/**
 * 挂载组件并运行 axe 无障碍扫描，返回违规列表。
 * 组件级测试默认关闭两条需要真实布局/整页上下文的规则：
 * - color-contrast（jsdom 无真实渲染，对比度计算不可信）
 * - region（孤立组件不位于 landmark 内属预期）
 */
export async function mountAndCheckA11y(
  component: Component,
  options: MountingOptions<Record<string, unknown>> = {}
): Promise<A11yViolation[]> {
  const wrapper = mount(component, {
    attachTo: document.body,
    ...options,
  })
  const results = await axeRun(document.body, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  })
  wrapper.unmount()
  document.body.innerHTML = ''
  return results.violations as unknown as A11yViolation[]
}

/** 断言无违规，违规时输出可读详情 */
export function expectNoViolations(violations: A11yViolation[]) {
  if (violations.length > 0) {
    const detail = violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes[0]?.html}`)
      .join('\n')
    throw new Error(`${violations.length} 条无障碍违规:\n${detail}`)
  }
}
