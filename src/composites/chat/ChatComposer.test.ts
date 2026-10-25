import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  describe('玻璃拟态（复用共享 GlassVariant）', () => {
    it('默认不挂任何玻璃类', () => {
      const wrapper = mountInput()
      expect(wrapper.classes().some(c => c.startsWith('nm-chat-composer--glass'))).toBe(false)
    })

    it('glass: true 归一为 float 档', () => {
      const wrapper = mountInput({ glass: true })
      expect(wrapper.classes()).toContain('nm-chat-composer--glass')
      expect(wrapper.classes()).toContain('nm-chat-composer--glass-float')
      expect(wrapper.classes()).toContain('nm-chat-composer--glassed')
    })

    it('三档各自映射到独立修饰类且互斥', () => {
      for (const glass of ['float', 'raised', 'pressed'] as const) {
        const wrapper = mountInput({ glass })
        expect(wrapper.classes()).toContain('nm-chat-composer--glass')
        expect(wrapper.classes()).toContain(`nm-chat-composer--glass-${glass}`)
        const tiers = wrapper
          .classes()
          .filter(c => /^nm-chat-composer--glass-(float|raised|pressed)$/.test(c))
        expect(tiers).toHaveLength(1)
      }
    })

    it('非法档位来自外部配置时静默关闭（fail-safe）', () => {
      const wrapper = mountInput({ glass: 'frosted' as never })
      expect(wrapper.classes().some(c => c.startsWith('nm-chat-composer--glass'))).toBe(false)
    })

    it('玻璃与禁用态可以叠加（样式层负责收敛）', () => {
      const wrapper = mountInput({ glass: 'raised', disabled: true })
      expect(wrapper.classes()).toContain('nm-chat-composer--glass-raised')
      expect(wrapper.classes()).toContain('nm-chat-composer--disabled')
    })
  })

  describe('聚焦（选中）特效', () => {
    it('默认为 ring，且四档都有对称的类名落点', () => {
      expect(mountInput().classes()).toContain('nm-chat-composer--focus-ring')
      for (const effect of ['glow', 'inset', 'none'] as const) {
        expect(mountInput({ focusEffect: effect }).classes()).toContain(
          `nm-chat-composer--focus-${effect}`
        )
      }
    })

    it('非法特效值回落到 ring', () => {
      const wrapper = mountInput({ focusEffect: 'neon' as never })
      expect(wrapper.classes()).toContain('nm-chat-composer--focus-ring')
    })

    it('壳内聚焦时挂 --focused，失焦后移除', async () => {
      const wrapper = mountInput()
      expect(wrapper.classes()).not.toContain('nm-chat-composer--focused')
      await wrapper.trigger('focusin')
      expect(wrapper.classes()).toContain('nm-chat-composer--focused')
      await wrapper.trigger('focusout')
      expect(wrapper.classes()).not.toContain('nm-chat-composer--focused')
    })

    it('焦点在壳内元素之间转移时不丢失 --focused', async () => {
      const wrapper = mountInput({ cancelable: true })
      await wrapper.trigger('focusin')
      const inside = wrapper.find('.nm-chat-composer__send').element
      await wrapper.trigger('focusout', { relatedTarget: inside })
      expect(wrapper.classes()).toContain('nm-chat-composer--focused')

      // 焦点移出壳外（relatedTarget 为 null）才算失焦
      await wrapper.trigger('focusout', { relatedTarget: null })
      expect(wrapper.classes()).not.toContain('nm-chat-composer--focused')
    })

    it('glow 内辉光与玻璃档位可组合', async () => {
      const wrapper = mountInput({ glass: 'raised', focusEffect: 'glow' })
      await wrapper.trigger('focusin')
      const classes = wrapper.classes()
      expect(classes).toContain('nm-chat-composer--focus-glow')
      expect(classes).toContain('nm-chat-composer--focused')
      expect(classes).toContain('nm-chat-composer--glass-raised')
    })
  })

  // jsdom 不算伪元素样式，内辉光的机制只能对样式源码做契约检查。
  // 这条守住的是「光必须是加法光」这个结论 —— 一旦有人把它改回彩色 box-shadow，
  // 净亮度会重新掉到 ≈0（染色而非发光），这里必须先红。
  describe('glow 实现契约（样式源码）', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/composites/chat/ChatComposer.vue'),
      'utf8'
    )
    const glowSection = source.slice(
      source.indexOf('// ---------- glow'),
      source.indexOf('// ---------- inset')
    )

    it('光画在独立的 screen 混合层上（真正的加法）', () => {
      expect(glowSection).toContain('mix-blend-mode: screen')
      // 光层必须在槽背景之上、文字之下
      expect(glowSection).toContain('z-index: -1')
      expect(glowSection).toContain('isolation: isolate')
      expect(glowSection).toContain('pointer-events: none')
    })

    it('不再用 1px 实色描边 / 外环收边（硬边正是"不自然"的来源）', () => {
      expect(glowSection).not.toMatch(/inset 0 0 0 1px/)
      expect(glowSection).not.toMatch(/0 0 0 1px (?!\w*-)/)
    })

    it('亮/暗主题各自定义光色（亮色须白化才高于槽面亮度）', () => {
      expect(source).toContain('--nm-composer-glow-core')
      expect(source).toContain('--nm-composer-glow-core: var(--nm-primary-color)')
      expect(source).toMatch(/\[data-theme='dark'\] \.nm-chat-composer/)
    })
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
