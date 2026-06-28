<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismBadge from '@/components/NeumorphismBadge/NeumorphismBadge.vue'
import { generateId } from '@/utils'
import { useLocale } from '@/composables/useLocale'

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

interface TocNode {
  level: number
  text: string
  id: string
  children: TocNode[]
}

interface FlatTocItem {
  level: number
  text: string
  id: string
  hasChildren: boolean
}

const props = withDefaults(defineProps<MarkdownRendererProps>(), {
  className: '',
  showToc: true,
})

const emit = defineEmits<{
  (e: 'docLink', path: string): void
}>()

const contentRef = ref<HTMLDivElement | null>(null)
const tocNavRef = ref<HTMLElement | null>(null)
const activeHeading = ref('')
const showMobileToc = ref(false)
const collapsedGroups = ref<Set<string>>(new Set())

const { t } = useLocale()

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

  // Mermaid diagram support (optional, loaded dynamically on-mounted)
  if (lang === 'mermaid') {
    return `<div class="mermaid-diagram" data-mermaid="${escapeHtml(text)}"><pre><code>${escapeHtml(text)}</code></pre></div>`
  }

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

/** 渲染错误状态 */
const renderError = ref<string | null>(null)

/** 渲染后的 HTML */
const renderedHtml = ref('')

function doRender() {
  renderError.value = null
  try {
    renderedHtml.value = marked.parse(props.content, {
      async: false,
      gfm: true,
      breaks: false,
      renderer,
    }) as string
  } catch (err) {
    renderError.value = (err as Error).message || 'Unknown error rendering markdown'
    renderedHtml.value = ''
  }
}

watch(() => props.content, doRender, { immediate: true })

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

// content 或 renderedHtml 变化后尝试渲染 mermaid 图表
watch(renderedHtml, () => {
  nextTick(() => {
    renderMermaidDiagrams()
  })
})

/** 目录 */
const toc = computed(() => extractToc(props.content))

