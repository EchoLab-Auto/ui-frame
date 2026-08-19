import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useChatInput, isImeComposing } from './useChatInput'

function keydown(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, ...init })
}

describe('isImeComposing', () => {
  it('isComposing / Process 键 / keyCode 229 均判定为组合输入', () => {
    expect(isImeComposing(keydown({ isComposing: true }))).toBe(true)
    expect(isImeComposing(keydown({ key: 'Process' }))).toBe(true)
    const legacy = keydown({})
    Object.defineProperty(legacy, 'keyCode', { value: 229 })
    expect(isImeComposing(legacy)).toBe(true)
    expect(isImeComposing(keydown({}))).toBe(false)
  })
})

describe('useChatInput', () => {
  it('Enter 提交并清空输入', () => {
    const modelValue = ref('  你好  ')
    const onSubmit = vi.fn()
    const { handleKeydown } = useChatInput({ modelValue, onSubmit })

    const event = keydown({})
    handleKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onSubmit).toHaveBeenCalledWith('你好')
    expect(modelValue.value).toBe('')
  })

  it('Shift+Enter 换行不提交', () => {
    const modelValue = ref('hello')
    const onSubmit = vi.fn()
    const { handleKeydown } = useChatInput({ modelValue, onSubmit })

    const event = keydown({ shiftKey: true })
    handleKeydown(event)
    expect(event.defaultPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(modelValue.value).toBe('hello')
  })

  it('IME 组合中的 Enter 不提交（中文选字场景）', () => {
    const modelValue = ref('nih')
    const onSubmit = vi.fn()
    const { handleKeydown } = useChatInput({ modelValue, onSubmit })

    handleKeydown(keydown({ isComposing: true }))
    handleKeydown(keydown({ key: 'Process' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(modelValue.value).toBe('nih')
  })

  it('空白内容与禁用态不可提交', () => {
    const modelValue = ref('   ')
    const disabled = ref(false)
    const onSubmit = vi.fn()
    const { submit, canSubmit, handleKeydown } = useChatInput({ modelValue, disabled, onSubmit })

    expect(canSubmit.value).toBe(false)
    submit()
    expect(onSubmit).not.toHaveBeenCalled()

    modelValue.value = 'hi'
    disabled.value = true
    expect(canSubmit.value).toBe(false)
    handleKeydown(keydown({}))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(modelValue.value).toBe('hi')
  })

  it('非 Enter 键不干预默认行为', () => {
    const modelValue = ref('a')
    const { handleKeydown } = useChatInput({ modelValue, onSubmit: vi.fn() })
    const event = keydown({ key: 'a' })
    handleKeydown(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
