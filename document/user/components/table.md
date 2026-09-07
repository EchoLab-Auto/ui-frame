---
id: comp-table
title: 'NeumorphismTable（数据表格）'
x: 2101
y: 2040
group: 使用
---

# NeumorphismTable

> 数据表格——凹陷槽容器内的原生 `<table>`，排序 / 筛选 / 选择逻辑全部交给 headless `useTable` 驱动，组件只负责渲染与事件转发；行选中带主色左描边，加载时有毛玻璃遮罩。源码：`src/components/NeumorphismTable/`。

```vue
<NeumorphismTable
  :data="rows"
  :columns="columns"
  selectable="multiple"
  v-model:selected-keys="selected"
/>
```

---

## 可配置项

### Props

| 名称           | 类型                                | 默认值              | 说明                                                                |
| -------------- | ----------------------------------- | ------------------- | ------------------------------------------------------------------- |
| `data`         | `Record<string, unknown>[]`         | `[]`                | 行数据                                                              |
| `columns`      | `TableColumn[]`                     | `[]`                | 列定义（见下）                                                      |
| `rowKey`       | `string`                            | `'key'`             | 行唯一标识字段                                                      |
| `selectable`   | `boolean \| 'single' \| 'multiple'` | `false`             | 选择模式：`true`/`'multiple'` 显示复选框列，`'single'` 整行点击单选 |
| `selectedKeys` | `string[]`                          | `[]`                | 选中行 keys，配合 `v-model:selected-keys`                           |
| `loading`      | `boolean`                           | `false`             | 加载态：毛玻璃遮罩 + 旋转指示器                                     |
| `emptyText`    | `string`                            | locale `tableEmpty` | 空数据文案（缺省取语言包，如「暂无数据」）                          |
| `size`         | `'small' \| 'medium' \| 'large'`    | `'medium'`          | 尺寸档位（单元格 padding 与字号），支持全局配置 `table.size` 级联   |
| `striped`      | `boolean`                           | `false`             | 斑马纹（偶数行浅底），支持 `table.striped` 级联                     |
| `hoverable`    | `boolean`                           | `true`              | 行悬停高亮（浅凹陷），支持 `table.hoverable` 级联                   |
| `showHeader`   | `boolean`                           | `true`              | 是否渲染表头                                                        |

### TableColumn

```ts
interface TableColumn {
  key: string
  label: string // 表头文案
  width?: string | number // 数字按 px 处理
  minWidth?: string | number
  align?: 'left' | 'center' | 'right' // 缺省 'left'
  sortable?: boolean
  sorter?: (a: unknown, b: unknown) => number // 自定义排序，>0 表示 a 在后
  filterable?: boolean
  filters?: { text: string; value: unknown }[]
  filter?: (rowValue: unknown, filterValue: unknown) => boolean // 返回 true 保留该行
}
```

### Events / Slots

| 名称                        | 说明                                                     |
| --------------------------- | -------------------------------------------------------- |
| `update:selectedKeys(keys)` | 选择变化（v-model）                                      |
| `select(rowKey, row)`       | 单行选择切换                                             |
| `selectAll(selected)`       | 表头全选/全不选切换                                      |
| `sort(key, direction)`      | 排序切换，`direction` 为 `'ascend' \| 'descend' \| null` |
| `header`                    | 表头单元格内容，绑定 `{ column }`                        |
| `cell-{column.key}`         | 单元格内容，绑定 `{ row, column, value, index }`         |
| `empty` / `loading`         | 空态 / 加载态自定义内容                                  |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { key: 'name', label: '名称', sortable: true },
  { key: 'size', label: '大小', align: 'right', sorter: (a, b) => a - b },
  { key: 'status', label: '状态', width: 120 },
]
const rows = [
  { key: '1', name: 'alpha', size: 12, status: '运行中' },
  { key: '2', name: 'beta', size: 34, status: '已停止' },
]
const selected = ref<string[]>([])
</script>

<template>
  <NeumorphismTable
    :data="rows"
    :columns="columns"
    selectable="multiple"
    v-model:selected-keys="selected"
    striped
    @sort="(key, dir) => console.log(key, dir)"
  >
    <template #cell-status="{ value }">
      <NeumorphismTag>{{ value }}</NeumorphismTag>
    </template>
  </NeumorphismTable>
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { table: { size: 'small', striped: true, hoverable: true } })
```

---

## 交互动画详解

### 视觉结构

表体容器是 `inset 3px 6px` 的凹陷槽；表头 `--nm-text-secondary` 加粗、底部细分割线；行之间以 60% 透明度的细分隔线相隔。

### 排序指示

可排序列表头带 chevron 图标：常态半透明且朝下（rotate 180°），该列激活时主色 + 转正（朝上），点击在 ascend → descend → null 间循环。

### 行状态

| 状态     | 表现                                                          |
| -------- | ------------------------------------------------------------- |
| hover    | `--nm-surface-raised` 底色 + 1px 浅凹陷（仅可悬停设备）       |
| striped  | 偶数行 30% 透明度的 border 色底                               |
| selected | 6% 主色底 + 2px 主色左描边（`!important` 压过 hover/striped） |

### 加载与空态

`loading` 时全表覆盖 60% 背景色 + 2px blur 的毛玻璃遮罩，旋转圈 0.8s 线性循环；`reduced-motion` 下停转并降级为灰色描边。空态在 tbody 下方居中展示。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismVirtualList](./virtual-list.md) — 大数据量的虚拟滚动方案
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useTable`
