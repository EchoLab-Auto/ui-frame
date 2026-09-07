---
id: comp-skeleton
title: 'NeumorphismSkeleton（骨架屏）'
x: 2493
y: 1544
group: 使用
---

# NeumorphismSkeleton

> 骨架屏——加载占位块：凹陷底 + 双层流光扫过，text / circle / rect 三种形状自由拼装出与真实布局同构的占位轮廓。源码：`src/components/NeumorphismSkeleton/`。

```vue
<NeumorphismSkeleton variant="text" :count="3" />
```

---

## 可配置项

### Props

| 名称        | 类型                           | 默认值    | 说明                                           |
| ----------- | ------------------------------ | --------- | ---------------------------------------------- |
| `variant`   | `'text' \| 'circle' \| 'rect'` | `'text'`  | 形状变体，支持全局配置 `skeleton.variant` 级联 |
| `width`     | `string \| number`             | —         | 宽度（数字自动补 `px`）                        |
| `height`    | `string \| number`             | —         | 高度（数字自动补 `px`）                        |
| `count`     | `number`                       | `1`       | 重复渲染数量（向下取整，最小 0）               |
| `animation` | `'pulse' \| 'wave' \| 'none'`  | `'pulse'` | 加载动效，支持 `skeleton.animation` 级联       |

### Events / Slots

无事件与插槽；每个占位块带 `role="status"` + `aria-label`（locale `skeletonLoading`），流光层 `aria-hidden`。

---

## 形状变体

| variant  | 默认尺寸          | 典型用途                 |
| -------- | ----------------- | ------------------------ |
| `text`   | 高 14px、宽 100%  | 文本行（段落下间距 8px） |
| `circle` | 44 × 44px 正圆    | 头像占位                 |
| `rect`   | 宽 100%、高 100px | 图片 / 卡片占位          |

```vue
<!-- 图文卡片占位：头像 + 三行文字 -->
<div style="display:flex; gap:12px">
  <NeumorphismSkeleton variant="circle" />
  <div style="flex:1">
    <NeumorphismSkeleton variant="text" :count="3" animation="wave" />
  </div>
</div>

<!-- 自定义尺寸的矩形占位 -->
<NeumorphismSkeleton variant="rect" :height="180" width="100%" />

<!-- 静态占位（无动画） -->
<NeumorphismSkeleton variant="text" animation="none" width="60%" />
```

全局预设：

```ts
app.use(NeumorphismUI, { skeleton: { animation: 'wave', variant: 'rect' } })
```

---

## 加载动效详解

| animation | 表现                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| `pulse`   | 整块透明度 0.5 ↔ 1 呼吸（1.6s ease-in-out）                                                       |
| `wave`    | 双层流光：105° 斜向光带快速扫过（1.6s），叠加一层 40% 宽的慢速尾光（2.4s、延迟 0.3s）模拟自然反光 |
| `none`    | 静态凹陷块，无任何动画                                                                            |

### Reduced-motion

`prefers-reduced-motion` 时移除全部过渡与动画，占位块静态呈现。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名
