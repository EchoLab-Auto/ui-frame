/**
 * Markdown 数学公式（KaTeX）—— 可选依赖 + 延迟渲染管线。
 *
 * ## 为什么不是简单的 marked 插件
 *
 * KaTeX 的 JS（~280KB min）与 CSS（~23KB + 60 个字体文件）只服务于
 * "正文里真的出现公式"的文档。若在 `MarkdownRenderer` 里静态引入，
 * 每个消费方（面板聊天、文档查看器、编辑器预览）都要为它付首屏代价，
 * 而绝大多数消息不含公式。因此沿用本模块既有的**占位 → 挂载后替换**
 * 管线（与 mermaid / prodoc-flow / 代码块一致）：
 *
 * 1. marked 扩展把公式源码渲染成**占位元素**，TeX 原文留在 textContent
 *    （降级时可读、不会被 DOMPurify 的 mXSS 规则剥除）；
 * 2. `renderMath()` 在挂载后动态 `import('katex')`，把占位替换成公式
 *    HTML；katex 未安装 / 加载失败时占位保持原样 → 用户看到 TeX 原文，
 *    而**不是空白**（fail-visible，而非 fail-silent）。
 *
 * ## 语法
 *
 * | 写法            | 渲染                |
 * | --------------- | ------------------- |
 * | `$a^2+b^2$`     | 行内公式            |
 * | `$$…$$`（独占行）| 块级公式（居中）    |
 * | `\(…\)`         | 行内公式（LaTeX 习惯）|
 * | `\[…\]`         | 块级公式（LaTeX 习惯）|
 *
 * `$…$` 采用 KaTeX auto-render 的**保守**规则（`$` 后不接空白/数字、
 * 闭合 `$` 前不接空白、不跨行、不跨空行），因此 `$100 和 $200` 这类
 * 价格文本不会被误判成公式；写作中含真正的 `$` 时用 `\$` 转义。
 * 代码块与行内代码里的 `$` 不受影响（marked 把它们作为整体 token 消费）。
 *
 * @module composites/doc/math
 */

import type { TokenizerAndRendererExtension, Tokens } from 'marked'
import { escapeHtml } from '../../utils'

/** 占位元素类名（行内与块级共用；块级另加 `--block` 修饰符） */
export const MATH_MOUNT_CLASS = 'md-math-mount'
/** 占位元素内保存 TeX 原文的类名（渲染成功后随 innerHTML 一起被替换） */
export const MATH_SOURCE_CLASS = 'md-math-src'
/** 渲染状态：`done` 已渲染 / `raw` 降级保留原文（避免重复尝试） */
export const MATH_STATE_ATTR = 'data-math-state'

/** 公式源码（定界符已剥离）——用于渲染的身份键 */
interface MathMatch {
  /** 完整匹配（含定界符；marked 用它推进源码位置） */
  raw: string
  /** 纯 TeX（定界符已剥离） */
  tex: string
}

interface MathToken extends Tokens.Generic {
  type: 'blockMath' | 'inlineMath'
  raw: string
  /** 展示用原文（含定界符，去除尾随空白） */
  text: string
  tex: string
  display: boolean
}

// ==========================================
// 匹配规则（导出以便单测直接覆盖边界）
// ==========================================

/** `$$…$$` 块级：独占一行（其后只允许空白与换行），可跨行。 */
export function matchBlockDollar(src: string): MathMatch | null {
  if (!src.startsWith('$$')) return null
  const close = src.indexOf('$$', 2)
  if (close < 0) return null
  const tex = src.slice(2, close)
  // 空公式（`$$$$`）不当作公式
  if (!tex.trim()) return null
  // 块级独占行：闭合后必须紧跟行尾（允许尾随空白）
  const after = src.slice(close + 2)
  const lineEnd = /^[ \t]*(?:\r?\n|$)/.exec(after)
  if (!lineEnd) return null
  // raw 必须完整覆盖到行尾换行 —— marked 用 raw.length 推进源码位置
  const raw = src.slice(0, close + 2 + lineEnd[0].length)
  return { tex, raw }
}

