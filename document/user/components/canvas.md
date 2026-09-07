---
id: comp-canvas
title: 'NeumorphismCanvas（画布）'
x: 3277
y: 2040
group: 使用
---

# NeumorphismCanvas

> 可缩放 / 平移 / 全屏的内容画布——凹陷槽视口内嵌 `transform: scale()` 内容层与原生滚动：拖拽平移、Ctrl/⌘ + 滚轮光标缩放、点阵 / 线条网格底纹，右下浮动控制胶囊一应俱全；缩放经锚点换算保持视口不动点。源码：`src/components/NeumorphismCanvas/`。

```vue
<NeumorphismCanvas v-model="zoom" height="600px">
  <YourLargeContent />
</NeumorphismCanvas>
```

---

## 可配置项

### Props

| 名称             | 类型                | 默认值    | 说明                                                      |
| ---------------- | ------------------- | --------- | --------------------------------------------------------- |
| `modelValue`     | `number`            | `1`       | 当前缩放（v-model；1 = 100%），不传也可内部自治           |
| `minZoom`        | `number`            | `0.1`     | 最小缩放                                                  |
| `maxZoom`        | `number`            | `5`       | 最大缩放                                                  |
| `zoomStep`       | `number`            | `0.1`     | 控制按钮 +/- 的步长                                       |
| `showGrid`       | `boolean`           | `true`    | 是否显示网格底纹，支持全局配置 `canvas.showGrid` 级联     |
| `gridSize`       | `number`            | `20`      | 网格单元尺寸（px，缩放前），支持 `canvas.gridSize` 级联   |
| `gridVariant`    | `'dots' \| 'lines'` | `'dots'`  | 网格样式：点阵 / 线条，支持 `canvas.gridVariant` 级联     |
| `showControls`   | `boolean`           | `true`    | 是否显示底部浮动控制胶囊，支持 `canvas.showControls` 级联 |
| `showFit`        | `boolean`           | `true`    | 控制胶囊是否含「适应屏幕」按钮                            |
| `showFullscreen` | `boolean`           | `true`    | 控制胶囊是否含全屏切换按钮                                |
| `panOnDrag`      | `boolean`           | `true`    | 鼠标拖拽平移（按住空格 + 拖拽始终可用）                   |
| `wheelZoom`      | `boolean`           | `true`    | Ctrl/⌘ + 滚轮以光标为锚点缩放                             |
| `width`          | `string`            | `'100%'`  | 画布宽度（CSS 值）                                        |
| `height`         | `string`            | `'500px'` | 画布高度（CSS 值）                                        |

### Events / Slots

| 名称                   | 说明                                          |
| ---------------------- | --------------------------------------------- |
| `update:modelValue(z)` | 缩放变化（v-model）                           |
| `zoom-change(z)`       | 缩放变化（与上同步触发，便于非 v-model 场景） |
| 默认 slot              | 画布内容（自然尺寸测量，随缩放 scale）        |
| `toolbar` slot         | 顶部工具条（仅使用时渲染）                    |

### Exposes

| 方法                 | 说明                                     |
| -------------------- | ---------------------------------------- |
| `zoomIn()`           | 按 `zoomStep` 放大                       |
| `zoomOut()`          | 按 `zoomStep` 缩小                       |
| `resetZoom()`        | 回到 100%                                |
| `fit()`              | 内容缩放至适配视口（留 32px 边距）并居中 |
| `toggleFullscreen()` | 进入 / 退出全屏                          |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
const canvasRef = ref()
</script>

<template>
  <NeumorphismCanvas ref="canvasRef" grid-variant="lines" :min-zoom="0.25">
    <template #toolbar>
      <button @click="canvasRef.fit()">适应屏幕</button>
    </template>
    <div style="width: 1200px; height: 800px">大画幅内容</div>
  </NeumorphismCanvas>
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { canvas: { showGrid: true, gridSize: 24, gridVariant: 'lines' } })
```

---

## 交互动画详解

### 缩放锚点（setZoom）

每次缩放先记录「视口内不动点 → 内容坐标」，缩放生效后 nextTick 反推 scrollLeft/Top，使按钮缩放以视口中心、滚轮缩放以光标为不动点；缩放值钳制在 `[minZoom, maxZoom]` 并保留三位小数。按钮 / 键盘缩放走 0.3s spring 平滑过渡，滚轮缩放即时响应（`smoothZoom` 开关）。

### 平移

- 鼠标主键拖拽（`panOnDrag`）或按住空格拖拽（始终可用）；4px 位移阈值后才进入平移态，未移动时保留原点击行为
- 指针落在控制按钮、表单控件或带 `data-nm-no-pan` 的元素上不触发平移；触屏交给原生 overflow 滚动
- 空格键仅在指针悬停画布或焦点位于画布内时接管（且焦点不在输入框 / contentEditable 时），阻止页面滚动

### 键盘交互（视口聚焦后）

| 按键            | 行为                           |
| --------------- | ------------------------------ |
| `←` `→` `↑` `↓` | 平移 60px（加 Shift 为 200px） |
| `+` / `=`       | 放大                           |
| `-` / `_`       | 缩小                           |
| `0`             | 重置为 100%                    |

视口 `tabindex="0"`、`role="application"`，`focus-visible` 内嵌主色描边。

### 网格与控制胶囊

- 网格底纹为 CSS 渐变背景（点阵 `radial-gradient` / 线条双向 `linear-gradient`），`background-size` 随缩放联动且最小 3px，0.3s 过渡
- 控制胶囊：缩小 / 百分比读数 / 放大 / 重置 / 适应屏幕 / 全屏，hover 内陷、active 加深内陷、重置按钮 hover 时图标旋转 180°；到达缩放边界时对应按钮禁用
- 内容自然尺寸经 ResizeObserver 跟踪，`fit()` 依赖最新测量值
- reduced-motion 下内容缩放过渡、网格过渡与按钮动画全部移除

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 exposes
