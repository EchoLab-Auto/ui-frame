---
id: interaction
title: '交互效果'
x: 1709
y: 532
group: 使用
---

# 交互效果

> 本文档介绍 `@echolab-auto/ui-frame` 的交互体系：键盘与焦点、弹出层、表单校验、反馈与数据组件的交互行为。所有交互遵循新拟态物理隐喻——hover 是「抬升」，active 是「压下」；动画细节见 [动画效果](./animation.md)。

**架构前提**：全库交互逻辑与渲染分离——约 35 个 headless composable（`useSelect` / `useTable` / `useModal`……）承载行为状态机，组件只负责渲染。你可以脱离组件 UI 直接复用这些 composable 构建自定义交互。

---

## 一、键盘导航

全库统一的键盘约定：

| 按键                  | 行为                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Esc`                 | 关闭一切浮层：Tooltip / Popover / Select / Modal / Drawer / Menu（收起展开项）/ ToastProvider（清空全部 toast）                                                            |
| `Enter` / `Space`     | 激活：Button、Menu / Tree / Dropdown 项、Segmented、Select 开关                                                                                                            |
| 方向键                | 按 `aria-orientation` 切换：水平排列用 ←→（Tabs 顶部、Menu 水平模式），垂直排列用 ↑↓；Menu 中 → 展开进子菜单、← 收起回父级；Tree 中 → 展开并进第一个子节点、← 收起或回父级 |
| `Home` / `End`        | 跳首尾：Select / Tree / Menu / Tabs / Segmented / Dropdown 全部支持                                                                                                        |
| `PageUp` / `PageDown` | Slider 按 `max(step×10, range/10)` 跳步                                                                                                                                    |
| `*`                   | Tree 中切换当前节点展开                                                                                                                                                    |

**Typeahead 字母搜索**：Select / Tree / Menu 均支持——500ms 缓冲窗口内连续输入字母，先前缀匹配后包含匹配，从当前焦点位置循环查找。

**IME 安全**：ChatComposer 等输入场景检测 `event.isComposing`，中文输入法回车选字不会误触发发送。

---

## 二、焦点管理

- **焦点栈**（`useFocusStack`）：Modal / Drawer 打开时记录当前焦点元素，关闭时按 LIFO 恢复——嵌套弹层（Modal 里开 Drawer）层层归还焦点
- **焦点陷阱**：Modal / Drawer 内 Tab / Shift+Tab 在可交互元素间首尾循环，不会 tab 出对话框；打开时自动聚焦容器内第一个可交互元素
- **焦点环**：统一 `:focus-visible` 主色光环（`0 0 0 2~3px var(--nm-primary-color)`），保留新拟态凹凸阴影；仅键盘聚焦显示，鼠标点击不出现；通用工具类 `.nm-focus-ring`
- **Roving tabindex**：Segmented / Tabs / Dropdown 组内只有一个项在 Tab 序列中，方向键移动焦点
- **aria-activedescendant**：Tree 容器整体占一个 Tab 位，节点经 `aria-activedescendant` 虚拟聚焦

对话框类组件的 ARIA 完备：`role="dialog" aria-modal="true"` + `aria-labelledby`/`aria-describedby`；Tooltip 内容 `role="tooltip"`；Popover 双语义——hover/focus 触发时为 `tooltip`，click 触发时为 `dialog`。

---

## 三、弹出层交互

### 触发与延迟

| 组件     | trigger                        | 延迟                                                             |
| -------- | ------------------------------ | ---------------------------------------------------------------- |
| Tooltip  | hover / click / focus          | hover 显示延迟 150ms，隐藏固定 100ms（指针移到气泡本体上不会关） |
| Popover  | click / hover / focus / manual | 仅 hover 走 150ms 延迟，click 立即开                             |
| Dropdown | click / hover / focus / manual | 同上                                                             |

点击外部关闭：各浮层在 document capture 阶段监听点击，落在触发器与浮层内部则忽略；Select 另有焦点外移关闭。Modal / Drawer 的遮罩点击关闭受 `maskClosable && closable` 双重门控；`destroyOnClose` 关闭后延迟 200ms 卸载 DOM（等离场动画播完）。

### 定位引擎（`useFloatingPosition`）

Tooltip / Popover / Select / AutoComplete 共享同一浮层定位：

- **rAF 逐帧追踪**触发器位置（不用 scroll 事件——嵌套滚动容器与平滑滚动下事件会漏发滞后），位置更新与绘制同帧
- `position: 'auto'` 按候选序（bottom→top→right→left）选首个能容纳内容的方向
- **翻转滞后**：当前侧空间不足 120px 且对侧宽裕超过 48px 才翻转，防止边界来回抖动
- **方向锁定**（`lockPlacement`）：Select outlined 连体变体展开期间冻结方向，避免触发器长高被误判

### 层级管理（`useZIndex`）

静态分层 `dropdown:100 < tooltip:200 < popover:300 < overlay:400 < toast:500`，层内步距 1000：浮层 teleport 到 body 会断 provide/inject 链，因此用模块级 overlay 栈计算 z-index——**Modal 里的 Select 下拉、Tooltip 永远在遮罩之上**，嵌套 Modal / Drawer 也能正确叠放。

### 滚动锁定

Modal / Drawer 打开时锁定 body 滚动：多层嵌套用计数器，归零才解锁；锁定时补偿滚动条宽度（`padding-right`），页面内容不跳动。

---

## 四、表单交互

### 校验体系

- `NeumorphismForm` 接收 `model` + `rules`（`FormRule` 支持 required / pattern / min / max / minLength / maxLength / 自定义 validator，默认中文错误消息带参数插值）
- **提交时校验**：`handleSubmit` 拦截原生提交，全量校验通过才 emit `submit`，并 emit `validate(valid)`
- **增量校验**：Form 注入 `validateFieldOnBlur`（首次 blur 后对该字段增量校验，touched 语义）——预留给使用方或自建字段组件调用
- FormItem 按 `name` 自动向 Form 注册/注销（运行时改名也支持）；错误优先级 `props.error > form.errors[name] > 本地错误`
- Form 暴露 `validateAll` / `validateField` / `clearErrors`；`FormKey` 注入键公开，可自建字段组件接入同一套校验

### 字段状态视觉（Input / Textarea / Select / DatePicker 共享）

| 状态     | 视觉                                                        |
| -------- | ----------------------------------------------------------- |
| 基础     | 凹陷槽（inset 阴影）                                        |
| hover    | 凹陷加深 + 抬起 1px                                         |
| focused  | 凹陷加深 + 3px 主色外环 + 抬起                              |
| error    | 凹陷 + 2px 错误色外环（focused 时 3px）；可选 0.4s 抖动动画 |
| disabled | 透明度 0.6 + `not-allowed` 光标，hover/active 全部屏蔽      |
| readonly | 独立修饰类，不降透明度，仅语义区分                          |

错误文案带 `role="alert"`，输入框经 `aria-invalid` + `aria-errormessage` 关联到错误元素。`floatingLabel` 模式下 label 从 placeholder 位上浮（有值或聚焦时）。

---

## 五、反馈交互

- **Button**：六个变体各自定义 hover/active 物理（见 [动画效果](./animation.md#四按钮六变体的交互物理)）；`loading` 时禁用点击、显示 spinner、内容透明度占位不塌陷布局、`aria-busy`
- **Switch**：物理感最强——滑块 squash & stretch（按下时压扁 18%，0.12s 回弹），切换时 0.5s 弹簧；轨道凹陷，开启时加深 inset 并出现主色径向辉光；键盘操作同样触发压缩反馈
- **Checkbox / Radio**：选中项从凹陷基底「凸起」（raised），共享 `useCheckable` 与 `_checkable.scss`
- **Toast**：队列上限 5 条（超出挤掉最旧）；默认 3000ms 自动关闭，`duration: 0` 常驻；移除先播 250ms 离场动画再删除；Esc 一键清空；`clearAll` 进行中来了新 toast 会取消清空
- **Alert**：`close()` 先播离场动画再隐藏；`duration` 可自动关闭
- **语义化播报**：Toast 容器旁有独立 `aria-live="assertive"` 的屏幕阅读器区域；error / warning 用 `role="alert"`，其余 `role="status"`

---

## 六、数据组件交互

- **Table**：点击表头排序三态循环（升序 → 降序 → 取消）；行选择 single / multiple 模式 + 全选半选态；分页切片在排序过滤之后
- **Tree**：搜索输入自动展开匹配路径并高亮；`expandAll` / `collapseAll`；双向同步用独立 flag 防循环更新
- **Tabs**：激活跳过禁用项；键盘导航后 nextTick 移动真实焦点
- **Collapse**：`accordion` 手风琴模式开新关旧；禁用项忽略点击
- **Pagination**：页码窗口算法（首尾固定 + 省略号，默认最多 7 个可见页码）；跳页输入钳制在有效范围并忽略非法值
- **VirtualList**：固定高度 O(1) 计算 / 动态高度前缀和 + 二分查找；`overscan` 上下多渲染 5 条；ResizeObserver 跟踪视口；`scrollTo(index, 'top'|'center')`
- **Menu**：水平模式 hover 展开子菜单；Esc 全部收起
- **Segmented**：`role="radiogroup"` 语义，方向键移动即选中；选中项从凹陷轨道「浮出」
- **Select**：多选标签可折叠（`maxCollapseTags` + 「+N」）；`filterable` 内嵌输入过滤；`outlined` 连体下拉变体在动画两相状态（`visualOpen` / `settledOpen`）下避免滚动条闪烁

---

## 七、拖拽与指针交互

- **Slider**：Pointer Events + `setPointerCapture`，指针拖出轨道也不断拖；pointermove 只记坐标、rAF 每帧至多应用一次（对齐 120Hz 高刷）；按 step 小数位取整防浮点噪声；拖动中连续触发 `update:modelValue`，松手只 emit 一次 `change`
- **Upload 拖拽**：计数器法（dragenter/leave 配对计数归零才取消高亮），子元素进出不抖动；非法文件仍以 `status: 'error'` 入列并触发相应事件，不打断流程
- **Canvas**：拖拽空白平移（4px 阈值区分点击）或 Space+拖拽（输入框聚焦时不劫持 Space）；`Ctrl/Cmd + 滚轮` 指数缩放且围绕光标锚点；按钮缩放围绕视口中心；键盘方向键滚动、`+`/`-` 缩放、`0` 复位；`[data-nm-no-pan]` 可豁免内部元素的拖拽平移；触摸设备走原生滚动
- **`v-nm-magnetic` 指令**：磁性悬停，元素向光标吸附偏移 + 倾斜，离开弹簧回位；触屏与 reduced-motion 自动禁用

---

## 八、Chat 与 Doc 的特殊交互

- **ChatTray / ChatMessageList**：距底 120px 内视为贴底，贴底时新消息与流式内容自动跟随（瞬时定位，不播滚动动画）；向上翻阅时不打断；离开底部显示「回到底部」浮动按钮
- **ChatComposer**：Enter 发送 / Shift+Enter 换行 / IME 组合中 Enter 不发送；trim 后非空才可提交，提交后清空
- **MarkdownRenderer**：标题自动注入锚点链接，点击平滑滚动而非改变 hash；目录 scroll-spy 用 IntersectionObserver 跟踪激活标题，点击目录跳转时屏蔽 scroll-spy 800ms 防中途高亮闪烁；reduced-motion 用户滚动自动降为瞬时
- **DocCodeBlock**：复制按钮成功态变主色 1500ms 后复位

---

## 九、全局状态视觉约定

| 状态               | 统一约定                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| disabled           | 透明度 0.35–0.6（按组件）+ `not-allowed` 光标 + `--disabled` 修饰类；hover/active 全部经 `:not()` 屏蔽 |
| readonly           | 独立 `--readonly` 类，不降透明度                                                                       |
| error              | 凹陷阴影 + 错误色外环（2px，focused 3px）+ `role="alert"` 错误文案 + 可选抖动                          |
| focus              | `:focus-visible` 主色光环，保留新拟态阴影                                                              |
| checked / selected | 从凹陷基底「凸起」或凹陷加深 + 主色辉光                                                                |
| loading            | spinner + `aria-busy` + 隐含禁用                                                                       |

另有两条全局约定：**触屏适配**（`pointer: coarse` 下交互元素最小 44px 命中区、`touch-action: manipulation`，位移类 hover 不触发）与 **RTL 支持**（`[dir='rtl']` 镜像方向性图标与浮层方位）。

---

## 深入

- [动画效果](./animation.md) — 缓动曲线、悬停动效与浮层进出动画
- [组件总览](./components.md) — 各组件分类说明
- [API 参考](./api.md#headless-composables) — 全部交互 composable 的完整签名
