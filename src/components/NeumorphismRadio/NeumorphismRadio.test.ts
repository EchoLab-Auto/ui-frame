import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismRadio from './NeumorphismRadio.vue'
import NeumorphismRadioGroup from './NeumorphismRadioGroup.vue'
import { RADIO_SCALE } from '@/utils/controlScales'

describe('NeumorphismRadio · size', () => {
  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    // 20 落在锚点 18(sm) 与 24(md) 之间：值就是「圆点直径」px，不做倍率换算
    const wrapper = mount(NeumorphismRadio, { props: { value: 'a', size: 20 } })
    expect(wrapper.classes()).toContain('nm-radio--sized')
    // 数字与档位类互斥：同时存在就变成「两套声明比顺序」
    expect(wrapper.classes().some(c => /^nm-radio--(small|medium|large)$/.test(c))).toBe(false)
    expect(wrapper.attributes('style')).toContain('--nm-radio-sz-box: 20px')
  })

  it('数字 size 在锚点上与档位别名一致（18 / 24 / 30）', () => {
    const box = RADIO_SCALE.primary /* --nm-radio-sz-box 是主几何量，已提到 primaryVar */
    // 锚点值只从引擎取一次，测试里不再抄第二份数字
    expect([box.sm, box.md, box.lg]).toEqual([18, 24, 30])
    const anchors = [
      [box.sm, 'small'],
      [box.md, 'medium'],
      [box.lg, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismRadio, { props: { value: 'a', size: px } })
      expect(byNumber.attributes('style')).toContain(`--nm-radio-sz-box: ${px}px`)

      const byTier = mount(NeumorphismRadio, { props: { value: 'a', size: tier } })
      expect(byTier.classes()).toContain(`nm-radio--${tier}`)
      // 档位路径不写内联变量：两条通道互不干扰
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 24', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismRadio, { props: { value: 'a', size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-radio-sz-box: 24px')
      // 回落后仍走数字通道，不会掉回档位类
      expect(wrapper.classes()).toContain('nm-radio--sized')
    }
  })

  it('RadioGroup 的数字 size 级联给子 Radio（数字必须能透传）', () => {
    const wrapper = mount({
      components: { NeumorphismRadioGroup, NeumorphismRadio },
      template: `
        <NeumorphismRadioGroup :size="20">
          <NeumorphismRadio value="a" label="A" />
          <NeumorphismRadio value="b" label="B" size="large" />
        </NeumorphismRadioGroup>
      `,
    })
    const radios = wrapper.findAll('.nm-radio')
    expect(radios).toHaveLength(2)
    for (const radio of radios) {
      // Group 的 size 覆盖子项自身档位：两条都落到数字通道
      expect(radio.classes()).toContain('nm-radio--sized')
      expect(radio.classes()).not.toContain('nm-radio--large')
      expect(radio.attributes('style')).toContain('--nm-radio-sz-box: 20px')
    }
  })
})
