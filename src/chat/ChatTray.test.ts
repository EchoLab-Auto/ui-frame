import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import ChatTray from './ChatTray.vue'

/** 给渲染出的滚动容器补上可控尺寸（happy-dom 全为 0） */
function mockScrollGeometry(wrapper: ReturnType<typeof mount>, scrollTop: number) {
  const el = wrapper.find('.nm-chat-tray__scroll').element as HTMLElement
  Object.defineProperties(el, {
    scrollHeight: { value: 1000, configurable: true },
    clientHeight: { value: 200, configurable: true },
    scrollTop: { value: scrollTop, configurable: true, writable: true },
  })
  el.scrollTo = vi.fn()
  return el
}

describe('ChatTray', () => {
  it('渲染默认插槽内容', () => {
    const wrapper = mount(ChatTray, { slots: { default: '<p class="m">消息</p>' } })
    expect(wrapper.find('.m').exists()).toBe(true)
    expect(wrapper.find('.nm-chat-tray__scroll').attributes('role')).toBe('log')
  })

  it('挂载时瞬时吸底', () => {
    const wrapper = mount(ChatTray, { slots: { default: '<p>x</p>' } })
    const el = mockScrollGeometry(wrapper, 0)
    // onMounted 的 nextTick 后调用 scrollTo('auto')
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
      expect(el.scrollTo).toHaveBeenCalled()
    })
  })

  it('离开底部时显示"回到底部"按钮，点击后吸底', async () => {
    const wrapper = mount(ChatTray, { slots: { default: '<p>x</p>' } })
    // 等 onMounted 的初始吸底完成，避免与后续 scroll 评估竞争
    await new Promise(resolve => setTimeout(resolve, 0))
    const el = mockScrollGeometry(wrapper, 0)
    await wrapper.find('.nm-chat-tray__scroll').trigger('scroll')

    const jump = wrapper.find('.nm-chat-tray__jump')
    expect(jump.exists()).toBe(true)
    await jump.trigger('click')
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' })
  })

  it('贴底时不显示跳转按钮', async () => {
    const wrapper = mount(ChatTray, { slots: { default: '<p>x</p>' } })
    await new Promise(resolve => setTimeout(resolve, 0))
    mockScrollGeometry(wrapper, 900)
    await wrapper.find('.nm-chat-tray__scroll').trigger('scroll')
    expect(wrapper.find('.nm-chat-tray__jump').exists()).toBe(false)
  })

  it('watchSource 变化且贴底时自动跟随', async () => {
    const count = ref(1)
    const wrapper = mount(ChatTray, {
      props: { watchSource: () => count.value },
      slots: { default: '<p>x</p>' },
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    const el = mockScrollGeometry(wrapper, 810)
    await wrapper.find('.nm-chat-tray__scroll').trigger('scroll')

    count.value = 2
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    expect(el.scrollTo).toHaveBeenCalled()
  })

  it('暴露 scrollToBottom / recheck 给宿主', () => {
    const wrapper = mount(ChatTray, { slots: { default: '<p>x</p>' } })
    const el = mockScrollGeometry(wrapper, 0)
    const vm = wrapper.vm as unknown as { scrollToBottom: (b?: ScrollBehavior) => void }
    vm.scrollToBottom('auto')
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'auto' })
  })
})
