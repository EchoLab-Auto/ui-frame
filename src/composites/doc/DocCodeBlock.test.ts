import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DocCodeBlock from './DocCodeBlock.vue'

describe('DocCodeBlock', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('渲染语言标签、行数与行号', () => {
    const wrapper = mount(DocCodeBlock, {
      props: { code: 'const a = 1\nconst b = 2', lang: 'ts' },
    })
    expect(wrapper.find('.code-lang').text()).toBe('ts')
    expect(wrapper.find('.code-lines').text()).toBe('2 lines')
    expect(wrapper.findAll('.line-num')).toHaveLength(2)
  })

  it('关键字高亮为 token span；text/plain 不高亮', () => {
    const highlighted = mount(DocCodeBlock, { props: { code: 'const a = 1', lang: 'ts' } })
    expect(highlighted.find('.token-keyword').exists()).toBe(true)

    const plain = mount(DocCodeBlock, { props: { code: 'const a = 1', lang: 'text' } })
    expect(plain.find('.token-keyword').exists()).toBe(false)
  })

  it('showLineNumbers=false 隐藏行号列', () => {
    const wrapper = mount(DocCodeBlock, {
      props: { code: 'echo hi', lang: 'bash', showLineNumbers: false },
    })
    expect(wrapper.find('.line-numbers').exists()).toBe(false)
  })

  it('点击复制调用剪贴板并显示已复制', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DocCodeBlock, { props: { code: 'echo hi', lang: 'bash' } })
    const btn = wrapper.find('.code-copy-btn')
    expect(btn.text()).toBe('复制')

    await btn.trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.code-copy-btn').text()).toBe('已复制!'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('echo hi')

    vi.advanceTimersByTime(1500)
    await vi.waitFor(() => expect(wrapper.find('.code-copy-btn').text()).toBe('复制'))
    vi.useRealTimers()
  })
})
