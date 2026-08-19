---
'@echolab-auto/ui-frame': minor
---

feat(chat): 新增 chat 聊天面板领域模块与状态反馈组件

- 新增子路径模块 `@echolab-auto/ui-frame/chat`，分两层架构：
  - **元组件（纯 UI 原语，零领域类型、插槽驱动）**：`ChatBubble`（对齐/色调/悬停复制）、`ChatTray`（凹陷托盘 + 吸底跟随 + 回到底部）、`ChatFold`（折叠块：受控/非受控、凹陷/凸起、head/actions/subhead 插槽）、`ChatComposer`（Enter 发送 / Shift+Enter 换行 / IME 组合安全）、`ChatCopyButton`
  - **组合组件（ChatMessage 数据驱动，由元组件拼成）**：`ChatMessageList`、`ChatMessageItem`（用户居右主色 / Agent 居左 Markdown / 系统居中细线 / 工具 / 分支合并五种形态）、`ChatToolCallBlock`、`ChatReasoningBlock`、`ChatBranchMergeBlock`
- 新增通用组件：`NeumorphismStatusDot`（online/offline/busy/connecting，过渡态呼吸脉冲）、`NeumorphismSpinner`（档位或像素尺寸）、`NeumorphismSegmented`（radiogroup 语义 + roving tabindex 键盘导航）
- 新增 headless composables：`useClipboard`（复制 + 状态自动复位）、`useChatScroll`（吸底跟随）、`useChatInput`（IME 安全提交）、`useSegmented`
- 新增全局配置段：`chat`（markdown/autoScroll/scrollThreshold）、`statusDot`、`spinner`、`segmented`
- 新增 locale 键（zh-CN / en-US）：statusDot\*、spinnerLoading、segmentedLabel、chat\*
- 新增设计 token：`--nm-chat-user-bg` / `--nm-chat-agent-bg` / `--nm-chat-system-color` / `--nm-chat-sunk-bg` / `--nm-chat-tray-bg`（亮暗双主题，凹陷色深于所在表面，符合物理隐喻）
- 示例站点新增「聊天组件」页（会话窗口 + 元组件自定义组装演示）；组件总览新增 StatusDot / Spinner / Segmented 演示

doc 模块同步完成元组件拆分：

- 新增元组件 `DocCodeBlock`（语法高亮 + 行号 + useClipboard 复制）与 `DocTocNav`（层级折叠 + 激活高亮 + 祖先自动展开，framed 可关）
- 新增 headless composables：`useMarkdownToc`（heading 提取 + 层级树 + 实例级唯一 id）、`useScrollSpy`（IntersectionObserver 滚动侦测 + 点击导航锁定）
- 新增 `highlightCode` 共享高亮模块：修复正则高亮的两个既有缺陷——插入的 span 标记被后续词法轮次破坏（如注释 span 的 class 被 keyword 命中），以及字符串中的 `#`/`//` 被注释正则吞并导致引号实体配对破坏（两遍式占位符保护 + 字符串优先于注释）
- `MarkdownRenderer` 重构为薄组合：渲染管线 + mermaid + 流程画布/代码块挂载（占位 → 子树，登记制卸载），TOC/scroll-spy/代码块全部委托元组件与 composable，DOM 结构与行为零回归（既有 94 个集成测试全过）
- 组件总览新增「文档元组件」分节；locale 新增 `markdownCodeCopy` 键
