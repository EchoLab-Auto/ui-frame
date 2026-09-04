import { describe, it, expect } from 'vitest'
import { highlightCode } from './highlight'

describe('highlightCode', () => {
  it('text/plain 只做转义不高亮', () => {
    expect(highlightCode('const a = 1', 'text')).toBe('const a = 1')
    expect(highlightCode('<div>', undefined)).toBe('&lt;div&gt;')
  })

  it('关键字 / 函数 / 数字 / 类型正常高亮', () => {
    const out = highlightCode('const x = 42', 'ts')
    expect(out).toContain('<span class="token-keyword">const</span>')
    expect(out).toContain('<span class="token-number">42</span>')
  })

  it('注释 span 不被后续词法轮次破坏（占位符保护）', () => {
    const out = highlightCode('// 快速开始', 'ts')
    expect(out).toBe('<span class="token-comment">// 快速开始</span>')
    expect(out).not.toContain('<span <span')
  })

  it('注释内的关键字不再高亮', () => {
    const out = highlightCode('// const import', 'ts')
    expect(out).toBe('<span class="token-comment">// const import</span>')
  })

  it('JS/TS 自减运算符不被当作注释', () => {
    const out = highlightCode('for (let i = 0; i < n; i--) {', 'ts')
    expect(out).not.toContain('token-comment')
    expect(out).toContain('i--')
  })

  it('CSS 自定义属性不被当作注释，块注释仍高亮', () => {
    const out = highlightCode(':root { --nm-x: 1; }', 'css')
    expect(out).not.toContain('token-comment')
    expect(out).toContain('--nm-x')

    const withComment = highlightCode('/* 重置 */ :root { --nm-x: 1; }', 'css')
    expect(withComment).toContain('<span class="token-comment">/* 重置 */</span>')
  })

  it('bash 的 # 注释高亮', () => {
    const out = highlightCode('# 安装依赖', 'bash')
    expect(out).toBe('<span class="token-comment"># 安装依赖</span>')
  })

  it('sql 的 -- 注释高亮，但要求后随空白', () => {
    const out = highlightCode('-- 查询全部', 'sql')
    expect(out).toBe('<span class="token-comment">-- 查询全部</span>')
  })

  it('转义后的引号实体整体识别为字符串，数字不被拆解', () => {
    const out = highlightCode("import { a } from 'vue'", 'ts')
    expect(out).toContain('<span class="token-string">&#039;vue&#039;</span>')
    expect(out).not.toContain('&#<span')
  })

  it('字符串内的 # 不触发注释吞并（引号实体配对保持完整）', () => {
    const out = highlightCode("const s = '# Hello'", 'ts')
    expect(out).toContain('<span class="token-string">&#039;# Hello&#039;</span>')
    expect(out).not.toContain('token-comment')
    expect(out).not.toContain('&#<span')
  })

  it('字符串内的 // 不触发注释吞并（URL 场景）', () => {
    const out = highlightCode('const u = "https://a.com"', 'ts')
    expect(out).toContain('<span class="token-string">&quot;https://a.com&quot;</span>')
    expect(out).not.toContain('token-comment')
  })

  it('占位符还原顺序正确（多个注释/字符串混排）', () => {
    const out = highlightCode("const s = 'a' // note\nconst t = 'b'", 'ts')
    expect(out).toContain('<span class="token-string">&#039;a&#039;</span>')
    expect(out).toContain('<span class="token-comment">// note</span>')
    expect(out).toContain('<span class="token-string">&#039;b&#039;</span>')
    expect(out).not.toMatch(//)
  })

  it('超过 26 个占位时字母序号进位仍正确还原', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `// c${i}`).join('\n')
    const out = highlightCode(lines, 'ts')
    for (let i = 0; i < 30; i++) {
      expect(out).toContain(`<span class="token-comment">// c${i}</span>`)
    }
    expect(out).not.toMatch(//)
  })
})
