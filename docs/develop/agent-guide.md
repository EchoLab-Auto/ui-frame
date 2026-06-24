# @echolab/ui-frame — Agent 构建指南

> **一句话**：Vue 3 新拟态（Neumorphism）组件库，通过多层阴影模拟 3D 浮雕效果。Agent 构建 UI 时，只需知道**组件名 + props + slot**即可使用，无需阅读源码。

---

## 1. 安装与启动（2 行）

```ts
import { createApp } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'

const app = createApp(App)
app.use(NeumorphismUI) // 全局注册所有 46 个组件
app.mount('#app')
```

**按需引入**（tree-shaking）：

```ts
import { NeumorphismButton, NeumorphismCard, useTheme } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
```

---

## 2. 构建 UI 的通用模式

所有组件遵循统一的三层接口：

```
<ComponentName   prop="value"      ← Props: 控制外观和行为
                 @event="handler"  ← Events: 通知父组件
>
  <slot />                          ← Slots: 插入自定义内容
</ComponentName>
```

### 2.1 Props — 控制外观

每个组件通过 `variant`/`size`/`shape` 等 props 切换视觉变体：

```vue
<NeumorphismButton variant="raised" size="large" shape="pill" disabled loading />
<NeumorphismCard :elevation="2" hoverable radius="large" />
<NeumorphismInput size="small" placeholder="输入内容" error="格式错误" />
```

**三级优先级**（所有组件通用）：`显式 prop > 全局配置 > 默认值`

### 2.2 Events — 响应交互

```vue
<NeumorphismButton @click="handleClick" />
<NeumorphismSwitch v-model="checked" @change="onChange" />
<NeumorphismModal v-model="visible" @close="onClose" />
```

### 2.3 Slots — 插入内容

```vue
<NeumorphismCard>
  <template #header>卡片标题</template>
  卡片正文
  <template #footer>底部操作</template>
</NeumorphismCard>
```

---

## 3. 主题系统（5 秒上手）

**亮色/暗色双主题**，通过 CSS 变量 + `data-theme` 属性切换：

```vue
<script setup>
import { provideTheme } from '@echolab/ui-frame'
const { theme, isDark, toggleTheme } = provideTheme()
</script>

<template>
  <div :data-theme="isDark ? 'dark' : undefined">
    <NeumorphismThemeToggle v-model="theme" />
    <!-- 所有子组件自动跟随主题 -->
  </div>
</template>
```

**覆盖任意视觉参数**（不改源码）：

```css
:root {
  --nm-primary-color: #6c7ae0; /* 主色调 */
  --nm-bg-color: #e0e0e0; /* 背景色 */
  --nm-border-radius-md: 16px; /* 圆角 */
  --nm-shadow-dark: rgba(0, 0, 0, 0.15); /* 暗阴影强度 */
}
```

---

## 4. 完整组件目录（46 个）

### 基础输入（10 个）

| 组件                      | 用途               | 核心 Props                                                   |
| ------------------------- | ------------------ | ------------------------------------------------------------ |
| `NeumorphismButton`       | 凸起/扁平/凹陷按钮 | `variant`(raised\|flat\|pressed), `size`, `shape`, `loading` |
| `NeumorphismSwitch`       | 开关切换           | `v-model`, `size`, `activeText`, `inactiveText`              |
| `NeumorphismCheckbox`     | 复选框             | `v-model`, `label`, `size`, `indeterminate`                  |
| `NeumorphismRadio`        | 单选按钮           | `v-model`, `value`, `size`, `disabled`                       |
| `NeumorphismRadioGroup`   | 单选按钮组         | `v-model`, `direction`(horizontal\|vertical)                 |
| `NeumorphismInput`        | 文本输入框         | `v-model`, `label`, `placeholder`, `size`, `error`           |
| `NeumorphismTextarea`     | 多行文本           | `v-model`, `rows`, `autoResize`, `showCount`                 |
| `NeumorphismSelect`       | 下拉选择           | `v-model`, `options`, `clearable`, `size`                    |
| `NeumorphismInputNumber`  | 数字输入           | `v-model`, `min`, `max`, `step`, `controls`(±按钮)           |
| `NeumorphismAutoComplete` | 输入联想           | `v-model`, `options`, `loading`, `debounce`                  |

### 表单（3 个）

| 组件                    | 用途     | 核心 Props                                      |
| ----------------------- | -------- | ----------------------------------------------- |
| `NeumorphismForm`       | 表单容器 | `model`, `rules`, `direction`, `size`           |
| `NeumorphismFormItem`   | 表单项   | `prop`, `label`, `required`, `rules`            |
| `NeumorphismDatePicker` | 日期选择 | `v-model`(Date), `format`, `minDate`, `maxDate` |

### 数据展示（10 个）

