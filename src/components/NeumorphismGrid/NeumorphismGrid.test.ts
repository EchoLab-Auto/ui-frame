import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismRow from './NeumorphismRow.vue'
import NeumorphismCol from './NeumorphismCol.vue'

describe('NeumorphismGrid (Row/Col)', () => {
  it('Row renders flex container with justify/align classes', () => {
    const wrapper = mount(NeumorphismRow, {
      props: { justify: 'center', align: 'start' },
      slots: { default: '<div />' },
    })
    expect(wrapper.classes()).toContain('nm-row')
    const el = wrapper.element as HTMLElement
    expect(el.style.justifyContent).toBe('center')
    expect(el.style.alignItems).toBe('flex-start')
  })

  it('Row applies gutter as negative margins', () => {
    const wrapper = mount(NeumorphismRow, {
      props: { gutter: 16 },
      slots: { default: '<div />' },
    })
    const el = wrapper.element as HTMLElement
    expect(el.style.marginLeft).toBe('-8px')
    expect(el.style.marginRight).toBe('-8px')
  })

  it('Col renders span class and gutter padding', () => {
    const wrapper = mount(NeumorphismCol, {
      props: { span: 12 },
      slots: { default: 'content' },
    })
    expect(wrapper.classes()).toContain('nm-col-12')
    expect(wrapper.text()).toBe('content')
  })

  it('Col offset class applies', () => {
    const wrapper = mount(NeumorphismCol, {
      props: { span: 8, offset: 4 },
      slots: { default: 'x' },
    })
    expect(wrapper.classes()).toContain('nm-col-8')
    expect(wrapper.classes()).toContain('nm-col-offset-4')
  })
})
