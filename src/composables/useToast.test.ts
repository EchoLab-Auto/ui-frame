import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add a toast', () => {
    const { toasts, addToast } = useToast()
    const id = addToast({ message: 'Test message' })
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('info')
    expect(id).toBe('nm-toast-1')
  })

  it('should add toast with custom type and duration', () => {
    const { toasts, addToast } = useToast()
    addToast({ message: 'Success!', type: 'success', duration: 5000 })
    expect(toasts.value[0].type).toBe('success')
  })

  it('should remove a toast after duration', () => {
    const { toasts, addToast } = useToast()
    addToast({ message: 'Ephemeral', duration: 1000 })
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1250) // duration + leaving animation
    expect(toasts.value).toHaveLength(0)
  })

  it('should not auto-dismiss when duration is 0', () => {
    const { toasts, addToast } = useToast()
    addToast({ message: 'Persistent', duration: 0 })
    vi.advanceTimersByTime(5000)
    expect(toasts.value).toHaveLength(1)
  })

  it('should remove toast via removeToast', () => {
    const { toasts, addToast, removeToast } = useToast()
    const id = addToast({ message: 'Removable' })
    removeToast(id)
    // Should be in leaving state
    expect(toasts.value[0].leaving).toBe(true)
    vi.advanceTimersByTime(300)
    expect(toasts.value).toHaveLength(0)
  })

  it('should respect maxCount', () => {
    const { toasts, addToast } = useToast({ maxCount: 3 })
    addToast({ message: '1', duration: 10000 })
    addToast({ message: '2', duration: 10000 })
    addToast({ message: '3', duration: 10000 })
    addToast({ message: '4', duration: 10000 })
    expect(toasts.value).toHaveLength(3)
    expect(toasts.value[0].message).toBe('2')
    expect(toasts.value[2].message).toBe('4')
  })

  it('should clear all toasts', () => {
    const { toasts, addToast, clearAll } = useToast()
    addToast({ message: '1' })
    addToast({ message: '2' })
    clearAll()
    expect(toasts.value.every(t => t.leaving)).toBe(true)
    vi.advanceTimersByTime(300)
    expect(toasts.value).toHaveLength(0)
  })

  it('should not clear newly added toast after clearAll', () => {
    const { toasts, addToast, clearAll } = useToast()
    addToast({ message: '1' })
    clearAll()
    const id = addToast({ message: '2', duration: 10000 })
    vi.advanceTimersByTime(300)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].id).toBe(id)
  })
})
