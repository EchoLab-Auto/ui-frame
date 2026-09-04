---
id: components
title: '组件总览'
x: 1317
y: 676
group: 使用
link:
  [
    'animation | 动画效果 | r>l',
    'interaction | 交互效果 | r>l',
    'comp-button | Button',
    'comp-switch | Switch | r>l',
    'comp-checkbox | Checkbox | r>_',
    'comp-radio | Radio',
    'comp-input | Input | r>l',
    'comp-textarea | Textarea | r>l',
    'comp-select | Select | r>l',
    'comp-art | Art | r>l',
    'comp-ascii-art | 字符画 | r>l',
    'comp-doc | 文档组件 | r>l',
  ]
---

# 组件总览

> 本文档按功能分类介绍 `@echolab-auto/ui-frame` 的全部组件：每个组件的职责、关键 props 与特有亮点。完整的 Props/Events/Slots 表格见 [API 参考](./api.md)，动画与交互的通用机制见 [动画效果](./animation.md) 与 [交互效果](./interaction.md)。

主库全局注册 **62 个组件**（`app.use(NeumorphismUI)` 后全部可用）；Chat 聊天面板与 Doc 文档渲染为独立模块，经子路径 `@echolab-auto/ui-frame/chat`、`@echolab-auto/ui-frame/doc` 引入。

---

## 组件分类：基础组件与组合组件

本项目的组件按「是否消费领域数据契约」分为两类：

| 分类         | 定义                                                                                    | 判定标准                                                                                                                           | 代码位置                                                                                               | 示例                                                       |
| ------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **基础组件** | 单一职责、自包含的 UI 原子/分子，是本库的最小可复用单元                                 | 仅靠 props / slots / events 通信；不消费任何领域数据契约；无外部副作用（不发网络请求、不读写宿主业务状态）；可与其他组件任意组合   | `src/components/`（主入口，`app.use(NeumorphismUI)` 全局注册 62 个）                                   | `NeumorphismButton`、`NeumorphismInput`、`NeumorphismCard` |
| **组合组件** | 由若干基础组件 + headless composable 拼装而成，消费领域数据契约、交付一个完整场景的组件 | 消费领域数据契约（如 `ProDocNode` 文档树、`ChatMessage` 消息）；纯渲染层——不持业务状态、不发网络请求，用户意图经事件上交宿主持久化 | `src/composites/`（doc 文档渲染、chat 聊天面板，经子路径 `@echolab-auto/ui-frame/doc` / `/chat` 引入） | `DocViewer`、`DocEditor`、`ChatMessageList`                |

> **元组件**：组合组件模块内部拆出的纯 UI 原语（`DocCodeBlock`、`DocTocNav`、`ChatBubble` 等）——零领域类型、slot 驱动，性质上属于基础组件，随所在模块经子路径导出，可脱离组合组件自由组装。

代码层面同样按此分类组织：`src/components/` 只含基础组件，组合组件集中于 `src/composites/`；各 barrel 导出处以 `@category` JSDoc 标记，组合组件模块额外导出 `componentCategories` 元数据（`composite` / `meta` 两个清单）。

**组合规则**：

- 依赖只能向下：组合组件依赖基础组件（含元组件）与 composable，基础组件互不嵌套业务语义
- 组合组件的状态外置：选中、编辑、拖拽等结果通过 `docLink` / `save` / `nodeMove` 等事件抛出，持久化永远是宿主的责任
- 两类组件共享同一套主题 token、台阶高度模型与全局配置级联，视觉与交互完全一致

**通用约定**：

- 多数组件的 `size` / `variant` / `bordered` 等 props 默认为 `undefined`，按「显式 prop > 全局配置 > 内置兜底值」级联生效
- 复杂组件均有对应的 headless composable（`useSelect` / `useTable` / `useChart` 等），可脱离 UI 复用逻辑
- 卡片类组件遵循统一**台阶高度模型**：`elevation` 正数凸起、负数凹陷、零值平齐

---

## 一、基础组件（62 个）

主库 `src/components/` 全局注册的全部组件，按功能分组如下。

### 基础按钮与触发

> [`NeumorphismButton` 有独立的详细文档](./components/button.md)——完整可配置项、六个预设变体的交互动画详解与用法预设。

