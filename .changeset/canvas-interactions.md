---
'@echolab-auto/ui-frame': minor
---

feat(canvas): NeumorphismCanvas 交互与视觉全面升级

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
