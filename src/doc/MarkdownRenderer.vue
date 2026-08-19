<script setup lang="ts">
import {
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  h,
  render,
  getCurrentInstance,
  toRef,
} from 'vue'
// TODO(perf): Change to dynamic import for lazy-loading (~40KB saving for non-doc consumers).
// Requires refactoring extractToc + doRender + renderer setup to async patterns.
import { marked } from 'marked'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import { escapeHtml } from '@/utils'
import { useLocale } from '@/composables/useLocale'
import DocTocNav from './DocTocNav.vue'
import DocCodeBlock from './DocCodeBlock.vue'
import DocFlowCanvas from './DocFlowCanvas.vue'
import { parseProDocFlow } from './flow-parser'
import { useMarkdownToc } from './useMarkdownToc'
import { useScrollSpy } from './useScrollSpy'

export type { TocNode } from './useMarkdownToc'

export interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string
  /** 自定义样式类名 */
  className?: string
  /** 是否显示目录 */
  showToc?: boolean
  /** 滚动容器（HTMLElement 或 CSS 选择器）。不传则自动查找 .nm-layout__content */
  scrollContainer?: HTMLElement | string
  /** prodoc-flow 画布节点可拖拽编辑（松手触发 flowNodeMove，由宿主持久化） */
  flowEditable?: boolean
}

const props = withDefaults(defineProps<MarkdownRendererProps>(), {
  className: '',
  showToc: true,
  flowEditable: false,
})

const emit = defineEmits<{
  (e: 'docLink', path: string): void
  /** 流程画布节点拖拽松手（source 为该 prodoc-flow 块的源码，供宿主定位写回） */
  (e: 'flowNodeMove', payload: { id: string; x: number; y: number; source: string }): void
}>()

const contentRef = ref<HTMLDivElement | null>(null)
const showMobileToc = ref(false)

const { t } = useLocale()

// 目录提取（headless，见 useMarkdownToc）—— 必须先于 doRender 接线（其依赖 toc）
const { toc, tocTree, makeUniqueId } = useMarkdownToc(toRef(props, 'content'))

/** 滚动到指定 heading 并关闭移动端 TOC */
function scrollToHeadingAndClose(id: string) {
  scrollToHeading(id)
  showMobileToc.value = false
}

// ==========================================
// 预创建 Renderer 实例 — 避免每次 content 变化都重建
// ==========================================
const renderer = new marked.Renderer()

renderer.code = ({ text, lang }) => {
  // Mermaid diagram support (optional, loaded dynamically on-mounted)
  if (lang === 'mermaid') {
    return `<div class="mermaid-diagram" data-mermaid="${escapeHtml(text)}"><pre><code>${escapeHtml(text)}</code></pre></div>`
  }

  // ProDoc 流程画布：占位 div + 挂载后替换为 DocFlowCanvas（见 mountFlowDiagrams）。
  // 源码不放在 data-* 属性里 —— DOMPurify 的 mXSS 防护会剥除值含 "-->"
  // 的自定义属性（流程图箭头必然命中）。<pre><code> 既作源码回退显示，
  // 又是挂载时 textContent 还原源码的唯一来源（属性无法承担的通道）。
  if (lang === 'prodoc-flow') {
    return `<div class="prodoc-flow-diagram"><pre><code>${escapeHtml(text)}</code></pre></div>`
  }

  // 常规代码块：占位 div + 挂载后替换为 DocCodeBlock（同流程画布管线）。
  const language = lang || 'text'
  return `<div class="doc-code-block-mount" data-lang="${escapeHtml(language)}"><pre><code>${escapeHtml(text)}</code></pre></div>`
}

renderer.codespan = ({ text }) => {
  return `<code class="inline-code">${escapeHtml(text)}</code>`
}

renderer.image = ({ href, title, text }) => {
  return `<img src="${href}" alt="${escapeHtml(text)}" title="${escapeHtml(title || '')}" loading="lazy" />`
}