| 组件                                          | 职责                      | 关键 props                                                                                                                | 亮点                                                             |
| --------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`NeumorphismButton`](./components/button.md) | 新拟态按钮                | `variant`（raised/pressed/primary/glow/glass/glass-raised）、`size`、`shape`（rounded/pill/circle）、`loading`、`pressed` | loading 内置 spinner 并禁用点击；`aria-pressed`/`aria-busy` 完备 |
| `NeumorphismThemeToggle`                      | 亮/暗/自动三态主题切换    | `modelValue`（light/dark/auto）、`disableAuto`                                                                            | 配合 ThemeProvider 使用                                          |
| `NeumorphismSegmented`                        | 分段选择器（单选选项条）  | `modelValue`、`options`、`size`                                                                                           | 方向键键盘导航；文案走 locale                                    |
| `NeumorphismLogo`                             | 动态像素 Logo（SVG 动画） | `mode`（pulse/liquid/wave/pointer）、`goo`、`autoplay`、`floating`                                                        | `usePixelLogoAnimation` 驱动；pointer 模式跟随指针；gooey 滤镜   |

---

### 表单输入

| 组件                                                                  | 职责               | 关键 props                                                                           | 亮点                                                                                 |
| --------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [`NeumorphismInput`](./components/input.md)                           | 单行文本输入       | `modelValue`、`type`、`error`、`floatingLabel`、`maxlength`                          | 浮动标签模式；`prefix`/`suffix` 插槽                                                 |
| [`NeumorphismTextarea`](./components/textarea.md)                     | 多行文本输入       | `modelValue`、`rows`、`autoResize`、`showCount`                                      | 自动高度；字数统计                                                                   |
| `NeumorphismInputNumber`                                              | 数字输入（± 步进） | `modelValue`、`min`/`max`、`step`、`precision`、`controls`                           | 键盘上下键步进；精度修正                                                             |
| `NeumorphismSlider`                                                   | 滑块（水平/垂直）  | `modelValue`、`min`/`max`、`step`、`vertical`、`showTooltip`、`showStops`            | 拖动中连续触发 `update:modelValue`，交互结束触发一次 `change`（对齐原生 range 语义） |
| [`NeumorphismSwitch`](./components/switch.md)                         | 开关切换           | `modelValue`、`activeText`/`inactiveText`、`activeColor`/`inactiveColor`             | `thumb` 插槽自定义滑块                                                               |
| [`NeumorphismCheckbox`](./components/checkbox.md)                     | 复选框             | `modelValue`、`label`、`indeterminate`                                               | 半选态支持                                                                           |
| [`NeumorphismRadio` / `NeumorphismRadioGroup`](./components/radio.md) | 单选按钮与单选组   | Radio：`value`、`label`；Group：`modelValue`、`direction`                            | `RadioGroupKey` 注入键公开，可自建子项接入协议                                       |
| `NeumorphismAutoComplete`                                             | 输入联想           | `modelValue`、`options`、`searchFn`（异步搜索）、`debounce`（默认 300ms）、`loading` | 防抖异步搜索；浮层自动定位；方向键导航                                               |

---

### 选择器与上传

| 组件                                          | 职责                  | 关键 props                                                                                                    | 亮点                                                     |
| --------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`NeumorphismSelect`](./components/select.md) | 下拉选择器            | `modelValue`、`options`、`multiple`、`filterable`、`clearable`、`collapseTags`、`variant`（default/outlined） | 多选标签折叠 +N；远程 loading；凹陷/描边连体两种视觉变体 |
| `NeumorphismDatePicker`                       | 日期选择器            | `modelValue`、`format`、`minDate`/`maxDate`、`firstDayOfWeek`                                                 | `useDatePicker` 生成日历网格；键盘导航；日期范围限制     |
| `NeumorphismUpload`                           | 文件上传（点击/拖拽） | `modelValue`（文件列表）、`accept`、`maxSize`、`maxCount`、`drag`、`listType`（text/picture/picture-card）    | `useUpload` 状态机；超限触发 `exceed`；图片预览列表      |

---

### 表单体系

