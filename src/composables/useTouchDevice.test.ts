import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useTouchDevice } from './useTouchDevice'

describe('useTouchDevice', () => {
  let matchMediaHandlers: Array<(e: { matches: boolean }) => void> = []

  function mockMatchMedia(matches: boolean) {
    return {
      matches,
      addEventListener: vi.fn((_: string, handler: (e: { matches: boolean }) => void) => {
        matchMediaHandlers.push(handler)
      }),
      removeEventListener: vi.fn((_: string, handler: (e: { matches: boolean }) => void) => {
        matchMediaHandlers = matchMediaHandlers.filter(h => h !== handler)
      }),
      dispatchEvent: vi.fn(),
    }
  }

  beforeEach(() => {
    matchMediaHandlers = []
    vi.stubGlobal('matchMedia', (query: string) =>
      mockMatchMedia(query === '(pointer: coarse)' && false)
    )
    vi.stubGlobal('innerWidth', 1024)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountWithTouchDevice() {
    let result: ReturnType<typeof useTouchDevice> | null = null
    const Comp = defineComponent({
      setup() {
        result = useTouchDevice()
        return () => h('div')
      },
    })
    const wrapper = mount(Comp)
    return { result: () => result!, unmount: () => wrapper.unmount() }
  }

  it('should detect non-touch device via matchMedia', () => {
    vi.stubGlobal('matchMedia', (query: string) =>
      mockMatchMedia(query === '(pointer: coarse)' ? false : false)
    )
    const { result } = mountWithTouchDevice()
    expect(result().isTouch.value).toBe(false)
  })

  it('should detect touch device via matchMedia', () => {
    vi.stubGlobal('matchMedia', (query: string) =>
      mockMatchMedia(query === '(pointer: coarse)' ? true : false)
    )
    const { result } = mountWithTouchDevice()
    expect(result().isTouch.value).toBe(true)
  })

  it('should report non-mobile on wide viewport', () => {
    vi.stubGlobal('innerWidth', 1024)
    const { result } = mountWithTouchDevice()
    expect(result().isMobile.value).toBe(false)
  })

  it('should report mobile on narrow viewport', () => {
    vi.stubGlobal('innerWidth', 375)
    const { result } = mountWithTouchDevice()
    expect(result().isMobile.value).toBe(true)
  })

  it('should update isTouch on matchMedia change', () => {
    vi.stubGlobal('matchMedia', (query: string) =>
      mockMatchMedia(query === '(pointer: coarse)' ? false : false)
    )
    const { result } = mountWithTouchDevice()
    expect(result().isTouch.value).toBe(false)

    // Simulate media query change
    matchMediaHandlers.forEach(handler => handler({ matches: true }))
    expect(result().isTouch.value).toBe(true)
  })

  it('should fallback to touchstart detection', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = mountWithTouchDevice()

    // Initially false when no matchMedia
    expect(result().isTouch.value).toBe(false)

    // Simulate touchstart
    const touchEvent = new Event('touchstart')
    window.dispatchEvent(touchEvent)
    expect(result().isTouch.value).toBe(true)
  })

  it('should remove listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = mountWithTouchDevice()
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
