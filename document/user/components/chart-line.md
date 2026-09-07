---
id: comp-chart-line
title: 'NeumorphismChartLine（折线图）'
x: 3277
y: 1544
group: 使用
---

# NeumorphismChartLine

> 十字线联动的 SVG 折线图——`useLineChart` 负责曲线构建（Catmull-Rom 平滑），悬停交互抽至 `useChartInteraction`：rAF 合帧的最近点扫描、虚线十字线与多系列结构化 tooltip。源码：`src/components/NeumorphismChartLine/`。

```vue
<NeumorphismChartLine :series="series" curve="smooth" area @point-click="onPick" />
```

---

## 可配置项

### Props

| 名称          | 类型                             | 默认值     | 说明                                                                   |
| ------------- | -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `series`      | `ChartSeries[]`                  | `[]`       | 数据系列：`{ name, data: { label?, value, color? }[], color? }`        |
| `width`       | `string \| number`               | `'100%'`   | 图表宽度（数字按 px）                                                  |
| `height`      | `string \| number`               | `'300px'`  | 图表高度（数字按 px）                                                  |
| `curve`       | `'linear' \| 'smooth' \| 'step'` | `'smooth'` | 曲线形态：直线 / Catmull-Rom 平滑 / 阶梯，支持 `chart.line.curve` 级联 |
| `area`        | `boolean`                        | `false`    | 线下方面积填充（纵向渐变色带），支持 `chart.line.area` 级联            |
| `areaOpacity` | `number`                         | `0.1`      | 面积填充不透明度基准                                                   |
| `showPoints`  | `boolean`                        | `true`     | 是否绘制数据点，支持 `chart.line.showPoints` 级联                      |
| `pointSize`   | `number`                         | `6`        | 数据点半径（px）                                                       |
| `lineWidth`   | `number`                         | `2.5`      | 线宽（px），支持 `chart.line.lineWidth` 级联                           |
| `showTooltip` | `boolean`                        | `true`     | 悬停十字线与 tooltip，支持全局配置 `chart.showTooltip` 级联            |
| `showLegend`  | `boolean`                        | `true`     | 底部图例，支持 `chart.showLegend` 级联                                 |
| `showGrid`    | `boolean`                        | `true`     | 横向网格线，支持 `chart.showGrid` 级联                                 |
| `showAxis`    | `boolean`                        | `true`     | X / Y 轴线与刻度标签，支持 `chart.showAxis` 级联                       |
| `animate`     | `boolean`                        | `true`     | 入场动画，支持 `chart.animate` 级联                                    |
| `yMin`        | `number`                         | 数据最小值 | Y 轴下限（缺省取数据最小值与 0 的较小者）                              |
| `yMax`        | `number`                         | 数据最大值 | Y 轴上限（缺省取数据最大值与 0 的较大者）                              |
| `title`       | `string`                         | —          | 标题文本（也可用 `title` 插槽自定义）                                  |

### Events / Slots

| 名称          | 说明                                             |
| ------------- | ------------------------------------------------ |
| `point-click` | 点击数据点，载荷 `{ index, seriesIndex, value }` |
| `title` slot  | 自定义标题区内容（与 `title` prop 并存渲染）     |

---

## 用法

```vue
<!-- 阶梯线 + 无数据点 -->
<NeumorphismChartLine :series="series" curve="step" :show-points="false" />

<!-- 面积图 + 加粗线宽 -->
<NeumorphismChartLine :series="series" area :area-opacity="0.2" :line-width="3" />
```

全局预设（`chart.line.*` 键：`curve` / `area` / `showPoints` / `lineWidth`，显式 prop 优先于全局配置）：

```ts
app.use(NeumorphismUI, {
  chart: { showTooltip: true, animate: false, line: { curve: 'step', showPoints: false } },
})
```

---

## 交互动画详解

### 十字线悬停（useChartInteraction）

- mousemove 经 rAF 合帧，把光标 x 换算为最近数据点索引；悬停时容器光标隐藏（`cursor: none`）
- 显示纵向虚线十字线 + 各系列交点圆点（4.5px，带浮雕阴影）；最近点放大 1.5px、描边加粗，其余点降为 0.3 不透明度
- tooltip 为结构化内容：x 轴标签作标题，各系列色点 + 数值逐行排列（模板插值渲染，杜绝 XSS）

### 入场动画

| 元素   | 动画                                                   | 阶梯延迟     |
| ------ | ------------------------------------------------------ | ------------ |
| 折线   | `nm-chart-line-draw`：stroke-dashoffset 描边生长，0.8s | 每系列 200ms |
| 面积   | `nm-chart-area-fade`：透明度淡入，0.8s                 | 随折线       |
| 数据点 | `nm-chart-point-pop`：半径弹出（spring），0.4s         | 每点 60ms    |

### 键盘与无障碍

容器可聚焦（`tabindex="0"`，`role="img"`）：`←/→` 循环移动焦点数据点，`Home/End` 跳首尾；聚焦点获得强调浮雕阴影。调色板监听 `<html data-theme>`，主题切换自动重取色。reduced-motion 下描边 / 弹出 / 淡入动画全部移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useLineChart` / `useChartInteraction`
