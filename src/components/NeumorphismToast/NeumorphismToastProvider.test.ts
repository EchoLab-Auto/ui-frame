import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismToastProvider from './NeumorphismToastProvider.vue'

describe('NeumorphismToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render container with position class', () => {
    mount(NeumorphismToastProvider, {
      props: { position: 'top-right' },
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    expect(document.querySelector('.nm-toast-container')).not.toBeNull()
    expect(document.querySelector('.nm-toast-container--top-right')).not.toBeNull()
  })

  it('should expose addToast method', () => {
    const wrapper = mount(NeumorphismToastProvider, {
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as { addToast: (opts: Record<string, unknown>) => string }
    const id = vm.addToast({ message: 'Hello' })
    expect(typeof id).toBe('string')
  })

  it('should add and display a toast', async () => {
    const wrapper = mount(NeumorphismToastProvider, {
      global: { stubs: { teleport: false, transitionGroup: false } },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as { addToast: (opts: Record<string, unknown>) => string }
    vm.addToast({ message: 'Test toast', type: 'success' })
    await nextTick()
    expect(document.querySelector('.nm-toast')).not.toBeNull()
    expect(document.querySelector('.nm-toast--success')).not.toBeNull()
  })

  it('should remove a toast via expose', async () => {
    const wrapper = mount(NeumorphismToastProvider, {
      global: { stubs: { teleport: false, transitionGroup: false } },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as {
      addToast: (opts: Record<string, unknown>) => string
      removeToast: (id: string) => void
      toasts: { id: string; leaving: boolean }[]
    }
    const id = vm.addToast({ message: 'Remove me', duration: 10000 })
    await nextTick()
    expect(vm.toasts.length).toBe(1)
    vm.removeToast(id)
    // Toast should be in leaving state
    expect(vm.toasts[0].leaving).toBe(true)
    vi.advanceTimersByTime(400)
    expect(vm.toasts.length).toBe(0)
  })

  it('should apply position classes', () => {
    const positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
      'top-center',
      'bottom-center',
    ] as const
    for (const position of positions) {
      document.body.innerHTML = ''
      mount(NeumorphismToastProvider, {
        props: { position },
        global: { stubs: { teleport: false } },
        attachTo: document.body,
      })
      expect(document.querySelector(`.nm-toast-container--${position}`)).not.toBeNull()
    }
  })
})
