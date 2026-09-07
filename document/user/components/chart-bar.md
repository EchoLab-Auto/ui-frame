---
id: comp-chart-bar
title: 'NeumorphismChartBar（柱状图）'
x: 3277
y: 1420
group: 使用
---

# NeumorphismChartBar

> 凹陷槽里的 SVG 柱状图——零依赖纯 SVG 渲染：headless `useBarChart`（构建于共享底座 `useChart` 之上）负责刻度 / 布局 / 调色板，组件层只管渲染与交互；柱体用 CSS `drop-shadow` 实现新拟态浮雕。源码：`src/components/NeumorphismChartBar/`。

```vue
<NeumorphismChartBar :series="series" title="月度销量" @bar-click="onPick" />
```

---

## 可配置项

### Props

| 名称          | 类型                         | 默认值       | 说明                                                            |
| ------------- | ---------------------------- | ------------ | --------------------------------------------------------------- |
| `series`      | `ChartSeries[]`              | `[]`         | 数据系列：`{ name, data: { label?, value, color? }[], color? }` |
| `width`       | `string \| number`           | `'100%'`     | 图表宽度（数字按 px）                                           |
| `height`      | `string \| number`           | `'300px'`    | 图表高度（数字按 px）                                           |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 柱条方向，支持 `chart.bar.orientation` 级联                     |
| `stacked`     | `boolean`                    | `false`      | 多系列堆叠（默认分组并列），支持 `chart.bar.stacked` 级联       |
| `barGap`      | `number`                     | `0.2`        | 组内间隙占组宽比例（0-1），支持 `chart.bar.barGap` 级联         |
| `showTooltip` | `boolean`                    | `true`       | 悬停提示，支持全局配置 `chart.showTooltip` 级联                 |
| `showLegend`  | `boolean`                    | `true`       | 底部图例，支持 `chart.showLegend` 级联                          |
| `showGrid`    | `boolean`                    | `true`       | 横向网格线 + 零基线，支持 `chart.showGrid` 级联                 |
| `showAxis`    | `boolean`                    | `true`       | X / Y 轴线与刻度标签，支持 `chart.showAxis` 级联                |
| `animate`     | `boolean`                    | `true`       | 入场生长动画，支持 `chart.animate` 级联                         |
| `yMin`        | `number`                     | 数据最小值   | Y 轴下限（缺省取数据最小值与 0 的较小者）                       |
| `yMax`        | `number`                     | 数据最大值   | Y 轴上限（缺省取数据最大值与 0 的较大者）                       |
| `title`       | `string`                     | —            | 标题文本（也可用 `title` 插槽自定义）                           |

### Events / Slots

| 名称         | 说明                                           |
| ------------ | ---------------------------------------------- |
| `bar-click`  | 点击柱体，载荷 `{ index, seriesIndex, value }` |
| `title` slot | 自定义标题区内容（与 `title` prop 并存渲染）   |

---

## 用法

```vue
<script setup lang="ts">
import type { ChartSeries } from '@echolab-auto/ui-frame'

const series: ChartSeries[] = [
  {
    name: '线上',
    data: [
      { label: '一月', value: 120 },
      { label: '二月', value: 200 },
    ],
  },
  {
    name: '线下',
    color: '#feca57',
    data: [
      { label: '一月', value: 80 },
      { label: '二月', value: 160 },
    ],
  },
]
</script>

<template>
  <!-- 固定 Y 轴量程，便于多图对比 -->
  <NeumorphismChartBar :series="series" :y-min="0" :y-max="300" />
</template>
```

全局预设（`chart.bar.*` 键：`orientation` / `stacked` / `barGap`，显式 prop 优先于全局配置）：

```ts
app.use(NeumorphismUI, { chart: { showGrid: true, animate: false, bar: { stacked: true } } })
```

---

## 交互动画详解

### 渲染与布局

- 容器尺寸经 ResizeObserver 跟踪，绘图区 = 容器 − 边距（默认 `{ top: 24, right: 24, bottom: 40, left: 48 }`），SVG viewBox 随之自适应
- Y 轴刻度走 nice-number 算法（1/2/5 阶梯，最多 5 档），数值标签自动缩写为 `1.2K` / `3.4M`
- 调色板取自 `--nm-chart-color-1..6` token，并监听 `<html data-theme>` 变化——明暗主题切换后自动重取色
- 系列 / 数据点可用 `color` 单独覆盖配色；柱宽 ≤6px 或高度 ≤6px 时圆角降为 1px

### 悬停与键盘

- 悬停柱体：浮雕阴影加深 + tooltip 跟随光标（fixed 定位，`150ms` 弹入）
- 容器可聚焦（`tabindex="0"`，`role="img"`），方向键 `←/→` 循环移动焦点数据点，`Home/End` 跳首尾；聚焦柱体获得与悬停一致的强调样式
- `focus-visible` 时凹陷槽叠加 2px 主色外环

### 入场动画

`nm-chart-bar-grow`：柱体自底部 `scaleY(0) → 1` 生长，0.5s spring 曲线，逐柱 40ms 阶梯延迟；reduced-motion 下全部动画与过渡移除、十字准星光标还原。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useBarChart`
