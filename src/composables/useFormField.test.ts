import { describe, it, expect, vi } from 'vitest'
import { useFormField } from './useFormField'

function hasClass(classes: unknown[], cls: string): boolean {
  return classes.some(c => {
    if (typeof c === 'string') return c === cls
    if (typeof c === 'object' && c !== null) return (c as Record<string, boolean>)[cls] === true
    return false
  })
}

describe('useFormField', () => {
  it('should generate stable fieldId from prefix', () => {
    const field = useFormField(() => ({
      size: 'medium',
      disabled: false,
      prefix: 'input',
    }))
    expect(field.fieldId).toMatch(/^nm-input-[a-z0-9]+$/)
  })

  it('should use provided id instead of generating one', () => {
    const field = useFormField(() => ({
      id: 'my-custom-id',
      size: 'medium',
      disabled: false,
      prefix: 'input',
    }))
    expect(field.fieldId).toBe('my-custom-id')
  })

  it('should reflect disabled state in baseClassList', () => {
    const field = useFormField(() => ({
      size: 'large',
      disabled: true,
      prefix: 'select',
    }))
    const classes = field.baseClassList('nm-select').value
    expect(classes[0]).toBe('nm-select')
    expect(classes[1]).toBe('nm-select--large')
    expect(hasClass(classes, 'nm-select--disabled')).toBe(true)
  })

  it('should reflect error state in baseClassList', () => {
    const field = useFormField(() => ({
      size: 'small',
      disabled: false,
      error: 'Invalid value',
      prefix: 'input',
    }))
    const classes = field.baseClassList('nm-input').value
    expect(hasClass(classes, 'nm-input--error')).toBe(true)
    expect(field.hasError.value).toBe(true)
    expect(field.errorMessage.value).toBe('Invalid value')
  })

  it('should reflect boolean error as empty string', () => {
    const field = useFormField(() => ({
      size: 'medium',
      disabled: false,
      error: true,
      prefix: 'input',
    }))
    expect(field.hasError.value).toBe(true)
    expect(field.errorMessage.value).toBe('')
  })

  it('should toggle focused state via handleFocus and handleBlur', () => {
    const field = useFormField(() => ({
      size: 'medium',
      disabled: false,
      prefix: 'textarea',
    }))
    const emit = vi.fn()

    expect(field.isFocused.value).toBe(false)

    const focusEvent = new FocusEvent('focus')
    field.handleFocus(focusEvent, emit)
    expect(field.isFocused.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('focus', focusEvent)

    const blurEvent = new FocusEvent('blur')
    field.handleBlur(blurEvent, emit)
    expect(field.isFocused.value).toBe(false)
    expect(emit).toHaveBeenCalledWith('blur', blurEvent)
  })

  it('should include focused class when focused', () => {
    const field = useFormField(() => ({
      size: 'medium',
      disabled: false,
      prefix: 'input',
    }))
    const emit = vi.fn()
    field.handleFocus(new FocusEvent('focus'), emit)

    const classes = field.baseClassList('nm-input').value
    expect(hasClass(classes, 'nm-input--focused')).toBe(true)
  })

  it('should generate different IDs for different calls', () => {
    const field1 = useFormField(() => ({ size: 'medium', disabled: false, prefix: 'input' }))
    const field2 = useFormField(() => ({ size: 'medium', disabled: false, prefix: 'input' }))
    expect(field1.fieldId).not.toBe(field2.fieldId)
  })
})
