import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComposer from './ChatComposer.vue'

function mountInput(props: Record<string, unknown> = {}) {
  return mount(ChatComposer, { props: { modelValue: '', ...props } })
}

/** 触发内部 textarea 的 keydown（NeumorphismTextarea 向上透传） */
async function triggerKeydown(wrapper: ReturnType<typeof mountInput>, init: KeyboardEventInit) {
  const textarea = wrapper.find('textarea')
  await textarea.trigger('keydown', init)
}

describe('ChatComposer', () => {
  it('Enter 发送 trim 后的内容并清空', async () => {
    const wrapper = mountInput({ modelValue: '  你好  ' })
    await triggerKeydown(wrapper, { key: 'Enter' })
    expect(wrapper.emitted('send')?.[0]).toEqual(['你好'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('Shift+Enter 与 IME 组合中的 Enter 不发送', async () => {
    const wrapper = mountInput({ modelValue: 'hello' })
    await triggerKeydown(wrapper, { key: 'Enter', shiftKey: true })
    await triggerKeydown(wrapper, { key: 'Enter', isComposing: true })
    await triggerKeydown(wrapper, { key: 'Process' })
    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('空内容与禁用态下发送按钮不可用', async () => {
    const empty = mountInput({ modelValue: '   ' })
    const sendButton = empty.find('.nm-chat-composer__send')
    expect(sendButton.attributes('disabled')).toBeDefined()

    const disabled = mountInput({ modelValue: 'hi', disabled: true })
    await triggerKeydown(disabled, { key: 'Enter' })
    expect(disabled.emitted('send')).toBeUndefined()
  })

  it('cancelable 时渲染取消按钮并发出 cancel', async () => {
    const wrapper = mountInput({ cancelable: true })
    const cancel = wrapper.findAll('button').find(b => b.text() === '取消任务')
    expect(cancel).toBeDefined()
    await cancel!.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('meta 插槽渲染会话信息', () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: '' },
      slots: { meta: '<span class="session">local:tui::local_user</span>' },
    })
    expect(wrapper.find('.session').exists()).toBe(true)
  })

  it('actions 插槽可替换默认发送按钮并拿到 submit/canSubmit', async () => {
    const wrapper = mount(ChatComposer, {
      props: { modelValue: 'hello' },
      slots: {
        actions:
          '<template #actions="{ submit, canSubmit }"><button class="custom-send" :disabled="!canSubmit" @click="submit">发出</button></template>',
      },
    })
    expect(wrapper.find('.nm-chat-composer__send').exists()).toBe(false)
    const custom = wrapper.find('.custom-send')
    expect(custom.exists()).toBe(true)
    await custom.trigger('click')
    expect(wrapper.emitted('send')?.[0]).toEqual(['hello'])
  })
})
