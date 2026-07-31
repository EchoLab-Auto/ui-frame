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
import { useZIndex } from './useZIndex'
import { useFocusStack } from './useFocusStack'

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'

// ---------------------------------------------------------------------------
// SSR-safe scroll lock — shares the same global counter as useModal via a
// WeakMap keyed by document, so drawers and modals can coexist without
// double-unlocking body scroll.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UseDrawerOptions {
  /** v-model visibility */
  modelValue: Ref<boolean>
  /** Whether clicking the mask closes the drawer */
  maskClosable?: Ref<boolean>
  /** Whether the drawer can be closed at all (Escape / close button) */
  closable?: Ref<boolean>
  /** Whether to destroy DOM when closed */
  destroyOnClose?: Ref<boolean>
}

export interface UseDrawerReturn {
  /** Whether the drawer is currently visible (for transitions) */
  isOpen: Ref<boolean>
  /** Whether the drawer DOM should be rendered */
  rendered: Ref<boolean>
  /** Open the drawer */
  open: () => void
  /** Close the drawer */
  close: () => void
  /** Handle keydown for Escape and focus trap */
  handleKeydown: (event: KeyboardEvent, drawerEl: HTMLElement | undefined) => void
  /** Handle mask click — closes when maskClosable and closable */
  handleMaskClick: () => void
  /** Focus the first focusable element inside the drawer (call after drawer mounts) */
  focusDrawer: (drawerEl: HTMLElement | undefined) => void
  /** Current z-index for the overlay mask (context-aware, accounts for nesting). */
  overlayZIndex: ComputedRef<number>
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------
/**
 * Headless drawer — encapsulates open/close, body scroll lock, focus trap,
 * Escape handling, and mask click dismissal. Use with your own UI rendering.
 */
export function useDrawer(opts: UseDrawerOptions): UseDrawerReturn {
  const { modelValue } = opts
  const maskClosable = opts.maskClosable ?? ref(true)
  const closable = opts.closable ?? ref(true)
  const destroyOnClose = opts.destroyOnClose ?? ref(false)

  const isOpen = ref(modelValue.value)
  const rendered = ref(modelValue.value)
  // 焦点栈（嵌套弹层 LIFO 恢复，与 useModal 共享全局栈）
  const focusStack = useFocusStack()
  let destroyTimer: ReturnType<typeof setTimeout> | undefined
  let hasUnlocked = false

  // ---- z-index overlay registration ----
  const { getZIndex, registerOverlay } = useZIndex()
  let unregisterOverlay: (() => void) | null = null

  // ---- scroll lock ----
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

  // ---- watch modelValue ----
  watch(
    () => modelValue.value,
    val => {
      if (val) {
        rendered.value = true
        const ae = document.activeElement
        focusStack.push(ae instanceof HTMLElement ? ae : null)
        lockBodyScroll()
        // Register this drawer in the global z-index overlay stack
        if (!unregisterOverlay) {
          unregisterOverlay = registerOverlay()
        }
        nextTick(() => {
          isOpen.value = true
        })
      } else {
        isOpen.value = false
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
          setTimeout(cleanup, 250)
        }
      }
    }
  )

  // ---- actions ----
  function open() {
    modelValue.value = true
  }

  function close() {
    if (!closable.value) return
    modelValue.value = false
  }

  function handleMaskClick() {
    if (maskClosable.value && closable.value) {
      close()
    }
  }

  // ---- focus trap ----
  function getFocusableElements(drawerEl: HTMLElement | undefined): HTMLElement[] {
    if (!drawerEl) return []
    return Array.from(
      drawerEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable]:not([contenteditable="false"])'
      )
    )
  }

  function focusDrawer(drawerEl: HTMLElement | undefined) {
    if (!drawerEl) return
    drawerEl.focus()
    const focusable = getFocusableElements(drawerEl)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  function handleKeydown(event: KeyboardEvent, drawerEl: HTMLElement | undefined) {
    if (event.key === 'Escape' && closable.value) {
      close()
      return
    }
    if (event.key === 'Tab' && drawerEl) {
      const focusable = getFocusableElements(drawerEl)
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

  // ---- lifecycle ----
  onMounted(() => {
    if (modelValue.value) {
      rendered.value = true
      nextTick(() => {
        isOpen.value = true
      })
    }
  })

  onBeforeUnmount(() => {
    clearTimeout(destroyTimer)
    if (!hasUnlocked) {
      unlockBodyScroll()
      hasUnlocked = true
    }
    if (isOpen.value) {
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
    isOpen,
    rendered,
    open,
    close,
    handleKeydown,
    handleMaskClick,
    focusDrawer,
    /** Current z-index for the overlay mask (context-aware). */
    overlayZIndex: computed(() => getZIndex('overlay')),
  }
}
