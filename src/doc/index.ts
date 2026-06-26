/**
 * @echolab-auto/ui-frame/doc — 文档渲染模块
 *
 * 提供 Markdown 渲染、文档查看器和编辑器组件，
 * 以及文档解析和树形结构工具。
 *
 * @example
 * ```ts
 * import { DocViewer, MarkdownRenderer, DocEditor, MarkdownEditor } from '@echolab-auto/ui-frame/doc'
 * import type { ProDocNode, DocTree, DocViewerProps, MarkdownRendererProps } from '@echolab-auto/ui-frame/doc'
 * ```
 */

// === Vue 组件 ===
export { default as DocViewer } from './DocViewer.vue'
export type { DocViewerProps } from './DocViewer.vue'

export { default as MarkdownRenderer } from './MarkdownRenderer.vue'
export type { MarkdownRendererProps } from './MarkdownRenderer.vue'

export { default as DocEditor } from './DocEditor.vue'
export type { DocEditorProps } from './DocEditor.vue'

export { default as MarkdownEditor } from './MarkdownEditor.vue'
export type { MarkdownEditorProps } from './MarkdownEditor.vue'

// === 核心类型 ===
export type { ProDocNode, DocTree, ProDocOptions } from './types.js'

// === 解析器 ===
export { parseFrontmatter, pathToId, extractTitle, createNode, buildDocTree } from './parser.js'

// === 文档树工具 ===
export { createDocTree, flattenDocTree, getAncestors } from './doc-tree.js'

// === 树节点转换 ===
export { getNodeIcon, nodeToTreeData } from './tree-utils.js'
export type { DocTreeNode } from './tree-utils.js'

// === 共享布局逻辑 ===
export { useDocLayout } from './useDocLayout'
export type { UseDocLayoutOptions, UseDocLayoutReturn } from './useDocLayout'
