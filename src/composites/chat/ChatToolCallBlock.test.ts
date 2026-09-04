import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatToolCallBlock from './ChatToolCallBlock.vue'

describe('ChatToolCallBlock', () => {
  it('渲染工具名与状态标签', () => {
    const wrapper = mount(ChatToolCallBlock, {
      props: { name: 'run_shell', status: 'succeeded' },
    })
    expect(wrapper.text()).toContain('run_shell')
    expect(wrapper.text()).toContain('成功')
  })

  it('running 状态渲染 spinner 与"运行中"', () => {
    const wrapper = mount(ChatToolCallBlock, {
      props: { name: 'read_file', status: 'running' },
    })
    expect(wrapper.find('.nm-spinner').exists()).toBe(true)
    expect(wrapper.text()).toContain('运行中')
  })

  it('详情默认折叠，点击触发器展开参数与输出', async () => {
    const wrapper = mount(ChatToolCallBlock, {
      props: { name: 'grep', input: 'pattern=foo', output: 'bar', status: 'succeeded' },
    })
    expect(wrapper.find('.nm-chat-tool__pre').exists()).toBe(false)
    expect(wrapper.text()).toContain('详情 14 字符')

    await wrapper.find('.nm-chat-fold__trigger').trigger('click')
    const pres = wrapper.findAll('.nm-chat-tool__pre')
    expect(pres).toHaveLength(2)
    expect(pres[0].text()).toBe('pattern=foo')
    expect(pres[1].text()).toBe('bar')
    expect(wrapper.text()).toContain('收起详情')
  })

  it('复制按钮在触发器之外（actions 区）', () => {
    const wrapper = mount(ChatToolCallBlock, {
      props: { name: 'grep', output: 'bar' },
    })
    const copy = wrapper.find('.nm-chat-copy')
    expect(copy.exists()).toBe(true)
    expect(copy.element.closest('.nm-chat-fold__trigger')).toBeNull()
  })

  it('无参数输出时头部为静态行（无触发器）', () => {
    const wrapper = mount(ChatToolCallBlock, { props: { name: 'noop' } })
    expect(wrapper.find('.nm-chat-fold__trigger').exists()).toBe(false)
    expect(wrapper.find('.nm-chat-fold__head-static').exists()).toBe(true)
  })
})
