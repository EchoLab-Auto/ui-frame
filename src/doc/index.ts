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

export { default as DocFlowCanvas } from './DocFlowCanvas.vue'
export type { DocFlowCanvasProps } from './DocFlowCanvas.vue'

// === 元组件（纯 UI 原语） ===
export { default as DocCodeBlock } from './DocCodeBlock.vue'
export type { DocCodeBlockProps } from './DocCodeBlock.vue'

export { default as DocTocNav } from './DocTocNav.vue'
export type { DocTocNavProps } from './DocTocNav.vue'

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
