import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismIcon from './NeumorphismIcon.vue'
import { ICON_NAMES, ICON_REGISTRY, ICON_SIZE_PX, defaultStrokeWidth } from '@/icons/registry'

describe('NeumorphismIcon', () => {
  it('按语义名渲染对应 path，默认 14px / 线宽 2', () => {
    const wrapper = mount(NeumorphismIcon, { props: { name: 'close' } })
    expect(wrapper.classes()).toContain('nm-icon')
    expect(wrapper.classes()).toContain('nm-icon--close')
    expect(wrapper.attributes('width')).toBe('14')
    expect(wrapper.attributes('height')).toBe('14')
    expect(wrapper.attributes('stroke-width')).toBe('2')
    expect(wrapper.attributes('viewBox')).toBe('0 0 24 24')
    expect(wrapper.attributes('stroke')).toBe('currentColor')
    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0].attributes('d')).toBe(ICON_REGISTRY.close.paths[0])
  })

  it('七档尺寸分别落到 --nm-icon-size-* 的像素值', () => {
    const cases = Object.entries(ICON_SIZE_PX) as [keyof typeof ICON_SIZE_PX, number][]
    for (const [size, px] of cases) {
      const wrapper = mount(NeumorphismIcon, { props: { name: 'gear', size } })
      expect(wrapper.attributes('width')).toBe(String(px))
      expect(wrapper.attributes('height')).toBe(String(px))
    }
  })

  it('数字尺寸直传', () => {
    const wrapper = mount(NeumorphismIcon, { props: { name: 'gear', size: 20 } })
    expect(wrapper.attributes('width')).toBe('20')
  })

  it('线宽按尺寸档自动：≤12→2.5 / ≥24→1.5 / 其余 2', () => {
    expect(defaultStrokeWidth(12)).toBe(2.5)
    expect(defaultStrokeWidth(13)).toBe(2)
    expect(defaultStrokeWidth(23)).toBe(2)
    expect(defaultStrokeWidth(24)).toBe(1.5)
    expect(
      mount(NeumorphismIcon, { props: { name: 'gear', size: 'xs' } }).attributes('stroke-width')
    ).toBe('2.5')
    expect(
      mount(NeumorphismIcon, { props: { name: 'gear', size: '2xl' } }).attributes('stroke-width')
    ).toBe('1.5')
    expect(
      mount(NeumorphismIcon, { props: { name: 'gear', size: 'md' } }).attributes('stroke-width')
    ).toBe('2')
  })

  it('显式 stroke-width 覆盖按档自动值（勾选语义用 3）', () => {
    const wrapper = mount(NeumorphismIcon, {
      props: { name: 'check', size: 'sm', strokeWidth: 3 },
    })
    expect(wrapper.attributes('stroke-width')).toBe('3')
  })

  it('a11y：有 label 时 role=img + aria-label，无 label 时 aria-hidden', () => {
    const withLabel = mount(NeumorphismIcon, { props: { name: 'warning', label: '高风险' } })
    expect(withLabel.attributes('role')).toBe('img')
    expect(withLabel.attributes('aria-label')).toBe('高风险')
    expect(withLabel.attributes('aria-hidden')).toBeUndefined()

    const decorative = mount(NeumorphismIcon, { props: { name: 'warning' } })
    expect(decorative.attributes('aria-hidden')).toBe('true')
    expect(decorative.attributes('aria-label')).toBeUndefined()
  })

  it('spin / pulse 修饰类', () => {
    expect(mount(NeumorphismIcon, { props: { name: 'refresh', spin: true } }).classes()).toContain(
      'nm-icon--spin'
    )
    expect(mount(NeumorphismIcon, { props: { name: 'clock', pulse: true } }).classes()).toContain(
      'nm-icon--pulse'
    )
  })

  it('实心图标带 filled 修饰类（不参与 stroke）', () => {
    const wrapper = mount(NeumorphismIcon, { props: { name: 'dot' } })
    expect(wrapper.classes()).toContain('nm-icon--filled')
  })

  it('注册表完整性：每个语义至少 1 条 path，且不含非法字符', () => {
    expect(ICON_NAMES.length).toBeGreaterThan(30)
    for (const name of ICON_NAMES) {
      const def = ICON_REGISTRY[name]
      expect(def.paths.length, `${name} 无 path`).toBeGreaterThan(0)
      for (const d of def.paths) {
        expect(d.trim().length, `${name} path 过短`).toBeGreaterThan(5)
        // 只允许 SVG path 语法字符（防误把文字/emoji 塞进来）
        expect(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\-\s*]+$/.test(d), `${name} path 含非法字符`).toBe(
          true
        )
      }
    }
  })

  it('未知语义名回退 close（不崩、不空白）', () => {
    // 类型层禁止，但运行时（模板字符串拼出来）仍可能命中
    const wrapper = mount(NeumorphismIcon, { props: { name: 'nope' as never } })
    expect(wrapper.classes()).toContain('nm-icon--nope')
    expect(wrapper.findAll('path')).toHaveLength(1)
  })
})
