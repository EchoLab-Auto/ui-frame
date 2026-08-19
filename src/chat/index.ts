/**
 * @echolab-auto/ui-frame/chat — 聊天 / Agent 面板领域组件
 *
 * 两层架构：
 * - **元组件（纯 UI 原语）**：ChatBubble / ChatTray / ChatFold / ChatComposer /
 *   ChatCopyButton —— 零领域类型，slot 驱动，可自由组装任意聊天式 UI
 * - **组合组件（ChatMessage 驱动）**：ChatMessageList / ChatMessageItem /
 *   ChatToolCallBlock / ChatReasoningBlock / ChatBranchMergeBlock ——
 *   由元组件拼成的现成领域组件
 *
 * 纯渲染层：宿主把消息数据（ChatMessage）喂给组合组件，或用元组件自行组装；
 * 组件不持有业务状态、不发起网络请求。
 *
 * 注意：Agent 消息正文的 Markdown 渲染复用 doc 模块的 MarkdownRenderer，
 * 使用本模块需安装可选 peer 依赖 marked + dompurify。
 *
 * @example
 * ```ts
 * import { ChatMessageList, ChatComposer } from '@echolab-auto/ui-frame/chat'
 * import type { ChatMessage, ChatToolCall } from '@echolab-auto/ui-frame/chat'
 *
 * // 或用元组件自由组装：
 * import { ChatBubble, ChatTray, ChatFold } from '@echolab-auto/ui-frame/chat'
 * ```
 */

// === 元组件（纯 UI 原语，无领域类型依赖） ===
export { default as ChatBubble } from './ChatBubble.vue'
export type { ChatBubbleProps, ChatBubbleAlign, ChatBubbleTone } from './ChatBubble.vue'

export { default as ChatTray } from './ChatTray.vue'
export type { ChatTrayProps } from './ChatTray.vue'

export { default as ChatFold } from './ChatFold.vue'
export type { ChatFoldProps } from './ChatFold.vue'

export { default as ChatComposer } from './ChatComposer.vue'
export type { ChatComposerProps } from './ChatComposer.vue'

export { default as ChatCopyButton } from './ChatCopyButton.vue'

// === 组合组件（ChatMessage 数据驱动） ===
export { default as ChatMessageList } from './ChatMessageList.vue'
export type { ChatMessageListProps } from './ChatMessageList.vue'

export { default as ChatMessageItem } from './ChatMessageItem.vue'
export type { ChatMessageItemProps } from './ChatMessageItem.vue'

export { default as ChatToolCallBlock } from './ChatToolCallBlock.vue'
export type { ChatToolCallBlockProps } from './ChatToolCallBlock.vue'

export { default as ChatReasoningBlock } from './ChatReasoningBlock.vue'
export type { ChatReasoningBlockProps } from './ChatReasoningBlock.vue'

export { default as ChatBranchMergeBlock } from './ChatBranchMergeBlock.vue'
export type { ChatBranchMergeBlockProps } from './ChatBranchMergeBlock.vue'

// === 数据契约 ===
export type {
  ChatRole,
  ChatToolStatus,
  ChatMessageSource,
  ChatToolCall,
  ChatBranchEntryKind,
  ChatBranchEntry,
  ChatBranchSummary,
  ChatMessage,
} from './types'
