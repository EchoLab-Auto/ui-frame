import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismPixelFont from './NeumorphismPixelFont.vue'

describe('NeumorphismPixelFont', () => {
  it('renders the given text', () => {
    const wrapper = mount(NeumorphismPixelFont, { props: { text: 'ASCII MOTION' } })
    expect(wrapper.find('.nm-pixel-font__text').text()).toBe('ASCII MOTION')
  })

  it('renders multi-line text verbatim', () => {
    const wrapper = mount(NeumorphismPixelFont, { props: { text: 'CODE\nMEETS\nMOVEMENT' } })
    // 文本节点原样保留 \n（white-space: pre 由样式保证）
    expect(wrapper.find('.nm-pixel-font__text').element.textContent).toContain('CODE\nMEETS')
  })

  it('applies default scale of 3 via CSS variable', () => {
    const wrapper = mount(NeumorphismPixelFont, { props: { text: 'A' } })
    expect(wrapper.attributes('style')).toContain('--nm-pixel-font-scale: 3')
  })

  it('applies custom scale', () => {
    const wrapper = mount(NeumorphismPixelFont, { props: { text: 'A', scale: 5 } })
    expect(wrapper.attributes('style')).toContain('--nm-pixel-font-scale: 5')
  })

  it('normalizes scale to an integer >= 1', () => {
    const fractional = mount(NeumorphismPixelFont, { props: { text: 'A', scale: 2.6 } })
    expect(fractional.attributes('style')).toContain('--nm-pixel-font-scale: 3')

    const tooSmall = mount(NeumorphismPixelFont, { props: { text: 'A', scale: 0 } })
    expect(tooSmall.attributes('style')).toContain('--nm-pixel-font-scale: 1')
  })

  it('hides the cursor by default and shows it when enabled', () => {
    const plain = mount(NeumorphismPixelFont, { props: { text: 'READY' } })
    expect(plain.find('.nm-pixel-font__cursor').exists()).toBe(false)

    const withCursor = mount(NeumorphismPixelFont, { props: { text: 'READY', cursor: true } })
    const cursor = withCursor.find('.nm-pixel-font__cursor')
    expect(cursor.exists()).toBe(true)
    expect(cursor.attributes('aria-hidden')).toBe('true')
  })

  it('maps align to modifier classes', () => {
    const left = mount(NeumorphismPixelFont, { props: { text: 'A' } })
    expect(left.classes()).toContain('nm-pixel-font--left')

    const center = mount(NeumorphismPixelFont, { props: { text: 'A', align: 'center' } })
    expect(center.classes()).toContain('nm-pixel-font--center')

    const right = mount(NeumorphismPixelFont, { props: { text: 'A', align: 'right' } })
    expect(right.classes()).toContain('nm-pixel-font--right')
  })

  it('exposes aria-label with img role only when provided', () => {
    const plain = mount(NeumorphismPixelFont, { props: { text: 'ASCII' } })
    expect(plain.attributes('aria-label')).toBeUndefined()
    expect(plain.attributes('role')).toBeUndefined()

    const labeled = mount(NeumorphismPixelFont, {
      props: { text: 'ASCII', ariaLabel: '像素标题' },
    })
    expect(labeled.attributes('aria-label')).toBe('像素标题')
    expect(labeled.attributes('role')).toBe('img')
  })
})
