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

  it('点击组件外部收起全部展开的子菜单（外点关闭）', async () => {
    const wrapper = mountMenu({ mode: 'vertical' })

    await wrapper.findAll('.nm-menu__item')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.nm-menu__submenu').exists()).toBe(true)

    // 外部点击（捕获阶段 pointerdown）→ 子菜单收起
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.nm-menu__submenu').exists()).toBe(false)
  })

  it('组件内部点击不触发收起（外点排除自身）', async () => {
    const wrapper = mountMenu({ mode: 'vertical' })

    await wrapper.findAll('.nm-menu__item')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.nm-menu__submenu').exists()).toBe(true)

    // 内部点击（点击第二项）→ 不触发外点关闭
    await wrapper.findAll('.nm-menu__item')[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.nm-menu__submenu').exists()).toBe(true)
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

  // ---- 数字 size（px 菜单项字号）----

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const root = mountMenu({ size: 12 }).find('.nm-menu')
    expect(root.classes()).toContain('nm-menu--sized')
    expect(root.classes().some(c => /^nm-menu--(small|medium|large)$/.test(c))).toBe(false)
    // 12 落在 11(sm) 与 14(md) 之间：位置 1/3
    const style = root.attributes('style')
    expect(style).toContain('--nm-menu-sz-font: 12px')
    expect(style).toContain('--nm-menu-sz-pad-x: 10.7px')
    expect(style).toContain('--nm-menu-sz-pad-y: 5.7px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [11, 'small'],
      [14, 'medium'],
      [15, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mountMenu({ size: px }).find('.nm-menu')
      expect(byNumber.attributes('style')).toContain(`--nm-menu-sz-font: ${px}px`)
      // 档位别名仍走原档位类，且不产生内联变量（两条路径不重叠）
      const byTier = mountMenu({ size: tier }).find('.nm-menu')
      expect(byTier.classes()).toContain(`nm-menu--${tier}`)
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 14', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const root = mountMenu({ size: bad }).find('.nm-menu')
      expect(root.attributes('style')).toContain('--nm-menu-sz-font: 14px')
    }
  })

  it('水平浮层子菜单也拿到尺寸变量（teleport 后不再继承根节点内联变量）', async () => {
    const wrapper = mountMenu({ mode: 'horizontal', size: 12 })

    await wrapper.findAll('.nm-menu__item')[0].trigger('mouseenter')
    await nextTick()

    const submenu = document.body.querySelector<HTMLElement>('.nm-menu__submenu')
    expect(submenu).not.toBeNull()
    expect(submenu!.className).toContain('nm-menu--sized')
    expect(submenu!.style.getPropertyValue('--nm-menu-sz-font')).toBe('12px')
  })
})
