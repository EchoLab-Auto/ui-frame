import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateId, debounce, isEmpty, escapeHtml, slugify } from './index'

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

  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      expect(escapeHtml('<script>alert("x")</script>')).toBe(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
      )
    })

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s')
    })

    it('leaves plain text unchanged', () => {
      expect(escapeHtml('hello world')).toBe('hello world')
    })
  })

  describe('slugify', () => {
    it('lowercases ASCII text and replaces spaces with dashes', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('preserves Chinese characters', () => {
      expect(slugify('你好世界')).toBe('你好世界')
    })

    it('handles mixed Chinese and ASCII', () => {
      expect(slugify('Hello 世界')).toBe('hello-世界')
    })

    it('normalizes whitespace and consecutive dashes', () => {
      expect(slugify('a   b--c')).toBe('a-b-c')
    })

    it('trims punctuation and leading/trailing dashes', () => {
      expect(slugify('---hello---')).toBe('hello')
    })

    it('returns empty string for pure punctuation', () => {
      expect(slugify('!!!')).toBe('')
    })

    it('handles Japanese hiragana', () => {
      expect(slugify('こんにちは')).toBe('こんにちは')
    })

    it('handles Korean hangul', () => {
      expect(slugify('안녕하세요')).toBe('안녕하세요')
    })

    it('handles Arabic text', () => {
      expect(slugify('مرحبا')).toBe('مرحبا')
    })
  })
})
