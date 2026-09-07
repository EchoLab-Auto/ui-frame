---
id: comp-spinner
title: 'NeumorphismSpinner（加载指示器）'
x: 2493
y: 1792
group: 使用
---

# NeumorphismSpinner

> 加载指示器——24 viewBox 的 SVG 双圆环：中性灰轨道 + 主色圆弧 1s 匀速旋转，可像素级定尺寸，内嵌于 Button 的 loading 态。源码：`src/components/NeumorphismSpinner/`。

```vue
<NeumorphismSpinner size="small" />
```

---

## 可配置项

### Props

| 名称    | 类型                                       | 默认值      | 说明                                                                     |
| ------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------ |
| `size`  | `'small' \| 'medium' \| 'large' \| number` | `'medium'`  | 尺寸档位（14 / 20 / 28px）或具体像素值，支持全局配置 `spinner.size` 级联 |
| `label` | `string`                                   | locale 文案 | 无障碍标签；缺省取 locale `spinnerLoading`（「加载中」）                 |

### Events / Slots

无事件与插槽；根元素 `role="status"` + `aria-label`，SVG 本体 `aria-hidden` + `focusable="false"`。

---

## 用法

```vue
<!-- 档位尺寸 -->
<NeumorphismSpinner size="large" />

<!-- 像素尺寸（跟随按钮文字） -->
<NeumorphismSpinner :size="16" />

<!-- 自定义无障碍标签 -->
<NeumorphismSpinner label="正在提交订单" />
```

全局预设：

```ts
app.use(NeumorphismUI, { spinner: { size: 'small' } })
```

---

## 结构与动画

- 尺寸经 CSS 变量 `--nm-spinner-size` 注入，SVG 宽高 100% 自适应
- 轨道圆（r=9、stroke-width 2.5）描边 `--nm-neutral-200`；圆弧圆描边 `--nm-primary-color`，`stroke-dasharray: 42 14`（周长约 56.5，留 3/4 弧）+ 圆头线帽
- 动画为整枚 SVG 的 `nm-spinner-rotate`：1s 线性 360° 无限旋转

### Reduced-motion

`prefers-reduced-motion` 时旋转停止，保留静态圆弧——视觉上仍是「轨道 + 一段弧」的可识别加载符号，但不产生任何位移。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名