renderer.listitem = ({ text, task, checked }) => {
  if (task) {
    return `
      <li class="task-list-item">
        <label class="task-checkbox">
          <input type="checkbox" ${checked ? 'checked' : ''} disabled />
          <span class="checkmark"></span>
          <span class="task-text">${text.replace(/^\[[ x]\]\s*/, '')}</span>
        </label>
      </li>
    `
  }
  return `<li>${text}</li>`
}

/** 渲染错误状态 */
const renderError = ref<string | null>(null)

/** 渲染后的 HTML */
const renderedHtml = ref('')

/**
 * 可选 XSS 净化：动态加载 DOMPurify（可选 peer dependency）对 marked 输出净化。
 * marked 默认放行原始 HTML，对外部/不可信 markdown 必须净化后再 v-html。
 * 未安装时回退到原始 HTML 并警告一次；DOMPurify 不在主包入口，主包体积不受影响。
 */
let purify: ((html: string) => string) | null = null
let purifyLoaded = false
let purifyWarned = false

function loadPurify(): void {
  if (purifyLoaded) return
  purifyLoaded = true
  // @ts-expect-error - dompurify is an optional peer dependency, may not be installed
  import('dompurify')
    .then(mod => {
      const dp = mod?.default
      if (dp && typeof dp.sanitize === 'function') {
        purify = (html: string) =>
          dp.sanitize(html, {
            // Preserve the data-* hooks emitted by this renderer.
            ADD_ATTR: ['data-mermaid', 'data-code', 'data-heading-id', 'data-lang', 'target'],
          })
        // Re-render now that sanitization is available.
        doRender()
      }
    })
    .catch(() => {
      if (!purifyWarned) {
        purifyWarned = true
        console.warn(
          '[MarkdownRenderer] dompurify 未安装，markdown 输出未做 XSS 净化；建议安装 dompurify 作为可选依赖以渲染不可信内容。'
        )
      }
    })
}

function doRender() {
  renderError.value = null
  try {
    // 使用 useMarkdownToc 预计算的 heading ID，确保目录与渲染标题 ID 一致（含碰撞后缀）
    const headingIds = toc.value.map(h => h.id)
    let headingIndex = 0

    const renderRenderer = Object.create(renderer)
    renderRenderer.heading = ({ tokens, depth }: { tokens: unknown[]; depth: number }) => {
      const text = extractTextFromTokens(tokens)
      const id = headingIds[headingIndex++] ?? makeUniqueId(text)
      return `<h${depth} id="${id}"><a href="#" data-heading-id="${id}" class="heading-anchor" aria-hidden="true">#</a>${text}</h${depth}>`
    }

    const raw = marked.parse(props.content, {
      async: false,
      gfm: true,
      breaks: false,
      renderer: renderRenderer,
    }) as string
    // Sanitize before assigning — renderedHtml is rendered via v-html.
    renderedHtml.value = purify ? purify(raw) : raw
  } catch (err) {
    renderError.value = (err as Error).message || 'Unknown error rendering markdown'
    renderedHtml.value = ''
  }
}

function extractTextFromTokens(tokens: unknown[]): string {
  return tokens
    .map(t => {
      const token = t as Record<string, unknown>
      if (token.text) return String(token.text)
      if (token.tokens) return extractTextFromTokens(token.tokens as unknown[])
      return ''
    })
    .join('')
}

// Kick off the optional DOMPurify load; once ready it re-renders sanitized.
loadPurify()
watch(() => props.content, doRender, { immediate: true })

// ==========================================
// scroll-spy（headless，见 useScrollSpy）
// 注意顺序：watchSource 引用 renderedHtml，必须在声明之后接线
// ==========================================
const { activeHeading, scrollToHeading } = useScrollSpy({
  content: contentRef,
  scrollContainer: toRef(props, 'scrollContainer'),
  watchSource: () => renderedHtml.value,
})

// 桌面侧栏与移动端抽屉共享同一份目录折叠状态；内容切换时重置
const collapsedGroups = ref<Set<string>>(new Set())
watch(
  () => props.content,
  () => {
    collapsedGroups.value = new Set()
  }
)