| 组件                     | 用途      | 核心 Props                                                   |
| ------------------------ | --------- | ------------------------------------------------------------ |
| `NeumorphismCard`        | 卡片容器  | `elevation`(-4~4), `hoverable`(bulge\|sink), `radius`        |
| `NeumorphismAvatar`      | 头像      | `src`, `size`, `shape`(circle\|rounded), `initials`          |
| `NeumorphismBadge`       | 角标/红点 | `value`, `dot`, `max`, `color`                               |
| `NeumorphismTag`         | 标签      | `variant`(default\|primary\|success\|...), `size`, `rounded` |
| `NeumorphismProgress`    | 进度条    | `percentage`, `variant`, `size`, `showLabel`, `striped`      |
| `NeumorphismSkeleton`    | 骨架屏    | `variant`(text\|circle\|rect), `animation`(pulse\|wave)      |
| `NeumorphismTable`       | 表格      | `columns`, `data`, `size`, `striped`, `hoverable`            |
| `NeumorphismTree`        | 树形控件  | `data`, `selectedKeys`, `expandedKeys`, `showSearch`         |
| `NeumorphismList`        | 列表      | `items`, `bordered`, `split`, `hoverable`, `loading`         |
| `NeumorphismVirtualList` | 虚拟滚动  | `items`, `itemHeight`, `overscan`                            |

### 反馈（8 个）

| 组件                       | 用途     | 核心 Props                                                 |
| -------------------------- | -------- | ---------------------------------------------------------- |
| `NeumorphismModal`         | 模态框   | `v-model`, `title`, `size`, `maskClosable`                 |
| `NeumorphismDrawer`        | 抽屉     | `v-model`, `position`(left\|right\|top\|bottom), `title`   |
| `NeumorphismToastProvider` | 消息提示 | `position`, `maxCount`（调用 `addToast({message,type})`）  |
| `NeumorphismTooltip`       | 文字提示 | `content`, `position`, `trigger`(hover\|click\|focus)      |
| `NeumorphismPopover`       | 弹出面板 | `trigger`, `position`, `width`, `showArrow`                |
| `NeumorphismAlert`         | 警告横幅 | `type`(info\|success\|warning\|error), `title`, `closable` |
| `NeumorphismEmpty`         | 空状态   | `description`, `size`                                      |
| `NeumorphismCollapse`      | 折叠面板 | `items`(或 slot), `accordion`                              |

### 导航（5 个）

| 组件                    | 用途     | 核心 Props                                                  |
| ----------------------- | -------- | ----------------------------------------------------------- |
| `NeumorphismTabs`       | 标签页   | `v-model`, `items`(label+key), `position`                   |
| `NeumorphismBreadcrumb` | 面包屑   | `items`(label+path), `size`                                 |
| `NeumorphismPagination` | 分页     | `v-model:current`, `total`, `pageSize`, `size`              |
| `NeumorphismMenu`       | 垂直菜单 | `items`(label+key+icon+children), `selectable`, `collapsed` |
| `NeumorphismNavMenu`    | 水平导航 | `items`, `defaultActive`                                    |
| `NeumorphismDropdown`   | 下拉菜单 | `items`(key+label+disabled+danger), trigger 自动            |

### 布局（7 个）

| 组件                   | 用途     | 核心 Props                                                     |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `NeumorphismLayout`    | 页面框架 | `showHeader`, `showSider`, `siderWidth`, `collapsible`         |
| `NeumorphismContainer` | 内容容器 | `mode`(fixed\|fluid), `noPadding`                              |
| `NeumorphismRow`       | 栅格行   | `gutter`, `justify`, `align`, `wrap`                           |
| `NeumorphismCol`       | 栅格列   | `span`(1-24), `offset`, `xs/sm/md/lg/xl/xxl`                   |
| `NeumorphismDivider`   | 分割线   | `direction`, `align`, `dashed`, `inset`                        |
| `NeumorphismSlider`    | 滑块     | `v-model`, `min`, `max`, `step`, `vertical`                    |
| `NeumorphismSteps`     | 步骤条   | `steps`(key+title+description), `v-model:current`, `direction` |

### 其他（3 个）

| 组件                | 用途       | 核心 Props                                      |
| ------------------- | ---------- | ----------------------------------------------- |
| `NeumorphismUpload` | 文件上传   | `v-model:files`, `accept`, `drag`, `listType`   |
| `NeumorphismCanvas` | 画布       | `showGrid`, `gridSize`                          |
| `ThemeProvider`     | 主题提供者 | `defaultTheme`(light\|dark\|auto), `storageKey` |

---

## 5. 常用布局模板

### 标准管理后台

