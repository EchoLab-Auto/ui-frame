import { describe, it, expect, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useModal } from './useModal'

afterEach(() => {
  document.body.style.overflow = ''
})

// Wraps composable call inside a component's setup() so lifecycle hooks work.
function withModal(initialOpen = false, opts: Record<string, unknown> = {}) {
  const open = ref(initialOpen)
  let modalResult: ReturnType<typeof useModal> | null = null

  const wrapper = mount(
    defineComponent({
      setup() {
        modalResult = useModal({
          modelValue: open,
          ...opts,
        } as Parameters<typeof useModal>[0])
        return () => h('div')
      },
    })
  )

  return {
    open,
    modal: () => modalResult!,
    unmount: () => wrapper.unmount(),
  }
}

describe('useModal', () => {
  it('should open modal when modelValue becomes true', async () => {
    const { open, modal } = withModal()
    open.value = true
    await nextTick()
    await nextTick()
    expect(modal().visible.value).toBe(true)
    expect(modal().rendered.value).toBe(true)
  })

  it('should close modal', () => {
    const { open, modal } = withModal(true)
    modal().close()
    expect(open.value).toBe(false)
  })

  it('should not close when closable is false', () => {
    const { open, modal } = withModal(true, { closable: ref(false) })
    modal().close()
    expect(open.value).toBe(true)
  })

  it('should close on Escape when closable', () => {
    const { open, modal } = withModal(true)
    modal().handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), undefined)
    expect(open.value).toBe(false)
  })

  it('should not close on Escape when not closable', () => {
    const { open, modal } = withModal(true, { closable: ref(false) })
    modal().handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), undefined)
    expect(open.value).toBe(true)
  })

  it('should lock body scroll on open', async () => {
    const { open, modal } = withModal(false)
    open.value = true
    await nextTick()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    modal()
  })

  it('should trap Tab focus', () => {
    const { modal } = withModal(true)
    const dialog = document.createElement('div')
    const btn1 = document.createElement('button')
    const btn2 = document.createElement('button')
    dialog.append(btn1, btn2)
    document.body.append(dialog)

    btn2.focus()
    modal().handleKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), dialog)
    expect(document.activeElement).toBe(btn1)

    btn1.focus()
    modal().handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }), dialog)
    expect(document.activeElement).toBe(btn2)

    document.body.removeChild(dialog)
  })

  it('should focus first focusable element', () => {
    const { modal } = withModal(true)
    const dialog = document.createElement('div')
    dialog.tabIndex = -1
    const btn1 = document.createElement('button')
    const btn2 = document.createElement('button')
    dialog.append(btn1, btn2)
    document.body.append(dialog)

    modal().focusDialog(dialog)
    expect(document.activeElement).toBe(btn1)

    document.body.removeChild(dialog)
  })

  it('confirm should close the modal', () => {
    const { open, modal } = withModal(true)
    modal().confirm()
    expect(open.value).toBe(false)
  })
})
