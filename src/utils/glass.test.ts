import { describe, it, expect } from 'vitest'
import { GLASS_VARIANTS, glassClassNames, normalizeGlass } from './glass'

describe('normalizeGlass', () => {
  it('maps the boolean shorthand true to float', () => {
    expect(normalizeGlass(true)).toBe('float')
  })

  it('returns false for falsy input', () => {
    expect(normalizeGlass(false)).toBe(false)
    expect(normalizeGlass(undefined)).toBe(false)
    expect(normalizeGlass(null)).toBe(false)
  })

  it('passes every declared variant through', () => {
    for (const variant of GLASS_VARIANTS) {
      expect(normalizeGlass(variant)).toBe(variant)
    }
  })

  it('rejects unknown strings coming from external config', () => {
    // 运行时防御：全局配置可能来自 JSON，类型不能保证
    expect(normalizeGlass('glass' as never)).toBe(false)
    expect(normalizeGlass('glass-raised' as never)).toBe(false)
    expect(normalizeGlass('' as never)).toBe(false)
  })

  it('exposes the variants in light-to-heavy order', () => {
    expect([...GLASS_VARIANTS]).toEqual(['float', 'raised', 'pressed'])
  })
})

describe('glassClassNames', () => {
  it('returns surface + level class for each variant', () => {
    expect(glassClassNames('nm-button', 'float')).toEqual([
      'nm-button--glass',
      'nm-button--glass-float',
    ])
    expect(glassClassNames('nm-card', 'raised')).toEqual([
      'nm-card--glass',
      'nm-card--glass-raised',
    ])
    expect(glassClassNames('nm-card', 'pressed')).toEqual([
      'nm-card--glass',
      'nm-card--glass-pressed',
    ])
  })

  it('returns an empty list when glass is off', () => {
    expect(glassClassNames('nm-button', false)).toEqual([])
  })

  it('respects the component prefix', () => {
    expect(glassClassNames('nm-widget', 'float')).toEqual([
      'nm-widget--glass',
      'nm-widget--glass-float',
    ])
  })
})
