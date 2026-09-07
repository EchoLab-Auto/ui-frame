---
id: comp-nav-menu
title: 'NeumorphismNavMenu（顶部导航菜单）'
x: 2885
y: 1296
group: 使用
---

# NeumorphismNavMenu

> 顶部导航菜单——水平项 + 底部发光激活指示条，子菜单经 `NeumorphismPopover` hover 弹出下拉浮层；亦可切为竖排内联展开。行为逻辑来自 headless `useMenu`。源码：`src/components/NeumorphismNavMenu/`。

```vue
<NeumorphismNavMenu :items="navs" default-active="home" @select="onSelect" />
```

---

## 可配置项

### Props

| 名称            | 类型                             | 默认值         | 说明                                                |
| --------------- | -------------------------------- | -------------- | --------------------------------------------------- |
| `items`         | `MenuItem[]`                     | `[]`           | 导航菜单项（`children` 作为一级下拉子菜单）         |
| `defaultActive` | `string`                         | —              | 默认激活项 key（非受控，内部维护 activeKey）        |
| `mode`          | `'horizontal' \| 'vertical'`     | `'horizontal'` | 布局方向，支持全局配置 `navMenu.mode` 级联          |
| `showIndicator` | `boolean`                        | `true`         | 激活项底部指示条，支持 `navMenu.showIndicator` 级联 |
| `theme`         | `'light' \| 'dark'`              | 跟随全局主题   | 主题覆盖                                            |
| `size`          | `'small' \| 'medium' \| 'large'` | `'medium'`     | 尺寸档位，支持全局配置 `navMenu.size` 级联          |

```ts
interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[] // 下拉/内联子菜单（仅渲染一级）
  divided?: boolean // vertical 模式渲染分隔线；下拉中子项 divided 生效
}
```

### Events / Slots

| 名称               | 说明                                      |
| ------------------ | ----------------------------------------- |
| `select(item)`     | 选中项时触发                              |
| `item-click(item)` | 与 `select` 同时触发；无 slot（数据驱动） |

---

## 用法

```vue
<script setup lang="ts">
const navs = [
  { key: 'home', label: '首页' },
  {
    key: 'products',
    label: '产品',
    children: [
      { key: 'ui', label: 'UI 框架' },
      { key: 'charts', label: '图表库', divided: true },
    ],
  },
  { key: 'about', label: '关于', disabled: true },
]
</script>

<template>
  <!-- 水平导航 + 指示条 -->
  <NeumorphismNavMenu :items="navs" @select="item => $router.push(`/${item.key}`)" />

  <!-- 竖排内联展开 -->
  <NeumorphismNavMenu :items="navs" mode="vertical" />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { navMenu: { mode: 'horizontal', showIndicator: true } })
```

---

## 交互动画详解

### 水平模式（默认）

- 激活项底部 2px（large 3px）主色指示条 + 50% 辉光，0.3s spring 从 `scaleX(0)` 展开
- 带 `children` 的项包裹在 `NeumorphismPopover`（hover 触发、offset 4、无箭头）中：悬停展开下拉，移出触发器或浮层经 **250ms 延迟** 关闭（来回移动不闪烁）
- 下拉箭头展开时旋转 180°；下拉项 hover 右移 2px，激活项主色加粗

### 竖排模式

- 凸起容器 + 内联展开子菜单（左侧竖线缩进），展开箭头旋转 90°；`divided` 项渲染分隔线

### 键盘与无障碍

- 根节点 `role="navigation"` + 内部 `menubar`（`aria-orientation` 随 mode）
- 含子菜单项 `aria-haspopup="menu"` + `aria-expanded`；下拉容器 `role="menu"`
- 键盘导航复用 `useMenu`：方向键按朝向移动 activeKey / 展开收起，Enter / Space 选中或切换展开，Escape 收起全部，Home / End 跳首末，可打印字符 typeahead 搜索
- 未禁用项保留 `tabindex="0"`（非 roving tabindex）；禁用项 `aria-disabled` + `tabindex="-1"`

### Reduced-motion

`prefers-reduced-motion` 时移除项过渡、指示条入场与箭头旋转动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismMenu](./menu.md) / [NeumorphismDropdown](./dropdown.md) — 同族菜单组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useMenu`
