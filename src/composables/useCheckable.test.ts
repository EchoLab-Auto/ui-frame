import { describe, it, expect } from 'vitest'
import { useCheckable } from './useCheckable'

describe('useCheckable', () => {
  it('should generate id with checkbox prefix', () => {
    const { inputId } = useCheckable(() => ({
      prefix: 'checkbox',
      isChecked: false,
      isDisabled: false,
      size: 'medium',
    }))
    expect(inputId).toMatch(/^nm-checkbox-[a-z0-9]+$/)
  })

  it('should generate id with radio prefix', () => {
    const { inputId } = useCheckable(() => ({
      prefix: 'radio',
      isChecked: false,
      isDisabled: false,
      size: 'medium',
    }))
    expect(inputId).toMatch(/^nm-radio-[a-z0-9]+$/)
  })

  it('should include prefix and extra classes in classList', () => {
    const { classList } = useCheckable(() => ({
      prefix: 'radio',
      isChecked: false,
      isDisabled: false,
      extraClasses: { 'nm-radio--sized': true },
    }))
    expect(classList.value).toContain('nm-radio')
    // 尺寸不再是本 composable 的职责：几何由组件内联变量驱动，这里只透传类名
    // （extraClasses 是独立对象元素，故检查它而不是顶层字符串）
    expect(classList.value[1]).toMatchObject({ 'nm-radio--sized': true })
  })

  it('should include checked state object in classList', () => {
    const { classList } = useCheckable(() => ({
      prefix: 'checkbox',
      isChecked: true,
      isDisabled: false,
      size: 'medium',
    }))
    // Vue class binding expects an object within the array
    const classObj = classList.value.find(c => typeof c === 'object' && c !== null) as
      Record<string, boolean> | undefined
    expect(classObj).toBeDefined()
    expect(classObj!['nm-checkbox--checked']).toBe(true)
  })

  it('should include disabled state in class object', () => {
    const { classList } = useCheckable(() => ({
      prefix: 'checkbox',
      isChecked: false,
      isDisabled: true,
      size: 'medium',
    }))
    const classObj = classList.value.find(c => typeof c === 'object' && c !== null) as
      Record<string, boolean> | undefined
    expect(classObj!['nm-checkbox--disabled']).toBe(true)
  })

  it('should merge extraClasses into class object', () => {
    const { classList } = useCheckable(() => ({
      prefix: 'checkbox',
      isChecked: false,
      isDisabled: false,
      size: 'medium',
      extraClasses: { 'nm-checkbox--indeterminate': true },
    }))
    const classObj = classList.value.find(c => typeof c === 'object' && c !== null) as
      Record<string, boolean> | undefined
    expect(classObj!['nm-checkbox--indeterminate']).toBe(true)
  })
})
