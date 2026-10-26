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

  it('点击组件外部收起展开的子菜单（外点关闭）', async () => {
    const wrapper = mount(NeumorphismNavMenu, {
      props: { items, mode: 'vertical' },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)

    await wrapper.findAll('.nm-nav-menu__item')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.nm-nav-menu__submenu').exists()).toBe(true)

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.nm-nav-menu__submenu').exists()).toBe(false)
  })

  // ---- 数字 size（px 导航项字号）----

  /** 尺寸断言只需要最简一个叶子项（vertical 模式不产生 Popover 浮层） */
  function mountPlain(props: Record<string, unknown> = {}) {
    const wrapper = mount(NeumorphismNavMenu, {
      props: { items: [{ key: 'docs', label: 'Docs' }], mode: 'vertical', ...props },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)
    return wrapper
  }

  it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
    const root = mountPlain({ size: 12 }).find('.nm-nav-menu')
    expect(root.classes()).toContain('nm-nav-menu--sized')
    expect(root.classes().some(c => /^nm-nav-menu--(small|medium|large)$/.test(c))).toBe(false)
    // 12 落在 11(sm) 与 14(md) 之间：位置 1/3
    const style = root.attributes('style')
    expect(style).toContain('--nm-nav-sz-font: 12px')
    expect(style).toContain('--nm-nav-sz-pad-x: 10.7px')
    expect(style).toContain('--nm-nav-sz-pad-y: 6.7px')
    // 指示条高度两锚点同为 2px，中间值也应是 2px（不被无意义地放大）
    expect(style).toContain('--nm-nav-sz-indicator: 2px')
  })

  it('数字 size 在锚点上与档位别名逐像素一致', () => {
    const anchors = [
      [11, 'small'],
      [14, 'medium'],
      [15, 'large'],
    ] as const
    for (const [px, tier] of anchors) {
      const byNumber = mountPlain({ size: px }).find('.nm-nav-menu')
      expect(byNumber.attributes('style')).toContain(`--nm-nav-sz-font: ${px}px`)
      const byTier = mountPlain({ size: tier }).find('.nm-nav-menu')
      expect(byTier.classes()).toContain(`nm-nav-menu--${tier}`)
      expect(byTier.attributes('style')).toBeUndefined()
    }
  })

  it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 14', () => {
    for (const bad of [0, -12, Number.NaN]) {
      const root = mountPlain({ size: bad }).find('.nm-nav-menu')
      expect(root.attributes('style')).toContain('--nm-nav-sz-font: 14px')
    }
  })
})
