---
id: comp-graph-view
title: 'NeumorphismGraphView（节点图，实验性）'
x: 1709
y: 2160
group: 使用
---

# NeumorphismGraphView

> 实验性组件——Obsidian 风格的**力导向节点图**：自绘 canvas 渲染节点与连线，内置退火式力学布局（无需 d3 等第三方依赖），支持拖拽节点、平移缩放、悬停高亮一度邻居、标签按缩放级别渐显。源码：`src/components/NeumorphismGraphView/`。

```vue
<NeumorphismGraphView :nodes="nodes" :links="links" height="520px" show-legend />
```

---

## 可配置项

### Props

| 名称                 | 类型                            | 默认值              | 说明                                                                          |
| -------------------- | ------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `nodes`              | `GraphNode[]`                   | `[]`                | 节点数据（`id` / `label` / `group` / `size` / `color` / `x` / `y` / `fixed`） |
| `links`              | `GraphLink[]`                   | `[]`                | 连线数据（`source` / `target` 引用节点 `id`，可选 `weight`）                  |
| `height`             | `string \| number`              | `'520px'`           | 容器高度                                                                      |
| `nodeRadius`         | `number`                        | `7`                 | 基础节点半径（画布坐标）；度数越高画得越大（上限 +96%）                       |
| `linkDistance`       | `number`                        | `78`                | 弹簧静止边长——越大图越松散                                                    |
| `repulsion`          | `number`                        | `900`               | 节点排斥强度常数                                                              |
| `showLabels`         | `'auto' \| 'always' \| 'hover'` | `'auto'`            | 标签策略：缩放到阈值（0.85×）后显现 / 始终显示 / 仅悬停与邻居                 |
| `showControls`       | `boolean`                       | `true`              | 右下角缩放控件（缩小 / 放大 / 适应视图 / 重新布局）                           |
| `showLegend`         | `boolean`                       | `false`             | 左下角分组图例（按 `group` 字典序取调色板色）                                 |
| `highlightNeighbors` | `boolean`                       | `true`              | 悬停 / 选中时高亮一度邻居，其余节点与连线淡化                                 |
| `draggable`          | `boolean`                       | `true`              | 允许拖拽节点（拖拽期间临时钉住，松手交还模拟）                                |
| `pannable`           | `boolean`                       | `true`              | 允许拖拽背景平移                                                              |
| `zoomable`           | `boolean`                       | `true`              | 允许滚轮 / 双指缩放（以指针为锚点）                                           |
| `autoFit`            | `boolean`                       | `true`              | 挂载与数据变化后自动适应视图                                                  |
| `preservePositions`  | `boolean`                       | `true`              | 数据刷新时保留既有节点坐标（关闭则整图重新播种）                              |
| `ariaLabel`          | `string`                        | locale `graphLabel` | 无障碍名称（含键盘操作提示）                                                  |

### Events

| 事件               | 载荷                | 说明                             |
| ------------------ | ------------------- | -------------------------------- |
| `node-click`       | `GraphNode`         | 点击（或键盘 Enter）选中节点     |
| `node-hover`       | `GraphNode \| null` | 悬停节点变化（离开为 `null`）    |
| `node-dblclick`    | `GraphNode`         | 双击节点——同时把它移到视图中心   |
| `background-click` | —                   | 点击空白处                       |
| `zoom-change`      | `number`            | 缩放倍率变化                     |
| `layout-start`     | —                   | 力学模拟从静止重新开始           |
| `layout-settled`   | —                   | 力学模拟静止（渲染循环随之停止） |

### Expose

| 方法                     | 说明                        |
| ------------------------ | --------------------------- |
| `fit()`                  | 适应视图                    |
| `zoomIn()` / `zoomOut()` | 以视口中心缩放              |
| `resetLayout()`          | 丢弃坐标重新播种 + 重新布局 |
| `reheat(strength?)`      | 让已静止的布局重新舒展      |
| `focusNode(id)`          | 把某节点移到视图中心        |
| `getZoom()`              | 当前缩放倍率                |

### 全局配置

`app.use(UI, { config: { graph: { nodeRadius, linkDistance, repulsion, showLabels, showControls, draggable, highlightNeighbors } } })`——显式 prop > 全局配置 > 内置默认。局部配置见 [ConfigProvider / 全局配置](../api.md)。

力学参数的分层是：**显式 `linkDistance`/`repulsion` > `forceSettings` 同名字段 > `DEFAULT_FORCE_SETTINGS`**。前两者是最常调的旋钮，单独给 prop 更顺手；其余高级旋钮统一走 `forceSettings`，避免在顶层铺 8 个几乎没人改的 props。

---

## 交互

- **拖拽节点**：按下即临时钉住（`pin`），邻居被实时牵引；松手交还模拟并重新退火
- **平移 / 缩放**：拖背景平移；滚轮以光标为锚点缩放（`zoomAt` 保持锚点下的世界坐标不动）；触屏双指捏合
- **悬停**：命中测试按屏幕坐标反算世界坐标（容差随缩放折算），高亮自身 + 一度邻居
- **键盘**：`←/→/↑/↓` 切换选中节点、`Enter/Space` 选中、`+/-` 缩放、`0` 适应视图、`Esc` 取消选中
- **reduced-motion**：开屏一次性把力学跑到静止（不做可见的"舒展动画"），静止后不再有帧循环

