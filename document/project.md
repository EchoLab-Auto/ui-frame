---
id: project
title: '@echolab-auto/ui-frame'
x: 673
y: 14
link: ['user | 使用 | b>t', 'develop | 开发 | b>t']
---

# @echolab-auto/ui-frame

**ui-frame** 是一个基于**新拟态（Neumorphism / Soft UI）**设计风格的 **Vue 3 UI 组件库**：通过多层柔和阴影和统一台阶高度模型营造真实的 3D 浮雕与凹陷效果。本目录是它的文档群——每个 `.md` 文件是图上的一个框，框间连线表达导航关系。

## 特性

- **统一台阶高度模型**：正数凸起、负数凹陷、零值平齐，阴影强度随 |elevation| 递增
- **亮色 / 暗色主题**：内置 `ThemeProvider`，支持自动跟随系统偏好
- **Headless 与 UI 解耦**：逻辑写在 composable，组件只做视觉
- **Token 驱动的主题**：视觉参数用 CSS 变量，不硬编码
- **无障碍**：键盘、ARIA、焦点管理、reduced-motion 全覆盖
- **TypeScript**：完整的类型定义，支持 Tree-shaking 按需引入

## 从这里开始

- [使用指南](./user/user.md) — 安装、主题配置与场景教程
- [开发指南](./develop/develop.md) — 设计原则、开发流程与文档规范
