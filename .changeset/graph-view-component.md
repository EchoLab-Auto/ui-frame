---
'@echolab-auto/ui-frame': minor
---

新增 `NeumorphismGraphView` 实验性节点图组件（Obsidian 风格的力导向图）：自绘 canvas 渲染节点与连线，内置**无第三方依赖**的退火式力学布局（`ForceLayout`，d3-force 同款 alpha 衰减——约 300 帧内铺开并静止，静止后停止帧循环）；支持拖拽节点（临时钉住、松手交还）、拖背景平移、滚轮/双指以指针为锚点缩放、双击节点居中、悬停高亮一度邻居并淡化其余、标签按缩放级别渐显（`auto`/`always`/`hover` 三档），以及键盘操作（方向键切换、Enter 选中、`+/-` 缩放、`0` 适应视图）。

对外暴露：`nodes`/`links`/`height`/`nodeRadius`/`linkDistance`/`repulsion`/`forceSettings`/`showLabels`/`showControls`/`showLegend`/`highlightNeighbors`/`draggable`/`pannable`/`zoomable`/`autoFit`/`preservePositions`/`ariaLabel`；事件 `node-click`/`node-hover`/`node-dblclick`/`background-click`/`zoom-change`/`layout-start`/`layout-settled`；方法 `fit`/`zoomIn`/`zoomOut`/`resetLayout`/`reheat`/`focusNode`/`getZoom`/`getAlpha`/`getForceSettings`；全局配置 `graph.*` 段与 locale 键 `graphLabel`/`graphZoomIn`/`graphZoomOut`/`graphZoomFit`/`graphRelayout`。

`forceSettings` 统一承载力学高级旋钮（`spring`/`gravity`/`velocityDecay`/`alphaDecay`/`alphaMin`/`alphaTarget`/`maxSpeed`/`maxRepulsionForce`），优先级为「显式 `linkDistance`/`repulsion` > `forceSettings` > 内置默认」；`getAlpha()` 暴露退火系数（1 → 0，归零即静止）便于外部呈现动力学进度。`ForceLayout.alpha` 改为只读，外部只能通过 `wake`/`reheat`/`setData` 影响温度。

配色跟随主题 token（按 `group` 分组取色，`data-theme` 切换经 `MutationObserver` 重绘），未给坐标的节点按索引做黄金角螺旋播种（同数据同布局），数据增删按 `id` 复用旧坐标。`ForceLayout`、`DEFAULT_FORCE_SETTINGS` 与几何工具（`fitTransform`/`zoomAt`/`screenToWorld`/`worldToScreen`/`seedPosition`/`boundsOf`/`clampScale`/`distance`/`GOLDEN_ANGLE`）随组件子路径导出，可做自定义渲染。example 组件展示页「扩展」分组新增「节点图 GraphView」演示（29 节点 / 44 连线知识库示例），带覆盖**全部关键参数**的调参面板：`nodeRadius`/`linkDistance`/`repulsion`/`height`、7 个力学旋钮（`spring`/`gravity`/`velocityDecay`/`maxSpeed`/`alphaDecay`/`alphaMin`/`maxRepulsionForce`）、9 个开关类 props（标签策略/图例/控件/高亮邻居/拖拽/平移/缩放/autoFit/preservePositions），以及适应视图 / 重新布局 / 重新唤醒 / ±节点（演示增量数据）/ 恢复默认，并实时显示 `alpha` 读数。
