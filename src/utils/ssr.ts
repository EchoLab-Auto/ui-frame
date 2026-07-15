/**
 * SSR-safe browser API utilities.
 *
 * Centralises typeof window / document guards scattered across 15+ files
 * into a single module. Use these instead of inline guards to ensure
 * consistent behaviour and to make new code SSR-safe by default.
 */

/** True when running in a browser (window is defined). */
export const isBrowser = typeof window !== 'undefined'

/** True when running on a server (SSR / Node). */
export const isServer = !isBrowser

/**
 * Safely access `window.matchMedia`, returning a no-op stub on the server.
 * The stub returns an object that behaves like a never-matching query so
 * callers can safely chain `.matches` without guards.
 */
export function safeMatchMedia(query: string): MediaQueryList {
  if (!isBrowser) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }
  return window.matchMedia(query)
}

/**
 * Safely read/write from localStorage. Returns null on read failures
 * (SSR, private browsing restrictions, quota errors).
 */
export function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silently ignore — quota exceeded or private browsing
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (!isBrowser) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently ignore
  }
}

/**
 * Get the current document. Returns undefined on the server.
 */
export function safeDocument(): Document | undefined {
  return isBrowser ? document : undefined
}

/**
 * Get the current window. Returns undefined on the server.
 */
export function safeWindow(): Window | undefined {
  return isBrowser ? window : undefined
}

/**
 * Get computed style for an element. Returns an empty CSSStyleDeclaration
 * stub on the server to avoid `getComputedStyle is not defined` errors.
 */
export function safeGetComputedStyle(el: Element): CSSStyleDeclaration {
  if (!isBrowser) {
    return {
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration
  }
  return window.getComputedStyle(el)
}
