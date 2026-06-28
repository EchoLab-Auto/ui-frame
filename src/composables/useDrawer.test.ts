import { describe, it, expect, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDrawer } from './useDrawer'

afterEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('useDrawer', () => {
  it('should be closed by default', () => {
    const modelValue = ref(false)
    const { isOpen, rendered } = useDrawer({ modelValue })
    expect(isOpen.value).toBe(false)
    expect(rendered.value).toBe(false)
  })

  it('should open when modelValue becomes true', async () => {
    const modelValue = ref(false)
    const { isOpen, rendered } = useDrawer({ modelValue })
    modelValue.value = true
    await nextTick()
    await nextTick()
    expect(rendered.value).toBe(true)
    expect(isOpen.value).toBe(true)
  })

  it('should close via open/close methods', async () => {
    const modelValue = ref(false)
    const { open, close } = useDrawer({ modelValue })
    open()
    expect(modelValue.value).toBe(true)
    close()
    expect(modelValue.value).toBe(false)
  })

  it('should not close when closable is false', () => {
    const modelValue = ref(true)
    const { close } = useDrawer({
      modelValue,
      closable: ref(false),
    })
    close()
    expect(modelValue.value).toBe(true)
  })

  it('should close on Escape when closable', () => {
    const modelValue = ref(true)
    const { handleKeydown } = useDrawer({
      modelValue,
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), undefined)
    expect(modelValue.value).toBe(false)
  })

  it('should not close on Escape when not closable', () => {
    const modelValue = ref(true)
    const { handleKeydown } = useDrawer({
      modelValue,
      closable: ref(false),
    })
    handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), undefined)
    expect(modelValue.value).toBe(true)
  })

  it('should close on mask click when maskClosable and closable', () => {
    const modelValue = ref(true)
    const { handleMaskClick } = useDrawer({ modelValue })
    handleMaskClick()
    expect(modelValue.value).toBe(false)
  })

  it('should not close on mask click when maskClosable is false', () => {
    const modelValue = ref(true)
    const { handleMaskClick } = useDrawer({
      modelValue,
      maskClosable: ref(false),
    })
    handleMaskClick()
    expect(modelValue.value).toBe(true)
  })

  it('should lock body scroll on open', async () => {
    const modelValue = ref(false)
    const { open } = useDrawer({ modelValue })
    open()
    await nextTick()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    // Clean up: unlock by closing
    modelValue.value = false
  })

  it('should unlock body scroll on close', async () => {
    const modelValue = ref(false)
    const { open, close } = useDrawer({ modelValue })
    open()
    await nextTick()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    close()
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('should trap Tab focus', () => {
    const modelValue = ref(true)
    const { handleKeydown } = useDrawer({ modelValue })
    const drawer = document.createElement('div')
    const btn1 = document.createElement('button')
    const btn2 = document.createElement('button')
    drawer.append(btn1, btn2)
    document.body.append(drawer)

    btn2.focus()
    handleKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), drawer)
    expect(document.activeElement).toBe(btn1)

    btn1.focus()
    handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }), drawer)
    expect(document.activeElement).toBe(btn2)

    document.body.removeChild(drawer)
  })

  it('should focus first focusable element', () => {
    const modelValue = ref(true)
    const { focusDrawer } = useDrawer({ modelValue })
    const drawer = document.createElement('div')
    drawer.tabIndex = -1
    const btn1 = document.createElement('button')
    const btn2 = document.createElement('button')
    drawer.append(btn1, btn2)
    document.body.append(drawer)

    focusDrawer(drawer)
    expect(document.activeElement).toBe(btn1)

    document.body.removeChild(drawer)
  })

  it('should not fail focusDrawer with undefined element', () => {
    const modelValue = ref(true)
    const { focusDrawer } = useDrawer({ modelValue })
    expect(() => focusDrawer(undefined)).not.toThrow()
  })

  it('should handle Tab with no focusable elements gracefully', () => {
    const modelValue = ref(true)
    const { handleKeydown } = useDrawer({ modelValue })
    const drawer = document.createElement('div')
    document.body.append(drawer)
    expect(() => handleKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), drawer)).not.toThrow()
    document.body.removeChild(drawer)
  })
})
