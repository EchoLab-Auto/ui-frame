---
id: comp-chart-pie
title: 'NeumorphismChartPie（饼图）'
x: 3277
y: 1668
group: 使用
---

# NeumorphismChartPie

> 支持环形与新拟态浮雕的 SVG 饼图——`usePieChart` 把扁平数据换算为弧路径（圆角弧段 + 内外标签定位），`innerRadius > 0` 时经 `foreignObject` 在圆心开出 `center` 插槽，天然适合 donut 总计展示。源码：`src/components/NeumorphismChartPie/`。

```vue
<NeumorphismChartPie :data="data" title="流量来源" @arc-click="onPick" />
```

---

## 可配置项

### Props

| 名称             | 类型                              | 默认值      | 说明                                                                                          |
| ---------------- | --------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `data`           | `ChartDataPoint[]`                | `[]`        | 数据点：`{ label?, value, color? }`                                                           |
| `width`          | `string \| number`                | `'100%'`    | 图表宽度（数字按 px）                                                                         |
| `height`         | `string \| number`                | `'300px'`   | 图表高度（数字按 px）                                                                         |
| `innerRadius`    | `number`                          | `0`         | 内半径（px）；`>0` 即环形（donut），并启用 `center` 插槽，支持 `chart.pie.innerRadius` 级联   |
| `padAngle`       | `number`                          | `0.02`      | 弧段间隔角（弧度）；数据仅一项时自动归零                                                      |
| `startAngle`     | `number`                          | `-90`       | 起始角（度，12 点方向为 -90）                                                                 |
| `labelPosition`  | `'inside' \| 'outside' \| 'none'` | `'outside'` | 标签位置：弧内百分比 / 弧外引线标签 / 不显示，支持 `chart.pie.labelPosition` 级联             |
| `roundedCorners` | `boolean`                         | `false`     | 弧段端头圆角，支持 `chart.pie.roundedCorners` 级联                                            |
| `showTooltip`    | `boolean`                         | `true`      | 悬停提示，支持全局配置 `chart.showTooltip` 级联                                               |
| `showLegend`     | `boolean`                         | `true`      | 底部图例（按数据点逐项），支持 `chart.showLegend` 级联                                        |
| `animate`        | `boolean`                         | `true`      | 入场展开动画，支持 `chart.animate` 级联                                                       |
| `title`          | `string`                          | —           | 标题文本（也可用 `title` 插槽自定义）                                                         |
| `colorPalette`   | `string[]`                        | `[]`        | 自定义调色板；为空时依次回退全局配置 `chart.colorPalette`、主题 token `--nm-chart-color-1..6` |

### Events / Slots

| 名称          | 说明                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `arc-click`   | 点击弧段，载荷 `{ index, value, label }`                             |
| `title` slot  | 自定义标题区内容（与 `title` prop 并存渲染）                         |
| `center` slot | 圆心内容（仅 `innerRadius > 0` 时渲染），作用域 `{ total }` 暴露总值 |

---

## 用法

```vue
<!-- 环形图 + 圆心总计 -->
<NeumorphismChartPie :data="data" :inner-radius="56">
  <template #center="{ total }">
    <strong>{{ total }}</strong>
  </template>
</NeumorphismChartPie>

<!-- 弧内百分比 + 自定义配色 -->
<NeumorphismChartPie
  :data="data"
  label-position="inside"
  :color-palette="['#ff6b6b', '#feca57', '#48dbfb']"
/>
```

全局预设（`chart.pie.*` 键：`innerRadius` / `labelPosition` / `roundedCorners`，另有全局调色板 `chart.colorPalette`；显式 prop 优先于全局配置）：

```ts
app.use(NeumorphismUI, {
  chart: {
    showLegend: true,
    showTooltip: true,
    colorPalette: ['#ff6b6b', '#feca57', '#48dbfb'],
    pie: { innerRadius: 56, labelPosition: 'inside' },
  },
})
```

---

## 交互动画详解

### 弧段交互

- 悬停 / 键盘聚焦的弧段 `scale(1.03)` 放大 + 浮雕阴影加深（0.3s spring），并弹出 tooltip（数据点配色优先，其次调色板）
- 弧段描边使用 `--nm-surface-color`，在浅色 / 暗色主题下都能与背景切开缝隙
- 空数据（总和为 0）时在圆心渲染 locale 文案 `chartNoData`

### 入场动画

`nm-chart-arc-expand`：弧段自圆心 `scale(0) → 1` 展开，0.5s spring，逐弧 100ms 阶梯延迟；reduced-motion 下动画、悬停放大与过渡全部移除。

### 键盘与无障碍

- 容器 `role="img"`，aria-label 概述为「N 个分段、总计 X」（不串联每个分段，避免读屏冗长），各弧段另有独立 `aria-label="标签: 百分比%"`
- 容器可聚焦，`←/→` 循环移动焦点弧段，`Home/End` 跳首尾
- 调色板监听 `<html data-theme>` 变化，主题切换自动重取色（`colorPalette` 传入后不跟踪）

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `usePieChart`
