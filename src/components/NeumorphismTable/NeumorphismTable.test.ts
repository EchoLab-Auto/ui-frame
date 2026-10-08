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
})
