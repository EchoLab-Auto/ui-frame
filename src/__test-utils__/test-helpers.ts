/**
 * 共享测试工具函数
 *
 * 提取本项目测试中反复出现的模式，减少各测试文件的样板代码。
 *
 * 使用方式：
 *   import { mountWithoutTeleport, createKeyboardEvent, cleanupDOM } from '@/__test-utils__/test-helpers'
 *
 * 注意：本文件仅用于测试，不会被构建产物包含（vitest.config.ts 中 include: 'src/**\/*.test.ts'）。
 */

import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import type { Component, ComponentPublicInstance } from 'vue'

// ============================================================
// 组件挂载辅助
// ============================================================

/**
 * 挂载使用了 `<teleport>` 或 `<transition>` 的组件，确保内容渲染在测试 DOM 中。
 *
 * 本项目中所有 overlay/popup 类组件（Modal, Drawer, Select, Dropdown,
 * Popover, Tooltip, ToastProvider, AutoComplete 等）均依赖 teleport/transition，
 * 使用普通 mount() 会导致内容无法在 test DOM 中找到。
 *
 * 模板（在测试文件中）：
 *   function mountX(props = {}) {
 *     return mountWithoutTeleport(NeumorphismX, { props })
 *   }
 *   afterEach(cleanupDOM)
 */
export function mountWithoutTeleport<P = Record<string, unknown>>(
  component: Component,
  options?: {
    props?: P
    slots?: Record<string, string>
    attrs?: Record<string, string>
    attachTo?: Element | string
  }
): VueWrapper<ComponentPublicInstance> {
  return mount(component, {
    props: (options?.props ?? {}) as Record<string, unknown>,
    slots: options?.slots as Record<string, string>,
    attrs: options?.attrs,
    attachTo: options?.attachTo ?? document.body,
    global: {
      stubs: {
        teleport: false,
        transition: false,
      },
    },
  })
}

// ============================================================
// DOM 清理
// ============================================================

/**
 * 清空 document.body，用于使用 attachTo: document.body 的测试的 afterEach。
 *
 * @example
 *   afterEach(cleanupDOM)
 */
export function cleanupDOM(): void {
  document.body.innerHTML = ''
}

// ============================================================
// 键盘事件辅助
// ============================================================

/**
 * 创建 KeyboardEvent 的工厂函数。
 *
 * @example
 *   const ev = createKeyboardEvent('Escape')
 *   const ev = createKeyboardEvent('Tab', { shiftKey: true })
 */
export function createKeyboardEvent(
  key: string,
  options?: Partial<KeyboardEventInit>
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

/**
 * 在 VueWrapper 根元素上派发 keydown 事件。
 *
 * @example
 *   triggerKeydown(wrapper, 'Escape')
 *   triggerKeydown(wrapper, 'Home')
 */
export function triggerKeydown(
  wrapper: VueWrapper<ComponentPublicInstance>,
  key: string,
  options?: Partial<KeyboardEventInit>
): void {
  ;(wrapper.element as HTMLElement).dispatchEvent(createKeyboardEvent(key, options))
}

/**
 * 在指定 DOM 元素上派发 keydown 事件。
 *
 * @example
 *   triggerKeydownOn(document.querySelector('.nm-modal')!, 'Escape')
 */
export function triggerKeydownOn(
  element: Element,
  key: string,
  options?: Partial<KeyboardEventInit>
): void {
  element.dispatchEvent(createKeyboardEvent(key, options))
}

// ============================================================
// 常用按键快捷工厂
// ============================================================

export function escapeKey(): KeyboardEvent {
  return createKeyboardEvent('Escape')
}
export function enterKey(): KeyboardEvent {
  return createKeyboardEvent('Enter')
}
export function spaceKey(): KeyboardEvent {
  return createKeyboardEvent(' ')
}
export function tabKey(shift = false): KeyboardEvent {
  return createKeyboardEvent('Tab', { shiftKey: shift })
}
export function arrowDownKey(): KeyboardEvent {
  return createKeyboardEvent('ArrowDown')
}
export function arrowUpKey(): KeyboardEvent {
  return createKeyboardEvent('ArrowUp')
}
export function homeKey(): KeyboardEvent {
  return createKeyboardEvent('Home')
}
export function endKey(): KeyboardEvent {
  return createKeyboardEvent('End')
}

// ============================================================
// 浏览器 API Mock
// ============================================================

/**
 * 创建 ResizeObserver mock（用于 useVirtualList 等依赖元素尺寸的测试）。
 */
export function createResizeObserverMock() {
  const observe = vi.fn()
  const unobserve = vi.fn()
  const disconnect = vi.fn()

  class ResizeObserver {
    observe = observe
    unobserve = unobserve
    disconnect = disconnect
  }

  return { ResizeObserver, observe, unobserve, disconnect }
}

/**
 * 创建 IntersectionObserver mock（用于 scroll-spy、懒加载等测试）。
 */
export function createIntersectionObserverMock() {
  let callback: IntersectionObserverCallback | null = null

  const observe = vi.fn()
  const unobserve = vi.fn()
  const disconnect = vi.fn()

  class IntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      callback = cb
    }
    observe = observe
    unobserve = unobserve
    disconnect = disconnect

    /** 手动触发回调，模拟元素进出视口 */
    static trigger(entries: Partial<IntersectionObserverEntry>[]) {
      callback?.(entries as IntersectionObserverEntry[], {
        root: null,
        rootMargin: '0px',
        thresholds: [0],
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: vi.fn(() => []),
      })
    }
  }

  return { IntersectionObserver, callback: () => callback, observe, unobserve, disconnect }
}

/**
 * 创建 localStorage mock（用于 useTheme 等持久化相关测试）。
 */
export function createLocalStorageMock() {
  const storage: Record<string, string> = {}
  return {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => {
      storage[k] = v
    },
    removeItem: (k: string) => {
      delete storage[k]
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  }
}

/**
 * 创建 matchMedia mock（用于响应主题、设备检测等测试）。
 */
export function createMatchMediaMock(matches: boolean) {
  return () => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

// ============================================================
// 其他辅助
// ============================================================

/**
 * 创建 File 对象的辅助函数（用于 upload 相关测试）。
 */
export function createTestFile(name: string, size: number, type: string): File {
  const bits = new Uint8Array(size)
  return new File([bits], name, { type })
}
