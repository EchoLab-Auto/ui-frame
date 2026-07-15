/**
 * @echolab-auto/ui-frame-doc
 *
 * Standalone document rendering package. Re-exports the doc module
 * from @echolab-auto/ui-frame so consumers can depend on just the
 * doc features without pulling in the full component library.
 *
 * @example
 * ```ts
 * import { DocViewer, MarkdownRenderer, useDocLayout } from '@echolab-auto/ui-frame-doc'
 * ```
 */

// All doc module exports re-exported from the main library
export {
  DocViewer,
  MarkdownRenderer,
  DocEditor,
  MarkdownEditor,
  parseFrontmatter,
  pathToId,
  extractTitle,
  createNode,
  buildDocTree,
  createDocTree,
  flattenDocTree,
  getAncestors,
  getNodeIcon,
  nodeToTreeData,
  useDocLayout,
} from '@echolab-auto/ui-frame/doc'

export type {
  DocViewerProps,
  MarkdownRendererProps,
  DocEditorProps,
  MarkdownEditorProps,
  ProDocNode,
  DocTree,
  ProDocOptions,
  DocTreeNode,
  UseDocLayoutOptions,
  UseDocLayoutReturn,
} from '@echolab-auto/ui-frame/doc'