/** 动态加载 Mermaid 并渲染图表 */
async function renderMermaidDiagrams() {
  if (!contentRef.value) return
  const diagrams = contentRef.value.querySelectorAll('.mermaid-diagram')
  if (diagrams.length === 0) return

  try {
    // 动态加载 mermaid（可选 peer dependency，未安装时静默回退）
    // @ts-expect-error - mermaid is an optional peer dependency, may not be installed
    const mermaid = await import('mermaid').catch(() => null)
    if (!mermaid?.default) return

    await mermaid.default.run({
      nodes: Array.from(diagrams),
    })
  } catch {
    // Mermaid 不可用时，保留原始的 <pre><code> 回退
  }
}

// content 或 renderedHtml 变化后重跑后处理（mermaid 替换 + 流程画布/代码块挂载）
watch(renderedHtml, () => {
  // v-html 即将替换 innerHTML —— 旧占位上的手动挂载子树必须先卸载，
  // 否则其 watcher/ResizeObserver 会随 DOM 移除而泄漏（Vue 运行时感知不到
  // v-html 内部的手动挂载）
  unmountMountedBlocks()
  nextTick(runPostRender)
})

// 首次挂载也必须跑后处理：renderedHtml 由 immediate watch 在本 watch 注册
// 之前就已赋值，初始渲染不会触发上述 watch（此前 mermaid 首挂载同样依赖
// purify 二次渲染"碰巧"触发，无 purify 时首挂载 mermaid 静默不渲染）
onMounted(runPostRender)

function runPostRender(): void {
  renderMermaidDiagrams()
  mountFlowDiagrams()
  mountCodeBlocks()
}

// ==========================================
// 手动挂载管线（占位 → Vue 子树：流程画布 / 代码块）
// ==========================================
// 登记制：每个被替换的占位元素都记录在案，内容更新前与组件卸载时统一清理
const mountedBlocks: HTMLElement[] = []
// 关键：手动 render 的子树默认没有应用上下文，useLocale / 全局配置注入会静默
// 回退默认值 —— 必须继承当前组件实例的 appContext
const currentInstance = getCurrentInstance()

function unmountMountedBlocks(): void {
  for (const el of mountedBlocks) {
    render(null, el)
  }
  mountedBlocks.length = 0
}

function mountFlowDiagrams(): void {
  if (!contentRef.value) return
  const placeholders = contentRef.value.querySelectorAll('.prodoc-flow-diagram')
  for (const el of placeholders) {
    // 源码从 <pre><code> 回退内容的 textContent 还原（实体自动解码）——
    // data-* 属性通道会被 DOMPurify 的 mXSS 规则剥除（值含 "-->"）
    const source = el.querySelector('pre code')?.textContent ?? el.textContent ?? ''
    const graph = parseProDocFlow(source)
    // 无有效节点（全非法/空源码）→ 保留 <pre> 源码回退
    if (graph.nodes.length === 0) continue

    const vnode = h(DocFlowCanvas, {
      graph,
      height: '420px',
      editable: props.flowEditable,
      onNavigate: (path: string) => emit('docLink', path),
      onNodeMove: (p: { id: string; x: number; y: number }) =>
        emit('flowNodeMove', { ...p, source }),
    })
    vnode.appContext = currentInstance?.appContext ?? null
    el.innerHTML = ''
    render(vnode, el as HTMLElement)
    mountedBlocks.push(el as HTMLElement)
  }
}

function mountCodeBlocks(): void {
  if (!contentRef.value) return
  const placeholders = contentRef.value.querySelectorAll('.doc-code-block-mount')
  for (const el of placeholders) {
    const source = el.querySelector('pre code')?.textContent ?? el.textContent ?? ''
    const lang = (el as HTMLElement).dataset.lang || 'text'
    const vnode = h(DocCodeBlock, { code: source, lang })
    vnode.appContext = currentInstance?.appContext ?? null
    el.innerHTML = ''
    render(vnode, el as HTMLElement)
    mountedBlocks.push(el as HTMLElement)
  }
}

