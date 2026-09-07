---
id: comp-tree
title: 'NeumorphismTree（树形控件）'
x: 2493
y: 924
group: 使用
---

# NeumorphismTree

> 树形控件——展开 / 选择 / 搜索 / 键盘导航全部交给 headless `useTree` 驱动，`NeumorphismTreeNode` 递归渲染；子树用 `grid-template-rows: 0fr ↔ 1fr` 做弹簧展开动画，搜索命中自动展开并高亮关键词。源码：`src/components/NeumorphismTree/`。

```vue
<NeumorphismTree
  :data="tree"
  show-search
  v-model:selected-keys="selected"
  v-model:expanded-keys="expanded"
/>
```

---

## 可配置项

### NeumorphismTree Props

| 名称                | 类型             | 默认值      | 说明                                                        |
| ------------------- | ---------------- | ----------- | ----------------------------------------------------------- |
| `data`              | `TreeNodeData[]` | **必填**    | 树形数据                                                    |
| `selectedKeys`      | `string[]`       | `[]`        | 选中节点 keys，配合 `v-model:selected-keys`                 |
| `expandedKeys`      | `string[]`       | `[]`        | 展开节点 keys，配合 `v-model:expanded-keys`                 |
| `showSearch`        | `boolean`        | `false`     | 顶部搜索框（凹陷样式），支持全局配置 `tree.showSearch` 级联 |
| `searchPlaceholder` | `string`         | `'搜索...'` | 搜索占位符，支持 `tree.searchPlaceholder` 级联              |
| `multiple`          | `boolean`        | `false`     | 多选模式，支持 `tree.multiple` 级联                         |

### TreeNodeData

```ts
interface TreeNodeData {
  key: string
  label: string
  children?: TreeNodeData[]
  disabled?: boolean // 禁选：透明度 0.45，点击不触发 select
  icon?: string // 标签前的图标字符（表情/符号）
  [k: string]: unknown // 允许扩展字段
}
```

### Events / Slots

| 名称                          | 说明                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| `update:selectedKeys(keys)`   | 选择变化（v-model）                                                        |
| `update:expandedKeys(keys)`   | 展开集合变化（含展开/收起全部与搜索自动展开）                              |
| `node-select(key)`            | 节点被选中                                                                 |
| `node-click(node)`            | 节点被点击（携带完整节点数据）                                             |
| `node-label`（TreeNode 插槽） | 自定义节点标签，绑定 `{ node, selected, expanded, level, select, toggle }` |

### NeumorphismTreeNode Props（递归内部组件）

| 名称           | 类型             | 默认值 | 说明                      |
| -------------- | ---------------- | ------ | ------------------------- |
| `node`         | `TreeNodeData`   | 必填   | 当前节点                  |
| `selectedKeys` | `string[]`       | 必填   | 选中集合（向下透传）      |
| `expandedKeys` | `string[]`       | 必填   | 展开集合（向下透传）      |
| `searchText`   | `string`         | 必填   | 搜索词（过滤与高亮）      |
| `focusedKey`   | `string \| null` | —      | 键盘焦点节点              |
| `level`        | `number`         | `0`    | 层级（决定缩进，逐级 +1） |

TreeNode 事件：`toggle-expand(key)` / `select(key)`，由父树统一接管。

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tree = [
  {
    key: 'src',
    label: 'src',
    icon: '📁',
    children: [
      { key: 'src/index', label: 'index.ts' },
      { key: 'src/app', label: 'App.vue' },
    ],
  },
  { key: 'readme', label: 'README.md', disabled: true },
]
const selected = ref<string[]>([])
const expanded = ref<string[]>(['src'])
</script>

<template>
  <NeumorphismTree
    :data="tree"
    show-search
    multiple
    v-model:selected-keys="selected"
    v-model:expanded-keys="expanded"
    @node-click="n => console.log(n.label)"
  />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, {
  tree: { showSearch: true, multiple: false, searchPlaceholder: '搜索节点...' },
})
```

---

## 交互动画详解

### 展开/收起

子树容器用 `display: grid` + `grid-template-rows: 1fr ↔ 0fr` 实现高度动画（0.4s spring），同步淡入淡出（0.35s ambient）；chevron 箭头旋转 0°→90°（0.3s spring）。顶部另有「全部展开 / 全部收起」快捷按钮。

### 搜索过滤与高亮

- 节点自身或**任一后代**命中即保留显示，命中路径自动展开
- 命中片段拆分为高亮 span：主色加粗 + 12% 主色底，`nm-tree-highlight-pop` 弹性出现（0.9→1.03→1 缩放）

### 行交互与选中

| 状态     | 表现                                                           |
| -------- | -------------------------------------------------------------- |
| hover    | `--nm-surface-raised` 底 + 右移 2px + 凸出阴影（仅可悬停设备） |
| active   | 右移 1px + scale 0.98，0.1s compress                           |
| selected | 8% 主色底 + 主色加粗标签                                       |
| disabled | 透明度 0.45，行不可点                                          |
| focused  | 2px 主色 outline（键盘导航）                                   |

### 无障碍

容器 `role="tree"` + `aria-activedescendant` 漫游焦点；节点 `role="treeitem"` 带 `aria-expanded` / `aria-selected` / `aria-disabled`；方向键导航由 `useTree.handleKeydown` 处理。`prefers-reduced-motion` 时移除过渡与高亮动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useTree`
