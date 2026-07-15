/**
 * Shared helpers for component interaction tests.
 */
import { nextTick } from 'vue'

/** Wait for async DOM updates to settle. */
export async function flush(): Promise<void> {
  await nextTick()
  await new Promise(r => setTimeout(r, 0))
}

/** Simulate a keyboard event on an element. */
export function fireKey(el: Element, key: string, opts: Partial<KeyboardEventInit> = {}): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

/** Simulate a focus event. */
export function fireFocus(el: Element): void {
  el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
}

/** Simulate a blur event. */
export function fireBlur(el: Element): void {
  el.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
}

/** Simulate a click event. */
export async function fireClick(el: Element): Promise<void> {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

/** Query an element by a CSS selector within a wrapper. */
export function query(wrapper: { element: Element }, selector: string): Element | null {
  return wrapper.element.querySelector(selector)
}