/** `\[…\]` 块级（LaTeX 习惯定界符），同样要求闭合后到行尾。 */
export function matchBlockBracket(src: string): MathMatch | null {
  if (!src.startsWith('\\[')) return null
  const close = src.indexOf('\\]', 2)
  if (close < 0) return null
  const tex = src.slice(2, close)
  if (!tex.trim()) return null
  const after = src.slice(close + 2)
  const lineEnd = /^[ \t]*(?:\r?\n|$)/.exec(after)
  if (!lineEnd) return null
  return { tex, raw: src.slice(0, close + 2 + lineEnd[0].length) }
}

/**
 * `$…$` 行内：KaTeX auto-render 的保守规则。
 *
 * - 起始 `$` 后不得紧跟空白或数字（否则 `$100` 这类价格会被吞）；
 * - 闭合 `$` 前不得是空白（`a $ 和 $ b` 不是公式）；
 * - 不跨行；
 * - 内容为空不算。
 */
export function matchInlineDollar(src: string): MathMatch | null {
  if (src[0] !== '$' || src[1] === '$') return null
  const first = src[1]
  if (first === undefined) return null
  if (/\s/.test(first) || /[0-9]/.test(first)) return null
  for (let i = 1; i < src.length; i += 1) {
    const ch = src[i]
    // 反斜杠转义：跳过一个字符（`\$` 不算闭合定界符）
    if (ch === '\\') {
      i += 1
      continue
    }
    if (ch === '\n') return null
    if (ch !== '$') continue
    if (/\s/.test(src[i - 1] ?? '')) return null
    // `$5$6` 之流：闭合 `$` 后紧跟数字 → 更像金额，不当作公式
    if (/[0-9]/.test(src[i + 1] ?? '')) return null
    const tex = src.slice(1, i)
    if (!tex.trim()) return null
    return { tex, raw: src.slice(0, i + 1) }
  }
  return null
}

/** `\(…\)` 行内（LaTeX 习惯定界符）：不跨空行。 */
export function matchInlineParen(src: string): MathMatch | null {
  if (!src.startsWith('\\(')) return null
  const close = src.indexOf('\\)', 2)
  if (close < 0) return null
  const tex = src.slice(2, close)
  if (!tex.trim()) return null
  // 段落内的软换行允许，空行（段落边界）不允许
  if (/\n[ \t]*\n/.test(tex)) return null
  return { tex, raw: src.slice(0, close + 2) }
}

/** 行内 `$$…$$`（不独占行，如 `公式 $$a^2$$ 在这里`）：不跨空行。 */
export function matchInlineDoubleDollar(src: string): MathMatch | null {
  if (!src.startsWith('$$')) return null
  const close = src.indexOf('$$', 2)
  if (close < 0) return null
  const tex = src.slice(2, close)
  if (!tex.trim()) return null
  if (/\n[ \t]*\n/.test(tex)) return null
  return { tex, raw: src.slice(0, close + 2) }
}

/** `\\[…\\]` 行内（同一行内成对出现，不要求独占行）：不跨空行。 */
export function matchInlineBracket(src: string): MathMatch | null {
  if (!src.startsWith('\\[')) return null
  const close = src.indexOf('\\]', 2)
  if (close < 0) return null
  const tex = src.slice(2, close)
  if (!tex.trim()) return null
  if (/\n[ \t]*\n/.test(tex)) return null
  return { tex, raw: src.slice(0, close + 2) }
}

/** 从"带定界符的原文"剥离定界符（占位元素 data-tex 缺失时的回退路径）。 */
export function stripMathDelimiters(text: string): string {
  const trimmed = text.trim()
  const pairs: Array<[string, string]> = [
    ['$$', '$$'],
    ['\\[', '\\]'],
    ['\\(', '\\)'],
    ['$', '$'],
  ]
  for (const [open, close] of pairs) {
    if (
      trimmed.startsWith(open) &&
      trimmed.endsWith(close) &&
      trimmed.length >= open.length + close.length
    ) {
      return trimmed.slice(open.length, trimmed.length - close.length)
    }
  }
  return trimmed
}

