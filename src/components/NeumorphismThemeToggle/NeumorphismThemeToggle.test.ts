import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismThemeToggle from './NeumorphismThemeToggle.vue'
import { ConfigKey } from '@/composables/useConfig'
import { THEME_TOGGLE_SCALE } from '@/utils/controlScales'

describe('NeumorphismThemeToggle', () => {
  it('should render three theme options with labels by default', () => {
    const wrapper = mount(NeumorphismThemeToggle)
    expect(wrapper.classes()).toContain('nm-theme-toggle')
    expect(wrapper.classes()).toContain('nm-theme-toggle--medium')
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(3)
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(3)
  })

  it('should hide labels when size prop is small', () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { size: 'small' } })
    expect(wrapper.classes()).toContain('nm-theme-toggle--small')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(0)
  })

  it('should hide auto option when disableAuto', () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { disableAuto: true } })
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(2)
  })

  it('should emit update:modelValue and change on select', async () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { modelValue: 'auto' } })
    await wrapper.findAll('.nm-theme-toggle__btn')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['light'])
    expect(wrapper.emitted('change')![0]).toEqual(['light'])
  })

  // 级联配置回归：标签显隐必须走级联后的 size（此前只看原始 prop，
  // 全局配置 themeToggle.size: 'small' 时标签不隐藏）
  it('should hide labels when global config themeToggle.size is small', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { size: 'small' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-theme-toggle--small')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(0)
  })

  it('should let explicit size prop override global config', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      props: { size: 'large' },
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { size: 'small' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-theme-toggle--large')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(3)
  })

  describe('size（数字是一等公民）', () => {
    it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
      // 7 落在锚点 6(md) 与 8(lg) 之间：位置 1.5，各指标按同一位置插值
      const wrapper = mount(NeumorphismThemeToggle, { props: { size: 7 } })
      expect(wrapper.classes()).toContain('nm-theme-toggle--sized')
      expect(wrapper.classes().some(c => /^nm-theme-toggle--(small|medium|large)$/.test(c))).toBe(
        false
      )
      // 变量挂根节点，尺寸本身施加在内部按钮 / 图标上
      const style = wrapper.attributes('style')
      expect(style).toContain('--nm-theme-toggle-sz-btn-pad-y: 7px')
      expect(style).toContain('--nm-theme-toggle-sz-icon: 17px')
      expect(style).toContain('--nm-theme-toggle-sz-pad: 3.5px')
    })

    it('数字 size 在锚点上与档位别名一致（5 / 6 / 8）', () => {
      const padY =
        THEME_TOGGLE_SCALE.primary /* --nm-theme-toggle-sz-btn-pad-y 是主几何量，已提到 primaryVar */
      // 锚点值只从引擎取一次，测试里不再抄第二份数字
      expect([padY.sm, padY.md, padY.lg]).toEqual([5, 6, 8])
      const anchors = [
        [padY.sm, 'small'],
        [padY.md, 'medium'],
        [padY.lg, 'large'],
      ] as const
      for (const [px, tier] of anchors) {
        const byNumber = mount(NeumorphismThemeToggle, { props: { size: px } })
        expect(byNumber.attributes('style')).toContain(`--nm-theme-toggle-sz-btn-pad-y: ${px}px`)

        const byTier = mount(NeumorphismThemeToggle, { props: { size: tier } })
        expect(byTier.classes()).toContain(`nm-theme-toggle--${tier}`)
        // 档位路径不写内联变量：两条通道互不干扰
        expect(byTier.attributes('style')).toBeUndefined()
      }
    })

    it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 6', () => {
      for (const bad of [0, -12, Number.NaN]) {
        const wrapper = mount(NeumorphismThemeToggle, { props: { size: bad } })
        expect(wrapper.attributes('style')).toContain('--nm-theme-toggle-sz-btn-pad-y: 6px')
        // 回落后仍走数字通道，不会掉回档位类
        expect(wrapper.classes()).toContain('nm-theme-toggle--sized')
      }
    })

    it('标签显隐这条结构性差异在数字路径下同样保留：< 6 等价小档', () => {
      // 内距 < medium 锚点 → 等价 small：不渲染 label（少一个 span，不是 CSS 隐藏）
      expect(
        mount(NeumorphismThemeToggle, { props: { size: 5 } }).findAll('.nm-theme-toggle__label')
      ).toHaveLength(0)
      // 内距 ≥ 6 → 等价 medium 及以上：标签照常渲染
      for (const px of [6, 9]) {
        expect(
          mount(NeumorphismThemeToggle, { props: { size: px } }).findAll('.nm-theme-toggle__label')
        ).toHaveLength(3)
      }
    })
  })

  it('should apply disableAuto from global config', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { disableAuto: true } } },
        },
      },
    })
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(2)
  })
})
