import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { usePopover } from './usePopover'

describe('usePopover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be closed by default', () => {
    const { isOpen } = usePopover()
    expect(isOpen.value).toBe(false)
  })

  it('should show popover', () => {
    const { isOpen, show } = usePopover()
    show()
    expect(isOpen.value).toBe(true)
  })

  it('should hide popover', () => {
    const { isOpen, show, hide } = usePopover()
    show()
    expect(isOpen.value).toBe(true)
    hide()
    vi.advanceTimersByTime(100)
    expect(isOpen.value).toBe(false)
  })

  it('should toggle visibility', () => {
    const { isOpen, toggle } = usePopover()
    toggle()
    expect(isOpen.value).toBe(true)
    toggle()
    vi.advanceTimersByTime(100)
    expect(isOpen.value).toBe(false)
  })

  it('should not show when disabled', () => {
    const { isOpen, show } = usePopover({
      disabled: ref(true),
    })
    show()
    expect(isOpen.value).toBe(false)
  })

  it('should not toggle when disabled', () => {
    const { isOpen, toggle } = usePopover({
      disabled: ref(true),
    })
    toggle()
    expect(isOpen.value).toBe(false)
  })

  it('should delay show for hover trigger', () => {
    const { isOpen, show } = usePopover({
      trigger: ref('hover'),
    })
    show()
    // Not yet visible before delay
    expect(isOpen.value).toBe(false)
    vi.advanceTimersByTime(150)
    expect(isOpen.value).toBe(true)
  })

  it('should show instantly for click trigger', () => {
    const { isOpen, show } = usePopover({
      trigger: ref('click'),
    })
    show()
    expect(isOpen.value).toBe(true)
  })

  it('should close on Escape key', () => {
    const { isOpen, show, handleKeydown } = usePopover()
    show()
    expect(isOpen.value).toBe(true)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isOpen.value).toBe(false)
  })

  it('should cancel show timer when hiding', () => {
    const { isOpen, show, hide } = usePopover({
      trigger: ref('hover'),
    })
    show()
    hide()
    vi.advanceTimersByTime(150)
    // Should still be closed since hide cancelled the show timer
    expect(isOpen.value).toBe(false)
  })

  it('should cancel hide timer when showing again', () => {
    const { isOpen, show, hide } = usePopover()
    show()
    hide()
    show() // Show again before hide completes
    vi.advanceTimersByTime(100)
    expect(isOpen.value).toBe(true)
  })

  it('should not handle keys when disabled', () => {
    const { isOpen, show, handleKeydown } = usePopover({
      disabled: ref(true),
    })
    show()
    expect(isOpen.value).toBe(false)
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isOpen.value).toBe(false)
  })
})
