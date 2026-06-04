import { ref, watch, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'

export interface UseModalOptions {
  /** v-model visibility */
  modelValue: Ref<boolean>
  /** Whether clicking the mask closes the modal */
  maskClosable?: Ref<boolean>
  /** Whether the modal can be closed */
  closable?: Ref<boolean>
  /** Whether to destroy DOM when closed */
  destroyOnClose?: Ref<boolean>
}

export interface UseModalReturn {
  /** Whether the modal is currently visible (for transitions) */
  visible: Ref<boolean>
  /** Whether the modal DOM should be rendered */
  rendered: Ref<boolean>
  /** Close the modal */
  close: () => void
  /** Confirm action */
  confirm: () => void
  /** Handle keydown for Escape and focus trap */
  handleKeydown: (event: KeyboardEvent, dialogEl: HTMLElement | undefined) => void
  /** Focus the first focusable element inside the dialog (call after dialog mounts) */
  focusDialog: (dialogEl: HTMLElement | undefined) => void
}

/**
 * Headless modal — encapsulates open/close, body scroll lock, focus
 * trap, and Escape handling. Use with your own UI rendering.
 */
export function useModal(opts: UseModalOptions): UseModalReturn {
  const { modelValue } = opts
  const closable = opts.closable ?? ref(true)
  const destroyOnClose = opts.destroyOnClose ?? ref(false)

  const visible = ref(modelValue.value)
  const rendered = ref(modelValue.value)
  const previousActiveElement = ref<HTMLElement | null>(null)
  let destroyTimer: ReturnType<typeof setTimeout> | undefined

  function lockBodyScroll() {
    document.body.style.overflow = 'hidden'
  }

  function unlockBodyScroll() {
    document.body.style.overflow = ''
  }

  watch(
    () => modelValue.value,
    (val) => {
      if (val) {
        rendered.value = true
        const ae = document.activeElement
    previousActiveElement.value = ae instanceof HTMLElement ? ae : null
        lockBodyScroll()
        nextTick(() => {
          visible.value = true
        })
      } else {
        visible.value = false
        clearTimeout(destroyTimer)
        if (destroyOnClose.value) {
          destroyTimer = setTimeout(() => {
            rendered.value = false
          }, 200)
        }
        unlockBodyScroll()
        previousActiveElement.value?.focus()
      }
    }
  )

  function close() {
    if (!closable.value) return
    modelValue.value = false
  }

  function confirm() {
    modelValue.value = false
  }

  function getFocusableElements(dialogEl: HTMLElement | undefined): HTMLElement[] {
    if (!dialogEl) return []
    return Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable]:not([contenteditable="false"])'
      )
    )
  }

  function focusDialog(dialogEl: HTMLElement | undefined) {
    if (!dialogEl) return
    // Focus dialog itself first (it has tabindex="-1")
    dialogEl.focus()
    // Then try to focus the first interactive element
    const focusable = getFocusableElements(dialogEl)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  function handleKeydown(event: KeyboardEvent, dialogEl: HTMLElement | undefined) {
    if (event.key === 'Escape' && closable.value) {
      close()
      return
    }
    if (event.key === 'Tab' && dialogEl) {
      const focusable = getFocusableElements(dialogEl)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
  }

  onMounted(() => {
    if (modelValue.value) {
      rendered.value = true
      nextTick(() => {
        visible.value = true
      })
    }
  })

  onBeforeUnmount(() => {
    clearTimeout(destroyTimer)
    unlockBodyScroll()
    if (visible.value) {
      previousActiveElement.value?.focus()
    }
  })

  return {
    visible,
    rendered,
    close,
    confirm,
    handleKeydown,
    focusDialog,
  }
}
