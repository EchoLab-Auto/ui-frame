import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismModal from './NeumorphismModal.vue'

describe('NeumorphismModal', () => {
  function mountModal(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
    return mount(NeumorphismModal, {
      props: { modelValue: false, ...props },
      slots,
      attachTo: document.body,
      global: {
        stubs: { teleport: false, transition: false },
      },
    })
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should not render when modelValue is false', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.nm-modal__mask').exists()).toBe(false)
  })

  it('should render when modelValue is true', async () => {
    mountModal({ modelValue: true })
    await nextTick()
    expect(document.querySelector('.nm-modal__mask')).not.toBeNull()
    expect(document.querySelector('.nm-modal')).not.toBeNull()
  })

  it('should display title when provided', async () => {
    mountModal({ modelValue: true, title: 'Test Title' })
    await nextTick()
    const titleEl = document.querySelector('.nm-modal__title')
    expect(titleEl).not.toBeNull()
    expect(titleEl!.textContent).toBe('Test Title')
  })

  it('should emit update:modelValue on close', async () => {
    const wrapper = mountModal({ modelValue: true })
    await nextTick()
    const closeBtn = document.querySelector('.nm-modal__close')
    expect(closeBtn).not.toBeNull()
    ;(closeBtn as HTMLElement).click()
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('should emit confirm on confirm click', async () => {
    const wrapper = mountModal({ modelValue: true })
    await nextTick()
    const confirmBtn = document.querySelector('.nm-modal__btn--confirm')
    expect(confirmBtn).not.toBeNull()
    ;(confirmBtn as HTMLElement).click()
    expect(wrapper.emitted('confirm')).toBeDefined()
  })

  it('should not show close button when closable is false', async () => {
    mountModal({ modelValue: true, closable: false })
    await nextTick()
    expect(document.querySelector('.nm-modal__close')).toBeNull()
  })

  it('should not show close button when showClose is false', async () => {
    mountModal({ modelValue: true, showClose: false })
    await nextTick()
    expect(document.querySelector('.nm-modal__close')).toBeNull()
  })

  it('should not show footer when footer is false', async () => {
    mountModal({ modelValue: true, footer: false })
    await nextTick()
    expect(document.querySelector('.nm-modal__footer')).toBeNull()
  })

  it('should apply size classes', async () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      document.body.innerHTML = ''
      mountModal({ modelValue: true, size })
      await nextTick()
      const modal = document.querySelector('.nm-modal')
      expect(modal!.classList.contains(`nm-modal--${size}`)).toBe(true)
    }
  })

  it('should have correct ARIA attributes', async () => {
    mountModal({ modelValue: true, title: 'Dialog' })
    await nextTick()
    const dialog = document.querySelector('.nm-modal')
    expect(dialog!.getAttribute('role')).toBe('dialog')
    expect(dialog!.getAttribute('aria-modal')).toBe('true')
  })

  it('should render default slot content', async () => {
    mountModal({ modelValue: true }, { default: '<p class="custom-content">Hello</p>' })
    await nextTick()
    expect(document.querySelector('.custom-content')).not.toBeNull()
  })

  it('should render custom footer slot', async () => {
    mountModal({ modelValue: true }, { footer: '<div class="custom-footer">Custom</div>' })
    await nextTick()
    expect(document.querySelector('.custom-footer')).not.toBeNull()
    expect(document.querySelector('.nm-modal__btn--cancel')).toBeNull()
  })
})
