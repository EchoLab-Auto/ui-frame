---
id: comp-pagination
title: 'NeumorphismPagination（分页器）'
x: 2885
y: 1048
group: 使用
---

# NeumorphismPagination

> 分页器——凸起页码按钮 + 主色凹陷当前页 + 省略号折叠长页列，可选总数与跳页输入。页列算法来自 headless `usePagination`。源码：`src/components/NeumorphismPagination/`。

```vue
<NeumorphismPagination v-model="page" :total="128" :page-size="10" show-total />
```

---

## 可配置项

### Props

| 名称              | 类型                             | 默认值     | 说明                                                                                                            |
| ----------------- | -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `modelValue`      | `number`                         | `1`        | 当前页码（v-model，1-based）                                                                                    |
| `total`           | `number`                         | `0`        | 总记录数                                                                                                        |
| `pageSize`        | `number`                         | `10`       | 每页条数，支持全局配置 `pagination.pageSize` 级联                                                               |
| `size`            | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `pagination.size` 级联                                                                   |
| `showTotal`       | `boolean`                        | `false`    | 显示总数文案，支持 `pagination.showTotal` 级联                                                                  |
| `showJumper`      | `boolean`                        | `false`    | 显示跳页输入框，支持 `pagination.showJumper` 级联                                                               |
| `maxVisiblePages` | `number`                         | `7`        | 最大可见页码数（超出折叠为 `...`），支持 `pagination.maxVisiblePages` 级联                                      |
| `disabled`        | `boolean`                        | `false`    | 整体禁用                                                                                                        |
| `prevLabel`       | `string`                         | `'上一页'` | 上一页按钮 `aria-label`                                                                                         |
| `nextLabel`       | `string`                         | `'下一页'` | 下一页按钮 `aria-label`                                                                                         |
| `totalLabel`      | `string`                         | —          | 覆盖总数文案模板（支持 `{total}` 占位符，如 `'共 {total} 条记录'`）；未设置时使用 locale `paginationTotal` 文案 |

### Events / Slots

| 名称                                  | 说明                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `update:modelValue(value)` / `change` | 页码变化时同步触发                                                          |
| `page-item`                           | 自定义页码项渲染，作用域 `{ page, active }`（`page` 可能是 `'...'` 字符串） |

---

## 用法

```vue
<!-- 完整配置：总数 + 跳页 + 大号 -->
<NeumorphismPagination
  v-model="page"
  :total="500"
  :page-size="20"
  :max-visible-pages="5"
  show-total
  show-jumper
  size="large"
/>

<!-- 自定义页码项 -->
<NeumorphismPagination v-model="page" :total="100">
  <template #page-item="{ page, active }">
    <button :style="{ fontWeight: active ? 700 : 400 }">{{ page }}</button>
  </template>
</NeumorphismPagination>
```

全局预设：

```ts
app.use(NeumorphismUI, { pagination: { pageSize: 20, showTotal: true, maxVisiblePages: 5 } })
```

---

## 交互动画详解

### 页码按钮状态

| 状态   | 表现                                                                |
| ------ | ------------------------------------------------------------------- |
| 常态   | `nm-raised(2px, 4px)` 凸起方块（38px，随尺寸档缩放）                |
| hover  | 凸起加深 + 上浮 1px                                                 |
| active | 凹陷 + 压平                                                         |
| 当前页 | 主色填充 + 凹陷，0.4s bounce 缩放脉冲；伴随径向辉光涟漪扩散（0.5s） |
| 禁用   | 透明度 0.4 + `not-allowed`                                          |

### 页列与跳页

- `visiblePages` 由 composable 计算：超过 `maxVisiblePages` 时以 `'...'` 字符串占位折叠，省略号 `aria-hidden`
- 上一页/下一页为首尾页时自动禁用；跳页输入为凹陷槽数字输入（min=1 / max=总页数），change 时翻页，聚焦加 2px 主色外环
- 总数文案默认取 locale `paginationTotal`（`共 {total} 条` / `Total {total}`），传入 `totalLabel` 时按 `{total}` 占位符覆盖
- 跳页器前后文案取 locale `paginationJumper`（`跳至 {input} 页` / `Go to {input}`），组件按 `{input}` 占位符拆为输入框前后两段

### 无障碍

- 根节点 `<nav role="navigation" aria-label>`（locale `paginationLabel`）
- 当前页按钮 `aria-current="page"`；每个页码按钮带 locale `paginationPageLabel` 的 `aria-label`
- 上一页/下一页图标按钮用 `prevLabel` / `nextLabel` 作 `aria-label`

### Reduced-motion

`prefers-reduced-motion` 时移除按钮过渡与当前页的脉冲/辉光动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `usePagination`
