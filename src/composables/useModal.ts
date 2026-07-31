import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  type Ref,
  type ComputedRef,
} from 'vue'
import { useFocusStack } from './useFocusStack'
import { useZIndex } from './useZIndex'

// SSR-safe scroll lock counter — keyed by document to support iframes/concurrent usage
const scrollLockCounters = new WeakMap<Document, number>()

function getScrollLockCount(doc: Document): number {
  return scrollLockCounters.get(doc) ?? 0
}

function setScrollLockCount(doc: Document, count: number): void {
  if (count <= 0) {
    scrollLockCounters.delete(doc)
  } else {
    scrollLockCounters.set(doc, count)
  }
}

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0
  return window.innerWidth - document.documentElement.clientWidth
}

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
  /** Current z-index for the overlay mask (context-aware, accounts for nesting). */
  overlayZIndex: ComputedRef<number>
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
  // 焦点栈（嵌套弹层 LIFO 恢复，替代单实例 previousActiveElement）
  const focusStack = useFocusStack()
  let destroyTimer: ReturnType<typeof setTimeout> | undefined
  let hasUnlocked = false

  // ---- z-index overlay registration ----
  const { getZIndex, registerOverlay } = useZIndex()
  let unregisterOverlay: (() => void) | null = null

  function lockBodyScroll() {
    if (typeof document === 'undefined') return
    const count = getScrollLockCount(document)
    setScrollLockCount(document, count + 1)
    if (count === 0) {
      const scrollbarWidth = getScrollbarWidth()
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.body.style.overflow = 'hidden'
    }
  }

  function unlockBodyScroll() {
    if (typeof document === 'undefined') return
    const count = getScrollLockCount(document)
    const next = Math.max(0, count - 1)
    setScrollLockCount(document, next)
    if (next === 0) {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }

  watch(
    () => modelValue.value,
    val => {
      if (val) {
        rendered.value = true
        const ae = document.activeElement
        focusStack.push(ae instanceof HTMLElement ? ae : null)
        lockBodyScroll()
        // Register this modal in the global z-index overlay stack so that
        // floating components (Select dropdowns, Tooltips, etc.) rendered
        // inside the modal automatically stack above its mask.
        if (!unregisterOverlay) {
          unregisterOverlay = registerOverlay()
        }
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
        if (!hasUnlocked) {
          unlockBodyScroll()
          hasUnlocked = true
        }
        focusStack.pop()?.focus()
        // Unregister from the z-index overlay stack after transition completes
        if (unregisterOverlay) {
          const cleanup = unregisterOverlay
          unregisterOverlay = null
          // Defer unregistration so floating children (tooltips, dropdowns)
          // that read z-index during their own leave transition still see
          // the correct overlay depth.
          setTimeout(cleanup, 250)
        }
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
    if (!hasUnlocked) {
      unlockBodyScroll()
      hasUnlocked = true
    }
    if (visible.value) {
      focusStack.pop()?.focus()
    }
    focusStack.destroy()
    // Clean up z-index overlay registration
    if (unregisterOverlay) {
      unregisterOverlay()
      unregisterOverlay = null
    }
  })

  return {
    visible,
    rendered,
    close,
    confirm,
    handleKeydown,
    focusDialog,
    /** Current z-index for the overlay mask (context-aware). */
    overlayZIndex: computed(() => getZIndex('overlay')),
  }
}
