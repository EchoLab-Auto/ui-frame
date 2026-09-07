---
id: comp-dropdown
title: 'NeumorphismDropdown（下拉菜单）'
x: 2885
y: 1420
group: 使用
---

# NeumorphismDropdown

> 下拉菜单——任意触发元素 + 凸起浮层菜单，基于 `NeumorphismPopover` 定位，内置 roving 高亮的键盘导航与危险项/分隔线语义。源码：`src/components/NeumorphismDropdown/`。

```vue
<NeumorphismDropdown :items="actions" @select="onSelect">
  <NeumorphismButton>操作 ▾</NeumorphismButton>
</NeumorphismDropdown>
```

---

## 可配置项

### Props

| 名称       | 类型                                               | 默认值     | 说明                                                |
| ---------- | -------------------------------------------------- | ---------- | --------------------------------------------------- |
| `items`    | `DropdownItem[]`                                   | `[]`       | 下拉菜单项                                          |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'bottom'` | 弹出位置，支持全局配置 `dropdown.position` 级联     |
| `trigger`  | `'click' \| 'hover' \| 'focus' \| 'manual'`        | `'click'`  | 触发方式，支持全局配置 `dropdown.trigger` 级联      |
| `disabled` | `boolean`                                          | `false`    | 禁用（透传给 Popover，不弹出）                      |
| `offset`   | `number`                                           | `4`        | 与触发元素的间距（px），支持 `dropdown.offset` 级联 |

```ts
interface DropdownItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divided?: boolean // 项前渲染分隔线
  danger?: boolean // 错误色文案（删除等危险操作）
}
```

### Events / Slots

| 名称                      | 说明                                           |
| ------------------------- | ---------------------------------------------- |
| `select(item)`            | 选中项时触发（选中后自动收起浮层）             |
| `visible-change(visible)` | 浮层显隐变化时触发                             |
| 默认 slot                 | 触发元素（渲染在 Popover 触发位）              |
| `items`                   | 自定义菜单内容（仅当 `items` prop 为空时渲染） |

---

## 用法

```vue
<script setup lang="ts">
import type { DropdownItem } from '@echolab-auto/ui-frame'

const actions: DropdownItem[] = [
  { key: 'edit', label: '编辑', icon: '✏️' },
  { key: 'share', label: '分享', icon: '🔗' },
  { key: 'delete', label: '删除', icon: '🗑', danger: true, divided: true },
]
</script>

<template>
  <!-- hover 触发 + 顶部弹出 -->
  <NeumorphismDropdown :items="actions" trigger="hover" position="top" @select="a => run(a.key)">
    <span>更多操作</span>
  </NeumorphismDropdown>
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { dropdown: { position: 'bottom', trigger: 'click', offset: 4 } })
```

---

## 交互动画详解

### 菜单项状态

| 状态           | 表现                                    |
| -------------- | --------------------------------------- |
| 常态           | 透明底，圆角小项                        |
| hover          | 浮起背景 + 右移 2px                     |
| active（按压） | 右移 1px + scale 0.98（0.08s compress） |
| 键盘高亮       | 浮起背景（`--active` 类）               |
| disabled       | 透明度 0.4 + `not-allowed`              |
| danger         | 错误色文案                              |

### 键盘导航（roving 高亮）

- 浮层 `role="menu"`（locale `dropdownMenuLabel` 作 `aria-label`），项为 `role="menuitem"` + `aria-disabled`
- ↑/↓ 在未禁用项间循环移动高亮（`activeIndex`），高亮项 `tabindex="0"` 其余 -1；Home / End 跳首/末
- Enter / Space 选中有高亮的项；Escape 收起浮层；收起后高亮复位

### 定位

位置、触发方式与间距全部透传 `NeumorphismPopover`（`show-arrow` 固定关闭）；选中或 Escape 通过 Popover 暴露的 `hide()` 收起。

### Reduced-motion

`prefers-reduced-motion` 时移除菜单项的过渡。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismMenu](./menu.md) / [NeumorphismNavMenu](./nav-menu.md) — 同族菜单组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
