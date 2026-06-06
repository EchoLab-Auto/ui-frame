import { describe, it, expect } from 'vitest'
import { validateFieldValue } from './useFormValidation'
import type { FormRule } from './useFormValidation'

describe('useFormValidation', () => {
  it('should pass when value is valid and required', () => {
    const error = validateFieldValue('hello', [{ required: true, message: 'Required' }])
    expect(error).toBe('')
  })

  it('should fail when value is empty and required', () => {
    const error = validateFieldValue('', [{ required: true, message: 'Required' }])
    expect(error).toBe('Required')
  })

  it('should fail when value is null and required', () => {
    const error = validateFieldValue(null, [{ required: true, message: 'Required' }])
    expect(error).toBe('Required')
  })

  it('should validate minLength', () => {
    const error = validateFieldValue('ab', [{ minLength: 3, message: 'Min 3 chars' }])
    expect(error).toBe('Min 3 chars')
  })

  it('should pass minLength', () => {
    const error = validateFieldValue('abc', [{ minLength: 3, message: 'Min 3 chars' }])
    expect(error).toBe('')
  })

  it('should validate maxLength', () => {
    const error = validateFieldValue('abcdef', [{ maxLength: 5, message: 'Max 5 chars' }])
    expect(error).toBe('Max 5 chars')
  })

  it('should validate pattern', () => {
    const error = validateFieldValue('abc', [{ pattern: /^\d+$/, message: 'Digits only' }])
    expect(error).toBe('Digits only')
  })

  it('should pass pattern match', () => {
    const error = validateFieldValue('123', [{ pattern: /^\d+$/, message: 'Digits only' }])
    expect(error).toBe('')
  })

  it('should validate custom validator', () => {
    const error = validateFieldValue('test', [
      {
        validator: (v: unknown) => v === 'pass',
        message: 'Must be "pass"',
      },
    ])
    expect(error).toBe('Must be "pass"')
  })

  it('should pass custom validator', () => {
    const error = validateFieldValue('pass', [
      {
        validator: (v: unknown) => v === 'pass',
        message: 'Must be "pass"',
      },
    ])
    expect(error).toBe('')
  })

  it('should return first error from multiple rules', () => {
    const rules: FormRule[] = [
      { required: true, message: 'Required' },
      { min: 5, message: 'Min 5' },
    ]
    const error = validateFieldValue('', rules)
    expect(error).toBe('Required')
  })

  it('should skip non-required empty values', () => {
    const error = validateFieldValue('', [{ minLength: 3, message: 'Min 3 chars' }])
    expect(error).toBe('')
  })

  it('should validate email pattern', () => {
    const error = validateFieldValue('notanemail', [
      {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email',
      },
    ])
    expect(error).toBe('Invalid email')
  })
})