/** 统一处理内容区点击：heading 锚点 + 文档链接（代码块复制由 DocCodeBlock 自理） */
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // 1. 处理 heading 锚点点击（阻止 hash 变更，改为平滑滚动）
  const anchor = target.closest('.heading-anchor') as HTMLAnchorElement | null
  if (anchor) {
    const id = anchor.dataset.headingId
    if (id) {
      e.preventDefault()
      scrollToHeading(id)
    }
    return
  }

  // 2. 处理文档链接拦截
  const link = target.closest('a')
  if (link) {
    const href = link.getAttribute('href')
    if (
      href &&
      !href.startsWith('//') &&
      (href.startsWith('/') || href.startsWith('.') || href.endsWith('.md'))
    ) {
      e.preventDefault()
      emit('docLink', href)
    }
  }
}

// 卸载时清理手动挂载的子树
onBeforeUnmount(() => {
  unmountMountedBlocks()
})
</script>

<template>
  <div :class="`neumorphism-markdown ${props.className}`">
    <!-- Markdown 内容 -->
    <div class="neumorphism-markdown-body">
      <div v-if="renderError" class="neumorphism-markdown-error" role="alert">
        <p class="neumorphism-markdown-error-title">⚠️ 渲染错误</p>
        <pre class="neumorphism-markdown-error-msg">{{ renderError }}</pre>
      </div>
      <div
        v-else
        ref="contentRef"
        class="neumorphism-markdown-content"
        @click="handleContentClick"
        v-html="renderedHtml"
      />
    </div>

    <!-- 目录侧边栏（桌面端） -->
    <DocTocNav
      v-if="showToc && toc.length > 0"
      v-model:collapsed-groups="collapsedGroups"
      :items="tocTree"
      :active-id="activeHeading"
      @select="scrollToHeading"
    />

    <!-- 移动端 TOC 浮动按钮 -->
    <button
      v-if="showToc && toc.length > 0"
      class="neumorphism-toc-mobile-btn"
      :class="{ active: showMobileToc }"
      :aria-label="t('markdownTocToggle')"
      @click="showMobileToc = !showMobileToc"
    >
      📑
    </button>

    <!-- 移动端 TOC 面板 -->
    <Transition name="neumorphism-toc-drawer">
      <div
        v-if="showToc && toc.length > 0 && showMobileToc"
        class="neumorphism-toc-mobile-overlay"
        @click.self="showMobileToc = false"
      >
        <NeumorphismCard :elevation="0" class="neumorphism-toc-mobile-panel">
          <div class="neumorphism-toc-mobile-header">
            <span class="neumorphism-toc-mobile-title">📑 {{ t('markdownTocLabel') }}</span>
            <button
              class="neumorphism-toc-mobile-close"
              :aria-label="t('markdownTocClose')"
              @click="showMobileToc = false"
            >
              ✕
            </button>
          </div>
          <DocTocNav
            v-model:collapsed-groups="collapsedGroups"
            :items="tocTree"
            :active-id="activeHeading"
            :framed="false"
            @select="scrollToHeadingAndClose"
          />
        </NeumorphismCard>
      </div>
    </Transition>
  </div>
</template>

<style>
.neumorphism-markdown {
  display: flex;
  gap: 28px;
  align-items: flex-start;
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

.neumorphism-markdown-body {
  flex: 1;
  min-width: 0;
}

/* Markdown render error */
.neumorphism-markdown-error {
  padding: 32px;
  background: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-lg);
  border: 1px solid var(--nm-color-error);
}

.neumorphism-markdown-error-title {
  font-weight: 600;
  color: var(--nm-color-error);
  margin: 0 0 12px;
}

.neumorphism-markdown-error-msg {
  font-family: var(--nm-font-mono);
  font-size: 13px;
  color: var(--nm-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 12px;
  background: var(--nm-bg-color);
  border-radius: var(--nm-border-radius-sm);
}

/* Markdown content */
.neumorphism-markdown-content {
  line-height: 1.75;
  color: var(--nm-text-primary);
  font-size: 15px;
}

.neumorphism-markdown-content h1,
.neumorphism-markdown-content h2,
.neumorphism-markdown-content h3,
.neumorphism-markdown-content h4,
.neumorphism-markdown-content h5,
.neumorphism-markdown-content h6 {
  margin-top: 36px;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--nm-text-primary);
  line-height: 1.25;
  letter-spacing: -0.3px;
  position: relative;
}

