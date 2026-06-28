import { inject, provide, computed, type ComputedRef } from 'vue'
import type { InjectionKey } from 'vue'
import type { LocaleMessages, Locale } from '@/locales/types'
import { zhCN } from '@/locales/zh-CN'
import { enUS } from '@/locales/en-US'

const LOCALE_MAP: Record<Locale, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const LocaleKey: InjectionKey<ComputedRef<LocaleMessages>> = Symbol('nm-locale')

const DEFAULT_LOCALE = zhCN

/**
 * Simple message interpolation: replaces `{key}` with values from the params object.
 */
function interpolate(
  message: string | undefined,
  params?: Record<string, string | number>
): string {
  if (!message) return ''
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`))
}

/**
 * Returns the active locale messages.
 *
 * Priority:
 *   1. Explicitly provided locale via `provideLocale()`
 *   2. Default zh-CN
 *
 * Use `t('key')` for messages with interpolation:
 *   t('badgeUnread', { count: 5 }) // '未读 5'
 *
 * Or access directly:
 *   locale.badgeOnline // '在线'
 */
export function useLocale(): {
  locale: ComputedRef<LocaleMessages>
  t: (key: keyof LocaleMessages, params?: Record<string, string | number>) => string
} {
  const locale = inject(
    LocaleKey,
    computed(() => DEFAULT_LOCALE)
  )

  function t(key: keyof LocaleMessages, params?: Record<string, string | number>): string {
    return interpolate(locale.value[key], params)
  }

  return { locale, t }
}

/**
 * Provide a custom locale to all child components.
 *
 * @example
 * ```ts
 * import { provideLocale } from '@echolab-auto/ui-frame'
 * import { zhCN } from '@echolab-auto/ui-frame/locales'
 *
 * provideLocale(zhCN)
 * ```
 */
export function provideLocale(messages: LocaleMessages): void {
  provide(
    LocaleKey,
    computed(() => messages)
  )
  // Set document language for screen readers
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    document.documentElement.lang =
      ((messages as Record<string, unknown>)._localeCode as string) ||
      document.documentElement.lang ||
      'zh-CN'
  }
}

/**
 * Get locale messages by locale code.
 */
export function getLocaleMessages(locale: Locale): LocaleMessages {
  return LOCALE_MAP[locale] ?? DEFAULT_LOCALE
}

export { LocaleKey }
