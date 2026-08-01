# @echolab-auto/ui-frame

## 1.1.0

### Minor Changes

- e0d6066: 修复级联配置全库失效（withDefaults 遮蔽 + 五个死配置段），全局配置真正生效；Select 新增 outlined 单盒变体与多选/可搜索/分组能力；统一浮层定位引擎 useFloatingPosition（修复嵌套滚动脱节）；级联配置段补全（alert/menu/popover 等七段）；无障碍门槛修复（DatePicker 键盘可达、Menu 焦点圈、Switch/Slider 可访问名称）；CSS 硬编码全面 Token 化；构建修复 sideEffects 样式契约失效；新增 useScrollbar/useChartInteraction/useProgress/useFloatingPosition 公共 composable；测试补齐（图表数学/零测试组件/axe-core 自动化回归）并接通覆盖率门禁；Changesets 发布流水线与全量载荷体积预算。

### Patch Changes

- 20f602c: 初始化项目工具链配置，包括 package.json 增强导出、changeset 脚本和其他开发体验优化。
