/**
 * Mermaid 图表 —— 可选依赖 + 延迟渲染管线。
 *
 * 渲染入口只属于 ui-frame：MarkdownRenderer 把 mermaid 代码块变成占位，
 * 本模块负责动态加载、初始化、逐图渲染及失败回退。宿主（Panel / DocViewer /
 * MarkdownEditor）不需要再实现一套图表逻辑，只需安装可选 peer `mermaid`。
 *
 * 源码只保存在 `<pre><code>` 的 textContent 中，不复制进 data-* 属性：
 * DOMPurify 的 mXSS 防护可能剥除包含 `-->` 的属性，而箭头又是 Mermaid 的
 * 常规语法。未安装、加载失败或单图语法错误时都保留这份可读源码。
 *
 * @module composites/doc/mermaid
 */

import { escapeHtml } from '../../utils'

export const MERMAID_CLASS = 'mermaid-diagram'
export const MERMAID_STATE_ATTR = 'data-mermaid-state'

export type MermaidState = 'loading' | 'done' | 'error'

/** 图表占位：`<pre>` 同时承担加载前展示与失败后的源码回退。 */
export function mermaidPlaceholder(source: string): string {
  return `<div class="${MERMAID_CLASS}" ${MERMAID_STATE_ATTR}="loading"><pre><code>${escapeHtml(source)}</code></pre></div>`
}

type MermaidModule = typeof import('mermaid')

let modulePromise: Promise<MermaidModule | null> | null = null
let initialized = false
let sequence = 0

/** 全模块共享一次动态 import；加载失败后允许下次内容渲染时重试。 */
async function loadMermaid(): Promise<MermaidModule | null> {
  if (!modulePromise) {
    modulePromise = import('mermaid').catch(() => null)
  }
  const module = await modulePromise
  if (!module) {
    modulePromise = null
    return null
  }
  if (!initialized) {
    module.default.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
    })
    initialized = true
  }
  return module
}

function setState(el: Element, state: MermaidState): void {
  el.setAttribute(MERMAID_STATE_ATTR, state)
}

/**
 * 渲染 root 下所有尚未完成的 Mermaid 占位。
 *
 * 每张图独立失败，不连坐其他图或正文。Markdown 流式更新会替换整棵 v-html
 * 子树；异步返回时用 `isConnected` 丢弃旧占位的迟到结果，避免渲染已被
 * 卸载的 SVG，也避免在旧 DOM 上继续积累工作。
 */
export async function renderMermaidDiagrams(root: ParentNode | null): Promise<void> {
  if (!root) return
  const pending = Array.from(root.querySelectorAll(`.${MERMAID_CLASS}`)).filter(
    el => el.getAttribute(MERMAID_STATE_ATTR) !== 'done'
  )
  if (pending.length === 0) return

  const mermaid = await loadMermaid()
  if (!mermaid) {
    for (const el of pending) {
      if (el.isConnected) setState(el, 'error')
    }
    return
  }

  for (const el of pending) {
    // 动态 import 期间该占位可能已随旧正文一起卸载。
    if (!el.isConnected || el.getAttribute(MERMAID_STATE_ATTR) === 'done') continue
    const source = el.querySelector('pre code')?.textContent ?? ''
    if (!source.trim()) {
      setState(el, 'error')
      continue
    }

    try {
      const id = `nm-mermaid-${++sequence}`
      const { svg } = await mermaid.default.render(id, source)
      // render 也可能跨越一次正文更新，不能复活/改写已经失效的占位。
      if (!el.isConnected) continue
      el.innerHTML = svg
      setState(el, 'done')
      // 保留旧状态钩子，兼容已接入的宿主样式；新代码应读 MERMAID_STATE_ATTR。
      el.setAttribute('data-processed', 'true')
    } catch {
      if (el.isConnected) setState(el, 'error')
      // 不覆盖 innerHTML：失败时原有 <pre><code> 仍可阅读与复制。
    }
  }
}
