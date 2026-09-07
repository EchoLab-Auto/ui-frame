---
id: comp-list
title: 'NeumorphismList（列表）'
x: 2493
y: 676
group: 使用
---

# NeumorphismList

> 通用列表——泛型组件（`generic="T"`），数据驱动渲染 + 头尾插槽 + 加载/空态内置；项 hover 微浮起、active 瞬时下压，点击经 `item-click` 上报。源码：`src/components/NeumorphismList/`。

```vue
<NeumorphismList :items="files" @item-click="open" />
```

---

## 可配置项

### Props

| 名称        | 类型                             | 默认值     | 说明                                                                |
| ----------- | -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `items`     | `T[]`                            | `[]`       | 数据源数组（不使用手动插槽内容时逐项渲染）                          |
| `bordered`  | `boolean`                        | `true`     | 外框凸出阴影（`raised 3px 8px`），支持全局配置 `list.bordered` 级联 |
| `split`     | `boolean`                        | `true`     | 项间分割线（末项除外），支持 `list.split` 级联                      |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位（项与头尾的 padding、字号），支持 `list.size` 级联         |
| `hoverable` | `boolean`                        | `true`     | 项悬停浮起效果，支持 `list.hoverable` 级联                          |
| `loading`   | `boolean`                        | `false`    | 加载态：替换列表体为旋转指示器                                      |

### Events / Slots

| 名称                      | 说明                                                      |
| ------------------------- | --------------------------------------------------------- |
| `item-click(item, index)` | 任一项被点击时触发（无论是否自定义渲染）                  |
| 默认 slot                 | 项渲染，绑定 `{ item, index }`；缺省直接输出 `{{ item }}` |
| `header` / `footer`       | 列表头 / 尾区（带分割边框）                               |
| `loading` / `empty`       | 加载态 / 空态自定义内容                                   |

---

## 用法

```vue
<script setup lang="ts">
interface FileItem {
  id: number
  name: string
  size: string
}
const files: FileItem[] = [
  { id: 1, name: '设计稿.fig', size: '2.4 MB' },
  { id: 2, name: 'README.md', size: '8 KB' },
]
</script>

<template>
  <NeumorphismList :items="files" bordered split @item-click="f => console.log(f)">
    <template #header>最近文件</template>
    <template #default="{ item }">
      <span>{{ item.name }}</span>
      <span style="margin-left: auto">{{ item.size }}</span>
    </template>
    <template #footer>共 {{ files.length }} 项</template>
  </NeumorphismList>
</template>
```

项的 `:key` 依次取 `item.id` → `item.key` → 下标。传了默认插槽的项自动获得 `cursor: pointer`。

全局预设：

```ts
app.use(NeumorphismUI, { list: { size: 'medium', bordered: true, split: true, hoverable: true } })
```

---

## 交互动画详解

### 项的三段反馈

| 阶段   | 表现                                                             | 曲线                        |
| ------ | ---------------------------------------------------------------- | --------------------------- |
| hover  | `--nm-surface-raised` 底色 + 上浮 1px + 凸出阴影（仅可悬停设备） | 0.25s ambient / 0.2s spring |
| active | 回落 0 + inset 凹陷阴影                                          | 0.1s compress（瞬时按压）   |
| 常态   | 透明底                                                           | —                           |

### 加载与空态

`loading` 优先级高于空态：加载中只显示旋转指示器（0.8s 线性）与文案；`items` 为空且非加载时显示空态，容器最小高度 120px 居中。两者文案均取语言包（`listLoading` / `listEmpty`），可被同名插槽覆盖。

### 无障碍与 reduced-motion

容器 `role="list"`、项 `role="listitem"`，aria-label 取语言包 `listLabel`；`prefers-reduced-motion` 时移除项过渡与旋转动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismVirtualList](./virtual-list.md) — 超长列表的虚拟滚动方案
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
