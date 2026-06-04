import { ref, computed, provide, inject, watch, onBeforeUnmount, type InjectionKey, type Ref } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

export interface ThemeOptions {
  defaultTheme?: Theme
  storageKey?: string
  followSystem?: boolean
}

export interface ThemeContext {
  theme: Ref<Theme>
  currentTheme: Ref<'light' | 'dark'>
  isDark: Ref<boolean>
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  dispose: () => void
}

const ThemeKey: InjectionKey<ThemeContext> = Symbol('neumorphism-theme')

const STORAGE_KEY = 'nm-theme-preference'

/**
 * Get system preferred color scheme
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get stored theme preference from localStorage
 */
function getStoredTheme(storageKey: string): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(storageKey) as Theme | null
  } catch {
    return null
  }
}

/**
 * Store theme preference to localStorage
 */
function storeTheme(theme: Theme, storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Apply theme class to document element
 */
function applyThemeClass(isDark: boolean): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark) {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
}

/**
 * Create theme state for a component tree
 */
export function createTheme(options: ThemeOptions = {}): ThemeContext {
  const {
    defaultTheme = 'auto',
    storageKey = STORAGE_KEY,
    followSystem = true,
  } = options

  // Initialize theme from storage or default
  const stored = getStoredTheme(storageKey)
  const theme = ref<Theme>(stored || defaultTheme)

  // Computed actual light/dark based on theme setting
  const currentTheme = computed<'light' | 'dark'>(() => {
    if (theme.value === 'auto') {
      return getSystemTheme()
    }
    return theme.value
  })

  const isDark = computed(() => currentTheme.value === 'dark')

  // Watch for changes and apply
  watch(
    isDark,
    (dark) => {
      applyThemeClass(dark)
    },
    { immediate: true }
  )

  // Listen for system theme changes when in auto mode
  let mediaQuery: MediaQueryList | undefined
  let mediaChangeHandler: (() => void) | undefined

  if (followSystem && typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaChangeHandler = () => {
      if (theme.value === 'auto') {
        applyThemeClass(getSystemTheme() === 'dark')
      }
    }
    mediaQuery.addEventListener('change', mediaChangeHandler)
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    storeTheme(newTheme, storageKey)
  }

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const dispose = () => {
    if (mediaQuery && mediaChangeHandler) {
      mediaQuery.removeEventListener('change', mediaChangeHandler)
    }
  }

  return {
    theme,
    currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    dispose,
  }
}

/**
 * Provide theme context to child components
 */
export function provideTheme(options: ThemeOptions = {}): ThemeContext {
  const themeContext = createTheme(options)
  provide(ThemeKey, themeContext)
  onBeforeUnmount(() => {
    themeContext.dispose()
  })
  return themeContext
}

// Module-level fallback to avoid creating multiple listeners
let fallbackTheme: ThemeContext | null = null
let fallbackRefCount = 0

/**
 * Inject theme context from parent
 */
export function useTheme(): ThemeContext {
  const context = inject(ThemeKey)
  if (!context) {
    // Return a shared default theme context if not provided
    if (!fallbackTheme) {
      fallbackTheme = createTheme()
    }
    fallbackRefCount++
    onBeforeUnmount(() => {
      fallbackRefCount--
      if (fallbackRefCount <= 0 && fallbackTheme) {
        fallbackTheme.dispose()
        fallbackTheme = null
        fallbackRefCount = 0
      }
    })
    return fallbackTheme
  }
  return context
}
