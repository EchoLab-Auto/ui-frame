import { escapeHtml } from '@/utils'

// ==========================================
// 模块级正则 — 避免每次调用重复编译
// ==========================================
// 注释风格按语言族分发：SQL 风格的 `--` 若对所有语言生效，会把 JS 自减
// `i--` 与 CSS 自定义属性 `--nm-x` 吞为注释
const COMMENT_RE_CLIKE = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
const COMMENT_RE_HASH = /(#\s+.*$)/gm
// SQL/Lua：`--` 后要求随空白，避免 `i--`、`x--y` 这类递减/运算符被误判
const COMMENT_RE_SQL = /(--\s.*$)/gm
// 不匹配任何内容（无行注释概念的语言）
const COMMENT_RE_NONE = /$.^/gm

const HASH_COMMENT_LANGS = new Set([
  'bash',
  'sh',
  'shell',
  'zsh',
  'python',
  'py',
  'yaml',
  'yml',
  'toml',
  'ruby',
  'rb',
  'ini',
  'makefile',
  'dockerfile',
])
const SQL_COMMENT_LANGS = new Set(['sql', 'mysql', 'pgsql', 'plsql', 'lua'])

function commentReFor(lang?: string): RegExp {
  const normalized = (lang ?? '').toLowerCase()
  if (HASH_COMMENT_LANGS.has(normalized)) return COMMENT_RE_HASH
  if (SQL_COMMENT_LANGS.has(normalized)) return COMMENT_RE_SQL
  if (normalized === 'html' || normalized === 'xml' || normalized === 'vue') return COMMENT_RE_NONE
  return COMMENT_RE_CLIKE
}

// 输入已先经 escapeHtml：引号只剩实体形态（&quot; / &#039;）或反引号
const STRING_RE = /(&quot;.*?&quot;|&#0?39;.*?&#0?39;|`.*?`)/g
const KEYWORD_RE =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|default|try|catch|finally|throw|new|this|typeof|instanceof|class|extends|import|export|from|async|await|yield|static|public|private|protected|interface|type|enum|namespace|module|declare|abstract|readonly|implements|void|number|string|boolean|any|never|unknown|null|undefined|true|false)\b/g
const FUNCTION_RE = /\b([a-zA-Z_]\w*)(?=\()/g
const NUMBER_RE = /\b(\d+\.?\d*)\b/g
const TYPE_RE = /\b([A-Z][a-zA-Z0-9_]*)\b/g
const PLACEHOLDER_RE = /\u0001([a-z]+)\u0001/g

/**
 * 占位符编码：控制字符包裹小写字母序号（不含数字/大写/关键字/括号），
 * 保证 KEYWORD/NUMBER/TYPE 等后续正则轮次不会命中占位符本体。
 */
function toPlaceholder(index: number): string {
  let n = index
  let letters = ''
  do {
    letters = String.fromCharCode(97 + (n % 26)) + letters
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return '\u0001' + letters + '\u0001'
}

function fromPlaceholder(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 96)
  return n - 1
}

/**
 * 简易代码高亮（零依赖正则实现）。
 *
 * 两遍式：注释与字符串先替换为占位符（其内部不再参与词法高亮，
 * 也避免插入的 span 标记被后续正则破坏），词法轮次完成后再还原为 span。
 * 输出为 escape 后的 HTML + token-* span，由 DocCodeBlock / MarkdownRenderer 共用。
 */
export function highlightCode(code: string, lang?: string): string {
  if (!lang || lang === 'text' || lang === 'plain') {
    return escapeHtml(code)
  }
  let html = escapeHtml(code)

  // 第一遍：字符串 / 注释入占位（span 标记与内容都不再参与后续轮次）。
  // 顺序重要：字符串优先 —— 注释正则（#/ /-- 至行尾）会吞掉字符串内部的
  // "# / // 内容并破坏其中的引号实体配对；反向（注释里的引号被染成字符串色）
  // 只是着色偏宽，不会破坏结构。
  const stash: string[] = []
  const stashPush = (cls: string) => (match: string) => {
    stash.push(`<span class="${cls}">${match}</span>`)
    return toPlaceholder(stash.length - 1)
  }
  html = html.replace(STRING_RE, stashPush('token-string'))
  html = html.replace(commentReFor(lang), stashPush('token-comment'))

  // 第二遍：剩余裸文本的词法高亮（span 标记无括号/数字/大写，互不干扰）
  html = html.replace(KEYWORD_RE, '<span class="token-keyword">$1</span>')
  html = html.replace(FUNCTION_RE, '<span class="token-function">$1</span>')
  html = html.replace(NUMBER_RE, '<span class="token-number">$1</span>')
  html = html.replace(TYPE_RE, '<span class="token-type">$1</span>')

  // 还原占位符为注释 / 字符串 span
  html = html.replace(PLACEHOLDER_RE, (_, letters: string) => stash[fromPlaceholder(letters)])
  return html
}