.neumorphism-markdown-content h1 {
  font-size: 26px;
}
.neumorphism-markdown-content h2 {
  font-size: 22px;
}
.neumorphism-markdown-content h3 {
  font-size: 18px;
}
.neumorphism-markdown-content h4 {
  font-size: 16px;
}
.neumorphism-markdown-content h5 {
  font-size: 15px;
}
.neumorphism-markdown-content h6 {
  font-size: 14px;
  color: var(--nm-text-secondary);
}

.heading-anchor {
  position: absolute;
  right: -22px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--nm-text-placeholder);
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

.neumorphism-markdown-content h1:hover .heading-anchor,
.neumorphism-markdown-content h2:hover .heading-anchor,
.neumorphism-markdown-content h3:hover .heading-anchor,
.neumorphism-markdown-content h4:hover .heading-anchor,
.neumorphism-markdown-content h5:hover .heading-anchor,
.neumorphism-markdown-content h6:hover .heading-anchor {
  opacity: 1;
}

.heading-anchor:hover {
  color: var(--nm-primary-color);
}

.neumorphism-markdown-content p {
  margin: 0 0 16px 0;
  color: var(--nm-text-primary);
}

.neumorphism-markdown-content a {
  color: var(--nm-primary-color);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.neumorphism-markdown-content a:hover {
  text-decoration: underline;
  opacity: 0.85;
}

.neumorphism-markdown-content ul,
.neumorphism-markdown-content ol {
  margin: 0 0 16px 0;
  padding-left: 24px;
  color: var(--nm-text-primary);
}

.neumorphism-markdown-content li {
  margin-bottom: 6px;
}

.neumorphism-markdown-content li::marker {
  color: var(--nm-text-placeholder);
}

.task-list-item {
  list-style: none;
  padding-left: 0;
  margin-left: -4px;
}

.task-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: default;
}

.task-checkbox input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--nm-border-radius-sm);
  flex-shrink: 0;
  background-color: var(--nm-surface-color);
  border: 1px solid var(--nm-border-medium);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.task-checkbox input:checked + .checkmark {
  background-color: var(--nm-primary-color);
  border-color: var(--nm-primary-color);
}

.checkmark::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-checkbox input:checked + .checkmark::after {
  opacity: 1;
}

.task-text {
  color: var(--nm-text-primary);
}

.task-checkbox input:checked ~ .task-text {
  text-decoration: line-through;
  color: var(--nm-text-placeholder);
}

.inline-code {
  background-color: var(--nm-surface-color);
  padding: 3px 8px;
  border-radius: var(--nm-border-radius-sm);
  font-size: 0.88em;
  font-family: var(--nm-font-mono);
  color: var(--nm-primary-color);
  border: 1px solid var(--nm-border-subtle);
}

.neumorphism-markdown-content blockquote {
  margin: 0 0 18px 0;
  padding: 16px 22px;
  border-left: 3px solid var(--nm-primary-color);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  border-radius: 0 var(--nm-border-radius-lg) var(--nm-border-radius-lg) 0;
}

.neumorphism-markdown-content blockquote p:last-child {
  margin-bottom: 0;
}

.neumorphism-markdown-content table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 0 0 18px 0;
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border: 1px solid var(--nm-border-subtle);
}

.neumorphism-markdown-content th,
.neumorphism-markdown-content td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--nm-border-subtle);
  text-align: left;
}

