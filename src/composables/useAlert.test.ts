import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAlert } from './useAlert'

describe('useAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be visible by default', () => {
    const { isVisible } = useAlert()
    expect(isVisible.value).toBe(true)
  })

  it('should not be leaving initially', () => {
    const { leaving } = useAlert()
    expect(leaving.value).toBe(false)
  })

  it('should close and trigger leaving animation', () => {
    const { close, leaving } = useAlert()
    close()
    expect(leaving.value).toBe(true)
  })

  it('should hide after leave animation completes', () => {
    const { isVisible, close, leaving } = useAlert()
    close()
    expect(leaving.value).toBe(true)
    vi.advanceTimersByTime(250)
    expect(isVisible.value).toBe(false)
    expect(leaving.value).toBe(false)
  })

  it('should not close twice', () => {
    const { close, leaving } = useAlert()
    close()
    // Reset leaving to test double-close guard
    vi.advanceTimersByTime(250)
    expect(leaving.value).toBe(false)
    // close again should be a no-op since isVisible is now false
    close()
    expect(leaving.value).toBe(false)
  })

  it('should auto-dismiss after duration', () => {
    const { isVisible, leaving } = useAlert({ duration: 5000 })
    expect(isVisible.value).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(leaving.value).toBe(true)
    vi.advanceTimersByTime(250)
    expect(isVisible.value).toBe(false)
  })

  it('should not auto-dismiss when duration is 0', () => {
    const { isVisible } = useAlert({ duration: 0 })
    vi.advanceTimersByTime(10000)
    expect(isVisible.value).toBe(true)
  })

  it('should accept custom duration', () => {
    const { isVisible, leaving } = useAlert({ duration: 2000 })
    vi.advanceTimersByTime(2000)
    expect(leaving.value).toBe(true)
    vi.advanceTimersByTime(250)
    expect(isVisible.value).toBe(false)
  })

  it('should clear timers on close before auto-dismiss', () => {
    const { close, isVisible } = useAlert({ duration: 5000 })
    vi.advanceTimersByTime(2000)
    close()
    vi.advanceTimersByTime(250)
    expect(isVisible.value).toBe(false)
    // It should not try to close again
  })
})
