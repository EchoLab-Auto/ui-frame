---
id: comp-virtual-list
title: 'NeumorphismVirtualList（虚拟滚动列表）'
x: 2493
y: 800
group: 使用
---

# NeumorphismVirtualList

> 万级数据的滚动列表——由 headless `useVirtualList` 驱动：等高项 + spacer 撑出总高 + translateY 定位可视窗，只渲染视口内及前后 overscan 缓冲的项；容器是凹陷槽，对外暴露平滑 `scrollTo`。源码：`src/components/NeumorphismVirtualList/`。

```vue
<NeumorphismVirtualList :items="rows" :item-height="48" style="height: 320px">
  <template #default="{ item }">{{ item.name }}</template>
</NeumorphismVirtualList>
```

---

## 可配置项

### Props

| 名称         | 类型     | 默认值 | 说明                                   |
| ------------ | -------- | ------ | -------------------------------------- |
| `items`      | `T[]`    | `[]`   | 数据源数组（泛型 `T`）                 |
| `itemHeight` | `number` | `40`   | 每项固定高度（px），虚拟化按此换算     |
| `overscan`   | `number` | `5`    | 视口上下额外渲染的项数（缓冲防白屏）   |
| `keyField`   | `string` | `'id'` | 用作 `:key` 的字段名，缺失时退化为下标 |

### Events / Slots

| 名称      | 说明                                       |
| --------- | ------------------------------------------ |
| 默认 slot | 项渲染，绑定 `{ item, index }`（全局下标） |
| `empty`   | `items` 为空时的占位内容（居中显示）       |

组件无自定义事件。

### Expose

| 成员                      | 说明                                                           |
| ------------------------- | -------------------------------------------------------------- |
| `scrollTo(index, align?)` | 平滑滚动到指定项；`align` 为 `'top' \| 'center'`，缺省 `'top'` |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const rows = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `第 ${i} 行` }))
const listRef = ref()
</script>

<template>
  <NeumorphismVirtualList
    ref="listRef"
    :items="rows"
    :item-height="44"
    :overscan="8"
    style="height: 360px"
  >
    <template #default="{ item, index }">
      <div class="row">{{ index }} — {{ item.name }}</div>
    </template>
    <template #empty>暂无数据</template>
  </NeumorphismVirtualList>

  <NeumorphismButton @click="listRef.scrollTo(500, 'center')">跳到第 500 行</NeumorphismButton>
</template>
```

注意：容器自身 `overflow-y: auto`，高度需由外部（style/class）给定，否则随内容撑开失去虚拟化意义。

---

## 工作机制

- **三段式结构**：滚动容器 → spacer（高 = `items.length × itemHeight`，撑起滚动条）→ 可视层（`translateY(offsetY)` 绝对定位，只含可视窗附近的项）
- **滚动驱动**：`handleScroll` 记录 scrollTop，`visibleItems` / `offsetY` / `startIndex` 由 composable 按 scrollTop + 视口高 + overscan 计算
- **凹陷容器**：`inset 4px 12px` 凹陷槽 + `--nm-border-radius-md`，空态绝对定位于容器正中

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismList](./list.md) — 常规规模的列表组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots/Expose 签名与 `useVirtualList`
