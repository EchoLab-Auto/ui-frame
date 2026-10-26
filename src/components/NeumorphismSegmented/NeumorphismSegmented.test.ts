import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSegmented from './NeumorphismSegmented.vue'
import { SEGMENTED_SCALE } from '@/utils/controlScales'

const OPTIONS = [
  { label: '无约束', value: 'none' },
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist', disabled: true },
]

describe('NeumorphismSegmented', () => {
  it('渲染 radiogroup 与全部选项', () => {
    const wrapper = mount(NeumorphismSegmented, { props: { options: OPTIONS } })
    expect(wrapper.classes()).toContain('nm-segmented')
    expect(wrapper.attributes('role')).toBe('radiogroup')
    const items = wrapper.findAll('.nm-segmented__item')
    expect(items).toHaveLength(3)
    expect(items[0].attributes('role')).toBe('radio')
  })

  it('选中项带 active 类与 aria-checked', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    const items = wrapper.findAll('.nm-segmented__item')
    expect(items[0].classes()).toContain('nm-segmented__item--active')
    expect(items[0].attributes('aria-checked')).toBe('true')

    await items[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['allowlist'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['allowlist'])
  })

  it('禁用项点击不触发事件', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    const disabled = wrapper.findAll('.nm-segmented__item')[2]
    expect(disabled.attributes('disabled')).toBeDefined()
    await disabled.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('方向键导航并选中', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['allowlist'])
  })

  it('应用尺寸修饰类', () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, size: 'small' },
    })
    expect(wrapper.classes()).toContain('nm-segmented--small')
  })

  describe('size（数字是一等公民）', () => {
    it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
      // 29 落在锚点 26(sm) 与 32(md) 之间：值就是「单段最小高度」px
      const wrapper = mount(NeumorphismSegmented, { props: { options: OPTIONS, size: 29 } })
      expect(wrapper.classes()).toContain('nm-segmented--sized')
      expect(wrapper.classes().some(c => /^nm-segmented--(small|medium|large)$/.test(c))).toBe(
        false
      )
      // 变量挂根节点、尺寸施加在内部 item 上
      const style = wrapper.attributes('style')
      expect(style).toContain('--nm-segmented-sz-height: 29px')
      // medium 档不声明 font-size，继承 --nm-font-md = 13，故锚点是 12 / 13 / 15；
      // 29 落在 26 与 32 正中间 → 字号 12 + (13 − 12) × 0.5 = 12.5
      expect(style).toContain('--nm-segmented-sz-font: 12.5px')
      expect(style).toContain('--nm-segmented-sz-pad-y: 3px')
    })

    it('数字 size 在锚点上与档位别名一致（26 / 32 / 38）', () => {
      const height =
        SEGMENTED_SCALE.primary /* --nm-segmented-sz-height 是主几何量，已提到 primaryVar */
      // 锚点值只从引擎取一次，测试里不再抄第二份数字
      expect([height.sm, height.md, height.lg]).toEqual([26, 32, 38])
      const anchors = [
        [height.sm, 'small'],
        [height.md, 'medium'],
        [height.lg, 'large'],
      ] as const
      for (const [px, tier] of anchors) {
        const byNumber = mount(NeumorphismSegmented, { props: { options: OPTIONS, size: px } })
        expect(byNumber.attributes('style')).toContain(`--nm-segmented-sz-height: ${px}px`)

        const byTier = mount(NeumorphismSegmented, { props: { options: OPTIONS, size: tier } })
        expect(byTier.classes()).toContain(`nm-segmented--${tier}`)
        // 档位路径不写内联变量：两条通道互不干扰
        expect(byTier.attributes('style')).toBeUndefined()
      }
    })

    it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 32', () => {
      for (const bad of [0, -12, Number.NaN]) {
        const wrapper = mount(NeumorphismSegmented, { props: { options: OPTIONS, size: bad } })
        expect(wrapper.attributes('style')).toContain('--nm-segmented-sz-height: 32px')
        // 回落后仍走数字通道，不会掉回档位类
        expect(wrapper.classes()).toContain('nm-segmented--sized')
      }
    })
  })
})