```vue
<NeumorphismLayout show-header show-sider :sider-width="240" collapsible>
  <template #header-left>Logo + 标题</template>
  <template #header-right>
    <NeumorphismThemeToggle v-model="theme" />
  </template>
  <template #sider>
    <NeumorphismMenu :items="menuItems" selectable />
  </template>
  <template #default>
    <NeumorphismContainer>
      <router-view />
    </NeumorphismContainer>
  </template>
</NeumorphismLayout>
```

### 表单页面

```vue
<NeumorphismCard :elevation="2" radius="large">
  <template #header>用户信息</template>
  <NeumorphismForm :model="form" :rules="rules" @submit="onSubmit">
    <NeumorphismFormItem label="用户名" prop="name" required>
      <NeumorphismInput v-model="form.name" placeholder="请输入" />
    </NeumorphismFormItem>
    <NeumorphismFormItem label="状态" prop="status">
      <NeumorphismSelect v-model="form.status" :options="statusOptions" />
    </NeumorphismFormItem>
    <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
  </NeumorphismForm>
</NeumorphismCard>
```

### 数据列表页

```vue
<NeumorphismCard :elevation="1" no-padding>
  <NeumorphismTable :columns="columns" :data="list" striped hoverable size="medium" />
  <template #footer>
    <NeumorphismPagination v-model:current="page" :total="total" :page-size="10" />
  </template>
</NeumorphismCard>
```

### 弹窗确认

```vue
<NeumorphismModal v-model="visible" title="确认删除" size="small" @confirm="handleDelete">
  确定要删除此项吗？此操作不可撤销。
  <template #footer>
    <NeumorphismButton variant="flat" @click="visible = false">取消</NeumorphismButton>
    <NeumorphismButton variant="raised" @click="handleDelete">确认</NeumorphismButton>
  </template>
</NeumorphismModal>
```

---

## 6. Headless Composables（纯逻辑，无 UI）

所有交互逻辑均可脱离 UI 使用：

```ts
import {
  useTheme, // 主题状态
  useSelect, // 下拉选择逻辑
  useTable, // 排序/筛选/分页
  useTree, // 展开/折叠/选中/键盘导航
  usePagination, // 分页计算
  useFormField, // 表单字段验证
  useModal, // 焦点陷阱/滚动锁定
  useToast, // 消息队列管理
  usePopover, // 弹出定位/边界检测
  useDatePicker, // 日历计算
  useVirtualList, // 虚拟滚动
  // ... 共 29 个
} from '@echolab/ui-frame'
```

**典型用法**：`const { isOpen, toggle, close } = useModal({ maskClosable: true })`

---

## 7. 全局批量配置

通过 `app.use()` 设置全库默认值，无需逐个组件传参：

```ts
app.use(NeumorphismUI, {
  button: { size: 'medium', variant: 'raised' },
  input: { size: 'medium' },
  modal: { maskClosable: true },
  toast: { position: 'top-right', maxCount: 5 },
  pagination: { showTotal: true },
  // ... 共 40+ 组件配置段
})
```

---

## 8. 关键 CSS 变量速查

覆盖这些变量即可自定义整体风格：

```css
:root {
  /* 色彩 */
  --nm-primary-color: #6c7ae0;
  --nm-bg-color: #e0e0e0;
  --nm-surface-color: #e0e0e0;
  --nm-text-primary: #555555;

  /* 圆角 */
  --nm-border-radius-sm: 8px;
  --nm-border-radius-md: 16px;

  /* 阴影强度 */
  --nm-shadow-dark: rgba(0, 0, 0, 0.15);
  --nm-shadow-light: rgba(255, 255, 255, 0.8);

  /* 间距 */
  --nm-spacing-xs: 4px;
  --nm-spacing-sm: 8px;
  --nm-spacing-md: 16px;
  --nm-spacing-lg: 24px;
}
```

---

## 9. 全局配置速查

使用 `app.use()` 时可按组件名设置全局默认 prop，减少重复传参：

```ts
app.use(NeumorphismUI, {
  button: { size: 'medium', variant: 'raised' },
  input: { size: 'medium' },
  select: { size: 'medium', clearable: true },
  modal: { maskClosable: true },
  toast: { position: 'top-right', maxCount: 5 },
  pagination: { size: 'medium', showTotal: true },
  table: { size: 'medium', striped: true, hoverable: true },
  tag: { rounded: true },
})
```

---

## 10. 常见模式速查

### 表单验证

```vue
<NeumorphismForm :model="form" :rules="{ name: [{ required: true, message: '必填' }] }">
  <NeumorphismFormItem prop="name" label="名称">
    <NeumorphismInput v-model="form.name" />
  </NeumorphismFormItem>
</NeumorphismForm>
```

### 确认弹窗

```vue
<NeumorphismModal v-model="show" title="确认" @confirm="onConfirm">
  确定执行此操作？
</NeumorphismModal>
```

### 消息提示

