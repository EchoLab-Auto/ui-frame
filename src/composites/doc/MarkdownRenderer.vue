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
  type VNode,
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
  (
    e: 'flowNodeMove',
    payload: { id: string; x: number; y: number; source: string; blockIndex: number }
  ): void
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

renderer.listitem = function (
  this: InstanceType<typeof marked.Renderer>,
  { tokens, task, checked }
) {
  if (task) {
    // 任务列表：首个 token 为 checkbox，其余内容做完整块级解析（行内格式生效）
    const body = this.parser.parse(tokens.slice(1))
    return `
      <li class="task-list-item">
        <label class="task-checkbox">
          <input type="checkbox" ${checked ? 'checked' : ''} disabled />
          <span class="checkmark"></span>
          <span class="task-text">${body}</span>
        </label>
      </li>
    `
  }
  // 默认行为：块级解析 item tokens（行内格式 **加粗**、`code`、链接等正常生效）
  return `<li>${this.parser.parse(tokens)}</li>`
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

    let seq = 0
    for (const el of Array.from(diagrams)) {
      // 图源取 data-mermaid 属性（DOM 解析后实体已还原）。
      // 不能用 mermaid.run({ nodes })：它读取元素 innerHTML，会把
      // 展示用的 <pre><code> 包装标签一并喂给解析器，导致必然语法错误
      const source = el.getAttribute('data-mermaid') ?? el.textContent ?? ''
      if (!source.trim()) continue
      try {
        const { svg } = await mermaid.default.render(`nm-mermaid-${Date.now()}-${seq++}`, source)
        el.innerHTML = svg
        el.setAttribute('data-processed', 'true')
      } catch {
        // 单图渲染失败时保留该图的 <pre><code> 回退，不影响其他图
      }
    }
  } catch {
    // Mermaid 不可用时，保留原始的 <pre><code> 回退
  }
}