// ==========================================
// marked 扩展：公式 → 占位元素
// ==========================================

/**
 * 占位 HTML。TeX 原文走 **textContent**（不是 data-* 属性值）：
 * DOMPurify 的 mXSS 规则会剥除值含 `-->` 的自定义属性，而公式源码
 * 可能包含任意符号。`data-tex` 只是快通道，缺失时由 textContent 兜底。
 */
function mathPlaceholderHtml(token: MathToken): string {
  const tag = token.display ? 'div' : 'span'
  const className = token.display
    ? `${MATH_MOUNT_CLASS} ${MATH_MOUNT_CLASS}--block`
    : MATH_MOUNT_CLASS
  const display = token.display ? 'block' : 'inline'
  return (
    `<${tag} class="${className}" data-math-display="${display}"` +
    ` data-tex="${escapeHtml(token.tex)}">` +
    `<span class="${MATH_SOURCE_CLASS}">${escapeHtml(token.text)}</span>` +
    `</${tag}>`
  )
}

/**
 * marked 扩展：块级 `$$…$$` / `\[…\]` 与行内 `$…$` / `\(…\)`。
 *
 * 不提供 `start()`：让 marked 逐个位置尝试本 tokenizer。首字符不匹配即
 * 返回 `undefined`（成本可忽略），换来的是**绝不跳过**内置规则 —— 尤其
 * 是行内代码（`` `$x$` `` 必须保持字面）。
 */
export const mathExtensions: TokenizerAndRendererExtension[] = [
  {
    name: 'blockMath',
    level: 'block',
    tokenizer(src: string): MathToken | undefined {
      const match = matchBlockDollar(src) ?? matchBlockBracket(src)
      if (!match) return undefined
      return {
        type: 'blockMath',
        raw: match.raw,
        text: match.raw.trim(),
        tex: match.tex,
        display: true,
      }
    },
    renderer(token: Tokens.Generic): string {
      return mathPlaceholderHtml(token as MathToken)
    },
  },
  {
    name: 'inlineMath',
    level: 'inline',
    /**
     * 告诉 marked 下一个可能是公式的位置。
     *
     * 没有它，内置 `text` 规则会把整行一次吞掉（`$` 不是 marked 的特殊字符），
     * 于是 `能量 $E=mc^2$ 守恒` 里的公式永远不会被看到 —— 这是本扩展**必须**
     * 实现 start 的原因（实测：省略后仅行首公式能命中）。
     */
    start(src: string): number | undefined {
      const candidates = [src.indexOf('$'), src.indexOf('\\('), src.indexOf('\\[')]
      const valid = candidates.filter(i => i >= 0)
      return valid.length > 0 ? Math.min(...valid) : undefined
    },
    tokenizer(src: string): MathToken | undefined {
      const match =
        matchInlineDoubleDollar(src) ??
        matchInlineDollar(src) ??
        matchInlineParen(src) ??
        matchInlineBracket(src)
      if (!match) return undefined
      // 行内 `$$…$$` / `\\[…\\]`（同一行内成对出现）：按块级样式渲染，但仍是
      // 行内 token，输出 span 放进段落（KaTeX display 输出本身是 span，可内联）
      const display = match.raw.startsWith('$$') || match.raw.startsWith('\\[')
      return {
        type: 'inlineMath',
        raw: match.raw,
        text: match.raw,
        tex: match.tex,
        display,
      }
    },
    renderer(token: Tokens.Generic): string {
      return mathPlaceholderHtml(token as MathToken)
    },
  },
]

// ==========================================
// 延迟渲染：占位 → KaTeX HTML
// ==========================================

