<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismBadge from '@/components/NeumorphismBadge/NeumorphismBadge.vue'
import { generateId } from '@/utils'

export interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string
  /** 自定义样式类名 */
  className?: string
  /** 是否显示目录 */
  showToc?: boolean
  /** 滚动容器（HTMLElement 或 CSS 选择器）。不传则自动查找 .nm-layout__content */
  scrollContainer?: HTMLElement | string
}

const props = withDefaults(defineProps<MarkdownRendererProps>(), {
  className: '',
  showToc: true,
})

const emit = defineEmits<{
  (e: 'docLink', path: string): void
}>()

const contentRef = ref<HTMLDivElement | null>(null)
const activeHeading = ref('')
const showMobileToc = ref(false)

/** 实例级唯一前缀，避免多实例 id 冲突 */
const tocPrefix = generateId('toc')

/** 生成带前缀的唯一 heading id */
function makeUniqueId(text: string): string {
  return `${tocPrefix}-${slugify(text)}`
}

// ==========================================
// 模块级正则 — 避免每次调用重复编译
// ==========================================
const COMMENT_RE = /(\/\/.*$|\/\*[\s\S]*?\*\/|#\s+.*$|--.*$)/gm
const STRING_RE = /(&quot;.*?&quot;|\'.*?\'|`.*?`)/g
const KEYWORD_RE =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|default|try|catch|finally|throw|new|this|typeof|instanceof|class|extends|import|export|from|async|await|yield|static|public|private|protected|interface|type|enum|namespace|module|declare|abstract|readonly|implements|void|number|string|boolean|any|never|unknown|null|undefined|true|false)\b/g
const FUNCTION_RE = /\b([a-zA-Z_]\w*)(?=\()/g
const NUMBER_RE = /\b(\d+\.?\d*)\b/g
const TYPE_RE = /\b([A-Z][a-zA-Z0-9_]*)\b/g

/** 简易代码高亮 */
function highlightCode(code: string, lang?: string): string {
  if (!lang || lang === 'text' || lang === 'plain') {
    return escapeHtml(code)
  }
  let html = escapeHtml(code)
  html = html.replace(COMMENT_RE, '<span class="token-comment">$1</span>')
  html = html.replace(STRING_RE, '<span class="token-string">$1</span>')
  html = html.replace(KEYWORD_RE, '<span class="token-keyword">$1</span>')
  html = html.replace(FUNCTION_RE, '<span class="token-function">$1</span>')
  html = html.replace(NUMBER_RE, '<span class="token-number">$1</span>')
  html = html.replace(TYPE_RE, '<span class="token-type">$1</span>')
  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
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

function extractToc(content: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = []
  const tokens = marked.lexer(content)
  for (const token of tokens) {
    if (token.type === 'heading') {
      const text = extractTextFromTokens(token.tokens as unknown[])
      headings.push({
        level: token.depth,
        text,
        id: makeUniqueId(text),
      })
    }
  }
  return headings
}

// ==========================================
// 预创建 Renderer 实例 — 避免每次 content 变化都重建
// ==========================================
const renderer = new marked.Renderer()

renderer.heading = ({ tokens, depth }) => {
  const text = extractTextFromTokens(tokens as unknown[])
  const id = makeUniqueId(text)
  return `<h${depth} id="${id}"><a href="#${id}" class="heading-anchor" aria-hidden="true">#</a>${text}</h${depth}>`
}

renderer.code = ({ text, lang }) => {
  const language = lang || 'text'
  const highlighted = highlightCode(text, lang)
  const lines = text.split('\n').length
  const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1)
    .map(n => `<span class="line-num">${n}</span>`)
    .join('')
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang">${language}</span>
        <span class="code-lines">${lines} lines</span>
        <button class="code-copy-btn" data-code="${escapeHtml(text)}">复制</button>
      </div>
      <div class="code-block-body">
        <div class="line-numbers">${lineNumbers}</div>
        <pre><code class="language-${language}">${highlighted}</code></pre>
      </div>
    </div>
  `
}

renderer.codespan = ({ text }) => {
  return `<code class="inline-code">${escapeHtml(text)}</code>`
}

renderer.image = ({ href, title, text }) => {
  return `<img src="${href}" alt="${text}" title="${title || ''}" loading="lazy" />`
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

/** 渲染后的 HTML */
const renderedHtml = computed(() => {
  return marked.parse(props.content, {
    async: false,
    gfm: true,
    breaks: false,
    renderer,
  }) as string
})

/** 目录 */
const toc = computed(() => extractToc(props.content))

/** 滚动到指定 heading */
function scrollToHeading(id: string) {
  contentRef.value?.querySelector(`[id="${id}"]`)?.scrollIntoView({ behavior: 'smooth' })
}

/** 滚动到指定 heading 并关闭移动端 TOC */
function scrollToHeadingAndClose(id: string) {
  scrollToHeading(id)
  showMobileToc.value = false
}

/** 统一处理内容区点击：复制按钮 + 文档链接 */
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // 1. 处理代码复制按钮
  const copyBtn = target.closest('.code-copy-btn') as HTMLButtonElement | null
  if (copyBtn) {
    const code = copyBtn.dataset.code
    if (code) {
      e.preventDefault()
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyBtn.textContent
        copyBtn.textContent = '已复制!'
        setTimeout(() => {
          if (copyBtn) copyBtn.textContent = originalText
        }, 1500)
      })
    }
    return
  }

  // 2. 处理文档链接拦截
  const link = target.closest('a')
  if (link) {
    const href = link.getAttribute('href')
    if (href && (href.startsWith('/') || href.startsWith('.') || href.endsWith('.md'))) {
      e.preventDefault()
      emit('docLink', href)
    }
  }
}

/** 解析滚动容器：优先使用 prop，其次查找 .nm-layout__content */
function resolveScrollContainer(): HTMLElement | null {
  if (!contentRef.value) return null
  if (props.scrollContainer instanceof HTMLElement) {
    return props.scrollContainer
  }
  if (typeof props.scrollContainer === 'string') {
    return contentRef.value.closest(props.scrollContainer) as HTMLElement | null
  }
  return contentRef.value.closest('.nm-layout__content') as HTMLElement | null
}

/** 监听滚动，高亮当前目录项 */
function handleScroll() {
  const main = resolveScrollContainer()
  if (!main) return
  const headings = contentRef.value?.querySelectorAll('h1, h2, h3')
  if (!headings) return
  let current = ''
  for (const h of headings) {
    const rect = h.getBoundingClientRect()
    const containerRect = main.getBoundingClientRect()
    if (rect.top - containerRect.top <= 120) {
      current = h.id
    } else {
      break
    }
  }
  activeHeading.value = current
}

/** 节流 */
function throttle(fn: () => void, wait: number): () => void {
  let lastTime = 0
  let rafId: number | null = null
  return () => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      fn()
    } else if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null
        fn()
      })
    }
  }
}

const throttledHandleScroll = throttle(handleScroll, 80)

// 挂载后监听滚动
let activeScrollContainer: HTMLElement | null = null

watch(contentRef, (el, oldEl) => {
  if (oldEl) {
    const oldContainer = resolveScrollContainer()
    oldContainer?.removeEventListener('scroll', throttledHandleScroll)
  }
  if (el) {
    nextTick(() => {
      activeScrollContainer = resolveScrollContainer()
      activeScrollContainer?.addEventListener('scroll', throttledHandleScroll)
      // 初始同步高亮
      handleScroll()
    })
  }
})

// 卸载时清理
onBeforeUnmount(() => {
  activeScrollContainer?.removeEventListener('scroll', throttledHandleScroll)
})
</script>

<template>
  <div :class="`neumorphism-markdown ${props.className}`">
    <!-- Markdown 内容 -->
    <div class="neumorphism-markdown-body">
      <div
        ref="contentRef"
        class="neumorphism-markdown-content"
        @click="handleContentClick"
        v-html="renderedHtml"
      />
    </div>

    <!-- 目录侧边栏（桌面端） -->
    <nav v-if="showToc && toc.length > 0" class="neumorphism-toc" aria-label="文档目录">
      <NeumorphismCard :elevation="-2" no-padding class="neumorphism-toc-card">
        <div class="neumorphism-toc-header">
          <span>📑 目录</span>
          <NeumorphismBadge :value="toc.length" />
        </div>
        <ul class="neumorphism-toc-list" role="list">
          <li
            v-for="item in toc"
            :key="item.id"
            :class="`neumorphism-toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''}`"
            role="listitem"
          >
            <a
              href="#"
              role="button"
              :aria-current="activeHeading === item.id ? 'location' : undefined"
              @click.prevent="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </NeumorphismCard>
    </nav>

    <!-- 移动端 TOC 浮动按钮 -->
    <button
      v-if="showToc && toc.length > 0"
      class="neumorphism-toc-mobile-btn"
      :class="{ active: showMobileToc }"
      aria-label="切换目录"
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
            <span class="neumorphism-toc-mobile-title">📑 目录</span>
            <button
              class="neumorphism-toc-mobile-close"
              aria-label="关闭目录"
              @click="showMobileToc = false"
            >
              ✕
            </button>
          </div>
          <ul class="neumorphism-toc-list" role="list">
            <li
              v-for="item in toc"
              :key="item.id"
              :class="`neumorphism-toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''}`"
              role="listitem"
            >
              <a
                href="#"
                role="button"
                :aria-current="activeHeading === item.id ? 'location' : undefined"
                @click.prevent="scrollToHeadingAndClose(item.id)"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </NeumorphismCard>
      </div>
    </Transition>
  </div>
</template>

<style>
.neumorphism-markdown {
  display: flex;
  gap: 28px;
}

.neumorphism-markdown-body {
  flex: 1;
  min-width: 0;
}

/* TOC */
.neumorphism-toc {
  width: 220px;
  min-width: 200px;
  max-height: calc(100vh - 180px);
  position: sticky;
  top: 16px;
  align-self: flex-start;
}

.neumorphism-toc-card {
  background-color: var(--nm-surface-raised);
}

.neumorphism-toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 10px 16px;
  font-size: 10px;
  font-weight: 700;
  color: var(--nm-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--nm-border-subtle);
  margin-bottom: 8px;
}

.neumorphism-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.neumorphism-toc-item a {
  display: block;
  padding: 5px 16px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-right: 2px solid transparent;
  transition:
    color 0.2s ease,
    border-right-color 0.2s ease,
    background-color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.neumorphism-toc-item.level-1 a {
  padding-right: 16px;
}
.neumorphism-toc-item.level-2 a {
  padding-right: 24px;
}
.neumorphism-toc-item.level-3 a {
  padding-right: 32px;
}
.neumorphism-toc-item.level-4 a {
  padding-right: 40px;
}
.neumorphism-toc-item.level-5 a {
  padding-right: 48px;
}
.neumorphism-toc-item.level-6 a {
  padding-right: 56px;
}

.neumorphism-toc-item a:hover {
  color: var(--nm-primary-color);
  border-right-color: color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
}

.neumorphism-toc-item.active a {
  color: var(--nm-primary-color);
  border-right-color: var(--nm-primary-color);
  background: color-mix(in srgb, var(--nm-primary-color) 12%, transparent);
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
  font-family: 'SF Mono', 'Cascadia Code', Monaco, 'Fira Code', 'Cousine', monospace;
  color: var(--nm-primary-color);
  border: 1px solid var(--nm-border-subtle);
}

.code-block-wrapper {
  margin: 0 0 20px 0;
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border: 1px solid var(--nm-border-subtle);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--nm-border-subtle);
}

.code-lang {
  font-size: 11px;
  font-weight: 700;
  color: var(--nm-primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'SF Mono', 'Cascadia Code', Monaco, 'Fira Code', 'Cousine', monospace;
}

.code-lines {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  font-family: 'SF Mono', 'Cascadia Code', Monaco, 'Fira Code', 'Cousine', monospace;
  margin-left: auto;
  margin-right: 12px;
}

.code-copy-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  font-size: 11px;
  font-weight: 500;
  color: var(--nm-text-secondary);
  background-color: var(--nm-surface-color);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.code-copy-btn:hover {
  color: var(--nm-primary-color);
}

.code-copy-btn.copied {
  background-color: var(--nm-primary-color);
  color: #fff;
}

.code-block-body {
  display: flex;
  overflow-x: auto;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: 14px 0 14px 14px;
  flex-shrink: 0;
  user-select: none;
  border-right: 1px solid var(--nm-border-subtle);
}

.line-num {
  font-size: 12px;
  line-height: 1.65;
  color: var(--nm-text-placeholder);
  font-family: 'SF Mono', 'Cascadia Code', Monaco, 'Fira Code', 'Cousine', monospace;
  text-align: right;
  padding-right: 14px;
  min-width: 28px;
}

.code-block-body pre {
  flex: 1;
  margin: 0;
  padding: 14px 20px;
  background: transparent;
  overflow-x: auto;
  box-shadow: none;
}

.code-block-body pre code {
  display: block;
  font-size: 13px;
  line-height: 1.65;
  font-family: 'SF Mono', 'Cascadia Code', Monaco, 'Fira Code', 'Cousine', monospace;
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.token-comment {
  color: var(--nm-code-comment);
  font-style: italic;
}
.token-string {
  color: var(--nm-code-string);
}
.token-keyword {
  color: var(--nm-code-keyword);
  font-weight: 600;
}
.token-function {
  color: var(--nm-code-function);
}
.token-number {
  color: var(--nm-code-number);
}
.token-type {
  color: var(--nm-code-type);
}
.token-operator {
  color: var(--nm-code-operator);
}
.token-punctuation {
  color: var(--nm-code-punctuation);
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
.neumorphism-toc-item a:focus-visible,
.neumorphism-markdown-content a:focus-visible,
.code-copy-btn:focus-visible,
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
  .neumorphism-toc {
    display: none;
  }

  .neumorphism-toc-mobile-btn,
  .neumorphism-toc-mobile-overlay {
    display: block;
  }
}

/* ==========================================
   prefers-reduced-motion
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .neumorphism-toc-item a,
  .heading-anchor,
  .code-copy-btn,
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
