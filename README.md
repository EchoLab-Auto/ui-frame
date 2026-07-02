# @echolab-auto/ui-frame

[![npm version](https://img.shields.io/npm/v/@echolab-auto/ui-frame)](https://www.npmjs.com/package/@echolab-auto/ui-frame)
[![license](https://img.shields.io/npm/l/@echolab-auto/ui-frame)](LICENSE)
[![build status](https://img.shields.io/github/actions/workflow/status/EchoLab-Auto/ui-frame/ci.yml?branch=main)](https://github.com/EchoLab-Auto/ui-frame/actions)

基于 **新拟态（Neumorphism / Soft UI）** 设计风格的 Vue 3 UI 组件库，通过多层柔和阴影和统一台阶高度模型营造真实的 3D 浮雕与凹陷效果。

## 特性

- **统一台阶高度模型** — 正数凸起、负数凹陷、零值平齐，阴影强度随 |elevation| 递增
- **悬停动效** — bulge（膨胀凸起）/ sink（下沉凹陷），不跨越零点，背景色自动匹配
- **亮色 / 暗色主题** — 内置 `ThemeProvider`，支持自动跟随系统偏好
- **多层阴影** — 环境遮挡 + 定向阴影 + 边缘高光，模拟物理光照
- **弹性缓动** — critically-damped 与 spring-like 过渡曲线，触感自然
- **Tree-shaking** — 按需引入，只打包需要的组件
- **TypeScript** — 完整的类型定义

## 安装

### npm

```bash
npm install @echolab-auto/ui-frame
```

### GitHub

```bash
npm install EchoLab-Auto/ui-frame
```

## 快速开始

### 全量引入

```ts
import { createApp } from 'vue'
import NeumorphismUI from '@echolab-auto/ui-frame'
import '@echolab-auto/ui-frame/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(NeumorphismUI)
app.mount('#app')
```

### 按需引入

```vue
<script setup>
import { NeumorphismButton } from '@echolab-auto/ui-frame'
import '@echolab-auto/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismButton variant="raised" size="medium">点击我</NeumorphismButton>
</template>
```

## 组件列表（46 个）

### 基础输入

| 组件                                         | 说明                   | 关键属性                                           |
| -------------------------------------------- | ---------------------- | -------------------------------------------------- |
| `NeumorphismButton`                          | 凸起/扁平/凹陷按钮     | `variant`, `size`, `shape`, `disabled`, `loading`  |
| `NeumorphismSwitch`                          | 开关切换               | `v-model`, `size`, `activeText`                    |
| `NeumorphismCheckbox`                        | 复选框                 | `v-model`, `label`, `size`, `indeterminate`        |
| `NeumorphismRadio` / `NeumorphismRadioGroup` | 单选按钮               | `v-model`, `value`, `direction`                    |
| `NeumorphismInput`                           | 文本输入框（凹陷效果） | `v-model`, `label`, `placeholder`, `size`, `error` |
| `NeumorphismTextarea`                        | 多行文本               | `v-model`, `rows`, `autoResize`, `showCount`       |
| `NeumorphismSelect`                          | 下拉选择               | `v-model`, `options`, `clearable`                  |
| `NeumorphismInputNumber`                     | 数字输入（±步进器）    | `v-model`, `min`, `max`, `step`                    |
| `NeumorphismAutoComplete`                    | 输入联想               | `v-model`, `options`, `loading`                    |
| `NeumorphismSlider`                          | 滑块                   | `v-model`, `min`, `max`, `step`, `vertical`        |

### 表单

| 组件                    | 说明            | 关键属性                             |
| ----------------------- | --------------- | ------------------------------------ |
| `NeumorphismForm`       | 表单容器 + 验证 | `model`, `rules`, `direction`        |
| `NeumorphismFormItem`   | 表单项          | `prop`, `label`, `required`, `rules` |
| `NeumorphismDatePicker` | 日期选择器      | `v-model`(Date), `format`, `minDate` |

### 数据展示

| 组件                     | 说明                     | 关键属性                                  |
| ------------------------ | ------------------------ | ----------------------------------------- |
| `NeumorphismCard`        | 卡片容器（台阶高度模型） | `elevation`(-4~4), `hoverable`, `radius`  |
| `NeumorphismAvatar`      | 头像                     | `src`, `size`, `shape`, `initials`        |
| `NeumorphismBadge`       | 角标/红点                | `value`, `dot`, `max`                     |
| `NeumorphismTag`         | 标签                     | `variant`, `size`, `rounded`              |
| `NeumorphismProgress`    | 进度条                   | `percentage`, `variant`, `striped`        |
| `NeumorphismSkeleton`    | 骨架屏                   | `variant`, `animation`                    |
| `NeumorphismTable`       | 数据表格                 | `columns`, `data`, `striped`, `hoverable` |
| `NeumorphismTree`        | 树形控件（键盘导航）     | `data`, `selectedKeys`, `showSearch`      |
| `NeumorphismList`        | 列表                     | `items`, `bordered`, `loading`            |
| `NeumorphismVirtualList` | 虚拟滚动列表             | `items`, `itemHeight`, `overscan`         |

### 反馈

| 组件                       | 说明     | 关键属性                                       |
| -------------------------- | -------- | ---------------------------------------------- |
| `NeumorphismModal`         | 模态框   | `v-model`, `title`, `size`, `maskClosable`     |
| `NeumorphismDrawer`        | 抽屉面板 | `v-model`, `position`, `title`                 |
| `NeumorphismToastProvider` | 消息提示 | `position`, `maxCount`                         |
| `NeumorphismTooltip`       | 文字提示 | `content`, `position`, `trigger`               |
| `NeumorphismPopover`       | 弹出面板 | `trigger`, `position`, `width`                 |
| `NeumorphismAlert`         | 警告横幅 | `type`(info/success/warning/error), `closable` |
| `NeumorphismEmpty`         | 空状态   | `description`, `size`                          |
| `NeumorphismCollapse`      | 折叠面板 | `items`, `accordion`                           |

### 导航

| 组件                    | 说明       | 关键属性                                |
| ----------------------- | ---------- | --------------------------------------- |
| `NeumorphismTabs`       | 标签页     | `v-model`, `items`, `position`          |
| `NeumorphismBreadcrumb` | 面包屑     | `items`, `size`                         |
| `NeumorphismPagination` | 分页       | `v-model:current`, `total`, `pageSize`  |
| `NeumorphismMenu`       | 垂直菜单   | `items`, `selectable`, `collapsed`      |
| `NeumorphismNavMenu`    | 水平导航栏 | `items`, `defaultActive`                |
| `NeumorphismDropdown`   | 下拉菜单   | `items`, trigger 自动                   |
| `NeumorphismSteps`      | 步骤条     | `steps`, `v-model:current`, `direction` |

### 布局

| 组件                   | 说明                                    | 关键属性                                 |
| ---------------------- | --------------------------------------- | ---------------------------------------- |
| `NeumorphismLayout`    | 页面框架（Header/Sider/Content/Footer） | `showHeader`, `showSider`, `collapsible` |
| `NeumorphismContainer` | 响应式页面容器                          | `mode`(fixed/fluid), `noPadding`         |
| `NeumorphismRow`       | flexbox 栅格行                          | `gutter`, `justify`, `align`             |
| `NeumorphismCol`       | 栅格列（6 响应式断点）                  | `span`(1-24), `xs/sm/md/lg/xl/xxl`       |
| `NeumorphismDivider`   | 分割线                                  | `direction`, `align`, `dashed`           |
| `NeumorphismCanvas`    | 画布                                    | `showGrid`, `gridSize`                   |

### 其他

| 组件                     | 说明              | 关键属性                                      |
| ------------------------ | ----------------- | --------------------------------------------- |
| `NeumorphismUpload`      | 文件上传（拖拽）  | `v-model:files`, `accept`, `drag`, `listType` |
| `ThemeProvider`          | 亮色/暗色主题管理 | `defaultTheme`(light/dark/auto)               |
| `NeumorphismThemeToggle` | 主题切换按钮      | `v-model`, `size`                             |

详细文档：

- [Agent 构建指南](docs/develop/agent-guide.md) — Agent 专用，组件目录 + 模式 + 决策指南
- [用户指南](docs/develop/guide.md) — 教程式，按场景阅读
- [API 参考](docs/develop/api.md) — 参考手册式，按模块名检索

## 示例

```bash
npm run example
```

访问 `http://localhost:5173/` 查看所有组件的交互展示。

## 浏览器支持

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 开发

```bash
# 构建库
npm run build

# 启动示例开发服务器
npm run example

# 构建示例（用于 GitHub Pages）
npm run example:build
```

## 发布

```bash
export NPM_TOKEN=npm_xxxxxxxx
npm config set //registry.npmjs.org/:_authToken=${NPM_TOKEN}
npm publish
```
