---
id: comp-collapse
title: 'NeumorphismCollapse（折叠面板）'
x: 2885
y: 676
group: 使用
---

# NeumorphismCollapse

> 折叠面板——凸起触发器 + `grid-template-rows` 弹簧展开，支持手风琴模式与逐面板自定义头/内容。行为逻辑全部来自 headless `useCollapse`。源码：`src/components/NeumorphismCollapse/`。

```vue
<NeumorphismCollapse v-model="openKeys" :items="panels" accordion />
```

---

## 可配置项

### Props

| 名称         | 类型                             | 默认值     | 说明                                                                 |
| ------------ | -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `modelValue` | `string[]`                       | `[]`       | 展开面板的 key 数组（v-model）                                       |
| `accordion`  | `boolean`                        | `false`    | 手风琴模式（同时只展开一个），支持全局配置 `collapse.accordion` 级联 |
| `items`      | `CollapseItem[]`                 | `[]`       | 面板项                                                               |
| `size`       | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `collapse.size` 级联                          |

```ts
interface CollapseItem {
  key: string
  title: string
  disabled?: boolean
}
```

### Events / Slots

| 名称                                  | 说明                                                        |
| ------------------------------------- | ----------------------------------------------------------- |
| `update:modelValue(value)` / `change` | 展开集合变化时同步触发                                      |
| 动态 slot `[item.key]`                | 各面板内容区（key 为对应 item 的 key）                      |
| 动态 slot `header-[item.key]`         | 自定义面板头部，作用域 `{ item, active }`；缺省渲染 `title` |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const openKeys = ref(['a'])
const panels = [
  { key: 'a', title: '什么是新拟态？' },
  { key: 'b', title: '如何定制主题？' },
  { key: 'c', title: '付费相关', disabled: true },
]
</script>

<template>
  <!-- 手风琴 + 自定义头部 -->
  <NeumorphismCollapse v-model="openKeys" :items="panels" accordion>
    <template #header-a="{ active }">
      <span>🧩 什么是新拟态？{{ active ? '（已展开）' : '' }}</span>
    </template>
    <template #a>通过内外阴影在单色表面上塑造柔和凸起/凹陷。</template>
    <template #b>修改 token 或全局配置即可。</template>
    <template #c>暂不可展开。</template>
  </NeumorphismCollapse>
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { collapse: { accordion: true, size: 'medium' } })
```

---

## 交互动画详解

### 展开/收起

- 面板用 `display: grid` + `grid-template-rows: 0fr ↔ 1fr` 实现高度动画，无需测量内容高度；曲线为 0.3s 带回弹的 `cubic-bezier(0.34, 1.56, 0.64, 1)`
- 内容透明度同步 0.25s 淡入淡出；箭头图标展开时旋转 180°

### 触发器状态

| 状态   | 表现                                   |
| ------ | -------------------------------------- |
| 常态   | `nm-raised(2px, 5px)` 凸起按钮         |
| hover  | 凸起加深 + 上浮 1px                    |
| active | 压下 0.99 + 凹陷（0.1s compress 曲线） |
| 已展开 | 凹陷槽 + 底部圆角归零，与面板连成一体  |
| 禁用   | 透明度 0.5 + `not-allowed`             |
| 聚焦   | 3px 主色外环（`focus-visible`）        |

### 无障碍

- 触发器为原生 `<button>`（包在 `<h3>` 内保持标题层级），带 `aria-expanded` / `aria-controls` / `aria-disabled`
- 面板 `role="region"` + `aria-labelledby` 指回触发器；id 由 `generateId` 自动生成，多实例互不冲突

### Reduced-motion

`prefers-reduced-motion` 时移除面板与内容的全部过渡，展开/收起瞬时完成。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useCollapse`
