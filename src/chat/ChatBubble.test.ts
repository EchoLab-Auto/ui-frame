import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatBubble from './ChatBubble.vue'

describe('ChatBubble', () => {
  it('默认 start 对齐 + default 色调', () => {
    const wrapper = mount(ChatBubble, { slots: { default: '内容' } })
    expect(wrapper.classes()).toContain('nm-chat-bubble--start')
    expect(wrapper.classes()).toContain('nm-chat-bubble--default')
    expect(wrapper.text()).toContain('内容')
  })

  it('align 与 tone 正交组合', () => {
    const wrapper = mount(ChatBubble, {
      props: { align: 'end', tone: 'primary' },
      slots: { default: '用户消息' },
    })
    expect(wrapper.classes()).toContain('nm-chat-bubble--end')
    expect(wrapper.classes()).toContain('nm-chat-bubble--primary')
  })

  it('plain + center 渲染系统消息细线样式（无气泡）', () => {
    const wrapper = mount(ChatBubble, {
      props: { align: 'center', tone: 'plain' },
      slots: { default: '系统提示' },
    })
    expect(wrapper.classes()).toContain('nm-chat-bubble--plain')
    expect(wrapper.classes()).toContain('nm-chat-bubble--center')
  })

  it('copyText 传入时渲染复制按钮，未传入不渲染', () => {
    const withCopy = mount(ChatBubble, {
      props: { copyText: 'hello' },
      slots: { default: 'hello' },
    })
    expect(withCopy.find('.nm-chat-copy').exists()).toBe(true)

    const withoutCopy = mount(ChatBubble, { slots: { default: 'hi' } })
    expect(withoutCopy.find('.nm-chat-copy').exists()).toBe(false)
  })

  it('head 插槽渲染在气泡头部', () => {
    const wrapper = mount(ChatBubble, {
      slots: {
        head: '<span class="who">Agent</span>',
        default: '正文',
      },
    })
    const head = wrapper.find('.nm-chat-bubble__head')
    expect(head.exists()).toBe(true)
    expect(head.find('.who').text()).toBe('Agent')
  })

  it('无 head 插槽且无 copyText 时不渲染头部', () => {
    const wrapper = mount(ChatBubble, { slots: { default: '仅正文' } })
    expect(wrapper.find('.nm-chat-bubble__head').exists()).toBe(false)
  })
})
