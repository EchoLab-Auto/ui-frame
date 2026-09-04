import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatFold from './ChatFold.vue'

describe('ChatFold', () => {
  it('默认折叠，点击触发器展开并发出事件', async () => {
    const wrapper = mount(ChatFold, {
      slots: {
        head: '<span class="h">标题</span>',
        default: '<p class="b">内容</p>',
      },
    })
    const body = () => wrapper.find('.nm-chat-fold__body')
    expect(body().exists()).toBe(false)

    const trigger = wrapper.find('.nm-chat-fold__trigger')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')

    expect(body().exists()).toBe(true)
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    expect(wrapper.emitted('toggle')?.[0]).toEqual([true])
    expect(wrapper.find('.nm-chat-fold__trigger').attributes('aria-expanded')).toBe('true')
  })

  it('defaultOpen 初始展开', () => {
    const wrapper = mount(ChatFold, {
      props: { defaultOpen: true },
      slots: { default: '<p>内容</p>' },
    })
    expect(wrapper.find('.nm-chat-fold__body').exists()).toBe(true)
  })

  it('受控模式：open 由外部持有，点击只发事件不改内部状态', async () => {
    const wrapper = mount(ChatFold, {
      props: { open: false },
      slots: { default: '<p>内容</p>' },
    })
    await wrapper.find('.nm-chat-fold__trigger').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    // 外部未更新 prop，仍保持折叠
    expect(wrapper.find('.nm-chat-fold__body').exists()).toBe(false)
  })

  it('head 插槽拿到 open 作用域', async () => {
    const wrapper = mount(ChatFold, {
      slots: {
        head: '<template #head="{ open }"><span class="state">{{ open ? "开" : "关" }}</span></template>',
        default: '<p>内容</p>',
      },
    })
    expect(wrapper.find('.state').text()).toBe('关')
    await wrapper.find('.nm-chat-fold__trigger').trigger('click')
    expect(wrapper.find('.state').text()).toBe('开')
  })

  it('expandable=false 时无触发器、头部静态、无折叠体', async () => {
    const wrapper = mount(ChatFold, {
      props: { expandable: false },
      slots: { head: '<span>静态头</span>' },
    })
    expect(wrapper.find('.nm-chat-fold__trigger').exists()).toBe(false)
    expect(wrapper.find('.nm-chat-fold__head-static').exists()).toBe(true)
    expect(wrapper.find('.nm-chat-fold__body').exists()).toBe(false)
  })

  it('actions 插槽内容在触发按钮之外（可放独立交互元素）', () => {
    const wrapper = mount(ChatFold, {
      slots: {
        head: '<span>标题</span>',
        actions: '<button class="act">动作</button>',
        default: '<p>内容</p>',
      },
    })
    const action = wrapper.find('.act')
    expect(action.exists()).toBe(true)
    // 不在 trigger 按钮内（避免按钮套按钮）
    expect(action.element.closest('.nm-chat-fold__trigger')).toBeNull()
  })

  it('subhead 插槽始终可见（不受折叠影响）', async () => {
    const wrapper = mount(ChatFold, {
      slots: {
        head: '<span>标题</span>',
        subhead: '<p class="sub">摘要</p>',
        default: '<p>详情</p>',
      },
    })
    expect(wrapper.find('.sub').exists()).toBe(true)
    expect(wrapper.find('.nm-chat-fold__body').exists()).toBe(false)
  })

  it('sunk/raised 修饰类互斥', () => {
    const sunk = mount(ChatFold)
    expect(sunk.classes()).toContain('nm-chat-fold--sunk')
    const raised = mount(ChatFold, { props: { sunk: false } })
    expect(raised.classes()).toContain('nm-chat-fold--raised')
  })
})
