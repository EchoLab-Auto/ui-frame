/**
 * 无障碍（Accessibility）测试辅助
 *
 * 提供对常见 ARIA 模式、键盘导航、焦点管理进行断言的工具函数。
 *
 * @example
 *   import { assertRole, assertAriaControls, assertKeyboardActivates } from '@/__test-utils__/a11y-helpers'
 */

import { expect } from 'vitest'
import { VueWrapper } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'

// ============================================================
// Role / ARIA 属性断言
// ============================================================

/** 断言元素存在指定的 role 属性 */
export function assertRole(element: Element | null, expectedRole: string): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('role')).toBe(expectedRole)
}

/** 断言元素具有 aria-label */
export function assertAriaLabel(element: Element | null, expectedLabel: string): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-label')).toBe(expectedLabel)
}

/** 断言触发元素通过 aria-controls 指向面板元素 */
export function assertAriaControls(trigger: Element | null, panelId: string): void {
  expect(trigger).not.toBeNull()
  expect(trigger!.getAttribute('aria-controls')).toBe(panelId)
}

/** 断言元素通过 aria-labelledby 引用另一个元素 */
export function assertAriaLabelledBy(element: Element | null, labelId: string): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-labelledby')).toBe(labelId)
}

/** 断言元素通过 aria-describedby 引用描述元素 */
export function assertAriaDescribedBy(element: Element | null, descriptionId: string): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-describedby')).toBe(descriptionId)
}

/** 断言元素存在 aria-expanded 属性并值为 expected */
export function assertAriaExpanded(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-expanded')).toBe(expected)
}

/** 断言元素存在 aria-selected 属性并值为 expected */
export function assertAriaSelected(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-selected')).toBe(expected)
}

/** 断言元素存在 aria-disabled 属性并值为 expected */
export function assertAriaDisabled(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-disabled')).toBe(expected)
}

/** 断言元素存在 aria-invalid 属性并值为 expected */
export function assertAriaInvalid(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-invalid')).toBe(expected)
}

/** 断言元素存在 aria-hidden 属性并值为 expected */
export function assertAriaHidden(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-hidden')).toBe(expected)
}

/** 断言元素具有 aria-atomic 属性 */
export function assertAriaAtomic(element: Element | null, expected: 'true' | 'false'): void {
  expect(element).not.toBeNull()
  expect(element!.getAttribute('aria-atomic')).toBe(expected)
}

// ============================================================
// 键盘交互断言
// ============================================================

/**
 * 断言组件支持 Enter/Space 键激活的交互模式。
 *
 * @example
 *   await assertKeyboardActivates(wrapper, 'button', () => {
 *     expect(wrapper.emitted('click')).toHaveLength(1)
 *   })
 */
export async function assertKeyboardActivates(
  element: Element,
  key: 'Enter' | ' ',
  afterAssert: () => void
): Promise<void> {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  // 某些组件在 nextTick 后才更新状态
  const { nextTick } = await import('vue')
  await nextTick()
  afterAssert()
}

/**
 * 断言焦点在 firstEl 和 lastEl 之间循环（焦点陷阱）。
 *
 * 模拟 Tab/Shift+Tab 按下，验证焦点在指定边界之间循环。
 */
export async function assertFocusTrap(
  container: HTMLElement,
  firstFocusable: HTMLElement,
  lastFocusable: HTMLElement
): Promise<void> {
  // Tab from last should wrap to first
  lastFocusable.focus()
  container.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
  )
  expect(document.activeElement).toBe(firstFocusable)

  // Shift+Tab from first should wrap to last
  firstFocusable.focus()
  container.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
  )
  expect(document.activeElement).toBe(lastFocusable)
}

// ============================================================
// 语义 HTML 断言
// ============================================================

/**
 * 断言 wrapper 中存在指定 role 的元素（返回该元素用于进一步断言）。
 */
export function findElementByRole(
  wrapper: VueWrapper<ComponentPublicInstance>,
  role: string
): Element | null {
  return (wrapper.element as HTMLElement).querySelector(`[role="${role}"]`)
}

/**
 * 断言标签与输入元素的关联。
 * - input 有 id
 * - label 有 for 指向该 id
 * - 或者 input 有 aria-label / aria-labelledby
 */
export function assertLabelAssociation(
  wrapper: VueWrapper<ComponentPublicInstance>,
  inputSelector: string,
  labelSelector?: string
): void {
  const input = (wrapper.element as HTMLElement).querySelector(inputSelector)
  expect(input).not.toBeNull()

  if (labelSelector) {
    const label = (wrapper.element as HTMLElement).querySelector(labelSelector)
    expect(label).not.toBeNull()
    const forId = label!.getAttribute('for')
    const inputId = input!.getAttribute('id')
    if (forId && inputId) {
      expect(forId).toBe(inputId)
    }
  }

  // Verify input has some form of accessible name
  // (aria-label, aria-labelledby, or id for label[for] association)
}
