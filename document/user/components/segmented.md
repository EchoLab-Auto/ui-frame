---
id: comp-segmented
title: 'NeumorphismSegmented（分段选择器）'
x: 2101
y: 800
group: 使用
---

# NeumorphismSegmented

> 凹陷轨道上的单选分段控件——选中项从凹槽中凸起，headless 逻辑由 `useSegmented` 承载（ARIA radiogroup 语义 + roving tabindex 键盘导航）。源码：`src/components/NeumorphismSegmented/`。

```vue
<NeumorphismSegmented v-model="view" :options="options" />
```

---

## 可配置项

### Props

| 名称         | 类型                             | 默认值      | 说明                                                    |
| ------------ | -------------------------------- | ----------- | ------------------------------------------------------- |
| `modelValue` | `string \| number`               | —           | 选中值（v-model）                                       |
| `options`    | `SegmentedOption[]`              | —           | 可选项列表（必填）                                      |
| `size`       | `'small' \| 'medium' \| 'large'` | `'medium'`  | 尺寸档位，支持全局配置 `segmented.size` 级联            |
| `disabled`   | `boolean`                        | `false`     | 整体禁用，支持全局配置 `segmented.disabled` 级联        |
| `ariaLabel`  | `string`                         | locale 文案 | radiogroup 无障碍标签（缺省取 locale `segmentedLabel`） |

```ts
interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}
```

### Events / Slots

| 名称                       | 说明                             |
| -------------------------- | -------------------------------- |
| `update:modelValue(value)` | 选中后同步 v-model               |
| `change(value)`            | 选中变化时触发（含键盘导航选中） |
| —                          | 无插槽                           |

---

## 用法

```vue
<script setup lang="ts">
const view = ref('day')
const options = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month', disabled: true },
]
</script>

<template>
  <NeumorphismSegmented v-model="view" :options="options" />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { segmented: { size: 'medium' } })
```

---

## 交互动画详解

### 键盘导航（ARIA radiogroup 模式）

| 按键                  | 行为                                   |
| --------------------- | -------------------------------------- |
| `←` / `↑` / `→` / `↓` | 移动焦点并即时选中（循环、跳过禁用项） |
| `Home` / `End`        | 跳到首个 / 末个可用项并选中            |

- **Roving tabindex**：组内只有一项 `tabindex="0"`（选中项优先，否则首个可用项），Tab 键只进组一次
- `focusIndex` 变化后，组件在焦点已位于组内时移动真实 DOM 焦点（不抢外部焦点）
- options 收缩或选中项被禁用时，焦点索引自动钳制回合法位置
- 焦点可见时绘制 2px 主色 `outline`

### 物理隐喻

- 轨道为 `inset` 凹陷槽；选中项以 `--nm-surface-raised` 背景 + 凸起阴影「浮出」凹槽
- 选中项字重加到 600；hover 未选中项仅文字变色，不制造阴影噪声
- 禁用项文字转 `--nm-text-disabled`，整体禁用时组透明度 0.6

### Reduced-motion

`prefers-reduced-motion` 时：选项的颜色 / 阴影过渡全部移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名与 `useSegmented`
