/**
 * Shared focus stack for nested modals and drawers.
 *
 * When multiple dialogs are opened (e.g., a modal inside a drawer), each
 * saves the previously focused element. Closing any layer restores focus
 * to the correct element and decrements the scroll-lock counter exactly once.
 *
 * Usage:
 *   const stack = useFocusStack()
 *   stack.push(previousElement)   // on open
 *   stack.pop()                   // on close
 *   stack.destroy()               // on unmount (safety cleanup)
 */

const globalStack: HTMLElement[] = []

export interface FocusStack {
  push: (el: HTMLElement | null) => void
  pop: () => HTMLElement | null
  depth: () => number
  destroy: () => void
}

export function useFocusStack(): FocusStack {
  const localElements: (HTMLElement | null)[] = []

  return {
    push(el: HTMLElement | null) {
      if (el) globalStack.push(el)
      localElements.push(el)
    },

    pop(): HTMLElement | null {
      const el = globalStack.pop()
      const local = localElements.pop()
      return el ?? local ?? null
    },

    depth(): number {
      return globalStack.length
    },

    destroy() {
      // Clean up any elements this instance pushed but didn't pop
      for (const el of localElements) {
        const idx = globalStack.indexOf(el!)
        if (idx !== -1) globalStack.splice(idx, 1)
      }
      localElements.length = 0
    },
  }
}
