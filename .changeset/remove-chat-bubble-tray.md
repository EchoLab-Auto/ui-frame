---
'@echolab-auto/ui-frame': minor
---

`/chat` 模块收敛为纯原子层：移除组装件 `ChatBubble` 与 `ChatTray`（及其全部
CSS 与配套测试），模块只保留真正单一职责的原子 `ChatComposer` /
`ChatFold` / `ChatCopyButton`。

这两个组装件把「角色→样式映射 + 行为 + 语义」烘进壳里（ChatBubble 的
align×tone 对齐/色调矩阵 + 头部槽 + 悬停复制；ChatTray 的托盘视觉 + 吸底
行为 + 跳转钮 + a11y 壳），属产品语义——已按宿主职责解散：

- **气泡壳样式 / 角色映射** → 宿主 CSS（`examples/pages/ChatPage.vue` 2026-10-13
  起即"原子组装参考实现"）；复制按钮 → `ChatCopyButton`（本模块保留）；
- **吸底滚动** → headless composable `useChatScroll`（本库保留）；跳转钮 →
  宿主用基础组件（`NeumorphismButton`）+ `showJumpButton` 信号自组；
- **托盘视觉（凹陷井 / 跳转钮阴影）** → 宿主 CSS 消费 `--nm-chat-*` token
  （本库保留）。

数据契约 `ChatMessage` 等类型、`chatJumpToBottom` 等 locale 键继续保留。
迁移参考：`EchoAgentPanel` 与 `examples/pages/ChatPage.vue`（均以原子自组）。
