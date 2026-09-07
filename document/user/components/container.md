---
id: comp-container
title: 'NeumorphismContainer（内容容器）'
x: 3277
y: 1048
group: 使用
---

# NeumorphismContainer

> 响应式内容容器——水平居中 + 断点最大宽度的页面骨架：`fixed` 模式按五档断点逐级限宽，`fluid` 模式全宽流动，可换语义标签渲染。源码：`src/components/NeumorphismContainer/`。

```vue
<NeumorphismContainer>
  <NeumorphismCard>居中限宽的内容</NeumorphismCard>
</NeumorphismContainer>
```

---

## 可配置项

### Props

| 名称        | 类型                 | 默认值    | 说明                                                                             |
| ----------- | -------------------- | --------- | -------------------------------------------------------------------------------- |
| `mode`      | `'fixed' \| 'fluid'` | `'fixed'` | `fixed` 按断点限制最大宽度，`fluid` 始终全宽，支持全局配置 `container.mode` 级联 |
| `noPadding` | `boolean`            | `false`   | 移除水平内边距                                                                   |
| `tag`       | `string`             | `'div'`   | 自定义渲染标签（如 `'section'` / `'main'`）                                      |

### Events / Slots

| 名称      | 说明     |
| --------- | -------- |
| 默认 slot | 容器内容 |

---

## 断点宽度（fixed 模式）

| 断点              | 最大宽度 | 水平内边距        |
| ----------------- | -------- | ----------------- |
| `< sm`            | 100%     | `--nm-spacing-md` |
| `≥ sm`（576px）   | 540px    | 同上              |
| `≥ md`（768px）   | 720px    | `--nm-spacing-lg` |
| `≥ lg`（992px）   | 960px    | 同上              |
| `≥ xl`（1200px）  | 1140px   | 同上              |
| `≥ xxl`（1400px） | 1320px   | 同上              |

容器始终 `margin-inline: auto` 水平居中；`fluid` 模式不限制最大宽度，仅保留内边距。

---

## 用法

```vue
<!-- 全宽横幅区 -->
<NeumorphismContainer mode="fluid" no-padding tag="section">
  <img src="banner.jpg" alt="" />
</NeumorphismContainer>

<!-- 语义化主内容 -->
<NeumorphismContainer tag="main">…</NeumorphismContainer>
```

全局预设：

```ts
app.use(NeumorphismUI, { container: { mode: 'fluid' } })
```

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名
