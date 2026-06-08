# 项目 README 内容规范

> 本文档严格定义 @echolab/ui-frame 项目根目录 `README.md` 的内容结构与撰写标准。Agent 在创建或修改 README 时必须逐项对照。

---

## 一、定位与读者

**读者**：首次访问仓库的外部开发者（潜在使用者）

**目的**：30 秒内传递"这是什么、为什么用它、怎么开始"三个信息

**禁止**：

- 不写内部实现细节（composable、Token 命名等）
- 不写开发流程（lint、测试命令等）
- 不写面向内部开发者的约束规则

---

## 二、必须包含的章节（按顺序）

### 2.1 项目标识

- **标题**：`@echolab/ui-frame`（npm 包名）
- **一句话描述**：以新拟态（Neumorphism）设计语言为核心的 Vue 3 组件库
- **徽章行**（可选但推荐）：npm 版本、license、build status

### 2.2 特性亮点（3-5 条）

用列表呈现，每条不超过一行。必须覆盖：

1. 新拟态视觉系统（凸起/凹陷/elevation）
2. 亮色/暗色双主题（运行时切换）
3. Headless + Vue 组件分层架构
4. 完整的 TypeScript 类型支持
5. 无障碍支持（ARIA、键盘导航、reduced-motion）

### 2.3 安装

```bash
npm install @echolab/ui-frame
```

### 2.4 快速开始

一个可直接运行的最小示例（不超过 20 行），展示核心用法：

```vue
<script setup>
import { NeumorphismButton } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismButton>Click me</NeumorphismButton>
</template>
```

### 2.5 文档链接

提供指向完整文档的链接：

- 用户指南 → `docs/develop/guide.md`
- API 参考 → `docs/develop/api.md`
- 在线示例（如已部署 Pages）→ 示例站点地址

### 2.6 浏览器支持

列出支持的浏览器范围（如 Chrome 88+、Firefox 78+、Safari 14+）。

### 2.7 License

声明许可证（本项目为 MIT），提供 LICENSE 文件链接。

---

## 三、格式规范

- 使用一级标题作为项目名，后续章节从二级标题开始
- 代码块标注语言（`bash`、`vue`、`ts`）
- 安装命令优先展示 npm，可选展示 pnpm/yarn
- 所有外部链接使用绝对 URL，内部文档链接使用相对路径
- 中英文混排时，英文与中文之间留一个空格

---

## 四、检查清单

创建或修改 README 后自检：

```
□ 标题是否为 npm 包名 @echolab/ui-frame？
□ 一句话描述是否准确传达项目定位？
□ 特性列表是否包含新拟态、主题切换、TypeScript、无障碍？
□ 安装命令是否正确？
□ 快速开始示例是否可直接复制运行？
□ 是否提供了完整文档的链接？
□ 是否声明了 License？
□ 内容是否面向外部使用者，无内部实现细节？
```
