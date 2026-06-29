/**
 * Generate a unique ID string
 */
export function generateId(prefix = 'nm'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Unicode-aware slugify.
 *
 * Preserves Unicode letters and numbers, normalizes whitespace and dashes
 * to single dashes, and trims leading/trailing dashes.
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      // Keep Unicode letters, numbers, whitespace, and hyphens
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      // Normalize whitespace and consecutive dashes to a single dash
      .replace(/[\s-]+/g, '-')
      // Trim leading/trailing dashes
      .replace(/^-+|-+$/g, '')
  )
}

/**
 * Debounce function with a cancel method
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
