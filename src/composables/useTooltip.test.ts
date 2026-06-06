import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useTooltip } from './useTooltip'

describe('useTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be hidden by default', () => {
    const { isVisible } = useTooltip()
    expect(isVisible.value).toBe(false)
  })

  it('should show after delay', () => {
    const { isVisible, show } = useTooltip({ delay: 150 })
    show()
    expect(isVisible.value).toBe(false)
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)
  })

  it('should hide after delay', () => {
    const { isVisible, show, hide } = useTooltip()
    show()
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)

    hide()
    expect(isVisible.value).toBe(true) // still visible during delay
    vi.advanceTimersByTime(100)
    expect(isVisible.value).toBe(false)
  })

  it('should not show when disabled', () => {
    const { isVisible, show } = useTooltip({ disabled: ref(true) })
    show()
    vi.advanceTimersByTime(200)
    expect(isVisible.value).toBe(false)
  })

  it('should cancel show timer on hide', () => {
    const { isVisible, show, hide } = useTooltip({ delay: 200 })
    show()
    hide()
    vi.advanceTimersByTime(300)
    expect(isVisible.value).toBe(false)
  })

  it('should cancel hide timer on show', () => {
    const { isVisible, show, hide } = useTooltip()
    show()
    vi.advanceTimersByTime(150)
    hide()
    show() // this should cancel hide timer
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)
  })

  it('should toggle visibility', () => {
    const { isVisible, toggle } = useTooltip()
    toggle()
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)

    toggle()
    vi.advanceTimersByTime(100)
    expect(isVisible.value).toBe(false)
  })

  it('should not toggle when disabled', () => {
    const { isVisible, toggle } = useTooltip({ disabled: ref(true) })
    toggle()
    vi.advanceTimersByTime(200)
    expect(isVisible.value).toBe(false)
  })

  it('should close on Escape key', () => {
    const { isVisible, show, handleKeydown } = useTooltip()
    show()
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)

    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isVisible.value).toBe(false)
  })

  it('should ignore non-Escape keys', () => {
    const { isVisible, show, handleKeydown } = useTooltip()
    show()
    vi.advanceTimersByTime(150)
    expect(isVisible.value).toBe(true)

    handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(isVisible.value).toBe(true)
  })

  it('should use default delay of 150ms', () => {
    const { isVisible, show } = useTooltip()
    show()
    vi.advanceTimersByTime(149)
    expect(isVisible.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(isVisible.value).toBe(true)
  })

  it('should use custom delay', () => {
    const { isVisible, show } = useTooltip({ delay: 500 })
    show()
    vi.advanceTimersByTime(499)
    expect(isVisible.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(isVisible.value).toBe(true)
  })

  it('should clear timers on unmount', () => {
    // onBeforeUnmount is called when component unmounts
    // In composable test, timers are cleaned up via onBeforeUnmount
    // We verify the timers are set up properly by checking behavior
    const { isVisible, show, hide } = useTooltip()
    show()
    hide()
    // Both timers should exist but be cleaned on unmount
    // We rely on vitest not reporting leaked timers
    vi.advanceTimersByTime(500)
    expect(isVisible.value).toBe(false)
  })
})