/** KaTeX 的最小接口（可选依赖，不把 katex 类型暴露到公开 API） */
interface KatexLike {
  renderToString(tex: string, options: Record<string, unknown>): string
}

let katexPromise: Promise<KatexLike | null> | null = null

/** 动态加载 katex（可选 peer dependency）；不可用时缓存 `null`，不再重试。 */
function loadKatex(): Promise<KatexLike | null> {
  if (!katexPromise) {
    katexPromise = import('katex')
      .then(mod => {
        const candidate = (mod as { default?: KatexLike }).default ?? (mod as unknown as KatexLike)
        return typeof candidate?.renderToString === 'function' ? candidate : null
      })
      .catch(() => null)
  }
  return katexPromise
}

/**
 * 渲染结果缓存：同一条回答可能被反复重渲染（v-html 全量替换、抽屉开关），
 * 而 KaTeX 的单次排版成本不低（复杂公式 ~1ms 量级）。键为 display+TeX。
 */
const mathHtmlCache = new Map<string, string>()
const MATH_CACHE_LIMIT = 400

function renderOne(katex: KatexLike, tex: string, display: boolean): string {
  const key = `${display ? 'b' : 'i'}\u0000${tex}`
  const cached = mathHtmlCache.get(key)
  if (cached !== undefined) return cached
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false, // 非法 TeX → 红色原文，不让整篇文档崩
    strict: 'ignore', // Unicode / 非标准写法的警告不当作错误
    trust: false, // 禁止 \htmlClass 等可执行/可注入命令
    output: 'htmlAndMathml', // 同时输出 MathML：屏幕阅读器与无字体环境可用
    errorColor: 'var(--nm-color-error, #d9534f)',
  })
  if (mathHtmlCache.size >= MATH_CACHE_LIMIT) mathHtmlCache.clear()
  mathHtmlCache.set(key, html)
  return html
}

/**
 * 把 `root` 内的公式占位替换为 KaTeX 输出（幂等，可反复调用）。
 *
 * 失败路径一律**保留 TeX 原文**并打上 `data-math-state="raw"`：
 * - katex 未安装 / 动态导入失败（离线、宿主未声明依赖）；
 * - 单条公式渲染抛错。
 *
 * 每次调用只处理尚未标记状态的占位，因此内容更新（v-html 全量替换后会
 * 生成新占位）与首次挂载可以共用同一个入口。
 */
export async function renderMath(root: ParentNode | null | undefined): Promise<void> {
  if (!root) return

  const selectPending = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`.${MATH_MOUNT_CLASS}:not([${MATH_STATE_ATTR}])`))

  if (selectPending().length === 0) return

  const katex = await loadKatex()
  // await 期间 DOM 可能已被下一次 v-html 替换：重新查询一次，只处理仍然
  // 挂在文档里且未渲染的占位（早先那批已脱离文档，渲染它没人看得见）。
  // 容器本身未挂载（组件测试 / 离屏预览）时不做该过滤。
  const attached = root instanceof Node && root.isConnected
  const pending = selectPending().filter(el => !attached || el.isConnected)

  if (!katex) {
    for (const el of pending) el.setAttribute(MATH_STATE_ATTR, 'raw')
    return
  }

  for (const el of pending) {
    const display = el.dataset.mathDisplay === 'block'
    const source = el.querySelector(`.${MATH_SOURCE_CLASS}`)?.textContent ?? el.textContent ?? ''
    const tex = el.dataset.tex ?? stripMathDelimiters(source)
    if (!tex.trim()) {
      el.setAttribute(MATH_STATE_ATTR, 'raw')
      continue
    }
    try {
      el.innerHTML = renderOne(katex, tex, display)
      el.setAttribute(MATH_STATE_ATTR, 'done')
    } catch {
      el.setAttribute(MATH_STATE_ATTR, 'raw')
    }
  }
}

/** 清空渲染缓存（测试用） */
export function clearMathCacheForTests(): void {
  mathHtmlCache.clear()
  katexPromise = null
}