```vue
<script setup>
const toastRef = ref()
function showMsg() {
  toastRef.value.addToast({ message: '操作成功', type: 'success' })
}
</script>
<NeumorphismToastProvider ref="toastRef" />
```

### 弹窗/抽屉

```vue
<NeumorphismModal v-model="visible" title="编辑" size="large" @close="onClose">
  <NeumorphismForm :model="form">...</NeumorphismForm>
</NeumorphismModal>

<NeumorphismDrawer v-model="drawerOpen" position="right" title="详情" :width="400">
  <NeumorphismList :items="detailItems" />
</NeumorphismDrawer>
```

### 下拉菜单

```vue
<NeumorphismDropdown
  :items="[
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true },
  ]"
  @select="onSelect"
>
  <NeumorphismButton variant="flat" size="small">操作 ▾</NeumorphismButton>
</NeumorphismDropdown>
```

### 树形选择

```vue
<NeumorphismTree :data="treeItems" v-model:selectedKeys="selected" showSearch multiple />
```

### 文件上传

```vue
<NeumorphismUpload v-model:files="fileList" accept="image/*" drag listType="picture" />
```

### 日期选择

```vue
<NeumorphismDatePicker v-model="date" format="yyyy-MM-dd" label="选择日期" />
```

### 步骤流程

```vue
<NeumorphismSteps
  :steps="[
    { key: '1', title: '第一步' },
    { key: '2', title: '第二步' },
  ]"
  v-model:current="step"
/>
```

### 虚拟列表

```vue
<NeumorphismVirtualList :items="bigArray" :itemHeight="48">
  <template #default="{ item }">{{ item.label }}</template>
</NeumorphismVirtualList>
```

---

## 11. 详细文档链接

- [API 参考](docs/develop/api.md) — 每个组件的 Props/Events/Slots 完整表格
- [用户指南](docs/develop/guide.md) — 场景驱动的教程
- [设计理念](docs/before-develop/design-philosophy.md) — 物理隐喻、Headless 分离等原则
- [设计模式](docs/before-develop/design-patterns.md) — 级联配置、Token 系统等的代码体现

---

## 12. 快速决策指南

| 你想做什么    | 用什么                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| 页面整体布局  | `NeumorphismLayout` + `NeumorphismContainer`                                                                 |
| 栅格排列      | `NeumorphismRow` + `NeumorphismCol`                                                                          |
| 卡片分组      | `NeumorphismCard`                                                                                            |
| 文本输入      | `NeumorphismInput` / `NeumorphismTextarea`                                                                   |
| 选择/开关     | `NeumorphismSelect` / `NeumorphismCheckbox` / `NeumorphismRadio` / `NeumorphismSwitch` / `NeumorphismSlider` |
| 数字输入      | `NeumorphismInputNumber`                                                                                     |
| 日期选择      | `NeumorphismDatePicker`                                                                                      |
| 搜索联想      | `NeumorphismAutoComplete`                                                                                    |
| 文件上传      | `NeumorphismUpload`                                                                                          |
| 表单提交      | `NeumorphismForm` + `NeumorphismFormItem`                                                                    |
| 表格展示      | `NeumorphismTable`                                                                                           |
| 树形数据      | `NeumorphismTree`                                                                                            |
| 列表/虚拟滚动 | `NeumorphismList` / `NeumorphismVirtualList`                                                                 |
| 标签/角标     | `NeumorphismTag` / `NeumorphismBadge`                                                                        |
| 进度/加载     | `NeumorphismProgress` / `NeumorphismSkeleton`                                                                |
| 空状态        | `NeumorphismEmpty`                                                                                           |
| 弹窗确认      | `NeumorphismModal`                                                                                           |
| 侧边抽屉      | `NeumorphismDrawer`                                                                                          |
| 消息提示      | `NeumorphismToastProvider`                                                                                   |
| 鼠标提示      | `NeumorphismTooltip`                                                                                         |
| 弹出面板      | `NeumorphismPopover`                                                                                         |
| 下拉菜单      | `NeumorphismDropdown`                                                                                        |
| 警告横幅      | `NeumorphismAlert`                                                                                           |
| 折叠面板      | `NeumorphismCollapse`                                                                                        |
| 标签页        | `NeumorphismTabs`                                                                                            |
| 面包屑        | `NeumorphismBreadcrumb`                                                                                      |
| 分页          | `NeumorphismPagination`                                                                                      |
| 导航菜单      | `NeumorphismMenu` / `NeumorphismNavMenu`                                                                     |
| 步骤条        | `NeumorphismSteps`                                                                                           |
| 主题切换      | `ThemeProvider` + `NeumorphismThemeToggle`                                                                   |
| 头像          | `NeumorphismAvatar`                                                                                          |
| 画布          | `NeumorphismCanvas`                                                                                          |
| 分割线        | `NeumorphismDivider`                                                                                         |
