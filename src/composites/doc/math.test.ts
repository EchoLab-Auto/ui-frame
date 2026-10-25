import { describe, it, expect, afterEach, vi } from 'vitest'
import { Marked } from 'marked'
import {
  MATH_MOUNT_CLASS,
  MATH_SOURCE_CLASS,
  MATH_STATE_ATTR,
  clearMathCacheForTests,
  matchBlockBracket,
  matchBlockDollar,
  matchInlineDollar,
  matchInlineParen,
  mathExtensions,
  renderMath,
  stripMathDelimiters,
} from './math'

/** 用与 MarkdownRenderer 相同的配置解析（私有实例 + 数学扩展）。 */
function parse(markdown: string): string {
  const md = new Marked({ gfm: true, breaks: false })
  md.use({ extensions: mathExtensions })
  return md.parse(markdown, { async: false }) as string
}

function host(markdown: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = parse(markdown)
  document.body.appendChild(el)
  return el
}

const mounts = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>(`.${MATH_MOUNT_CLASS}`))

afterEach(() => {
  document.body.innerHTML = ''
  clearMathCacheForTests()
  vi.restoreAllMocks()
})

describe('定界符匹配（边界规则）', () => {
  describe('matchBlockDollar', () => {
    it('独占一行的 $$…$$ 识别为块级，TeX 已剥定界符', () => {
      expect(matchBlockDollar('$$\\frac{a}{b}$$')).toEqual({
        tex: '\\frac{a}{b}',
        raw: '$$\\frac{a}{b}$$',
      })
    })

    it('允许跨行', () => {
      const m = matchBlockDollar('$$\n a^2 + b^2 \n$$')
      expect(m?.tex).toBe('\n a^2 + b^2 \n')
    })

    it('未闭合 → 不是公式', () => {
      expect(matchBlockDollar('$$a + b')).toBeNull()
    })

    it('闭合后同一行还有正文 → 不是块级（交给行内规则）', () => {
      expect(matchBlockDollar('$$a$$ 后面还有字')).toBeNull()
    })

    it('空公式 $$$$ → 不是公式', () => {
      expect(matchBlockDollar('$$$$')).toBeNull()
    })

    it('raw 覆盖到行尾换行符（marked 依赖 raw.length 推进源码）', () => {
      const m = matchBlockDollar('$$a$$\n后续段落')
      expect(m?.raw).toBe('$$a$$\n')
    })
  })

  describe('matchBlockBracket', () => {
    it('\\[…\\] 独占一行识别为块级', () => {
      expect(matchBlockBracket('\\[a^2\\]')?.tex).toBe('a^2')
    })

    it('未闭合 → 不是公式', () => {
      expect(matchBlockBracket('\\[a^2')).toBeNull()
    })
  })

  describe('matchInlineDollar', () => {
    it('普通行内公式', () => {
      expect(matchInlineDollar('$a^2+b^2$')).toEqual({ tex: 'a^2+b^2', raw: '$a^2+b^2$' })
    })

    it('起始数字是合法公式（$2^n$ / $0.5$ / 带单位的量）', () => {
      expect(matchInlineDollar('$2^n$')?.tex).toBe('2^n')
      expect(matchInlineDollar('$0.5$')?.tex).toBe('0.5')
      expect(matchInlineDollar('$5\\,\\text{ms}$')?.tex).toBe('5\\,\\text{ms}')
    })

    it('价格对不是公式：闭合 $ 前是空白（「$199，那件 $299」）', () => {
      expect(matchInlineDollar('$199，那件 $299')).toBeNull()
      expect(matchInlineDollar('$100 和 $200')).toBeNull()
    })

    it('起始 $ 后是空白 → 不是公式', () => {
      expect(matchInlineDollar('$ a$')).toBeNull()
    })

    it('闭合 $ 前是空白 → 不是公式', () => {
      expect(matchInlineDollar('$a $')).toBeNull()
    })

    it('闭合 $ 后紧跟数字（$5$6）→ 不是公式', () => {
      expect(matchInlineDollar('$5$6')).toBeNull()
    })

    it('不跨行', () => {
      expect(matchInlineDollar('$a\nb$')).toBeNull()
    })

    it('支持转义字符：$a\\$b$ 的闭合符是最后一个 $', () => {
      expect(matchInlineDollar('$a\\$b$')?.tex).toBe('a\\$b')
    })

    it('未闭合 → 不是公式', () => {
      expect(matchInlineDollar('$a + b')).toBeNull()
    })

    it('$$ 交给块级/行内块规则，本函数不接管', () => {
      expect(matchInlineDollar('$$a$$')).toBeNull()
    })
  })

  describe('matchInlineParen', () => {
    it('\\(…\\) 识别为行内公式', () => {
      expect(matchInlineParen('\\(\\alpha + \\beta\\)')?.tex).toBe('\\alpha + \\beta')
    })

    it('可跨软换行但不可跨空行', () => {
      expect(matchInlineParen('\\(a\nb\\)')?.tex).toBe('a\nb')
      expect(matchInlineParen('\\(a\n\nb\\)')).toBeNull()
    })

    it('未闭合 → 不是公式', () => {
      expect(matchInlineParen('\\(a')).toBeNull()
    })
  })

  describe('stripMathDelimiters', () => {
    it.each([
      ['$$a$$', 'a'],
      ['$a$', 'a'],
      ['\\[a\\]', 'a'],
      ['\\(a\\)', 'a'],
      ['  $a$  ', 'a'],
      ['无定界符', '无定界符'],
    ])('%s → %s', (input, expected) => {
      expect(stripMathDelimiters(input)).toBe(expected)
    })
  })
})