---

## 布局引擎

`ForceLayout`（`forceLayout.ts`）是**无 DOM 依赖**的 headless 实现，可单独用于自定义渲染：

```ts
import { ForceLayout } from '@echolab-auto/ui-frame/components/NeumorphismGraphView'

const layout = new ForceLayout({ linkDistance: 90 })
layout.setData(nodes, links, { nodeRadius: 7 })
layout.warmup(300) // 离线跑 300 帧
layout.nodes // [{ id, x, y, vx, vy, radius, degree }]
```

每帧叠加三类力（统一乘退火系数 `alpha`）：

1. **两两排斥** `repulsion / d²`（单对上限 `maxRepulsionForce` 防爆）
2. **连线弹簧** `(d - linkDistance) × spring × weight`
3. **向心引力** `-position × gravity`（防止孤立子图漂移）

`alpha` 从 1 按 `alphaDecay`（默认 0.0228）指数衰减，低于 `alphaMin`（0.001）判定静止——同 d3-force 的退火策略：**先猛后缓**，60fps 下约 300 帧（≈5s）内铺开并稳稳停住，而不是长久微抖。速度另按 `velocityDecay` 逐帧衰减并钳制 `maxSpeed`。

**初值确定性**：未给坐标的节点按索引做黄金角螺旋播种（`seedPosition`），同数据 → 同布局，无随机数；数据增删按 `id` 复用旧坐标，只给新节点补位，避免整图跳变。

**复杂度**：排斥为 O(n²)——适合知识库、依赖图等百级节点场景；上千节点建议外部先分簇再分别渲染。

---

## 视觉规则

- **配色**：节点按 `group` 从主题色板取色（`--nm-color-primary-500`、`success`、`warning`、`error`、`info` 等），显式 `color` 优先；`data-theme` 变化时经 `MutationObserver` 重新解析 CSS 变量并重绘
- **节点大小**：基础半径随度数增长（上限 8 度补偿），枢纽节点自然更醒目
- **光晕**：节点带同色柔光（悬停者更强），暗色主题下层次更明显；选中节点另加一道描边环
- **标签**：屏幕固定 12px（不随缩放变形），用背景色描边做"光晕底"，压在连线上依然可读
- **容器**：凹陷（inset）边框 + `--nm-bg-color` 底色，与其它新拟态容器一致

---

## example 中的可调参数

`examples/pages/ComponentsPage.vue` 的「扩展 → 节点图 GraphView」提供了覆盖**全部关键参数**的调参面板（改动即时生效、不重建整图）：

| 分组                          | 控件                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 布局与视图                    | `nodeRadius`（2–20px）· `linkDistance`（40–200px）· `repulsion`（100–3000）· `height`（320–760px）                                                                             |
| 力学动力学（`forceSettings`） | `spring`（0.001–0.03）· `gravity`（0–0.002）· `velocityDecay`（0–0.9）· `maxSpeed`（2–40）· `alphaDecay`（0.004–0.12）· `alphaMin`（0.0004–0.02）· `maxRepulsionForce`（1–20） |
| 视图 / 交互 / 行为            | `showLabels`（自动/常显/悬停）· `showLegend` · `showControls` · `highlightNeighbors` · `draggable` · `pannable` · `zoomable` · `autoFit` · `preservePositions`                 |
| 动作                          | 适应视图 · 重新布局 · 重新唤醒 · ＋新增节点 · －移除节点 · 恢复默认                                                                                                            |

读数区实时显示节点/连线数、悬停与选中项（含分组与双链数）、模拟状态（力学模拟中 / 已静止）以及**当前退火系数 alpha**——模拟运行时以 100ms 轮询（`getAlpha()`）更新，静止后停表，不留下空转定时器。改任一力学参数都只更新引擎设置并唤醒（不清坐标），因此拖滑块时图是"平滑舒展"而不是整图重排。

唯一没进面板的是 `alphaTarget`：它 > 0 会让模拟永不静止（持续 rAF 空转），只在"拖拽期间保持活性"这类场景才有意义，需要时经 `forceSettings.alphaTarget` 传入。

---

## 用法

```vue
<script setup lang="ts">
import { NeumorphismGraphView, type GraphLink, type GraphNode } from '@echolab-auto/ui-frame'

const nodes: GraphNode[] = [
  { id: 'design', label: '设计哲学', group: '核心', size: 11 },
  { id: 'tokens', label: '设计令牌', group: '核心' },
  { id: 'button', label: '按钮', group: '表单' },
  { id: 'graph', label: '节点图', group: '实验' },
]
const links: GraphLink[] = [
  { source: 'design', target: 'tokens', weight: 1.5 },
  { source: 'tokens', target: 'button' },
  { source: 'button', target: 'graph' },
]
</script>

<template>
  <NeumorphismGraphView
    :nodes="nodes"
    :links="links"
    height="520px"
    show-legend
    @node-click="n => console.log('打开笔记', n.id)"
  />
</template>
```

---

## 深入

- [NeumorphismCanvas](./canvas.md) — 通用画布容器（本组件的平移/缩放交互与其一致的取向）
- [NeumorphismArt](./art.md) — 程序化动态效果画布
- [组件总览](../components.md) — 返回全组件分类目录
- [API 参考](../api.md) — 完整 Props/Slots 签名