/** 将扁平 TOC 构建为层级树 */
const tocTree = computed(() => {
  const items = toc.value
  const root: TocNode[] = []
  const stack: TocNode[] = []

  for (const item of items) {
    const node: TocNode = { level: item.level, text: item.text, id: item.id, children: [] }

    // 弹出栈中 level >= 当前节点的项，找到父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return root
})

/** 将树展平为可见项列表（尊重折叠状态） */
const visibleToc = computed(() => {
  const result: FlatTocItem[] = []

  function walk(nodes: TocNode[]) {
    for (const node of nodes) {
      result.push({
        level: node.level,
        text: node.text,
        id: node.id,
        hasChildren: node.children.length > 0,
      })
      if (node.children.length > 0 && !collapsedGroups.value.has(node.id)) {
        walk(node.children)
      }
    }
  }

  walk(tocTree.value)
  return result
})

/** 滚动到指定 heading */
function scrollToHeading(id: string) {
  contentRef.value?.querySelector(`[id="${id}"]`)?.scrollIntoView({ behavior: 'smooth' })
}

/** 滚动到指定 heading 并关闭移动端 TOC */
function scrollToHeadingAndClose(id: string) {
  scrollToHeading(id)
  showMobileToc.value = false
}

/** 切换 TOC 节点折叠状态 */
function toggleCollapse(id: string) {
  const next = new Set(collapsedGroups.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  collapsedGroups.value = next
}

/** 查询 TOC 节点是否已折叠 */
function isCollapsed(id: string): boolean {
  return collapsedGroups.value.has(id)
}

/** 将 TOC 侧边栏滚动到当前激活项（仅桌面端可见时执行） */
function scrollTocToActive() {
  if (!tocNavRef.value) return
  // 桌面端 TOC 隐藏时（移动端），跳过滚动
  if (window.innerWidth <= 1100) return
  const activeEl = tocNavRef.value.querySelector(
    '.neumorphism-toc-item.active'
  ) as HTMLElement | null
  if (activeEl) {
    activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
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
        copyBtn.textContent = t('markdownCodeCopied')
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

/**
 * 从给定元素向上查找滚动容器。
 * 接受可选 fromEl 用于组件卸载/切换时基于旧 DOM 节点清理。
 */
function resolveScrollContainer(fromEl?: HTMLElement): HTMLElement | null {
  const el = fromEl ?? contentRef.value
  if (!el) return null
  if (props.scrollContainer instanceof HTMLElement) {
    return props.scrollContainer
  }
  if (typeof props.scrollContainer === 'string') {
    return el.closest(props.scrollContainer) as HTMLElement | null
  }
  return el.closest('.nm-layout__content') as HTMLElement | null
}

/** 动态获取 header 高度（用于 scroll-spy 偏移计算） */
function getHeaderHeight(scrollContainer?: HTMLElement): number {
  const container = scrollContainer ?? resolveScrollContainer()
  if (!container) return 64

  const layout = container.closest('.nm-layout') as HTMLElement | null
  const header = layout?.querySelector('.nm-layout__header') as HTMLElement | null
  if (header) {
    return header.getBoundingClientRect().height
  }
  return 64
}

/** 监听滚动，高亮当前目录项并同步 TOC 滚动位置 */
function handleScroll() {
  const main = resolveScrollContainer()
  if (!main) return
  const headings = contentRef.value?.querySelectorAll('h1, h2, h3')
  if (!headings) return
  const scrollSpyOffset = getHeaderHeight(main) + 20
  let current = ''
  for (const h of headings) {
    const rect = h.getBoundingClientRect()
    const containerRect = main.getBoundingClientRect()
    if (rect.top - containerRect.top <= scrollSpyOffset) {
      current = h.id
    } else {
      break
    }
  }
  if (current !== activeHeading.value) {
    activeHeading.value = current
    nextTick(() => scrollTocToActive())
  }
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
  // 基于旧 DOM 节点清理，修复组件切换时 ref 已置 null 导致清理失败的 bug
  if (oldEl) {
    const oldContainer = resolveScrollContainer(oldEl)
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

/** autoHeading 变化时，自动展开被折叠的祖先节点 */
watch(activeHeading, newId => {
  if (!newId) return

  function findAndExpand(nodes: TocNode[]): boolean {
    for (const node of nodes) {
      if (node.id === newId) return true
      if (findAndExpand(node.children)) {
        if (collapsedGroups.value.has(node.id)) {
          const next = new Set(collapsedGroups.value)
          next.delete(node.id)
          collapsedGroups.value = next
        }
        return true
      }
    }
    return false
  }

  findAndExpand(tocTree.value)
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
    <nav
      v-if="showToc && toc.length > 0"
      ref="tocNavRef"
      class="neumorphism-toc"
      :aria-label="t('markdownTocLabel')"
    >
      <NeumorphismCard :elevation="-2" no-padding class="neumorphism-toc-card">
        <div class="neumorphism-toc-header">
          <span>📑 {{ t('markdownTocLabel') }}</span>
          <NeumorphismBadge :value="toc.length" />
        </div>
        <ul class="neumorphism-toc-list" role="list">
          <li
            v-for="item in visibleToc"
            :key="item.id"
            :class="`neumorphism-toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''} ${item.hasChildren ? 'has-children' : ''}`"
            role="listitem"
          >
            <a
              href="#"
              role="button"
              :aria-current="activeHeading === item.id ? 'location' : undefined"
              @click.prevent="scrollToHeading(item.id)"
            >
              <button
                v-if="item.hasChildren"
                class="toc-toggle"
                :aria-label="
                  isCollapsed(item.id) ? t('markdownTocExpand') : t('markdownTocCollapse')
                "
                @click.stop.prevent="toggleCollapse(item.id)"
              >
                {{ isCollapsed(item.id) ? '▸' : '▾' }}
              </button>
              <span class="toc-text">{{ item.text }}</span>
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
          <ul class="neumorphism-toc-list" role="list">
            <li
              v-for="item in visibleToc"
              :key="item.id"
              :class="`neumorphism-toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''} ${item.hasChildren ? 'has-children' : ''}`"
              role="listitem"
            >
              <a
                href="#"
                role="button"
                :aria-current="activeHeading === item.id ? 'location' : undefined"
                @click.prevent="scrollToHeadingAndClose(item.id)"
              >
                <button
                  v-if="item.hasChildren"
                  class="toc-toggle"
                  :aria-label="
                    isCollapsed(item.id) ? t('markdownTocExpand') : t('markdownTocCollapse')
                  "
                  @click.stop.prevent="toggleCollapse(item.id)"
                >
                  {{ isCollapsed(item.id) ? '▸' : '▾' }}
                </button>
                <span class="toc-text">{{ item.text }}</span>
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

/* TOC — sticky sidebar that floats alongside content when scrolling */
.neumorphism-toc {
  width: 220px;
  min-width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 10;
  /* Scrollbar styling for the TOC itself */
  scrollbar-width: thin;
  scrollbar-color: var(--nm-surface-raised) transparent;
}
.neumorphism-toc::-webkit-scrollbar {
  width: 5px;
}
.neumorphism-toc::-webkit-scrollbar-track {
  background: transparent;
}
.neumorphism-toc::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--nm-text-placeholder) 25%, transparent);
  border-radius: 3px;
}
.neumorphism-toc::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--nm-text-secondary) 40%, transparent);
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
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px 5px 0;
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

/* 层级左侧缩进 */
.neumorphism-toc-item.level-1 a {
  padding-left: 16px;
}
.neumorphism-toc-item.level-2 a {
  padding-left: 32px;
}
.neumorphism-toc-item.level-3 a {
  padding-left: 48px;
}
.neumorphism-toc-item.level-4 a {
  padding-left: 64px;
}
.neumorphism-toc-item.level-5 a {
  padding-left: 80px;
}
.neumorphism-toc-item.level-6 a {
  padding-left: 96px;
}

/* 有子项的标题略微加粗 */
.neumorphism-toc-item.has-children > a .toc-text {
  font-weight: 500;
}

/* TOC 折叠/展开按钮 */
.toc-toggle {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background: transparent;
  color: var(--nm-text-placeholder);
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
  font-family: monospace;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.toc-toggle:hover {
  color: var(--nm-primary-color);
  background-color: color-mix(in srgb, var(--nm-primary-color) 10%, transparent);
}

.toc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-family: var(--nm-font-mono);
}

.code-lines {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
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
  font-family: var(--nm-font-mono);
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
  font-family: var(--nm-font-mono);
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
   Print stylesheet
   ========================================== */
@media print {
  .neumorphism-toc,
  .neumorphism-toc-mobile-btn,
  .neumorphism-toc-mobile-overlay,
  .code-copy-btn,
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