describe('marked 扩展：公式 → 占位元素', () => {
  it('行内公式产出 span 占位，TeX 在 data-tex 与原文两处', () => {
    const el = host('能量 $E=mc^2$ 守恒')
    const [mount] = mounts(el)
    expect(mount.tagName).toBe('SPAN')
    expect(mount.dataset.tex).toBe('E=mc^2')
    expect(mount.dataset.mathDisplay).toBe('inline')
    // 降级路径：原文始终在 textContent（data-tex 被净化剥除时靠它回退）
    expect(mount.querySelector(`.${MATH_SOURCE_CLASS}`)?.textContent).toBe('$E=mc^2$')
  })

  it('独占一行的 $$…$$ 产出块级 div 占位', () => {
    const el = host('前文\n\n$$\n\\int_0^1 x\\,dx\n$$\n\n后文')
    const [mount] = mounts(el)
    expect(mount.tagName).toBe('DIV')
    expect(mount.classList.contains(`${MATH_MOUNT_CLASS}--block`)).toBe(true)
    expect(mount.dataset.mathDisplay).toBe('block')
    expect(mount.dataset.tex).toBe('\n\\int_0^1 x\\,dx\n')
  })

  it('同一行内的 $$…$$ 也按块级样式渲染（display 输出可内联）', () => {
    const el = host('公式 $$a^2$$ 在这里')
    const [mount] = mounts(el)
    expect(mount.dataset.mathDisplay).toBe('block')
  })

  it('行内代码里的 $ 保持字面（不被当成公式）', () => {
    const el = host('价格写作 `$100` 与 `$a$`')
    expect(mounts(el)).toHaveLength(0)
    expect(el.querySelectorAll('code')).toHaveLength(2)
  })

  it('代码块里的 $ 保持字面', () => {
    const el = host('```sh\necho $HOME $PATH\n```')
    expect(mounts(el)).toHaveLength(0)
    expect(el.querySelector('pre code')?.textContent).toContain('$HOME')
  })

  it('转义的 \\$ 不触发公式', () => {
    const el = host('一个美元符号 \\$5 而已')
    expect(mounts(el)).toHaveLength(0)
  })

  it('金额文本不误判', () => {
    const el = host('这件商品 $199，那件 $299，都不便宜')
    expect(mounts(el)).toHaveLength(0)
  })

  it('公式与其他行内格式共存：**加粗 $x$ 加粗**', () => {
    const el = host('**加粗中的 $x$ 公式**')
    const strong = el.querySelector('strong')
    expect(strong?.querySelector(`.${MATH_MOUNT_CLASS}`)).not.toBeNull()
  })

  it('价格后面紧跟行内代码（$199 … `$a$`）不会把代码扫进公式', () => {
    // 实测踩坑：孤立的 $ 会一路扫进后面的行内代码，把「199，代码里 `」当公式
    expect(mounts(host('这件 $199，代码里 `$a$` 也保持原样'))).toHaveLength(0)
  })

  it('真实价格文本（各种写法）都不产生公式', () => {
    for (const text of [
      '这件商品 $199，那件 $299，都不便宜',
      '成本$199，售价$299',
      '成本 $5 与 $6 之间',
      '花了 $199 元',
      '价格$100-$200',
      '预算 $1,000,000 里花掉 $200,000',
    ]) {
      expect(mounts(host(text)), text).toHaveLength(0)
    }
  })

  it('一段里的多个公式各占一个位置', () => {
    const el = host('$a$ 与 $b$ 与 $c$')
    expect(mounts(el).map(m => m.dataset.tex)).toEqual(['a', 'b', 'c'])
  })

  it('TeX 源码里的 HTML 特殊字符被转义（不注入标记）', () => {
    const el = host('$a<b$')
    expect(el.querySelector('script')).toBeNull()
    expect(mounts(el)[0].dataset.tex).toBe('a<b')
  })
})