| 组件                                              | 职责                       | 关键 props                                                                                | 亮点                                                                       |
| ------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NeumorphismForm` / `NeumorphismFormItem`         | 表单容器与表单项           | Form：`model`、`rules`、`labelWidth`、`direction`；FormItem：`label`、`required`、`rules` | 校验逻辑在 `useFormValidation`；`FormKey` 注入键公开，支持自建字段接入校验 |
| `NeumorphismFieldLabel` / `NeumorphismFieldError` | 字段标签与错误提示原子组件 | `label`/`required`/`forId`；`message`                                                     | 错误提示带 `role="alert"`                                                  |

---

### 数据展示

| 组件                                      | 职责                             | 关键 props                                                                                    | 亮点                                                                       |
| ----------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NeumorphismCard`                         | 卡片容器（台阶高度模型核心载体） | `elevation`（-4~4）、`radius`、`hoverable`（bulge/sink）、`glass`                             | 悬停 ±2 高度动效；玻璃拟态模式；`variant`/`depth` 已废弃，请用 `elevation` |
| `NeumorphismTable`                        | 数据表格                         | `data`、`columns`、`rowKey`、`selectable`、`selectedKeys`、`striped`                          | headless `useTable` 驱动排序/选择状态机；表头键盘可排序                    |
| `NeumorphismList`                         | 通用列表                         | `items`、`bordered`、`split`、`hoverable`                                                     | `header`/`footer`/`empty` 插槽齐全                                         |
| `NeumorphismVirtualList`                  | 虚拟滚动长列表                   | `items`、`itemHeight`（默认 40）、`overscan`（默认 5）                                        | 窗口化渲染，只渲染可视区；`scrollTo` 方法                                  |
| `NeumorphismTree` / `NeumorphismTreeNode` | 树形控件                         | `data`、`selectedKeys`/`expandedKeys`（v-model）、`showSearch`、`multiple`                    | 搜索高亮过滤；键盘导航                                                     |
| `NeumorphismAvatar`                       | 头像                             | `src`、`initials`、`icon`、`size`、`shape`                                                    | 图片/首字母/图标三态回退                                                   |
| `NeumorphismBadge`                        | 角标/红点                        | `value`、`max`、`dot`、`showZero`                                                             | 超出 max 显示「max+」                                                      |
| `NeumorphismTag`                          | 标签                             | `variant`（default/primary/success/warning/error/info）、`closable`                           | 六种语义色                                                                 |
| `NeumorphismProgress`                     | 进度条（线性/环形）              | `modelValue`、`type`、`variant`、`effect`（pulse/flow/wave/stripes/sparkle）、`indeterminate` | 6 种动效；SVG 环形；不定态动画                                             |
| `NeumorphismSkeleton`                     | 骨架屏                           | `variant`（text/circle/rect）、`animation`（pulse/wave/none）、`count`                        | 两种占位动画                                                               |
| `NeumorphismEmpty`                        | 空状态占位                       | `image`、`description`、`size`                                                                | 自定义插图插槽                                                             |
| `NeumorphismSpinner`                      | 加载指示器                       | `size`（档位或像素值）、`label`                                                               | 遵循 reduced-motion                                                        |
| `NeumorphismStatusDot`                    | 状态点                           | `status`（online/offline/busy/connecting）、`pulse`                                           | 呼吸脉冲动画                                                               |
| `NeumorphismDivider`                      | 分割线                           | `direction`、`align`、`dashed`、`inset`                                                       | 文案对齐                                                                   |
| `NeumorphismCollapse`                     | 折叠面板                         | `modelValue`、`accordion`、`items`                                                            | 手风琴互斥模式                                                             |

---

### 导航

| 组件                    | 职责          | 关键 props                                                         | 亮点                                    |
| ----------------------- | ------------- | ------------------------------------------------------------------ | --------------------------------------- |
| `NeumorphismTabs`       | 标签页        | `modelValue`、`tabs`、`position`（top/left/right）                 | 方向键键盘导航                          |
| `NeumorphismBreadcrumb` | 面包屑        | `items`、`separator`                                               | 禁用项支持                              |
| `NeumorphismPagination` | 分页器        | `modelValue`、`total`、`pageSize`、`showJumper`、`maxVisiblePages` | 页码窗口算法；跳页器                    |
| `NeumorphismMenu`       | 垂直/水平菜单 | `items`（含 children）、`mode`、`collapsed`、`theme`               | 子菜单展开/收起；折叠为仅图标           |
| `NeumorphismNavMenu`    | 顶部导航菜单  | `items`、`showIndicator`                                           | 激活指示条/辉光                         |
| `NeumorphismDropdown`   | 下拉菜单      | `items`、`position`、`trigger`（click/hover/focus/manual）         | 复用 Popover 浮层定位体系               |
| `NeumorphismSteps`      | 步骤条        | `steps`、`current`（v-model）、`direction`、`center`               | 步骤状态机（wait/process/finish/error） |

