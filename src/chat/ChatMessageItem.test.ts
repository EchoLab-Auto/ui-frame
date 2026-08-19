import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatMessageItem from './ChatMessageItem.vue'
import type { ChatMessage } from './types'

const base: ChatMessage = {
  id: 'm1',
  role: 'user',
  content: '你好',
  time: 1700000000,
}

describe('ChatMessageItem', () => {
  it('用户消息：居右主色气泡 + aria 角色 + 纯文本内容', () => {
    const wrapper = mount(ChatMessageItem, { props: { message: base } })
    expect(wrapper.classes()).toContain('nm-chat-bubble--end')
    expect(wrapper.classes()).toContain('nm-chat-bubble--primary')
    expect(wrapper.attributes('aria-label')).toBe('用户')
    expect(wrapper.text()).toContain('你好')
    // 用户消息不走 Markdown 渲染
    expect(wrapper.find('.neumorphism-markdown').exists()).toBe(false)
  })

  it('agent 消息：居左中性气泡，默认按 Markdown 渲染', () => {
    const wrapper = mount(ChatMessageItem, {
      props: { message: { ...base, role: 'agent', content: '**加粗**' } },
    })
    expect(wrapper.classes()).toContain('nm-chat-bubble--start')
    expect(wrapper.find('.neumorphism-markdown').exists()).toBe(true)
    expect(wrapper.find('strong').exists()).toBe(true)
  })

  it('markdown=false 时 agent 消息退化为纯文本', () => {
    const wrapper = mount(ChatMessageItem, {
      props: { message: { ...base, role: 'agent', content: '**加粗**' }, markdown: false },
    })
    expect(wrapper.find('.neumorphism-markdown').exists()).toBe(false)
    expect(wrapper.text()).toContain('**加粗**')
  })

  it('系统消息：居中平铺细线样式', () => {
    const wrapper = mount(ChatMessageItem, {
      props: { message: { ...base, role: 'system', content: '已清空历史' } },
    })
    expect(wrapper.classes()).toContain('nm-chat-bubble--center')
    expect(wrapper.classes()).toContain('nm-chat-bubble--plain')
    expect(wrapper.text()).toContain('已清空历史')
  })

  it('tool 角色分发到工具调用块', () => {
    const wrapper = mount(ChatMessageItem, {
      props: {
        message: {
          ...base,
          role: 'tool',
          content: 'grep',
          tool: { name: 'grep', input: 'a', output: 'b', status: 'succeeded' },
        },
      },
    })
    expect(wrapper.find('.nm-chat-tool').exists()).toBe(true)
    expect(wrapper.find('.nm-chat-bubble').exists()).toBe(false)
  })

  it('branch 角色分发到分支合并块', () => {
    const wrapper = mount(ChatMessageItem, {
      props: {
        message: {
          ...base,
          role: 'branch',
          content: '',
          branch: { branchId: 'abcdef123456', summary: '分支完成', entries: [] },
        },
      },
    })
    expect(wrapper.find('.nm-chat-branch').exists()).toBe(true)
    expect(wrapper.text()).toContain('分支合并')
    expect(wrapper.text()).toContain('abcdef12')
  })

  it('带 reasoning 时渲染推理折叠块', () => {
    const wrapper = mount(ChatMessageItem, {
      props: { message: { ...base, role: 'agent', reasoning: ['第一步', '第二步'] } },
    })
    expect(wrapper.find('.nm-chat-reasoning').exists()).toBe(true)
    expect(wrapper.text()).toContain('推理过程（2 段）')
  })

  it('来源信息拼接适配器与用户名', () => {
    const wrapper = mount(ChatMessageItem, {
      props: {
        message: {
          ...base,
          source: { adapterName: 'qq', channel: 'group_1', groupName: '前端群', userName: '小明' },
        },
      },
    })
    expect(wrapper.text()).toContain('qq')
    expect(wrapper.text()).toContain('群 前端群')
    expect(wrapper.text()).toContain('小明')
  })
})
