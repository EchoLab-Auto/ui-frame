import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismLayout from './NeumorphismLayout.vue'

describe('NeumorphismLayout', () => {
  it('renders header/sider/content slots', () => {
    const wrapper = mount(NeumorphismLayout, {
      props: { showSider: true },
      slots: {
        'header-left': '<div class="hdr">H</div>',
        sider: '<div class="sdr">S</div>',
        default: '<div class="cnt">C</div>',
      },
    })
    expect(wrapper.find('.hdr').exists()).toBe(true)
    expect(wrapper.find('.sdr').exists()).toBe(true)
    expect(wrapper.find('.cnt').exists()).toBe(true)
  })

  it('collapsible shows toggle and emits collapse event', async () => {
    const wrapper = mount(NeumorphismLayout, {
      props: { showSider: true, collapsible: true },
      slots: { sider: '<div>S</div>', default: '<div>C</div>' },
    })
    const toggle = wrapper.find('.nm-layout__collapse-btn')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    expect(wrapper.emitted('collapse')?.[0]).toEqual([true])
  })

  it('hides sider when showSider=false', () => {
    const wrapper = mount(NeumorphismLayout, {
      props: { showSider: false },
      slots: { sider: '<div class="sdr">S</div>', default: '<div>C</div>' },
    })
    expect(wrapper.find('.sdr').exists()).toBe(false)
  })
})
