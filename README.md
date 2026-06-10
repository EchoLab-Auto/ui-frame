# @echolab/ui-frame

[![npm version](https://img.shields.io/npm/v/@echolab/ui-frame)](https://www.npmjs.com/package/@echolab/ui-frame)
[![license](https://img.shields.io/npm/l/@echolab/ui-frame)](LICENSE)
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
npm install @echolab/ui-frame
```

### GitHub

```bash
npm install EchoLab-Auto/ui-frame
```

## 快速开始

### 全量引入

```ts
import { createApp } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(NeumorphismUI)
app.mount('#app')
```

### 按需引入

```vue
<script setup>
import { NeumorphismButton } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismButton variant="raised" size="medium">点击我</NeumorphismButton>
</template>
```

## 组件列表

| 组件                   | 说明                                          | 关键属性                                               |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `NeumorphismButton`    | 凸起/扁平/凹陷按钮，多层阴影 + 弹性悬停       | `variant`, `size`, `shape`, `disabled`, `loading`      |
| `NeumorphismSwitch`    | 日月图标切换开关，交叉淡入淡出 + 临界阻尼滑动 | `v-model`, `active-text`, `inactive-text`, `size`      |
| `NeumorphismCard`      | 统一台阶高度容器，支持 bulge/sink 悬停动效    | `elevation`, `hoverable`, `radius`, `noPadding`        |
| `NeumorphismInput`     | 凹陷输入框，支持悬停加深 + 聚焦光环           | `v-model`, `label`, `placeholder`, `size`, `error`     |
| `ThemeProvider`        | 亮色/暗色主题管理，自动跟随系统               | `default-theme`, `storage-key`, `follow-system`        |
| `NeumorphismContainer` | 响应式页面容器，固定/全宽模式                 | `mode`, `noPadding`, `tag`                             |
| `NeumorphismRow`       | flexbox 栅格行，列间距与对齐控制              | `gutter`, `justify`, `align`, `wrap`                   |
| `NeumorphismCol`       | 栅格列，支持 6 个响应式断点                   | `span`, `offset`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`  |
| `NeumorphismLayout`    | 经典页面框架（Header/Sider/Content/Footer）   | `showHeader`, `showSider`, `siderWidth`, `collapsible` |

详细文档：

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

MIT
