---
'@echolab-auto/ui-frame': minor
---

`/chat` 模块收敛为纯元组件：移除组合组件 `ChatMessageList` / `ChatMessageItem` / `ChatToolCallBlock` / `ChatReasoningBlock` / `ChatBranchMergeBlock` 与 `componentCategories` 导出。聊天场景的组合（消息行、工具/推理/分支块）属产品侧语义，由宿主用保留的机制原语（`ChatBubble` / `ChatTray` / `ChatFold` / `ChatComposer` / `ChatCopyButton`）自行组装；模块保留 `types.ts` 的 `ChatMessage` 数据契约。迁移参考：EchoAgentPanel 以 `ChatBubble` + doc 模块 `MarkdownRenderer` 自组消息行（2026-09-30）。
