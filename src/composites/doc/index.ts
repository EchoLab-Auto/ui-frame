/**
 * @echolab-auto/ui-frame/doc — 文档渲染模块（组合组件模块）
 *
 * 提供 Markdown 渲染、文档查看器和编辑器组件，
 * 以及文档解析和树形结构工具。
 *
 * 模块内部分两层（分类定义见 document/user/components.md「组件分层」）：
 * - **组合组件**：DocViewer / DocEditor / MarkdownRenderer / MarkdownEditor /
 *   DocFlowCanvas —— 由主库基础组件拼装，消费 ProDocNode / ProDocFlowGraph
 *   数据契约，纯渲染层（不持业务状态、不发网络请求）
 * - **元组件**：DocCodeBlock / DocTocNav / TocNodeItem —— 纯 UI 原语，
 *   零领域类型，性质上属于基础组件，可脱离本模块自由组装
 *
 * @example
 * ```ts
 * import { DocViewer, MarkdownRenderer, DocEditor, MarkdownEditor } from '@echolab-auto/ui-frame/doc'
 * import type { ProDocNode, DocTree, DocViewerProps, MarkdownRendererProps } from '@echolab-auto/ui-frame/doc'
 * ```
 */

/**
 * 组件分类元数据：composite 为组合组件（数据契约驱动），
 * meta 为元组件（纯 UI 原语，归基础组件层）。
 */
export const componentCategories = {
  composite: ['DocViewer', 'DocEditor', 'MarkdownRenderer', 'MarkdownEditor', 'DocFlowCanvas'],
  meta: ['DocCodeBlock', 'DocTocNav', 'TocNodeItem'],
} as const

// === 组合组件（数据契约驱动，现成可用） ===

/** @category 组合组件 */
export { default as DocViewer } from './DocViewer.vue'
export type { DocViewerProps } from './DocViewer.vue'

/** @category 组合组件 */
export { default as MarkdownRenderer } from './MarkdownRenderer.vue'
export type { MarkdownRendererProps } from './MarkdownRenderer.vue'

/** @category 组合组件 */
export { default as DocEditor } from './DocEditor.vue'
export type { DocEditorProps } from './DocEditor.vue'

/** @category 组合组件 */
export { default as MarkdownEditor } from './MarkdownEditor.vue'
export type { MarkdownEditorProps } from './MarkdownEditor.vue'

/** @category 组合组件 */
export { default as DocFlowCanvas } from './DocFlowCanvas.vue'
export type { DocFlowCanvasProps } from './DocFlowCanvas.vue'

// === 元组件（纯 UI 原语，归基础组件层） ===

/** @category 元组件 */
export { default as DocCodeBlock } from './DocCodeBlock.vue'
export type { DocCodeBlockProps } from './DocCodeBlock.vue'

/** @category 元组件 */
export { default as DocTocNav } from './DocTocNav.vue'
export type { DocTocNavProps } from './DocTocNav.vue'

/** @category 元组件 */
export { default as TocNodeItem } from './TocNodeItem.vue'

// === Headless 元逻辑 ===
export { useMarkdownToc } from './useMarkdownToc'
export type { TocItem, TocNode, UseMarkdownTocReturn } from './useMarkdownToc'

export { useScrollSpy, getScrollBehavior } from './useScrollSpy'
export type { UseScrollSpyOptions, UseScrollSpyReturn } from './useScrollSpy'

export { highlightCode } from './highlight'

// === 核心类型 ===
export type { ProDocNode, DocTree, ProDocOptions } from './types.js'
export type {
  ProDocFlowDirection,
  ProDocFlowNodeShape,
  ProDocFlowNode,
  ProDocFlowEdge,
  ProDocFlowError,
  ProDocFlowGraph,
} from './types.js'

// === 解析器 ===
export { parseFrontmatter, pathToId, extractTitle, createNode, buildDocTree } from './parser.js'

// === 流程图（prodoc-flow） ===
export { parseProDocFlow, extractFlowBlocks, writeFlowNodePosition } from './flow-parser.js'
export { layoutProDocFlow } from './flow-layout.js'
export type { FlowLayoutNode, FlowLayoutEdge, FlowLayoutResult } from './flow-layout.js'
export { resolveCanvasGraph, buildHierarchyGraph } from './flow-graph.js'

// === 文档树工具 ===
export { createDocTree, flattenDocTree, getAncestors } from './doc-tree.js'

// === 树节点转换 ===
export { getNodeIcon, nodeToTreeData } from './tree-utils.js'
export type { DocTreeNode } from './tree-utils.js'

// === 共享布局逻辑 ===
export { useDocLayout } from './useDocLayout'
export type { UseDocLayoutOptions, UseDocLayoutReturn } from './useDocLayout'
