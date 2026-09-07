---
id: comp-menu
title: 'NeumorphismMenu（菜单）'
x: 2885
y: 1172
group: 使用
---

# NeumorphismMenu

> 侧边/水平菜单——支持三级嵌套子菜单、图标折叠态（配 Tooltip）、分隔线与完整键盘导航（含 typeahead）。行为逻辑来自 headless `useMenu`。源码：`src/components/NeumorphismMenu/`。

```vue
<NeumorphismMenu :items="menus" mode="vertical" default-active="dashboard" @select="onSelect" />
```

---

## 可配置项

### Props

| 名称              | 类型                             | 默认值       | 说明                                                      |
| ----------------- | -------------------------------- | ------------ | --------------------------------------------------------- |
| `items`           | `MenuItem[]`                     | `[]`         | 菜单项（`children` 嵌套子菜单，模板最多渲染三级）         |
| `mode`            | `'vertical' \| 'horizontal'`     | `'vertical'` | 布局方向，支持全局配置 `menu.mode` 级联                   |
| `defaultActive`   | `string`                         | —            | 默认激活项 key（非受控，内部维护 activeKey）              |
| `defaultExpanded` | `string[]`                       | `[]`         | 默认展开的子菜单 keys（非受控）                           |
| `collapsed`       | `boolean`                        | `false`      | 折叠模式：仅显示图标，标签经右侧 Tooltip 展示，子菜单隐藏 |
| `selectable`      | `boolean`                        | `true`       | 是否可选中（跟踪 activeKey），支持 `menu.selectable` 级联 |
| `theme`           | `'light' \| 'dark'`              | 跟随全局主题 | 主题覆盖                                                  |
| `size`            | `'small' \| 'medium' \| 'large'` | `'medium'`   | 尺寸档位，支持全局配置 `menu.size` 级联                   |

```ts
interface MenuItem {
  key: string
  label: string
  icon?: string // 文本/emoji 图标
  disabled?: boolean
  children?: MenuItem[]
  divided?: boolean // 项前渲染分隔线
}
```

### Events / Slots

| 名称               | 说明                                      |
| ------------------ | ----------------------------------------- |
| `select(item)`     | 选中叶子项时触发                          |
| `item-click(item)` | 与 `select` 同时触发；无 slot（数据驱动） |

---

## 用法

```vue
<script setup lang="ts">
import type { MenuItem } from '@echolab-auto/ui-frame'

const menus: MenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  {
    key: 'system',
    label: '系统管理',
    icon: '⚙️',
    children: [
      { key: 'user', label: '用户管理' },
      { key: 'role', label: '角色管理', divided: true },
    ],
  },
  { key: 'logout', label: '退出登录', icon: '🚪', disabled: true },
]
</script>

<template>
  <!-- 折叠图标态 -->
  <NeumorphismMenu :items="menus" collapsed @select="item => console.log(item.key)" />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { menu: { mode: 'vertical', selectable: true, size: 'medium' } })
```

---

## 交互动画详解

### 两种形态

- **vertical**（默认）：凸起大圆角容器，子菜单内联展开（左侧竖线缩进）；展开箭头旋转 90°；hover 项右移 3px + 微凹陷
- **horizontal**：行排列，子菜单以绝对定位浮层弹出（200ms 移出延迟关闭）；箭头朝下，展开时旋转 180°

### 键盘导航（WAI-ARIA menu / menubar 模式）

- 根节点 role 随 mode 切换：`menu`（vertical）/ `menubar`（horizontal）；项为 `menuitem`，含子菜单时 `aria-haspopup="menu"` + `aria-expanded`
- 方向键按朝向解释：vertical 下 ↑/↓ 移动、→ 展开并进入首子项、← 收起或回父级；horizontal 下 ←/→ 移动、↓ 展开、↑ 收起
- Enter / Space 选中叶子项或切换子菜单展开；Escape 收起全部子菜单；Home / End 跳首/末；可打印字符触发 **typeahead** 按标签搜索
- 方向键移动的是内部 activeKey 高亮（非 DOM roving tabindex）；所有未禁用项保留 `tabindex="0"`，`:focus-visible` 呈现主色焦点圈（WCAG 2.4.7）

### 选中与折叠态

- `selectable` 时激活项主色加粗 + 微凹陷底
- `collapsed` 时仅渲染图标居中，标签与展开箭头隐藏、子菜单不展开；带图标的项自动挂 `NeumorphismTooltip`（300ms 延迟，右侧弹出）显示标签

### Reduced-motion

`prefers-reduced-motion` 时移除项内容与展开箭头的全部过渡。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismNavMenu](./nav-menu.md) — 顶部导航场景的姊妹组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useMenu`