// content 或 renderedHtml 变化后重跑后处理（mermaid 替换 + 流程画布/代码块挂载）
watch(renderedHtml, () => {
  // v-html 即将替换 innerHTML —— 先把存活子树的根节点摘下暂存，
  // runPostRender 里同源占位可直接认领（保活组件状态，避免流式更新全量重建）
  stashMountedBlocks()
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
  cleanupUnclaimedBlocks()
}

// ==========================================
// 手动挂载管线（占位 → Vue 子树：流程画布 / 代码块）
// ==========================================
// 登记制：每个被替换的占位元素都记录在案，内容更新前与组件卸载时统一清理。
// 保活机制：v-html 全量替换 DOM 时，同源（key 相同）的子树根节点被整体迁移到
// 新占位下继续存活（复制反馈态、块内滚动位置不丢失），只有真正消失/变更的
// 子树才走 render(null) 卸载。
interface MountedBlock {
  key: string
  /** 子树根节点（随 DOM 迁移而换父级） */
  rootEl: HTMLElement
  /**
   * render() 初次挂载的容器 —— Vue 的卸载凭证（container._vnode 关联），
   * 即使 DOM 已迁移，也必须用它调用 render(null, …) 才能正确卸载。
   */
  ownerContainer: HTMLElement
}

let mountedBlocks: MountedBlock[] = []
/** 待认领暂存：key → 同源候选队列（重复相同代码块按序认领） */
let pendingAdopt: Map<string, Array<{ rootEl: HTMLElement; ownerContainer: HTMLElement }>> | null =
  null

// 关键：手动 render 的子树默认没有应用上下文，useLocale / 全局配置注入会静默
// 回退默认值 —— 必须继承当前组件实例的 appContext
const currentInstance = getCurrentInstance()

function stashMountedBlocks(): void {
  const stash = new Map<string, Array<{ rootEl: HTMLElement; ownerContainer: HTMLElement }>>()
  for (const block of mountedBlocks) {
    const bucket = stash.get(block.key) ?? []
    bucket.push({ rootEl: block.rootEl, ownerContainer: block.ownerContainer })
    stash.set(block.key, bucket)
  }
  mountedBlocks = []
  pendingAdopt = stash
}

/** 暂存区无人认领的子树真正卸载（runPostRender 末尾调用） */
function cleanupUnclaimedBlocks(): void {
  if (!pendingAdopt) return
  for (const bucket of pendingAdopt.values()) {
    for (const item of bucket) {
      render(null, item.ownerContainer)
    }
  }
  pendingAdopt = null
}

/** 同源子树优先认领；否则全新挂载 */
function adoptOrMount(el: Element, key: string, createVnode: () => VNode): void {
  const bucket = pendingAdopt?.get(key)
  const candidate = bucket?.shift()
  if (bucket && bucket.length === 0) pendingAdopt?.delete(key)

  el.innerHTML = ''
  if (candidate) {
    el.appendChild(candidate.rootEl)
    mountedBlocks.push({
      key,
      rootEl: candidate.rootEl,
      ownerContainer: candidate.ownerContainer,
    })
    return
  }

  const vnode = createVnode()
  vnode.appContext = currentInstance?.appContext ?? null
  render(vnode, el as HTMLElement)
  const rootEl = el.firstElementChild as HTMLElement | null
  if (rootEl) {
    mountedBlocks.push({ key, rootEl, ownerContainer: el as HTMLElement })
  }
}

function mountFlowDiagrams(): void {
  if (!contentRef.value) return
  const placeholders = contentRef.value.querySelectorAll('.prodoc-flow-diagram')
  placeholders.forEach((el, blockIndex) => {
    // 源码从 <pre><code> 回退内容的 textContent 还原（实体自动解码）——
    // data-* 属性通道会被 DOMPurify 的 mXSS 规则剥除（值含 "-->"）
    const source = el.querySelector('pre code')?.textContent ?? el.textContent ?? ''
    const graph = parseProDocFlow(source)
    // 无有效节点（全非法/空源码）→ 保留 <pre> 源码回退
    if (graph.nodes.length === 0) return

    // blockIndex = 文档内第 N 个 prodoc-flow 块（含非法块的占位），
    // 与正文中 FLOW_BLOCK_RE 的匹配序一致，供宿主写回时按序号唯一定位
    adoptOrMount(el, `flow:${source}`, () =>
      h(DocFlowCanvas, {
        graph,
        height: '420px',
        editable: props.flowEditable,
        onNavigate: (path: string) => emit('docLink', path),
        onNodeMove: (p: { id: string; x: number; y: number }) =>
          emit('flowNodeMove', { ...p, source, blockIndex }),
      })
    )
  })
}

function mountCodeBlocks(): void {
  if (!contentRef.value) return
  const placeholders = contentRef.value.querySelectorAll('.doc-code-block-mount')
  for (const el of placeholders) {
    const source = el.querySelector('pre code')?.textContent ?? el.textContent ?? ''
    const lang = (el as HTMLElement).dataset.lang || 'text'
    adoptOrMount(el, `code:${lang}:${source}`, () => h(DocCodeBlock, { code: source, lang }))
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
  // 存活子树与暂存区（若有）全部经 ownerContainer 正确卸载
  for (const block of mountedBlocks) {
    render(null, block.ownerContainer)
  }
  mountedBlocks = []
  if (pendingAdopt) {
    for (const bucket of pendingAdopt.values()) {
      for (const item of bucket) {
        render(null, item.ownerContainer)
      }
    }
    pendingAdopt = null
  }
})
</script>

<template>
  <div :class="`neumorphism-markdown ${props.className}`">
    <!-- Markdown 内容 -->
    <div class="neumorphism-markdown-body">
      <div v-if="renderError" class="neumorphism-markdown-error" role="alert">
        <p class="neumorphism-markdown-error-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          渲染错误
        </p>
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
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </svg>
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
            <span class="neumorphism-toc-mobile-title"
              ><svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M8 6h13M8 12h13M8 18h13" />
                <circle cx="4" cy="6" r="1" />
                <circle cx="4" cy="12" r="1" />
                <circle cx="4" cy="18" r="1" />
              </svg>
              {{ t('markdownTocLabel') }}</span
            >
            <button
              class="neumorphism-toc-mobile-close"
              :aria-label="t('markdownTocClose')"
              @click="showMobileToc = false"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
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
  padding: var(--nm-spacing-xl);
  background: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-lg);
  border: 1px solid var(--nm-color-error);
}

.neumorphism-markdown-error-title {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-weight: 600;
  color: var(--nm-color-error);
  margin: 0 0 var(--nm-spacing-12);
}

