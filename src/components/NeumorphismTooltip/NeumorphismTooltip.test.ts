import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, type VNode } from 'vue'
import NeumorphismTooltip from './NeumorphismTooltip.vue'

describe('NeumorphismTooltip', () => {
  const mountedWrappers: Array<{ unmount: () => void }> = []

  function mountTooltip(
    props: Record<string, unknown> = {},
    slots?: Record<string, string | ((slotProps: { contentId: string }) => VNode)>,
    attachTo: HTMLElement = document.body
  ) {
    const wrapper = mount(NeumorphismTooltip, {
      props: { delay: 0, ...props },
      slots: slots ?? { default: '<button>Hover</button>' },
      global: {
        // 真实 teleport（浮层必须真的挂到 body，否则本文件断言失去意义）；
        // 真实 transition —— 否则 VTU 的 transition-stub 会在 body 与浮层间插一层节点
        stubs: { teleport: false, transition: false },
      },
      attachTo,
    })
    return wrapper
  }

  afterEach(() => {
    while (mountedWrappers.length) mountedWrappers.pop()!.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renders trigger slot content', () => {
    const wrapper = mountTooltip()
    expect(wrapper.find('button').text()).toContain('Hover')
  })

  it('teleports the tooltip content to document.body when shown', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ content: 'Copied!' })

    expect(document.body.querySelector('.nm-tooltip')).toBeNull()

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1)
    await nextTick()

    const tooltip = document.body.querySelector<HTMLElement>('.nm-tooltip')
    expect(tooltip).not.toBeNull()
    // teleport 的目标是 body —— 内容不再是 wrapper 的子节点
    expect(tooltip!.parentElement).toBe(document.body)
    expect(wrapper.element.contains(tooltip!)).toBe(false)
    expect(wrapper.find('.nm-tooltip').exists()).toBe(false)
    expect(tooltip!.textContent).toContain('Copied!')
  })

  it('escapes an overflow:hidden ancestor (not clipped by the wrapper subtree)', async () => {
    vi.useFakeTimers()
    // 模拟被 overflow:hidden 祖先包裹的真实场景
    const overflowHost = document.createElement('div')
    overflowHost.style.overflow = 'hidden'
    overflowHost.style.width = '120px'
    overflowHost.style.height = '24px'
    document.body.appendChild(overflowHost)

    const wrapper = mountTooltip({ content: 'Out of the box' }, undefined, overflowHost)
    expect(overflowHost.querySelector('button')).not.toBeNull()

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1)
    await nextTick()

    // 内容不在裁剪容器内，而在 body 上 —— 不会被 overflow:hidden 裁掉
    expect(overflowHost.querySelector('.nm-tooltip')).toBeNull()
    const tooltip = document.body.querySelector<HTMLElement>('.nm-tooltip')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.parentElement).toBe(document.body)
  })

  it('uses fixed viewport positioning and keeps a z-index', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip({ content: 'Positioned' })

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1)
    await nextTick()

    const tooltip = document.body.querySelector<HTMLElement>('.nm-tooltip')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.style.position).toBe('fixed')
    expect(tooltip!.style.zIndex).not.toBe('')
    // 方位类仍由 actualPlacement 驱动（happy-dom 无布局 → 方向可能被翻转）
    expect(tooltip!.className).toMatch(/nm-tooltip--(top|bottom|left|right)/)
  })

  it('keeps the aria-describedby wiring via the content-id slot prop', async () => {
    vi.useFakeTimers()
    const wrapper = mountTooltip(
      { content: 'Copy' },
      {
        default: (slotProps: { contentId: string }) =>
          h('button', { 'aria-describedby': slotProps.contentId }, 'Copy'),
      }
    )

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1)
    await nextTick()

    const describedBy = wrapper.find('button').attributes('aria-describedby')
    expect(describedBy).toBeTruthy()

    const tooltip = document.body.querySelector<HTMLElement>('.nm-tooltip')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.id).toBe(describedBy)
    expect(tooltip!.getAttribute('role')).toBe('tooltip')
    expect(tooltip!.getAttribute('aria-hidden')).toBe('false')
  })

  it('hides the teleported content after the pointer leaves', async () => {
    vi.useFakeTimers()
    // transition 用 VTU 默认 stub：v-if 切换即刻移除节点，便于断言浮层已消失
    const wrapper = mount(NeumorphismTooltip, {
      props: { content: 'Bye', delay: 0 },
      slots: { default: '<button>Hover</button>' },
      global: { stubs: { teleport: false } },
      attachTo: document.body,
    })
    mountedWrappers.push(wrapper)

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(document.body.querySelector('.nm-tooltip')).not.toBeNull()

    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(document.body.querySelector('.nm-tooltip')).toBeNull()
  })
})