.neumorphism-markdown-content th {
  background-color: var(--nm-bg-color);
  font-weight: 600;
  color: var(--nm-text-primary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.neumorphism-markdown-content td {
  color: var(--nm-text-primary);
  font-size: 14px;
}

.neumorphism-markdown-content tr:last-child td {
  border-bottom: none;
}

.neumorphism-markdown-content tr:nth-child(even) td {
  background-color: color-mix(in srgb, var(--nm-text-placeholder) 4%, transparent);
}

.neumorphism-markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: var(--nm-border-radius-lg);
}

.neumorphism-markdown-content hr {
  border: none;
  border-top: 1px solid var(--nm-border-subtle);
  margin: 32px 0;
}

.neumorphism-markdown-content strong {
  color: var(--nm-text-primary);
  font-weight: 600;
}

.neumorphism-markdown-content del,
.neumorphism-markdown-content s {
  color: var(--nm-text-placeholder);
  text-decoration-color: var(--nm-text-secondary);
}

/* ==========================================
   Focus-visible for accessibility
   ========================================== */
.neumorphism-markdown-content a:focus-visible,
.heading-anchor:focus-visible,
.neumorphism-toc-mobile-btn:focus-visible,
.neumorphism-toc-mobile-close:focus-visible {
  outline: 2px solid var(--nm-primary-color);
  outline-offset: 2px;
  border-radius: var(--nm-border-radius-sm);
}

.neumorphism-markdown-content a:focus-visible {
  border-radius: 2px;
}

/* ==========================================
   Mobile TOC
   ========================================== */
.neumorphism-toc-mobile-btn {
  display: none;
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  font-size: 20px;
  cursor: pointer;
  background-color: var(--nm-surface-color);
  box-shadow:
    6px 6px 12px var(--nm-shadow-dark),
    -6px -6px 12px var(--nm-shadow-light);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.neumorphism-toc-mobile-btn:hover {
  transform: scale(1.05);
}

.neumorphism-toc-mobile-btn.active {
  background-color: var(--nm-primary-color);
}

.neumorphism-toc-mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.neumorphism-toc-mobile-panel {
  position: absolute;
  right: 16px;
  bottom: 80px;
  width: 280px;
  max-height: 60vh;
  overflow-y: auto;
  background-color: var(--nm-surface-raised);
}

.neumorphism-toc-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--nm-border-subtle);
}

.neumorphism-toc-mobile-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--nm-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.neumorphism-toc-mobile-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background-color: var(--nm-surface-color);
  color: var(--nm-text-secondary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.neumorphism-toc-mobile-close:hover {
  color: var(--nm-primary-color);
}

/* ==========================================
   TOC Drawer transition
   ========================================== */
.neumorphism-toc-drawer-enter-active,
.neumorphism-toc-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.neumorphism-toc-drawer-enter-from,
.neumorphism-toc-drawer-leave-to {
  opacity: 0;
}

/* ==========================================
   Table horizontal scroll on mobile
   ========================================== */
.neumorphism-markdown-content table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.neumorphism-markdown-content th,
.neumorphism-markdown-content td {
  white-space: normal;
}

/* ==========================================
   Responsive
   ========================================== */
@media (max-width: 1100px) {
  .neumorphism-toc-mobile-btn,
  .neumorphism-toc-mobile-overlay {
    display: block;
  }
}

/* ==========================================
   Print stylesheet
   ========================================== */
@media print {
  .neumorphism-toc,
  .neumorphism-toc-mobile-btn,
  .neumorphism-toc-mobile-overlay,
  .code-block-header .code-copy-btn,
  .heading-anchor {
    display: none !important;
  }

  .code-block-wrapper {
    break-inside: avoid;
    border: 1px solid #ccc;
  }

  .neumorphism-markdown {
    display: block;
  }

  .neumorphism-markdown-body {
    max-width: none;
  }

  .neumorphism-markdown-content {
    font-size: 13px;
    line-height: 1.6;
    color: #000;
  }

  .neumorphism-markdown-content a {
    color: #000;
    text-decoration: underline;
  }

  .neumorphism-markdown-content pre,
  .neumorphism-markdown-content code {
    background: #f5f5f5;
    border: 1px solid #ddd;
  }

  .neumorphism-markdown-content table {
    border: 1px solid #ddd;
  }

  .neumorphism-markdown-content th,
  .neumorphism-markdown-content td {
    border-bottom: 1px solid #ddd;
  }
}

/* ==========================================
   prefers-reduced-motion
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .heading-anchor,
  .checkmark,
  .neumorphism-toc-mobile-btn,
  .neumorphism-toc-drawer-enter-active,
  .neumorphism-toc-drawer-leave-active {
    transition: none !important;
  }

  .neumorphism-toc-drawer-enter-from,
  .neumorphism-toc-drawer-leave-to {
    opacity: 1;
  }
}
</style>
