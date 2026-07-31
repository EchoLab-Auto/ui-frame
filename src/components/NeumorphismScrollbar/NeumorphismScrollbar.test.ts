import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismScrollbar from './NeumorphismScrollbar.vue'

describe('NeumorphismScrollbar', () => {
  it('renders without error when target is empty (no-op)', () => {
    const wrapper = mount(NeumorphismScrollbar)
    expect(wrapper.exists()).toBe(true)
  })

  it('applies CSS class variant to the target element', () => {
    document.body.innerHTML = '<div id="sb-target"></div>'
    const wrapper = mount(NeumorphismScrollbar, {
      props: { variant: 'primary', target: '#sb-target' },
    })
    const el = document.querySelector('#sb-target')!
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(true)
    wrapper.unmount()
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(false)
  })

  it('dots variant builds overlay wrapper inside target', () => {
    document.body.innerHTML = '<div id="sb-dots"></div>'
    mount(NeumorphismScrollbar, {
      props: { variant: 'dots', target: '#sb-dots' },
    })
    const el = document.querySelector('#sb-dots')!
    expect(el.children.length).toBeGreaterThan(0)
  })
})
