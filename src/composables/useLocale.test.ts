import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h, provide } from 'vue'
import { mount } from '@vue/test-utils'
import { useLocale, getLocaleMessages, LocaleKey } from './useLocale'
import { zhCN } from '@/locales/zh-CN'
import { enUS } from '@/locales/en-US'
import type { LocaleMessages } from '@/locales/types'

function withLocale(customMessages?: LocaleMessages) {
  let localeResult: ReturnType<typeof useLocale> | null = null

  const Child = defineComponent({
    setup() {
      localeResult = useLocale()
      return () => h('div')
    },
  })

  const Parent = defineComponent({
    setup() {
      if (customMessages) {
        provide(
          LocaleKey,
          computed(() => customMessages)
        )
      }
      return () => h(Child)
    },
  })

  const wrapper = mount(Parent)

  return { locale: () => localeResult!, unmount: () => wrapper.unmount() }
}

describe('useLocale', () => {
  it('should default to zh-CN when no provider is given', () => {
    const { locale } = withLocale()
    expect(locale().locale.value.modalConfirm).toBe('确认')
    expect(locale().locale.value.paginationPrev).toBe('上一页')
  })

  it('t() should translate a simple key', () => {
    const { locale } = withLocale()
    expect(locale().t('modalConfirm')).toBe('确认')
    expect(locale().t('paginationPrev')).toBe('上一页')
  })

  it('t() should interpolate params', () => {
    const { locale } = withLocale()
    expect(locale().t('badgeUnread', { count: 5 })).toBe('未读 5')
    expect(locale().t('paginationTotal', { total: 100 })).toBe('共 100 条')
    expect(locale().t('paginationPageLabel', { page: 3 })).toBe('第 3 页')
  })

  it('t() should return empty string for undefined key', () => {
    const { locale } = withLocale()
    expect(locale().t('nonExistentKey' as keyof LocaleMessages)).toBe('')
  })

  it('t() should return raw message when no params provided', () => {
    const { locale } = withLocale()
    expect(locale().t('modalCancel')).toBe('取消')
  })

  it('t() should keep placeholder for missing param', () => {
    const { locale } = withLocale()
    expect(locale().t('badgeUnread')).toBe('未读 {count}')
  })

  it('should use custom locale when provided via inject', () => {
    const custom: LocaleMessages = {
      modalConfirm: 'Custom Confirm',
      modalCancel: 'Custom Cancel',
    }
    const { locale } = withLocale(custom)
    expect(locale().t('modalConfirm')).toBe('Custom Confirm')
    expect(locale().t('modalCancel')).toBe('Custom Cancel')
  })
})

describe('getLocaleMessages', () => {
  it('should return zh-CN messages', () => {
    const messages = getLocaleMessages('zh-CN')
    expect(messages.modalConfirm).toBe('确认')
    expect(messages.paginationPrev).toBe('上一页')
  })

  it('should return en-US messages', () => {
    const messages = getLocaleMessages('en-US')
    expect(messages.modalConfirm).toBe('Confirm')
    expect(messages.paginationPrev).toBe('Previous')
  })

  it('should fallback to zh-CN for unknown locale', () => {
    const messages = getLocaleMessages('fr-FR' as 'zh-CN')
    expect(messages.modalConfirm).toBe('确认')
  })
})

describe('locale packages', () => {
  it('zh-CN and en-US should have identical keys', () => {
    const zhKeys = Object.keys(zhCN).sort()
    const enKeys = Object.keys(enUS).sort()
    expect(enKeys).toEqual(zhKeys)
  })

  it('zh-CN should not have empty values', () => {
    const emptyKeys = Object.entries(zhCN)
      .filter(([, v]) => !v || v.trim() === '')
      .map(([k]) => k)
    expect(emptyKeys).toEqual([])
  })

  it('en-US should not have empty values', () => {
    const emptyKeys = Object.entries(enUS)
      .filter(([, v]) => !v || v.trim() === '')
      .map(([k]) => k)
    expect(emptyKeys).toEqual([])
  })
})
