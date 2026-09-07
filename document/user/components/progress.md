---
id: comp-progress
title: 'NeumorphismProgress（进度条）'
x: 2493
y: 1420
group: 使用
---

# NeumorphismProgress

> 进度条——凹陷轨道 + 浮起进度芯，线性 / 环形双形态，内置 6 种流动动效与 Material 式不确定模式；百分比数字随进度 rAF 平滑滚动。核心几何与动画逻辑抽在 headless `useProgress`。源码：`src/components/NeumorphismProgress/`。

```vue
<NeumorphismProgress v-model="percent" effect="pulse" show-label />
```

---

## 可配置项

### Props

| 名称            | 类型                                                                 | 默认值      | 说明                                                                 |
| --------------- | -------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `modelValue`    | `number`                                                             | `0`         | 当前值（与 `max` 换算为百分比，自动钳制在 0–100）                    |
| `max`           | `number`                                                             | `100`       | 最大值                                                               |
| `variant`       | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'`        | `'primary'` | 颜色变体，支持全局配置 `progress.variant` 级联                       |
| `size`          | `'small' \| 'medium' \| 'large'`                                     | `'medium'`  | 尺寸档位，支持 `progress.size` 级联                                  |
| `type`          | `'line' \| 'circle'`                                                 | `'line'`    | 形态：线性进度条或 SVG 环形进度                                      |
| `showLabel`     | `boolean`                                                            | `false`     | 显示百分比文字（数字随进度平滑滚动），支持 `progress.showLabel` 级联 |
| `indeterminate` | `boolean`                                                            | `false`     | 不确定模式：忽略数值，播放往复追逐动画                               |
| `effect`        | `'default' \| 'pulse' \| 'flow' \| 'wave' \| 'stripes' \| 'sparkle'` | `'default'` | 线性进度条的流动动效，支持 `progress.effect` 级联                    |

### Events / Slots

无自定义事件与插槽——纯展示组件，语义通过 `role="progressbar"` + `aria-valuemin/max/now` 暴露。

---

## 尺寸规格

| size     | 线性轨道高度 | 环形 SVG 边长 / 描边宽 |
| -------- | ------------ | ---------------------- |
| `small`  | 6px          | 64px / 4px             |
| `medium` | 12px         | 120px / 7px            |
| `large`  | 18px         | 160px / 10px           |

```vue
<!-- 成功态 + 标签 -->
<NeumorphismProgress :model-value="100" variant="success" show-label />

<!-- 环形进度 -->
<NeumorphismProgress type="circle" :model-value="72" size="large" show-label />

<!-- 不确定模式（等待远端响应） -->
<NeumorphismProgress indeterminate variant="warning" />
```

全局预设：

```ts
app.use(NeumorphismUI, { progress: { variant: 'primary', effect: 'flow', showLabel: true } })
```

---

## 六种 effect 动效详解

动效全部跑在进度条的 `::before` / `::after` 伪元素上，只动 `transform`（合成层），不重绘进度条本体：

| effect    | 表现                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `default` | 微光扫过：45% 宽的柔光带周期横穿进度条，扫完后停驻片刻再循环（2.6s ambient）                           |
| `pulse`   | 能量光束：尾部渐隐的彗星头（白炽核 + 光晕 + 两枚拖尾火星）随 2.4s 呼吸，另有一条 4.8s 偶尔掠过的细闪光 |
| `flow`    | 绸缎流光：200% 宽的双组光带缓慢平移，-50% → 0 的位移与图案周期对齐，无缝循环（4.6s）                   |
| `wave`    | 水波荡漾：两层内嵌 SVG 正弦波片（120px / 180px 周期）以不同速度、相反方向交错滑动（6.5s / 9.5s）       |
| `stripes` | 理发灯斜纹：-45° 重复渐变光带匀速右移，位移精确取轴向周期 16·√2 ≈ 22.627px 实现无缝（2.6s）            |
| `sparkle` | 星尘闪烁：两层微光点反向漂移（7s / 11s reverse），各自按 2.6s / 3.8s 时钟独立明灭                      |

补充状态：

- **完成态（100%）**：进度条获得跟随变体色的呼吸光晕（`nm-progress-complete-glow` 2s），effect 光带停止；`pulse` 下通过 `background-size` 过渡把隐藏实色层从左到右「追上」光束，退出完成态反向抹除
- **不确定模式（线性）**：Material 式双段追逐——真实进度条 + 一个 45% 透明度的伪元素尾随段，各自按 2.4s 的 grow/shrink 编排在轨道内往复

---

## 环形进度（type="circle"）

- SVG 双圆结构：轨道圆（surface-raised 色）+ 进度圆（变体色描边、`stroke-linecap: round`），整体 `rotate(-90deg)` 让进度从 12 点方向起笔
- 进度映射为 `stroke-dashoffset = 周长 × (1 - percentage/100)`，几何参数（`circleSize` / `strokeWidth` / `radius` / `circumference` / `dashOffset`）由 `useProgress` 按 `size` 推导
- `dashoffset` 过渡 0.65s（与线性条 width 过渡同步）；周长经 CSS 变量 `--nm-progress-c` 内联注入供 keyframes 使用
- 不确定模式：整个 SVG 自 -90° 起连续旋转（1.6s），同时进度圆的 dash 在「点 ↔ 70% 弧」间脉冲伸缩
- 百分比标签绝对定位于圆心，等宽数字（`tabular-nums`）

## 数字滚动与无障碍

- `displayPercentage` 经 rAF ease-out-cubic 在 650ms 内从旧值滚动到新值（对齐 width 过渡时长），reduced-motion 下直接跳变
- 未开 `showLabel` 时自动补 `aria-label`（locale `progressLabel`，「进度 {percentage}%」）；不确定模式挂 `aria-busy` 并以 `aria-valuetext` 读 locale `progressIndeterminate`

## Reduced-motion

- 移除全部 effect 光带、完成态光晕、不确定追逐与环形旋转
- 环形不确定模式降级为**静态 75% 弧**（`dasharray: 0.75C`），保留「正在加载」的可读语义而不播放动画

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名与 `useProgress` 组合式函数
