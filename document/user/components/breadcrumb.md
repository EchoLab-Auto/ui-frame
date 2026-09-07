---
id: comp-breadcrumb
title: 'NeumorphismBreadcrumb（面包屑）'
x: 2885
y: 924
group: 使用
---

# NeumorphismBreadcrumb

> 面包屑导航——微凸起的可点击层级项 + 当前页 `aria-current="page"` 语义，路由跳转交由使用方在 `itemClick` 中接线。源码：`src/components/NeumorphismBreadcrumb/`。

```vue
<NeumorphismBreadcrumb :items="crumbs" @item-click="go" />
```

---

## 可配置项

### Props

| 名称        | 类型                             | 默认值     | 说明                                          |
| ----------- | -------------------------------- | ---------- | --------------------------------------------- |
| `items`     | `BreadcrumbItem[]`               | `[]`       | 面包屑项（最后一项视为当前页）                |
| `separator` | `string`                         | `'/'`      | 分隔符文本（`aria-hidden`，不进读屏）         |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `breadcrumb.size` 级联 |

```ts
interface BreadcrumbItem {
  label: string
  to?: string // 类型上保留的目标地址；组件不内置跳转，请在 itemClick 中自行路由
  disabled?: boolean
}
```

### Events / Slots

| 名称                     | 说明                                |
| ------------------------ | ----------------------------------- |
| `itemClick(item, index)` | 点击非当前、非禁用项时触发；无 slot |

---

## 用法

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { BreadcrumbItem } from '@echolab-auto/ui-frame'

const router = useRouter()
const crumbs: BreadcrumbItem[] = [
  { label: '首页', to: '/' },
  { label: '组件', to: '/components' },
  { label: '面包屑' }, // 最后一项 = 当前页
]

function go(item: BreadcrumbItem) {
  if (item.to) router.push(item.to)
}
</script>

<template>
  <!-- 自定义分隔符 -->
  <NeumorphismBreadcrumb :items="crumbs" separator="›" @item-click="go" />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { breadcrumb: { size: 'medium' } })
```

---

## 交互动画详解

### 链接项状态（非当前页且未禁用）

| 状态   | 表现                                      |
| ------ | ----------------------------------------- |
| 常态   | 微凸起 `nm-raised(1px, 2px)` + 次要文字色 |
| hover  | 主色文字 + 浮起背景 + 上浮 1px，阴影增强  |
| active | 压平 + 凹陷（0.1s compress 曲线）         |
| 聚焦   | 2px 主色外环（`focus-visible`）           |

当前页项加粗 + 主文字色，不可点击；禁用项透明度 0.5。分隔符用占位文字色，`user-select: none`。

### 无障碍

- 根节点 `<nav aria-label>`（locale `breadcrumbLabel`）+ 有序列表 `<ol>`
- 非当前项渲染 `role="link"` + `tabindex="0"`，支持 Enter / Space 触发
- 当前页 `aria-current="page"`；分隔符 `aria-hidden="true"`

### Reduced-motion

`prefers-reduced-motion` 时移除链接项的全部过渡。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