describe('renderMath：占位 → KaTeX 渲染', () => {
  it('把占位替换为 KaTeX 输出并标记 done', async () => {
    const el = host('能量 $E=mc^2$ 守恒')
    await renderMath(el)
    const mount = mounts(el)[0]
    expect(mount.getAttribute(MATH_STATE_ATTR)).toBe('done')
    expect(mount.querySelector('.katex')).not.toBeNull()
    // 同时输出 MathML：屏幕阅读器 / 无字体环境可用
    expect(mount.querySelector('.katex-mathml annotation')?.textContent).toBe('E=mc^2')
  })

  it('块级公式标记 katex-display', async () => {
    const el = host('$$\na^2 + b^2 = c^2\n$$')
    await renderMath(el)
    expect(mounts(el)[0].querySelector('.katex-display')).not.toBeNull()
  })

  it('幂等：重复调用不重复渲染（状态标记拦下）', async () => {
    const el = host('$x$')
    await renderMath(el)
    const first = mounts(el)[0].innerHTML
    await renderMath(el)
    expect(mounts(el)[0].innerHTML).toBe(first)
  })

  it('内容更新后新占位仍能被渲染（v-html 全量替换场景）', async () => {
    const el = host('$a$')
    await renderMath(el)
    el.innerHTML = parse('$b$')
    await renderMath(el)
    expect(mounts(el)[0].dataset.tex).toBe('b')
    expect(mounts(el)[0].querySelector('.katex')).not.toBeNull()
  })

  it('非法 TeX 不抛错，降级为 KaTeX 错误样式（红色原文）', async () => {
    const el = host('$\\frac{a}{$')
    await renderMath(el)
    const mount = mounts(el)[0]
    expect(mount.getAttribute(MATH_STATE_ATTR)).toBe('done')
    expect(mount.querySelector('.katex-error')).not.toBeNull()
  })

  it('没有公式时是空操作', async () => {
    const el = host('纯文本')
    await expect(renderMath(el)).resolves.toBeUndefined()
  })

  it('katex 不可用（动态导入失败）时保留 TeX 原文并标记 raw', async () => {
    vi.resetModules()
    vi.doMock('katex', () => {
      throw new Error('module not found')
    })
    const mod = await import('./math')
    const el = document.createElement('div')
    el.innerHTML = mod.mathExtensions
      ? (() => {
          const md = new Marked({ gfm: true, breaks: false })
          md.use({ extensions: mod.mathExtensions })
          return md.parse('$E=mc^2$', { async: false }) as string
        })()
      : ''
    document.body.appendChild(el)
    await mod.renderMath(el)
    const mount = el.querySelector<HTMLElement>(`.${mod.MATH_MOUNT_CLASS}`)!
    expect(mount.getAttribute(mod.MATH_STATE_ATTR)).toBe('raw')
    // fail-visible：原文仍在（不是空白）
    expect(mount.textContent).toBe('$E=mc^2$')
  })
})
