# @echolab-auto/ui-frame

## 1.3.2

### Patch Changes

- 开发依赖范围内更新（eslint / eslint-plugin-vue 10.10、prettier 3.9.6、vitest 4.1.11、@vue/test-utils 2.5、sass 1.104、marked 18.0.11、@commitlint 21.2.2 等）；源码与文档格式化对齐 prettier 3.9 联合类型新规则。无运行时与对外 API 变更。

## 1.3.1

### Patch Changes

- 组件按「基础组件 / 组合组件」两类分层落地：doc、chat 模块迁入 `src/composites/`，`src/components/` 仅保留基础组件；各 barrel 导出增加 `@category` 标记，组合组件模块新增 `componentCategories` 分类元数据导出。对外 API（含 `@echolab-auto/ui-frame/doc`、`/chat` 子路径）无变化。

  文档：新增 Doc 文档组件详解（含侧边栏文档树渲染规则与排版逻辑）；组件总览重构为基础/组合两段式分类并补充定义；API 参考补全 DocFlowCanvas、MarkdownRenderer `flowEditable`/`flowNodeMove`、MarkdownEditor `autoSave` 与 useDocLayout 搜索/hash 同步等缺漏。

## 1.3.0

### Minor Changes

- Button 变体收敛与扩展：移除 `flat`（与 `raised` 物理同构、仅高度低一档，原 `variant="flat"` 请改用默认 `raised`）；新增 `glass`（悬浮磨砂玻璃）与 `glass-raised`（凸面磨砂玻璃）变体，复用 `--nm-glass-*` token，亮/暗主题与 reduced-motion 全覆盖。DocViewer 视图切换激活态改用 `pressed` 表达「已按下」语义。

### Patch Changes

- 修复 doc 模块 mermaid 渲染：改用 `data-mermaid` 属性中的解码图源逐图调用 `mermaid.render`，不再把展示用的 `<pre><code>` 包装标签喂给解析器；单图失败保留原文回退，不影响其他图。

## 1.2.0

### Minor Changes

- 4f48c32: feat(canvas): NeumorphismCanvas 交互与视觉全面升级
  - 新增拖拽平移(鼠标拖拽、空格+拖拽;触屏走原生滚动),`panOnDrag` 可关闭
  - 新增 Ctrl/⌘+滚轮缩放至光标位置,按钮缩放锚定视口中心,`wheelZoom` 可关闭
  - 修复缩放后滚动范围不随缩放级别更新的缺陷(新增 sizer 测量层 + ResizeObserver)
  - 新增适应屏幕(fit)、全屏切换按钮,`showFit` / `showFullscreen` 可分别隐藏
  - 新增键盘导航:视口聚焦后方向键平移(Shift 加速)、`+`/`-` 缩放、`0` 重置
  - 新增 `gridVariant`(dots/lines)网格变体,纳入全局配置 `canvas.gridVariant`
  - 网格点颜色改用专用 token `--nm-canvas-grid-color`,双主题下更柔和
  - 控制条重构为底部居中浮动 pill;顶部工具栏仅在传入 `toolbar` 插槽时渲染
  - 缩放改为混合受控:无 v-model 时组件内部自维护,有 v-model 时行为不变
  - 新增 `defineExpose`:`zoomIn` / `zoomOut` / `resetZoom` / `fit` / `toggleFullscreen`
  - 新增 locale 键:canvasZoomFit、canvasFullscreen、canvasExitFullscreen、canvasLabel

- 769a647: feat(chat): 新增 chat 聊天面板领域模块与状态反馈组件
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

## 1.1.1

### Minor Changes

- ProDoc 画布文档：新增 `prodoc-flow` 流程图语法（方向/四形状/边标签/链式/文档链接/容错），`flow-parser`/`flow-layout`（零依赖分层 DAG 布局）/`flow-graph` 纯逻辑层，`DocFlowCanvas` 只读流程画布组件；MarkdownRenderer 集成 `prodoc-flow` 交互画布（修复首挂载后处理不触发、DOMPurify mXSS 规则剥除含 `-->` 的 data-\* 属性两个存量缺陷）；DocViewer 新增「文档/画布」视图切换——显式流程优先、子文档自动层级地图、点击钻取从抽象到具体
- Slider 拖动丝滑优化：轨道填充拖动即时跟随（消除 300ms 橡皮筋滞后）、拖动开始缓存轨道几何消除逐帧强制同步布局、pointermove 经 rAF 合并对齐刷新率、`change` 事件对齐原生提交语义（松手/键盘一次）、小数 step 浮点噪声与粗 step 越界修复

### Patch Changes

- Select outlined 逐帧检查四缺陷修复：定位引擎新增 `lockPlacement`（修复展开中途方向翻转闪烁）、下拉 padding 细条残留改伪元素占位、多选 4px 接缝（盒级 row-gap 历史残留）、tags 区 `@mousedown.prevent` 导致焦点未就位时外部点击不关闭（document 捕获 pointerdown 兜底，default 变体同病）
- InputNumber 逐帧检查四缺陷修复：焦点外环被 body overflow 裁剪只剩残影（移至 body 层整圈）、到达 min/max 按钮无禁用态、未设 min 时点击 +/- 产出 NaN 并永久卡死（步进原点与空值基值修复，对齐原生 stepUp/stepDown）、长按不连续步进（400ms 后 80ms 间隔重复）

## 1.1.0

### Minor Changes

- e0d6066: 修复级联配置全库失效（withDefaults 遮蔽 + 五个死配置段），全局配置真正生效；Select 新增 outlined 单盒变体与多选/可搜索/分组能力；统一浮层定位引擎 useFloatingPosition（修复嵌套滚动脱节）；级联配置段补全（alert/menu/popover 等七段）；无障碍门槛修复（DatePicker 键盘可达、Menu 焦点圈、Switch/Slider 可访问名称）；CSS 硬编码全面 Token 化；构建修复 sideEffects 样式契约失效；新增 useScrollbar/useChartInteraction/useProgress/useFloatingPosition 公共 composable；测试补齐（图表数学/零测试组件/axe-core 自动化回归）并接通覆盖率门禁；Changesets 发布流水线与全量载荷体积预算。

### Patch Changes

- 20f602c: 初始化项目工具链配置，包括 package.json 增强导出、changeset 脚本和其他开发体验优化。
