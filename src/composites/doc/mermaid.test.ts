import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import mermaid from 'mermaid'
import { MERMAID_STATE_ATTR, mermaidPlaceholder, renderMermaidDiagrams } from './mermaid'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg class="mermaid-unit-svg"></svg>' })),
  },
}))

const render = vi.mocked(mermaid.render)

function mountPlaceholder(source: string): { root: HTMLDivElement; diagram: Element } {
  const root = document.createElement('div')
  root.innerHTML = mermaidPlaceholder(source)
  document.body.appendChild(root)
  const diagram = root.querySelector('.mermaid-diagram')!
  return { root, diagram }
}

describe('Mermaid 延迟渲染管线', () => {
  beforeEach(() => {
    render.mockReset()
    render.mockResolvedValue({ svg: '<svg class="mermaid-unit-svg"></svg>' })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('占位保留转义源码，不把含箭头的图源复制进 data-* 属性', () => {
    const { root, diagram } = mountPlaceholder('flowchart LR\n  A["<开始>"] --> B')
    expect(diagram.getAttribute('data-mermaid')).toBeNull()
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('loading')
    expect(diagram.querySelector('pre code')?.textContent).toContain('A["<开始>"] --> B')
    expect(root.innerHTML).toContain('&lt;开始&gt;')
  })

  it('初始化 strict 安全模式，源码按 textContent 解码后渲染成 SVG', async () => {
    const { diagram } = mountPlaceholder('flowchart LR\n  A["宿主"] --> B["插件"]')

    await renderMermaidDiagrams(document.body)

    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ startOnLoad: false, securityLevel: 'strict' })
    )
    expect(render.mock.calls[0]?.[1]).toContain('A["宿主"] --> B["插件"]')
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('done')
    expect(diagram.querySelector('svg')).not.toBeNull()
    expect(diagram.querySelector('pre')).toBeNull()
  })

  it('单图语法错误保留源码，同批其他图继续渲染', async () => {
    const bad = mountPlaceholder('不是合法图')
    const good = mountPlaceholder('flowchart LR\n  A --> B')
    render.mockImplementation(async (_id, source) => {
      if (source.includes('不是合法图')) throw new Error('bad diagram')
      return { svg: '<svg class="mermaid-unit-svg"></svg>' }
    })

    await renderMermaidDiagrams(document.body)

    expect(bad.diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('error')
    expect(bad.diagram.querySelector('pre code')?.textContent).toBe('不是合法图')
    expect(good.diagram.getAttribute(MERMAID_STATE_ATTR)).toBe('done')
    expect(good.diagram.querySelector('svg')).not.toBeNull()
  })

  it('内容更新导致旧占位卸载后，迟到的渲染结果不会写回旧 DOM', async () => {
    const { root, diagram } = mountPlaceholder('flowchart LR\n  A --> B')
    let finish!: (value: { svg: string }) => void
    render.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )

    const pending = renderMermaidDiagrams(document.body)
    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    root.remove()
    finish({ svg: '<svg class="stale-svg"></svg>' })
    await pending

    expect(diagram.querySelector('.stale-svg')).toBeNull()
    expect(diagram.querySelector('pre code')?.textContent).toContain('A --> B')
    expect(diagram.getAttribute(MERMAID_STATE_ATTR)).not.toBe('done')
  })
})
