import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismTextarea from './NeumorphismTextarea.vue'

describe('NeumorphismTextarea', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismTextarea)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()
    expect(textarea.attributes('rows')).toBe('4')
  })

  it('should bind modelValue', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { modelValue: 'hello' } })
    expect(wrapper.find('textarea').element.value).toBe('hello')
  })

  it('should emit update:modelValue on input', async () => {
    const wrapper = mount(NeumorphismTextarea)
    await wrapper.find('textarea').setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new value'])
  })

  it('should set placeholder', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { placeholder: 'Enter text' } })
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Enter text')
  })

  it('should apply disabled state', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { disabled: true } })
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.nm-textarea').classes()).toContain('nm-textarea--disabled')
  })

  it('should apply readonly state', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { readonly: true } })
    expect(wrapper.find('textarea').attributes('readonly')).toBeDefined()
    expect(wrapper.find('.nm-textarea').classes()).toContain('nm-textarea--readonly')
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismTextarea, { props: { size } })
      expect(wrapper.find('.nm-textarea').classes()).toContain(`nm-textarea--${size}`)
    }
  })

  it('should display label', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { label: 'Description' } })
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.find('.nm-textarea').classes()).toContain('nm-textarea--has-label')
  })

  it('should apply error state', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { error: 'Required' } })
    expect(wrapper.find('.nm-textarea').classes()).toContain('nm-textarea--error')
    expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Required')
  })

  it('should set rows', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { rows: 8 } })
    expect(wrapper.find('textarea').attributes('rows')).toBe('8')
  })

  it('should set maxlength and minlength', () => {
    const wrapper = mount(NeumorphismTextarea, {
      props: { maxlength: 200, minlength: 10 },
    })
    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('maxlength')).toBe('200')
    expect(textarea.attributes('minlength')).toBe('10')
  })

  it('should set name', () => {
    const wrapper = mount(NeumorphismTextarea, { props: { name: 'description' } })
    expect(wrapper.find('textarea').attributes('name')).toBe('description')
  })

  it('should show character count when showCount is true', () => {
    const wrapper = mount(NeumorphismTextarea, {
      props: { modelValue: 'hello', maxlength: 100, showCount: true },
    })
    expect(wrapper.text()).toContain('5 / 100')
  })

  it('should emit focus event', async () => {
    const wrapper = mount(NeumorphismTextarea)
    await wrapper.find('textarea').trigger('focus')
    expect(wrapper.emitted('focus')).toBeDefined()
  })

  it('should emit blur event', async () => {
    const wrapper = mount(NeumorphismTextarea)
    await wrapper.find('textarea').trigger('blur')
    expect(wrapper.emitted('blur')).toBeDefined()
  })

  describe('auto-resize 高度测量（placeholder 隔离，2026-10 回归修复）', () => {
    /** 模拟 Chromium：折行 placeholder 会计入 scrollHeight（窄容器 + 长占位文本）。 */
    function stubPlaceholderInflatedScrollHeight(
      el: HTMLTextAreaElement,
      contentH: number,
      inflatedH: number
    ) {
      Object.defineProperty(el, 'scrollHeight', {
        configurable: true,
        get: () => (el.placeholder ? inflatedH : contentH),
      })
    }

    it('空内容 + 长 placeholder（折行）：高度按内容测量，不被 placeholder 撑高', async () => {
      const wrapper = mount(NeumorphismTextarea, {
        props: { autoResize: true, placeholder: '输入消息，Enter 发送（Shift+Enter 换行）' },
      })
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement
      // placeholder 折行 → scrollHeight 虚报 71px（2 行）；真实内容高度 46px
      stubPlaceholderInflatedScrollHeight(ta, 46, 71)
      await wrapper.find('textarea').trigger('input')
      expect(ta.style.height).toBe('46px')
      // placeholder 测量后恢复（不因测量被吞）
      expect(ta.placeholder).toBe('输入消息，Enter 发送（Shift+Enter 换行）')
    })

    it('有内容时：多行内容正常按 scrollHeight 撑高', async () => {
      const wrapper = mount(NeumorphismTextarea, {
        props: { autoResize: true, modelValue: '多行\n内容\n测试' },
      })
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement
      // 有内容时 placeholder 不渲染；高度应反映内容
      Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 92 })
      await wrapper.find('textarea').trigger('input')
      expect(ta.style.height).toBe('92px')
    })

    it('无 placeholder 时行为不变（回归保护）', async () => {
      const wrapper = mount(NeumorphismTextarea, { props: { autoResize: true } })
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement
      Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 60 })
      await wrapper.find('textarea').trigger('input')
      expect(ta.style.height).toBe('60px')
    })

    it('autoResize=false：不设置内联高度', async () => {
      const wrapper = mount(NeumorphismTextarea, { props: { autoResize: false, placeholder: 'x' } })
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement
      Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 200 })
      await wrapper.find('textarea').trigger('input')
      expect(ta.style.height).toBe('')
    })
  })
})
