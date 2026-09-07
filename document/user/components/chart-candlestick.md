---
id: comp-chart-candlestick
title: 'NeumorphismChartCandlestick（K 线图）'
x: 3277
y: 1792
group: 使用
---

# NeumorphismChartCandlestick

> OHLC 蜡烛图——`useCandlestickChart` 把绘图区切分为价格区（72%）与成交量区（28%），支持多条移动平均线（MA）、涨跌双色浮雕蜡烛与双语系 OHLC tooltip。源码：`src/components/NeumorphismChartCandlestick/`。

```vue
<NeumorphismChartCandlestick :data="ohlc" title="股价走势" @candle-click="onPick" />
```

---

## 可配置项

### Props

| 名称          | 类型               | 默认值        | 说明                                                                                        |
| ------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `data`        | `OhlcDataPoint[]`  | `[]`          | K 线数据：`{ date, open, high, low, close, volume? }`                                       |
| `width`       | `string \| number` | `'100%'`      | 图表宽度（数字按 px）                                                                       |
| `height`      | `string \| number` | `'400px'`     | 图表高度（数字按 px）                                                                       |
| `showVolume`  | `boolean`          | `true`        | 是否绘制底部成交量副图（半透明柱 + 右侧独立刻度），支持 `chart.candlestick.showVolume` 级联 |
| `showMA`      | `boolean`          | `true`        | 是否绘制移动平均线，支持 `chart.candlestick.showMA` 级联                                    |
| `maPeriods`   | `number[]`         | `[5, 10, 20]` | MA 周期列表，支持 `chart.candlestick.maPeriods` 级联                                        |
| `upColor`     | `string`           | token         | 涨色，缺省 `var(--nm-chart-up-color)`，支持 `chart.candlestick.upColor` 级联                |
| `downColor`   | `string`           | token         | 跌色，缺省 `var(--nm-chart-down-color)`，支持 `chart.candlestick.downColor` 级联            |
| `showTooltip` | `boolean`          | `true`        | 悬停 OHLC 提示，支持全局配置 `chart.showTooltip` 级联                                       |
| `showGrid`    | `boolean`          | `true`        | 价格区网格线（成交量区为虚线网格），支持 `chart.showGrid` 级联                              |
| `showAxis`    | `boolean`          | `true`        | 价格 / 日期轴线与刻度标签，支持 `chart.showAxis` 级联                                       |
| `animate`     | `boolean`          | `true`        | 入场动画，支持 `chart.animate` 级联                                                         |
| `title`       | `string`           | —             | 标题文本（也可用 `title` 插槽自定义）                                                       |

### Events / Slots

| 名称           | 说明                                                           |
| -------------- | -------------------------------------------------------------- |
| `candle-click` | 点击蜡烛实体，载荷 `{ index, open, high, low, close, volume }` |
| `title` slot   | 自定义标题区内容（与 `title` prop 并存渲染）                   |

---

## 用法

```vue
<script setup lang="ts">
import type { OhlcDataPoint } from '@echolab-auto/ui-frame'

const ohlc: OhlcDataPoint[] = [
  { date: '09-01', open: 10, high: 11.2, low: 9.8, close: 11, volume: 12000 },
]
</script>

<template>
  <!-- 纯价格线（关闭副图与 MA） -->
  <NeumorphismChartCandlestick :data="ohlc" :show-volume="false" :show-m-a="false" />

  <!-- 自定义涨跌色与 MA 周期 -->
  <NeumorphismChartCandlestick
    :data="ohlc"
    up-color="#2ecc71"
    down-color="#e74c3c"
    :ma-periods="[5, 20, 60]"
  />
</template>
```

全局预设（`chart.candlestick.*` 键：`upColor` / `downColor` / `showVolume` / `showMA` / `maPeriods` / `bodyWidthRatio`，显式 prop 优先于全局配置）：

```ts
app.use(NeumorphismUI, {
  chart: {
    candlestick: {
      upColor: '#2ecc71',
      downColor: '#e74c3c',
      showVolume: false,
      maPeriods: [5, 20, 60],
    },
  },
})
```

---

## 交互动画详解

### 布局与渲染

- 价格区占绘图区高 72%、成交量区占 28%，两区各有独立 clipPath 与刻度；价格 Y 轴在左、成交量 Y 轴在右，区间以虚线分隔
- 蜡烛影线（最高/最低）用 `--nm-chart-wick-color` 细线，实体宽度由 `chart.candlestick.bodyWidthRatio`（默认 0.6）控制；实体宽 ≤3px 时圆角降为 1px
- 涨 / 跌蜡烛配色分别级联 `upColor` / `downColor`，缺省走 `--nm-chart-up-color` / `--nm-chart-down-color` token，主题切换自动跟随
- MA 线不加 clipPath，曲线可自然越出绘图区；图例区仅列 MA 线

### 悬停与 tooltip

- 悬停蜡烛：整组浮雕阴影加深；tooltip 按 locale 拼接 `开 | 高 | 低 | 收 [| 量]`（`chartOhlcOpen/High/Low/Close` + `chartVolume`），fixed 定位跟随光标
- 容器可聚焦（`tabindex="0"`，`role="img"`），`←/→` 循环移动焦点蜡烛，`Home/End` 跳首尾；聚焦蜡烛获得强调样式

### 入场动画

| 元素     | 动画                                                 | 阶梯延迟   |
| -------- | ---------------------------------------------------- | ---------- |
| 蜡烛实体 | `nm-chart-candle-grow`：自底部 `scaleY(0) → 1`，0.4s | 每根 15ms  |
| 成交量柱 | `nm-chart-bar-grow`：同样生长，0.4s                  | 每根 20ms  |
| MA 线    | `nm-chart-line-draw`：stroke-dashoffset 描边，0.6s   | 每条 200ms |

reduced-motion 下全部动画与过渡移除、十字准星光标还原。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useCandlestickChart`
