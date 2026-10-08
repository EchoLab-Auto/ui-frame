import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismMenu from './NeumorphismMenu.vue'

const items = [
  { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }] },
  { key: 'edit', label: 'Edit' },
]

describe('NeumorphismMenu', () => {
  // 水平模式的子菜单 teleport 到 body（真实 teleport），逐个卸载再清 DOM 防残留
  const mountedWrappers: Array<{ unmount: () => void }> = []

  afterEach(() => {
    while (mountedWrappers.length) mountedWrappers.pop()!.unmount()
    document.body.innerHTML = ''
  })

  function mountMenu(props: Record<string, unknown> = {}) {
    const wrapper = mount(NeumorphismMenu, {
      props: { items, ...props },
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)
    return wrapper
  }

  it('renders menu items with menu role', () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain('File')
    expect(wrapper.find('.nm-menu__item').exists()).toBe(true)
  })

  it('teleports the horizontal submenu to document.body when expanded (not clipped by ancestors)', async () => {
    const wrapper = mountMenu({ mode: 'horizontal' })

    await wrapper.findAll('.nm-menu__item')[0].trigger('mouseenter')
    await nextTick()

    const submenu = document.body.querySelector<HTMLElement>('.nm-menu__submenu')
    expect(submenu).not.toBeNull()
    // 浮层挂在 body 上，不在 nav 子树内 → 祖先 overflow:hidden 无法裁剪
    expect(wrapper.element.contains(submenu!)).toBe(false)
    expect(submenu!.parentElement).toBe(document.body)
    expect(submenu!.className).toContain('nm-menu__submenu--floating')
    expect(submenu!.style.position).toBe('fixed')
    expect(submenu!.getAttribute('role')).toBe('menu')
  })

  it('keeps the vertical submenu inline (accordion model unchanged, no teleport)', async () => {
    const wrapper = mountMenu({ mode: 'vertical' })

    await wrapper.findAll('.nm-menu__item')[0].trigger('click')
    await nextTick()

    const submenu = wrapper.find('.nm-menu__submenu')
    expect(submenu.exists()).toBe(true)
    expect(submenu.classes()).toContain('nm-menu__submenu')
    // 内联渲染：不在 body 上、无 floating 类
    expect(document.body.querySelector('.nm-menu__submenu--floating')).toBeNull()
    expect(wrapper.element.contains(submenu.element)).toBe(true)
  })
})
