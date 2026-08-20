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

fix: 评审发现的十一项缺陷全部修复

- highlightCode：注释正则按语言族分发（SQL 风格 `--` 不再吞并 JS 自减 `i--` 与 CSS 自定义属性）
- MarkdownRenderer 挂载管线保活：v-html 全量替换时同源子树根节点整体迁移认领（流式更新不再重建，复制反馈/滚动位置保留），无人认领才卸载
- renderer.listitem 修复行内解析：改用 tokens 块级解析（列表项内加粗/行内代码/链接/任务列表生效）
- DocFlowCanvas 拖拽管线：预览不再触发 fit（消除每帧重排与 scale 过期发散）；pointercancel 丢弃拖拽；箭头 marker id 实例唯一（多画布共存不失引用）；suppressClick 松手兜底清除（不再吞点击）；onBeforeUnmount 清理 window 监听与挂起 rAF
- flow-layout：通道边安全间隙按整列/整行内容带计算（修复宽兄弟节点穿边）；BT/RL 回边与跨层边从流向端边出线（镜像语义修正）
- writeFlowNodePosition：CRLF 归一化比较（Windows 文档拖拽写回不再静默失败）；新增 blockIndex 按序定位（重复块场景），flowNodeMove 载荷携带 blockIndex
- useScrollSpy：header ResizeObserver 高度未变时跳过重建（消除初始通知自旋）
- useChatScroll：跟随判定改用增长前贴底态（长流式回复不再脱随）+ 程序化滚动防闪烁
- useSegmented：roving tabindex 初始落点/点击同步/焦点移动/收缩钳制四项 a11y 修复
- DocTocNav：collapsedGroups 支持受控共享（桌面侧栏与移动端抽屉状态一致）
