---
id: comp-grid
title: 'NeumorphismRow / Col（栅格）'
x: 3277
y: 1172
group: 使用
---

# NeumorphismRow / NeumorphismCol

> 24 格响应式栅格——Row 通过 `provide/inject` 把 gutter 下发给 Col，Col 以 flex 百分比占位（每格 4.1667%）；移动优先的六档断点 + 触屏小屏自动堆叠。源码：`src/components/NeumorphismGrid/`。

```vue
<NeumorphismRow :gutter="16">
  <NeumorphismCol :span="12" :md="8">A</NeumorphismCol>
  <NeumorphismCol :span="12" :md="8">B</NeumorphismCol>
  <NeumorphismCol :span="24" :md="8">C</NeumorphismCol>
</NeumorphismRow>
```

---

## 可配置项

### NeumorphismRow Props

| 名称      | 类型                                                                                  | 默认值      | 说明                                                                     |
| --------- | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `gutter`  | `number \| [number, number]`                                                          | `0`         | 列间距（px），数组形式为 `[水平, 垂直]`；支持全局配置 `grid.gutter` 级联 |
| `justify` | `'start' \| 'center' \| 'end' \| 'space-between' \| 'space-around' \| 'space-evenly'` | `'start'`   | 水平排列方式（映射 justify-content），支持 `grid.justify` 级联           |
| `align`   | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'`                             | `'stretch'` | 垂直对齐方式（映射 align-items），支持 `grid.align` 级联                 |
| `wrap`    | `boolean`                                                                             | `true`      | 是否换行（`false` 时加 `nm-row--nowrap`），支持 `grid.wrap` 级联         |

### NeumorphismCol Props

| 名称     | 类型               | 默认值 | 说明                             |
| -------- | ------------------ | ------ | -------------------------------- |
| `span`   | `number \| string` | `24`   | 栅格占位格数（0–24）             |
| `offset` | `number \| string` | —      | 左侧偏移格数（margin-left 实现） |
| `xs`     | `number \| string` | —      | 响应式占位：`<576px`             |
| `sm`     | `number \| string` | —      | 响应式占位：`≥576px`             |
| `md`     | `number \| string` | —      | 响应式占位：`≥768px`             |
| `lg`     | `number \| string` | —      | 响应式占位：`≥992px`             |
| `xl`     | `number \| string` | —      | 响应式占位：`≥1200px`            |
| `xxl`    | `number \| string` | —      | 响应式占位：`≥1400px`            |

### Events / Slots

| 名称      | 说明                             |
| --------- | -------------------------------- |
| 默认 slot | Row / Col 均只有默认插槽承载内容 |

---

## 用法

```vue
<!-- 水平 + 垂直间距 -->
<NeumorphismRow :gutter="[16, 24]">
  <NeumorphismCol :span="8">…</NeumorphismCol>
</NeumorphismRow>

<!-- 居中对齐 + 偏移 -->
<NeumorphismRow justify="center">
  <NeumorphismCol :span="6" :offset="6">居中块</NeumorphismCol>
</NeumorphismRow>

<!-- 响应式：小屏整行、中屏半行、大屏三列 -->
<NeumorphismRow :gutter="16">
  <NeumorphismCol :xs="24" :md="12" :lg="8">…</NeumorphismCol>
</NeumorphismRow>
```

全局预设：

```ts
app.use(NeumorphismUI, { grid: { gutter: 16, align: 'stretch' } })
```

---

## 交互动画详解

### 间距机制（负 margin + 半 padding）

Row 对水平 gutter 施加 `margin-left/right: -gutter/2`，对垂直 gutter 施加 `row-gap: gutter`；Col 对应施加 `padding: gutter/2`，gutter 经 `RowGutterKey` 注入下发，Col 脱离 Row 单独使用时按 0 处理。gutter 为 0 时不输出任何内联样式。

### 断点与堆叠

- 断点为移动优先：`xs` 无媒体查询直接生效，`sm/md/lg/xl/xxl` 分别对应 `≥576/768/992/1200/1400px`，每档生成 `nm-col-{档}-{0..24}` 类
- 未设置 `span` 时 Col 为 `flex: 1 0 0%` 自动等分；设置后按 `span/24` 百分比定宽
- **触屏降级**：触屏设备且 `<768px` 时，未显式带 `nm-col-xs-*` 的 Col 自动堆叠为 100% 宽

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
