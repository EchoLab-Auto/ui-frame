---
id: comp-tabs
title: 'NeumorphismTabs（标签页）'
x: 2885
y: 800
group: 使用
---

# NeumorphismTabs

> 标签页——凹陷激活槽 + 底部发光指示条，roving tabindex 键盘导航完整实现 WAI-ARIA Tabs 模式。行为逻辑来自 headless `useTabs`。源码：`src/components/NeumorphismTabs/`。

```vue
<NeumorphismTabs v-model="active" :tabs="tabs">当前面板内容</NeumorphismTabs>
```

---

## 可配置项

### Props

| 名称         | 类型                             | 默认值                | 说明                                          |
| ------------ | -------------------------------- | --------------------- | --------------------------------------------- |
| `modelValue` | `string`                         | `''`                  | 当前激活 tab 的 key（v-model）                |
| `tabs`       | `TabItem[]`                      | `[]`                  | 标签页数据                                    |
| `position`   | `'top' \| 'left' \| 'right'`     | `'top'`               | 标签栏位置，支持全局配置 `tabs.position` 级联 |
| `size`       | `'small' \| 'medium' \| 'large'` | `'medium'`            | 尺寸档位，支持全局配置 `tabs.size` 级联       |
| `navLabel`   | `string`                         | locale `tabsNavLabel` | 标签栏 `aria-label`                           |

```ts
interface TabItem {
  key: string
  label: string
  disabled?: boolean
  icon?: string // 可选图标（emoji / 文本字符），渲染在 label 前（`nm-tabs__tab-icon`，`aria-hidden`）
}
```

### Events / Slots

| 名称                                  | 说明                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `update:modelValue(value)` / `change` | 激活 tab 变化时同步触发                                          |
| `tabClick(tab)`                       | 点击 tab 时携带整个 TabItem 额外触发                             |
| 默认 slot                             | 面板内容（渲染在 `role="tabpanel"` 容器内，随激活 tab 切换淡入） |
| `tab`                                 | 自定义 tab 渲染，作用域 `{ tab, active, index, activate }`       |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const active = ref('profile')
const tabs = [
  { key: 'profile', label: '个人资料' },
  { key: 'security', label: '安全设置' },
  { key: 'billing', label: '账单', disabled: true },
]
</script>

<template>
  <!-- 左侧竖排标签 -->
  <NeumorphismTabs v-model="active" :tabs="tabs" position="left">
    <div v-if="active === 'profile'">资料表单……</div>
    <div v-else-if="active === 'security'">安全设置……</div>
  </NeumorphismTabs>
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { tabs: { position: 'top', size: 'medium' } })
```

---

## 交互动画详解

### 激活反馈（三段叠加）

- tab 本体：凹陷槽 + 0.4s bounce 缩放脉冲（0.96 → 1.02 → 1）
- 指示条：tab 底部 2px 主色短条 + 6px 辉光，从 0 宽度超调到 28px 再收敛为 20px
- 面板：0.35s decelerate 淡入 + 4px 上移

### 键盘导航与无障碍

- **roving tabindex**：仅激活 tab `tabindex="0"`，其余为 -1；方向键激活后焦点经 `nextTick` 移到新 tab
- `position: 'top'` 时 `aria-orientation="horizontal"`，用 ←/→ 循环切换；`'left' / 'right'` 为竖排，用 ↑/↓；Home / End 两种朝向都跳到首/末
- `role="tablist" / tab / tabpanel` 齐备，`aria-selected` / `aria-controls` / `aria-labelledby` 自动关联（共享 id 前缀）
- 禁用 tab 跳过：键盘序列只遍历 `!disabled` 的项，禁用项 `aria-disabled` + `disabled` 双标注

### 布局细节

- top 朝向导航条横向排列、溢出可横向滚动；left/right 竖排，`right` 时导航条在面板之后（flex order 交换）
- hover 非激活项轻微凸起 + 上浮 1px；active 按压 scale 0.97

### Reduced-motion

`prefers-reduced-motion` 时移除全部过渡与三段激活动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useTabs`
