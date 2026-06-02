# @echolab/ui-frame

基于 **新拟态（Neumorphism / Soft UI）** 设计风格的 Vue 3 UI 组件库 —— 通过柔和、可触知的阴影营造真实的 3D 浮雕效果。

> 灵感来源于物理界面优雅的 inset / 凸起阴影美学。

## 特性

- **新拟态设计** — 柔和的凸起与凹陷阴影效果
- **亮色 / 暗色主题** — 内置主题系统，支持自动检测
- **Tree-shaking** — 按需引入，只打包需要的组件
- **TypeScript** — 完整的类型定义
- **Vue 3 Composition API** — 现代化 Vue 开发体验

## 安装

### 通过 npm 安装（推荐）

```bash
npm install @echolab/ui-frame
```

```bash
yarn add @echolab/ui-frame
```

```bash
pnpm add @echolab/ui-frame
```

### 通过 GitHub 安装

如果包尚未发布到 npm，可以直接从 GitHub 安装：

```bash
# 从 main 分支安装
npm install EchoLab-Auto/ui-frame

# 或从指定分支/标签安装
npm install EchoLab-Auto/ui-frame#main
npm install EchoLab-Auto/ui-frame#v1.0.0
```

```bash
yarn add EchoLab-Auto/ui-frame
```

```bash
pnpm add EchoLab-Auto/ui-frame
```

**注意：** 从 GitHub 安装时，`prepare` 脚本会自动执行构建。请确保 Node.js 版本 >= 18。

## 快速开始

```ts
import { createApp } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(NeumorphismUI)
app.mount('#app')
```

## 组件列表

| 组件 | 说明 | 关键属性 |
|-----------|-------------|-----------|
| `NeumorphismButton` | 带有凸起/凹陷阴影效果的按钮 | `variant`, `size`, `shape`, `disabled`, `loading` |
| `NeumorphismSwitch` | 带太阳/月亮图标的切换开关 | `v-model`, `active-text`, `inactive-text`, `size` |
| `NeumorphismCard` | 带凸起或凹陷阴影深度的容器 | `variant`, `depth`, `radius`, `hoverable` |
| `NeumorphismInput` | 带凹陷阴影效果的输入框 | `v-model`, `label`, `placeholder`, `size`, `error` |
| `ThemeProvider` | 管理应用全局的亮色/暗色主题 | `default-theme`, `storage-key`, `follow-system` |

详细的使用说明、组件属性及主题定制，请参阅 [文档](docs/documentation.md)。

## 示例

项目提供了组件展示页面，展示所有组件的交互效果，并支持亮/暗主题切换。

```bash
npm run example
```

访问 http://localhost:5173/

MIT

## 仓库

[https://github.com/EchoLab-Auto/ui-frame](https://github.com/EchoLab-Auto/ui-frame)
