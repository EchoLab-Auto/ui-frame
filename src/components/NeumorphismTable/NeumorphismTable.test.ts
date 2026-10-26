import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTable from './NeumorphismTable.vue'

describe('NeumorphismTable — sort header keyboard accessibility', () => {
  const columns = [
    { key: 'name', label: '名称', sortable: true },
    { key: 'age', label: '年龄' },
  ]
  const data = [
    { name: 'b', age: 2 },
    { name: 'a', age: 1 },
  ]

  it('sortable header is focusable (tabindex=0) and exposes aria-sort', () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data } })
    const th = wrapper.findAll('.nm-table__th')[0]
    expect(th.attributes('tabindex')).toBe('0')
    expect(th.attributes('aria-sort')).toBe('none')
  })

  it('non-sortable header is not focusable and has no aria-sort', () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data } })
    const th = wrapper.findAll('.nm-table__th')[1]
    expect(th.attributes('tabindex')).toBeUndefined()
    expect(th.attributes('aria-sort')).toBeUndefined()
  })

  it('Enter on sortable header emits sort and updates aria-sort to ascending', async () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data } })
    const th = wrapper.findAll('.nm-table__th')[0]
    await th.trigger('keydown.enter')
    expect(wrapper.emitted('sort')?.[0]).toEqual(['name', 'ascend'])
    expect(th.attributes('aria-sort')).toBe('ascending')
  })

  it('Space on sortable header cycles to descending', async () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data } })
    const th = wrapper.findAll('.nm-table__th')[0]
    await th.trigger('keydown.space')
    await th.trigger('keydown.space')
    expect(wrapper.emitted('sort')?.[1]).toEqual(['name', 'descend'])
    expect(th.attributes('aria-sort')).toBe('descending')
  })

  it('marks selectable single rows clickable (cursor affordance class)', () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data, selectable: 'single' } })
    const rows = wrapper.findAll('.nm-table__tr')
    expect(rows[0].classes()).toContain('nm-table__tr--clickable')
  })

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const wrapper = mount(NeumorphismTable, { props: { columns, data, size: 10 } })
    expect(wrapper.classes()).toContain('nm-table--sized')
    expect(wrapper.classes().some(c => /^nm-table--(small|medium|large)$/.test(c))).toBe(false)
    // 10 落在 8(sm) 与 12(md) 之间：位置 0.5
    expect(wrapper.attributes('style')).toContain('--nm-table-sz-pad-y: 10px')
    expect(wrapper.attributes('style')).toContain('--nm-table-sz-pad-x: 14px')
    expect(wrapper.attributes('style')).toContain('--nm-table-sz-font: 13px')
  })

  it('数字 size 在锚点上与档位别名等价（同一组 px）', () => {
    // 锚点：small 8 / medium 12 / large 16（单元格上下内距）；medium 走基础规则，无独立 class
    const anchors = [
      [8, 'small'],
      [12, 'medium'],
      [16, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mount(NeumorphismTable, { props: { columns, data, size: px } })
      const byTier = mount(NeumorphismTable, { props: { columns, data, size: tier } })
      expect(byNumber.attributes('style')).toContain(`--nm-table-sz-pad-y: ${px}px`)
      expect(byTier.classes()).toContain(`nm-table--${tier}`)
      expect(byTier.classes()).not.toContain('nm-table--sized')
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 12', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const wrapper = mount(NeumorphismTable, { props: { columns, data, size: bad } })
      expect(wrapper.attributes('style')).toContain('--nm-table-sz-pad-y: 12px')
    }
  })
})