---

### 反馈与浮层

| 组件                       | 职责             | 关键 props                                                      | 亮点                                               |
| -------------------------- | ---------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `NeumorphismModal`         | 模态对话框       | `modelValue`、`title`、`size`、`maskClosable`、`destroyOnClose` | `useFocusStack` 处理嵌套弹层焦点；`useZIndex` 分层 |
| `NeumorphismDrawer`        | 抽屉             | `modelValue`、`position`（left/right/top/bottom）、`width`      | 四向进出                                           |
| `NeumorphismToastProvider` | 全局消息提示容器 | `position`、`maxCount`                                          | 配合 `useToast`；最大堆叠数限制；teleport 到 body  |
| `NeumorphismAlert`         | 警告横幅         | `type`、`title`、`message`、`closable`、`duration`              | 内置类型图标；可自动关闭                           |
| `NeumorphismTooltip`       | 文字提示气泡     | `content`、`position`、`trigger`、`delay`                       | 悬停/点击/聚焦触发                                 |
| `NeumorphismPopover`       | 弹出面板         | `position`（含 auto）、`trigger`、`width`、`showArrow`          | `useFloatingPosition` 自动翻转定位                 |

---

### 布局

| 组件                                | 职责                               | 关键 props                                                                  | 亮点                                    |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| `NeumorphismLayout`                 | 页面框架（顶栏 + 侧边栏 + 内容区） | `showHeader`/`showSider`、`siderWidth`、`collapsible`、`mobileAutoCollapse` | 移动端自动折叠；skip-nav 无障碍跳转链接 |
| `NeumorphismContainer`              | 内容容器                           | `mode`（fixed/fluid）、`noPadding`、`tag`                                   | 固定断点宽度或全宽                      |
| `NeumorphismRow` / `NeumorphismCol` | 24 格栅格                          | Row：`gutter`、`justify`、`align`；Col：`span`、`offset`、响应式 `xs`~`xxl` | `RowGutterKey` 注入键公开；6 档断点     |
| `NeumorphismScrollbar`              | 自定义滚动条                       | `variant`（standard/primary/dots/glow）、`target`（目标容器选择器）         | 点阵/辉光装饰性变体                     |

---

### 图表

四个图表组件均为 SVG 渲染，共享 `series` / `width` / `height` / `showTooltip` / `showLegend` / `showGrid` / `showAxis` / `animate` 等 props 与 `title` 插槽，均支持全局配置 `chart` 段级联；交互逻辑在公开导出的 `useChart` / `useChartInteraction` 中。

| 组件                          | 职责        | 关键 props                                                                      | 亮点                                                                         |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `NeumorphismChartBar`         | 柱状图      | `series`、`yMin`/`yMax`                                                         | `bar-click` 事件；另有 OffscreenCanvas 渲染器 `createChartRenderer` 公开导出 |
| `NeumorphismChartLine`        | 折线图      | `curve`（linear/smooth/step）、`area`、`showPoints`                             | 平滑/阶梯曲线；面积填充                                                      |
| `NeumorphismChartPie`         | 饼图/环形图 | `data`、`innerRadius`（>0 即环形）、`padAngle`、`labelPosition`、`colorPalette` | `center` 环心插槽；圆角扇区                                                  |
| `NeumorphismChartCandlestick` | K 线图      | `data`（OHLC）、`showVolume`、`showMA`、`maPeriods`、`upColor`/`downColor`      | 内置均线与成交量副图                                                         |

---

### 扩��与工具

