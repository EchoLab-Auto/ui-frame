import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismNavMenu from './NeumorphismNavMenu.vue'

const items = [
  { key: 'products', label: 'Products', children: [{ key: 'ui', label: 'UI Kit' }] },
  { key: 'docs', label: 'Docs' },
]

describe('NeumorphismNavMenu', () => {
  // 水平模式的下拉经 NeumorphismPopover teleport 到 body（真实 teleport），逐个卸载再清 DOM
  const mountedWrappers: Array<{ unmount: () => void }> = []

  afterEach(() => {
    while (mountedWrappers.length) mountedWrappers.pop()!.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renders horizontal items', () => {
    const wrapper = mount(NeumorphismNavMenu, {
      props: { items, mode: 'horizontal' },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)
    expect(wrapper.text()).toContain('Products')
  })

  it('teleports the horizontal dropdown to document.body (not clipped by ancestors)', async () => {
    vi.useFakeTimers()
    const wrapper = mount(NeumorphismNavMenu, {
      props: { items, mode: 'horizontal' },
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)

    await wrapper.find('.nm-popover-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(200)
    await nextTick()

    const dropdown = document.body.querySelector<HTMLElement>('.nm-nav-menu__dropdown')
    expect(dropdown).not.toBeNull()
    // 下拉挂在 body 上，不在 nav 子树内 → 祖先 overflow:hidden 无法裁剪
    expect(wrapper.element.contains(dropdown!)).toBe(false)
    expect(dropdown!.closest('.nm-popover-wrapper')).toBeNull()
  })

  it('keeps the vertical submenu inline (no floating layer)', async () => {
    const wrapper = mount(NeumorphismNavMenu, {
      props: { items, mode: 'vertical' },
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)

    await wrapper.findAll('.nm-nav-menu__item')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.nm-nav-menu__submenu').exists()).toBe(true)
    expect(document.body.querySelector('.nm-nav-menu__dropdown')).toBeNull()
  })
})
