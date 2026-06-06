import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createTheme, useTheme, provideTheme } from './useTheme'
import type { ThemeContext } from './useTheme'

function mockLocalStorage() {
  const storage: Record<string, string> = {}
  return {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => {
      storage[k] = v
    },
    removeItem: (k: string) => {
      delete storage[k]
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k])
    },
  }
}

function mockMatchMedia(matches: boolean) {
  return () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

describe('createTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage())
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('matchMedia', mockMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should default to auto theme', () => {
    const theme = createTheme()
    expect(theme.theme.value).toBe('auto')
    expect(theme.currentTheme.value).toBe('light')
    expect(theme.isDark.value).toBe(false)
    theme.dispose()
  })

  it('should apply dark class when isDark', () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true))
    const theme = createTheme()
    expect(theme.isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    theme.dispose()
  })

  it('setTheme should update theme and store in localStorage', () => {
    const theme = createTheme()
    theme.setTheme('dark')
    expect(theme.theme.value).toBe('dark')
    expect(localStorage.getItem('nm-theme-preference')).toBe('dark')
    theme.dispose()
  })

  it('setTheme should update theme to light', () => {
    const theme = createTheme()
    theme.setTheme('light')
    expect(theme.theme.value).toBe('light')
    expect(theme.isDark.value).toBe(false)
    theme.dispose()
  })

  it('toggleTheme should switch between light and dark', () => {
    const theme = createTheme({ defaultTheme: 'light' })
    expect(theme.isDark.value).toBe(false)
    theme.toggleTheme()
    expect(theme.isDark.value).toBe(true)
    theme.toggleTheme()
    expect(theme.isDark.value).toBe(false)
    theme.dispose()
  })

  it('should read stored theme on init', () => {
    localStorage.setItem('nm-theme-preference', 'dark')
    const theme = createTheme()
    expect(theme.theme.value).toBe('dark')
    expect(theme.isDark.value).toBe(true)
    theme.dispose()
  })

  it('should use custom storage key', () => {
    localStorage.setItem('my-app-theme', 'dark')
    const theme = createTheme({ storageKey: 'my-app-theme' })
    expect(theme.theme.value).toBe('dark')
    theme.dispose()
  })

  it('should use defaultTheme when no stored theme', () => {
    const theme = createTheme({ defaultTheme: 'dark' })
    expect(theme.theme.value).toBe('dark')
    theme.dispose()
  })

  it('dispose should remove media query listener', () => {
    const removeListener = vi.fn()
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeListener,
      dispatchEvent: vi.fn(),
    }))
    const theme = createTheme({ followSystem: true })
    theme.dispose()
    expect(removeListener).toHaveBeenCalled()
  })

  it('should handle SSR environment gracefully', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    const theme = createTheme()
    expect(theme.theme.value).toBe('auto')
    expect(theme.currentTheme.value).toBe('light')
    theme.dispose()
  })
})

describe('provideTheme / useTheme', () => {
  function withTheme() {
    let themeCtx: ThemeContext | null = null

    const Child = defineComponent({
      setup() {
        themeCtx = useTheme()
        return () => h('div')
      },
    })

    const Parent = defineComponent({
      setup() {
        provideTheme({ defaultTheme: 'dark' })
        return () => h(Child)
      },
    })

    const wrapper = mount(Parent)
    return { ctx: () => themeCtx!, unmount: () => wrapper.unmount() }
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage())
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('matchMedia', mockMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should provide theme context to children', () => {
    const { ctx } = withTheme()
    expect(ctx().theme.value).toBe('dark')
    expect(ctx().isDark.value).toBe(true)
  })

  it('should allow setting theme via context', () => {
    const { ctx } = withTheme()
    ctx().setTheme('light')
    expect(ctx().theme.value).toBe('light')
    expect(ctx().isDark.value).toBe(false)
  })

  it('should toggle theme via context', () => {
    const { ctx } = withTheme()
    ctx().toggleTheme()
    expect(ctx().theme.value).toBe('light')
    ctx().toggleTheme()
    expect(ctx().theme.value).toBe('dark')
  })
})

describe('useTheme fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage())
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('matchMedia', mockMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should create fallback when no provider', () => {
    let ctx: ThemeContext | null = null
    const Comp = defineComponent({
      setup() {
        ctx = useTheme()
        return () => h('div')
      },
    })
    mount(Comp)
    expect(ctx!.theme.value).toBe('auto')
  })
})

describe('provideTheme reactive options', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage())
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('matchMedia', mockMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should react to ref option changes', async () => {
    const options = ref({ defaultTheme: 'light' as const })

    const Child = defineComponent({
      setup() {
        const ctx = useTheme()
        return () => h('div', ctx.theme.value)
      },
    })

    const Parent = defineComponent({
      setup() {
        provideTheme(options)
        return () => h(Child)
      },
    })

    const wrapper = mount(Parent)
    expect(wrapper.text()).toBe('light')

    options.value = { defaultTheme: 'dark' }
    await new Promise(r => setTimeout(r, 10))
    expect(wrapper.text()).toBe('dark')
  })
})