| 组件                                               | 职责                   | 关键 props                                                                                                                            | 亮点                                                      |
| -------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `ThemeProvider`                                    | 主题提供者             | `defaultTheme`（light/dark/auto）、`storageKey`、`followSystem`                                                                       | 配套 `useTheme` / `getAntiFlickerScript`（防闪烁脚本）    |
| [`NeumorphismAsciiArt`](./components/ascii-art.md) | 字符画（图片 → ASCII） | `src`、`density`、`reactive`、`speed`、`height`                                                                                       | 保持原图比例；直方图拉伸；指针提亮                        |
| [`NeumorphismArt`](./components/art.md)            | 试验性动态效果画布     | `effect`（pixel-field/particles/waves/goo/ascii）、`reactive`、`speed`、`density`、`seed`、`palette`、`src`                           | 5 种程序化效果；指针交互；DPR 适配；reduced-motion 静态帧 |
| `NeumorphismCanvas`                                | 可缩放/平移画布        | `modelValue`（缩放 v-model）、`minZoom`/`maxZoom`、`showGrid`、`gridVariant`（dots/lines）、`showControls`/`showFit`/`showFullscreen` | 空格+拖拽平移；Ctrl/Cmd+滚轮缩放；一键适配与全屏          |

---

## 二、组合组件（子路径导出）

`src/composites/` 下的两个领域模块，全部由基础组件拼装、消费数据契约、纯渲染层，经子路径引入。

### Chat 聊天面板

`import { ChatMessageList } from '@echolab-auto/ui-frame/chat'`。两层架构：**元组件**（纯 UI 原语、slot 驱动）+ **组合组件**（`ChatMessage` 数据驱动）；纯渲染层，不持业务状态、不发网络请求。

| 组件                                                                | 职责                             | 亮点                                                      |
| ------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| `ChatMessageList` / `ChatMessageItem`                               | 消息列表与单条消息               | Agent 消息支持 Markdown 渲染（依赖 doc 模块）；时间格式化 |
| `ChatBubble`                                                        | 聊天气泡                         | `copyText` 传入即带悬停复制按钮；对齐与色调变体           |
| `ChatTray`                                                          | 滚动托盘                         | 仅当用户本在底部时才自动吸底（`scrollThreshold` 判定）    |
| `ChatFold`                                                          | 折叠块                           | 凹陷井/凸起卡片两种形态；可禁用折叠退化为静态行           |
| `ChatComposer`                                                      | 输入发送栏                       | **IME 组合中 Enter 不发送**；自动高度；可取消任务         |
| `ChatToolCallBlock` / `ChatReasoningBlock` / `ChatBranchMergeBlock` | 工具调用 / 推理过程 / 分支合并块 | 流式状态可视化                                            |
| `ChatCopyButton`                                                    | 复制按钮                         | `useClipboard` 驱动                                       |

---

### Doc 文档渲染

`import { MarkdownRenderer } from '@echolab-auto/ui-frame/doc'`。典型的**组合组件**模块：全部由主库基础组件拼装，消费 `ProDocNode` 文档树数据契约，纯渲染层。

> [`Doc 文档组件有独立的详细文档](./components/doc.md)——分层架构、五个组合组件的完整可配置项、prodoc-flow 流程图与数据契约用法。

| 组件                      | 职责                | 亮点                                                           |
| ------------------------- | ------------------- | -------------------------------------------------------------- |
| `DocViewer` / `DocEditor` | 文档查看器 / 编辑器 | 树导航 + Markdown 渲染；编辑保存事件                           |
| `MarkdownRenderer`        | Markdown 渲染器     | 目录 scroll-spy；内嵌 prodoc-flow 流程图；`docLink` 文档内跳转 |
| `MarkdownEditor`          | Markdown 编辑器     | 格式化工具栏；**自动保存**（默认 30s）                         |
| `DocFlowCanvas`           | 流程图画布          | 节点可拖拽，松手发 `nodeMove` 由宿主持久化                     |
| `DocCodeBlock`            | 代码块              | 自研 `highlightCode` 高亮；行号可关                            |
| `DocTocNav`               | 目录导航            | scroll-spy 驱动高亮；多实例可共享折叠状态                      |

---

## 深入

- [动画效果](./animation.md) — 台阶高度模型、缓动曲线与全局动效
- [交互效果](./interaction.md) — 键盘、焦点、弹出层与反馈交互
- [API 参考](./api.md) — 每个组件的完整 Props/Events/Slots 表格
