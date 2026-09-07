---
id: comp-divider
title: 'NeumorphismDivider（分割线）'
x: 2493
y: 2040
group: 使用
---

# NeumorphismDivider

> 分割线——内容区块间的细分隔：水平 / 垂直双向、虚线、可嵌文字（左中右对齐），hover 时文字变主色。源码：`src/components/NeumorphismDivider/`。

```vue
<NeumorphismDivider>更多内容</NeumorphismDivider>
```

---

## 可配置项

### Props

| 名称        | 类型                            | 默认值         | 说明                                                                                                    |
| ----------- | ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `direction` | `'horizontal' \| 'vertical'`    | `'horizontal'` | 方向，支持全局配置 `divider.direction` 级联                                                             |
| `align`     | `'left' \| 'center' \| 'right'` | `'center'`     | 水平模式下的文字对齐，支持 `divider.align` 级联                                                         |
| `dashed`    | `boolean`                       | `false`        | 虚线样式，支持 `divider.dashed` 级联                                                                    |
| `inset`     | `boolean`                       | `false`        | 内缩：水平时左右各让出 `--nm-spacing-lg`，垂直时上下各让出 `--nm-spacing-lg`，支持 `divider.inset` 级联 |

### Events / Slots

| 名称      | 说明                                               |
| --------- | -------------------------------------------------- |
| 默认 slot | 分割线中间的文字（仅水平模式排版为「线-文字-线」） |

根元素 `role="separator"` + `aria-orientation`（随 `direction`），语义完备。

---

## 用法

```vue
<!-- 纯线条 -->
<NeumorphismDivider />

<!-- 文字左对齐 + 虚线 -->
<NeumorphismDivider align="left" dashed>第一节</NeumorphismDivider>

<!-- 行内垂直分隔 -->
<span>首页</span>
<NeumorphismDivider direction="vertical" />
<span>归档</span>
```

全局预设：

```ts
app.use(NeumorphismUI, { divider: { direction: 'horizontal', dashed: true } })
```

---

## 排版细节

| 模式       | 表现                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------- |
| 水平无线字 | 通栏 1px 上边线（`--nm-border-subtle`），上下各 16px 外边距                                   |
| 水平带文字 | 文字两侧由伪元素绘制 120px 定长线段；`align: left/right` 时隐藏对应一侧的线，形成单边延伸     |
| 垂直       | 1em 高的 1px 左边线，行内排列（`inline-flex` + `vertical-align: middle`），左右各 12px 外边距 |
| 虚线       | 水平改 `border-top-style`、垂直改 `border-left-style` 为 dashed                               |
| inset      | 水平：上下外边距保持 16px、左右各让出 `--nm-spacing-lg`；垂直：上下各让出 `--nm-spacing-lg`   |

文字样式：两侧 16px 内边距、不换行、500 字重、次级文字色；hover 分割线时文字 0.3s 渐变为 `--nm-primary-color`。

### Reduced-motion

`prefers-reduced-motion` 时移除文字颜色过渡。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名