.neumorphism-markdown-error-msg {
  font-family: var(--nm-font-mono);
  font-size: var(--nm-font-md);
  color: var(--nm-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: var(--nm-spacing-12);
  background: var(--nm-bg-color);
  border-radius: var(--nm-border-radius-sm);
}

/* Markdown content */
.neumorphism-markdown-content {
  line-height: 1.75;
  color: var(--nm-text-primary);
  font-size: var(--nm-font-lg);
}

.neumorphism-markdown-content h1,
.neumorphism-markdown-content h2,
.neumorphism-markdown-content h3,
.neumorphism-markdown-content h4,
.neumorphism-markdown-content h5,
.neumorphism-markdown-content h6 {
  margin-top: 36px;
  margin-bottom: var(--nm-spacing-md);
  font-weight: 600;
  color: var(--nm-text-primary);
  line-height: 1.25;
  letter-spacing: -0.3px;
  position: relative;
}

/* 标题梯度：映射到全局 heading 阶梯（文档语境降一档，h5 由 font 阶梯承接） */
.neumorphism-markdown-content h1 {
  font-size: var(--nm-heading-h2-size);
}
.neumorphism-markdown-content h2 {
  font-size: var(--nm-heading-h3-size);
}
.neumorphism-markdown-content h3 {
  font-size: var(--nm-heading-h4-size);
}
.neumorphism-markdown-content h4 {
  font-size: var(--nm-heading-h5-size);
}
.neumorphism-markdown-content h5 {
  font-size: var(--nm-font-lg);
}
.neumorphism-markdown-content h6 {
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
}

.heading-anchor {
  position: absolute;
  right: -22px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--nm-text-placeholder);
  text-decoration: none;
  font-size: var(--nm-font-xl);
  font-weight: 400;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

@media (hover: hover) {
  .neumorphism-markdown-content h1:hover .heading-anchor,
  .neumorphism-markdown-content h2:hover .heading-anchor,
  .neumorphism-markdown-content h3:hover .heading-anchor,
  .neumorphism-markdown-content h4:hover .heading-anchor,
  .neumorphism-markdown-content h5:hover .heading-anchor,
  .neumorphism-markdown-content h6:hover .heading-anchor {
    opacity: 1;
  }
}

@media (hover: hover) {
  .heading-anchor:hover {
    color: var(--nm-primary-color);
  }
}

.neumorphism-markdown-content p {
  margin: 0 0 var(--nm-spacing-md) 0;
  color: var(--nm-text-primary);
}

.neumorphism-markdown-content a {
  color: var(--nm-primary-color);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

@media (hover: hover) {
  .neumorphism-markdown-content a:hover {
    text-decoration: underline;
    opacity: 0.85;
  }
}

.neumorphism-markdown-content ul,
.neumorphism-markdown-content ol {
  margin: 0 0 var(--nm-spacing-md) 0;
  padding-left: var(--nm-spacing-lg);
  color: var(--nm-text-primary);
}

.neumorphism-markdown-content li {
  margin-bottom: var(--nm-spacing-6);
}

.neumorphism-markdown-content li::marker {
  color: var(--nm-text-placeholder);
}

.task-list-item {
  list-style: none;
  padding-left: 0;
  margin-left: var(--nm-spacing-neg-xs);
}

.task-checkbox {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-10);
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
  border: solid var(--nm-text-on-primary);
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
  padding: 3px var(--nm-spacing-sm);
  border-radius: var(--nm-border-radius-sm);
  font-size: 0.88em;
  font-family: var(--nm-font-mono);
  color: var(--nm-primary-color);
  border: 1px solid var(--nm-border-subtle);
}

.neumorphism-markdown-content blockquote {
  margin: 0 0 18px 0;
  padding: var(--nm-spacing-md) 22px;
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
  padding: var(--nm-spacing-12) var(--nm-spacing-md);
  border-bottom: 1px solid var(--nm-border-subtle);
  text-align: left;
}

.neumorphism-markdown-content th {
  background-color: var(--nm-bg-color);
  font-weight: 600;
  color: var(--nm-text-primary);
  font-size: var(--nm-font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.neumorphism-markdown-content td {
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
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
  margin: var(--nm-spacing-xl) 0;
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
  align-items: center;
  justify-content: center;
  color: var(--nm-text-secondary);
  position: fixed;
  right: 20px;
  bottom: 20px;
  /* 归位全局 z 体系：内容浮层档（dropdown=100），按钮浮于遮罩之上 */
  z-index: calc(var(--nm-z-dropdown) + 1);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  font-size: var(--nm-font-2xl);
  cursor: pointer;
  background-color: var(--nm-surface-color);
  box-shadow:
    6px 6px 12px var(--nm-shadow-dark),
    -6px -6px 12px var(--nm-shadow-light);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

@media (hover: hover) {
  .neumorphism-toc-mobile-btn:hover {
    transform: scale(1.05);
  }
}

.neumorphism-toc-mobile-btn.active {
  background-color: var(--nm-primary-color);
  color: var(--nm-surface-color);
}

.neumorphism-toc-mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: var(--nm-z-dropdown);
  background-color: var(--nm-mask-bg);
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
  padding: var(--nm-spacing-12) var(--nm-spacing-md);
  border-bottom: 1px solid var(--nm-border-subtle);
}

.neumorphism-toc-mobile-title {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-size: var(--nm-font-sm);
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

@media (hover: hover) {
  .neumorphism-toc-mobile-close:hover {
    color: var(--nm-primary-color);
  }
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
/* 断点取系统集 xl=1200（与 DocTocNav 的侧 TOC 收起配对） */
@media (max-width: 1200px) {
  .neumorphism-toc-mobile-btn {
    display: flex;
  }

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
    font-size: var(--nm-font-md);
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
