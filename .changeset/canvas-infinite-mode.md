---
'@echolab-auto/ui-frame': minor
---

NeumorphismCanvas 新增 `infinite` 无限画布模式：平移 / 缩放为无界虚拟状态（`transform: translate() scale()`），替代原生 overflow 滚动，内容可位于任意（含负）画布坐标。新增 `contentBounds` prop、`canvas.infinite` 全局级联、locale 键 `canvasResetView`，以及 expose 方法 `resetView()` / `panBy()` / `getView()` / `toCanvasCoords()`；infinite 模式下普通滚轮平移、触屏单指拖拽平移，复位按钮与 `0` 键动画回到全部内容视图。默认滚动模式行为不变。
