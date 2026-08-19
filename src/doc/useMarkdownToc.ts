import { computed, type ComputedRef, type Ref } from 'vue'
import { marked } from 'marked'
import { generateId, slugify } from '@/utils'

/** 扁平目录项（heading 提取结果） */
export interface TocItem {
  level: number
  text: string
  id: string
}

/** 层级目录节点 */
export interface TocNode {
  level: number
  text: string
  id: string
  children: TocNode[]
}

export interface UseMarkdownTocReturn {
  /** 扁平 heading 列表（含实例级唯一 id） */
  toc: ComputedRef<TocItem[]>
  /** 由扁平列表构建的层级树 */
  tocTree: ComputedRef<TocNode[]>
  /** 生成带实例前缀的唯一 heading id（渲染管线兜底用） */
  makeUniqueId: (text: string) => string
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

/**
 * Headless 目录提取 —— 从 markdown 内容提取 heading 列表并构建层级树。
 * id 带实例级唯一前缀（避免多实例冲突），同名标题自动去重加后缀。
 */
export function useMarkdownToc(content: Ref<string>): UseMarkdownTocReturn {
  /** 实例级唯一前缀，避免多实例 id 冲突 */
  const tocPrefix = generateId('toc')

  /** 生成带前缀的唯一 heading id */
  function makeUniqueId(text: string): string {
    return `${tocPrefix}-${slugify(text)}`
  }

  function extractToc(text: string): TocItem[] {
    const headings: TocItem[] = []
    const usedIds = new Set<string>()
    const tokens = marked.lexer(text)
    for (const token of tokens) {
      if (token.type === 'heading') {
        const headingText = extractTextFromTokens(token.tokens as unknown[])
        let baseSlug = slugify(headingText)
        if (!baseSlug) baseSlug = 'heading'
        let id = `${tocPrefix}-${baseSlug}`
        let suffix = 1
        while (usedIds.has(id)) {
          id = `${tocPrefix}-${baseSlug}-${suffix}`
          suffix++
        }
        usedIds.add(id)
        headings.push({
          level: token.depth,
          text: headingText,
          id,
        })
      }
    }
    return headings
  }

  const toc = computed(() => extractToc(content.value))

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

  return { toc, tocTree, makeUniqueId }
}
