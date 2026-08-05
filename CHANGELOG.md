# @echolab-auto/ui-frame

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
