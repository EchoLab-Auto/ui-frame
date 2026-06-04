import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateId, debounce, isEmpty } from './index'

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a string with prefix', () => {
      const id = generateId('test')
      expect(id).toMatch(/^test-[a-z0-9]+$/)
    })

    it('should use default prefix "nm"', () => {
      const id = generateId()
      expect(id).toMatch(/^nm-[a-z0-9]+$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce function calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 200)
      debounced('a')
      debounced('b')
      debounced('c')
      vi.advanceTimersByTime(250)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('c')
    })

    it('should support cancel', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 200)
      debounced('a')
      debounced.cancel()
      vi.advanceTimersByTime(250)
      expect(fn).not.toHaveBeenCalled()
    })

    it('should clear previous timer on subsequent calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 200)
      debounced('first')
      vi.advanceTimersByTime(100)
      debounced('second')
      vi.advanceTimersByTime(150)
      expect(fn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })
  })

  describe('isEmpty', () => {
    it('should return true for null/undefined', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
    })

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true)
    })

    it('should return false for non-empty array', () => {
      expect(isEmpty([1, 2])).toBe(false)
    })

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false)
    })

    it('should return false for numbers', () => {
      expect(isEmpty(0)).toBe(false)
      expect(isEmpty(1)).toBe(false)
    })

    it('should return false for booleans', () => {
      expect(isEmpty(false)).toBe(false)
    })
  })
})
