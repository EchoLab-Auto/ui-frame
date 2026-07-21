import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useReducedMotion, prefersReducedMotion } from './useReducedMotion'
import type { UseReducedMotionReturn } from './useReducedMotion'
import { createMatchMediaMock } from '@/__test-utils__/test-helpers'

function withReducedMotion() {
  let result: UseReducedMotionReturn | null = null
  const Comp = defineComponent({
    setup() {
      result = useReducedMotion()
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return { api: () => result!, unmount: () => wrapper.unmount() }
}

describe('useReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefersReducedMotion reflects the current media query state', () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(true)))
    expect(prefersReducedMotion()).toBe(true)

    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(false)))
    expect(prefersReducedMotion()).toBe(false)
  })

  it('should track media query changes reactively', () => {
    const mql = createMatchMediaMock(false)()
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

    const { api } = withReducedMotion()
    expect(api().isReducedMotion.value).toBe(false)

    const handler = (mql.addEventListener as Mock).mock.calls[0][1]
    handler({ matches: true } as MediaQueryListEvent)
    expect(api().isReducedMotion.value).toBe(true)
  })

  it('should remove the listener automatically on component unmount', () => {
    const mql = createMatchMediaMock(false)()
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

    const { unmount } = withReducedMotion()
    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('should support manual stop outside a component lifecycle', () => {
    const mql = createMatchMediaMock(false)()
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

    const { stop } = useReducedMotion()
    stop()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)

    // Calling stop twice is a safe no-op
    stop()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })
})
