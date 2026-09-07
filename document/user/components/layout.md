---
id: comp-layout
title: 'NeumorphismLayout（页面框架）'
x: 3277
y: 924
group: 使用
---

# NeumorphismLayout

> 页面级框架——顶栏 + 可折叠侧边栏 + 内容区 + 可选页脚：桌面端宽度弹簧折叠，移动端自动切换为抽屉式侧栏，内置「跳到主内容」无障碍链接。源码：`src/components/NeumorphismLayout/`。

```vue
<NeumorphismLayout show-sider collapsible>
  <template #header-left>LOGO</template>
  <template #sider="{ collapsed }">
    <NeumorphismMenu :collapsed="collapsed" :items="menus" />
  </template>
  页面主体
</NeumorphismLayout>
```

---

## 可配置项

### Props

| 名称                 | 类型      | 默认值    | 说明                                                                        |
| -------------------- | --------- | --------- | --------------------------------------------------------------------------- |
| `showHeader`         | `boolean` | `true`    | 显示顶部导航，支持全局配置 `layout.showHeader` 级联                         |
| `showSider`          | `boolean` | `false`   | 显示侧边栏，支持 `layout.showSider` 级联                                    |
| `siderWidth`         | `number`  | `240`     | 侧边栏展开宽度（px），支持 `layout.siderWidth` 级联                         |
| `collapsible`        | `boolean` | `false`   | 可折叠（顶栏左侧出现折叠按钮），支持 `layout.collapsible` 级联              |
| `defaultCollapsed`   | `boolean` | `false`   | 默认折叠（仅初始值，之后由内部状态接管）                                    |
| `collapsedWidth`     | `number`  | `64`      | 折叠后宽度（px），支持 `layout.collapsedWidth` 级联                         |
| `mobileAutoCollapse` | `boolean` | `true`    | 移动端自动折叠侧边栏（配合抽屉模式），支持 `layout.mobileAutoCollapse` 级联 |
| `height`             | `string`  | `'100vh'` | 框架高度；嵌套使用时设为 `'100%'`（父容器需有确定高度）                     |

### Events / Slots

| 名称                                                  | 说明                                                      |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `collapse(collapsed)`                                 | 桌面端点击折叠按钮时触发（移动端切换抽屉不触发）          |
| `skip-nav` slot                                       | 自定义「跳到主内容」链接文案（默认走 locale）             |
| `header-left` / `header-center` / `header-right` slot | 顶栏三段（左/中/右）                                      |
| `sider` slot                                          | 侧边栏内容，作用域参数 `{ collapsed }`（联动菜单折叠态）  |
| 默认 slot                                             | 主内容区（`<main id="nm-layout-content">`，自带纵向滚动） |
| `footer` slot                                         | 页脚（仅传了该 slot 才渲染）                              |

---

## 用法

```vue
<!-- 纯顶栏页面 -->
<NeumorphismLayout>
  <template #header-center>标题</template>
  内容
</NeumorphismLayout>

<!-- 嵌套在已有高度容器内 -->
<div style="height: 600px">
  <NeumorphismLayout height="100%" show-sider>…</NeumorphismLayout>
</div>
```

全局预设：

```ts
app.use(NeumorphismUI, { layout: { showSider: true, siderWidth: 260, collapsible: true } })
```

---

## 交互动画详解

### 桌面端折叠

侧边栏宽度在 `siderWidth` ↔ `collapsedWidth` 之间以 0.4s spring 过渡；折叠按钮图标随状态切换，按钮本体是凸起→按压的新拟态微交互（hover 上浮 1px，active 凹陷）。折叠状态由内部 `collapsed` ref 维护，`defaultCollapsed` 只作初始值。

### 移动端抽屉模式

`useTouchDevice` 判定为移动端时：

- 框架从 `100vh` 内滚动改为整页滚动（`height: auto`），侧边栏变为 `fixed` 抽屉（280px / max 85vw），`translateX(-100%)` 隐藏
- 折叠按钮改作抽屉开关；抽屉打开时铺半透明遮罩（禁触摸滚动穿透），点遮罩或点内容区关闭
- `mobileAutoCollapse` 开启时移动端强制折叠态

### 无障碍

- 内置「跳到主内容」链接：仅聚焦时从顶边滑出，点击后把焦点移到 `<main>`（`tabindex="-1"`）
- 侧边栏 `role="navigation"` + locale `aria-label`；折叠按钮 `aria-label` 随展开/折叠切换
- Reduced-motion 下侧栏宽度过渡与按钮动画移除

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
