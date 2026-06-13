<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import {
  MarkdownRenderer,
  MarkdownEditor,
  buildDocTree,
  DocViewer,
  DocEditor,
  type ProDocNode,
} from '@/doc'

const themeContext = useTheme()
const themeValue = themeContext.theme
const isDark = themeContext.isDark

// ==========================================
// MarkdownRenderer 演示数据
// ==========================================
const sampleMarkdown = ref(`# MarkdownRenderer 组件

这是一个 **Markdown 渲染器** 组件的演示页面。支持以下功能：

## 代码高亮

\`\`\`typescript
import { MarkdownRenderer } from '@echolab/ui-frame'

// 基本用法
const content = ref('# Hello World')
\`\`\`

\`\`\`javascript
// 简易语法高亮演示
const greeting = 'Hello, World!'
const number = 42

function sayHello(name) {
  return \`Hello, \${name}!\`
}

class Person {
  constructor(name) {
    this.name = name
  }
}
\`\`\`

## 表格

| 特性 | 支持 | 说明 |
|------|------|------|
| 代码高亮 | ✅ | 支持注释、字符串、关键字等 |
| 目录生成 | ✅ | 自动提取并同步高亮 |
| 任务列表 | ✅ | 自定义复选框样式 |
| 图片懒加载 | ✅ | 原生 loading="lazy" |

## 任务列表

- [x] 完成 Markdown 解析
- [x] 添加代码高亮
- [x] 支持目录生成
- [ ] 支持数学公式
- [ ] 支持 Mermaid 图表

## 引用块

> 新拟态（Neumorphism）是一种设计风格，通过柔和的阴影和高光营造立体感。
>
> 它结合了拟物化（Skeuomorphism）和平面设计（Flat Design）的优点。

## 行内样式

你可以使用 **粗体**、*斜体*、~~删除线~~ 和 \`行内代码\`。

---

## 链接

- [外部链接](https://github.com)
- [内部文档](./guide.md) — 会被拦截为 docLink 事件

## 目录 (TOC)

右侧目录自动从标题生成，支持 **粘性悬浮** — 滚动文档内容时目录始终固定在可视区域，不会随内容滚出屏幕。

### 目录特性

- 自动提取 H1-H6 标题
- 滚动同步高亮当前章节
- 目录自身内容过长时内部可滚动
- 响应式：窄屏自动切换为移动端浮动按钮 + 抽屉面板

## 图片

![Neumorphism UI](https://placehold.co/600x200/e0e0e0/888?text=Neumorphism+UI)

图片使用了原生的 \`loading="lazy"\` 属性延迟加载。

## 更多引用

> 第一层引用：UI 组件库是前端开发的基础设施。
>
> > 嵌套引用：好的组件库需要兼顾设计一致性和灵活性。

> 另一个引用块：新拟态风格通过多层阴影模拟物理光照。

## 数字列表

1. 第一项：安装依赖
2. 第二项：引入组件
3. 第三项：配置主题
   1. 选择亮色或暗色主题
   2. 设置主题存储键
   3. 启用跟随系统

## 内联元素大全

- **粗体文本** 用于强调
- *斜体文本* 用于引用
- ~~删除线~~ 表示已废弃
- \`内联代码\` 用于变量名
- 混合使用：**粗体中的 \`代码\` 和 *斜体***

## 配置选项

\`MarkdownRenderer\` 组件支持以下属性来自定义渲染行为。

### 自定义滚动容器

通过 \`scrollContainer\` 属性可以指定滚动容器，支持 HTMLElement 或 CSS 选择器。

### 代码高亮定制

内置的简易语法高亮支持注释、字符串、关键字、函数名、数字和类型的着色。

### 性能优化

模块级正则预编译避免重复创建，\`throttle\` 节流减少高亮计算频率。

### 无障碍支持

所有目录项使用 \`role="button"\` 并绑定 \`aria-current\` 指示当前位置。

### 暗色模式适配

代码高亮颜色在暗色模式下自动切换，确保在任何背景下都可读。
`)

// ==========================================
// DocViewer 演示数据
// ==========================================
const docFiles: Record<string, string> = {
  'index.md': `---
title: 首页
order: 0
---

# 欢迎使用 DocViewer

这是一个文档查看器组件的演示。

## 功能特性

- 📖 文档树导航
- 🔍 文档搜索
- 🎨 主题切换
- 📱 响应式布局
`,
  'guide/getting-started.md': `---
title: 快速开始
order: 1
---

# 快速开始

## 安装

\`\`\`bash
npm install @echolab/ui-frame
\`\`\`

## 使用

\`\`\`typescript
import { DocViewer } from '@echolab/ui-frame/doc'
\`\`\`

## 配置

你可以通过全局配置来修改默认行为。
`,
  'guide/components.md': `---
title: 组件列表
order: 2
---

# 组件列表

## 基础组件

- Button — 按钮
- Input — 输入框
- Select — 选择器

## 布局组件

- Layout — 页面布局
- Grid — 栅格系统
- Container — 容器
`,
  'api/index.md': `---
title: API 文档
order: 3
---

# API 文档

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| root | ProDocNode | 必填 | 文档树根节点 |
| initialPath | string | - | 初始文档路径 |
| className | string | '' | 自定义类名 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| docLink | path: string | 点击文档链接时触发 |
`,
}

const docRoot = ref<ProDocNode>(buildDocTree(docFiles))

// ==========================================
// 编辑演示
// ==========================================
const editorContent = ref(`# 编辑模式演示

这是 \`MarkdownEditor\` 组件的演示。

## 功能

- ✏️ 编辑模式
- ⬌ 分栏模式（编辑 + 预览）
- 👁 预览模式

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + S | 保存 |

试试在编辑区域输入一些 Markdown 内容！
`)

const savedContent = ref('')

function handleSave(path: string, content: string) {
  savedContent.value = `已保存: ${path} (${content.length} 字符)`
  console.log('保存:', path, content)
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="doc-page" :data-theme="isDark ? 'dark' : undefined">
    <NeumorphismLayout show-header show-sider :sider-width="220" collapsible>
      <!-- ===== HEADER ===== -->
      <template #header-left>
        <span class="brand">@echolab/ui-frame</span>
      </template>

      <template #header-right>
        <NeumorphismThemeToggle v-model="themeValue" size="small" />
      </template>

      <!-- ===== SIDER NAVIGATION ===== -->
      <template #sider="{ collapsed }">
        <nav v-if="!collapsed" class="sider-nav" aria-label="文档组件导航">
          <div class="nav-group">
            <span class="nav-group-title">文档组件</span>
            <a
              href="#markdown-renderer"
              class="nav-link"
              @click.prevent="scrollToSection('markdown-renderer')"
            >
              MarkdownRenderer
            </a>
            <a
              href="#markdown-editor"
              class="nav-link"
              @click.prevent="scrollToSection('markdown-editor')"
            >
              MarkdownEditor
            </a>
            <a href="#doc-viewer" class="nav-link" @click.prevent="scrollToSection('doc-viewer')">
              DocViewer
            </a>
            <a href="#doc-editor" class="nav-link" @click.prevent="scrollToSection('doc-editor')">
              DocEditor
            </a>
          </div>
        </nav>
      </template>

      <!-- ===== MAIN CONTENT ===== -->
      <template #default>
        <div class="content-inner">
          <!-- Hero -->
          <section class="hero">
            <h1 class="hero-title">文档组件</h1>
            <p class="hero-desc">
              提供 Markdown 渲染、文档查看器和编辑器组件，基于新拟态设计风格，
              支持代码高亮、目录生成、文档树导航、编辑/预览/分栏模式等丰富功能。
            </p>
          </section>

          <NeumorphismDivider />

          <!-- MarkdownRenderer -->
          <section id="markdown-renderer" class="category-section">
            <h2 class="category-title">MarkdownRenderer</h2>
            <p class="category-desc">
              将 Markdown 字符串渲染为新拟态风格的
              HTML，支持代码高亮、目录生成、任务列表、图片懒加载等。
            </p>

            <NeumorphismCard :elevation="1" class="demo-card demo-card--full demo-card--renderer">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Markdown 渲染演示</h3>
                  <span class="demo-badge">代码高亮 · 目录 · 任务列表 · 目录悬浮</span>
                </div>
              </template>

              <MarkdownRenderer :content="sampleMarkdown" />
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- MarkdownEditor -->
          <section id="markdown-editor" class="category-section">
            <h2 class="category-title">MarkdownEditor</h2>
            <p class="category-desc">
              Markdown 编辑器，支持编辑/预览/分栏三种模式切换，实时字数统计。
            </p>

            <NeumorphismCard :elevation="1" class="demo-card demo-card--full" style="height: 600px">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Markdown 编辑器演示</h3>
                  <span class="demo-badge">编辑 · 预览 · 分栏</span>
                </div>
              </template>

              <MarkdownEditor :value="editorContent" @change="v => (editorContent = v)" />
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- DocViewer -->
          <section id="doc-viewer" class="category-section">
            <h2 class="category-title">DocViewer</h2>
            <p class="category-desc">
              完整的文档浏览界面，包含文档树导航、Markdown 渲染、主题切换等功能。
            </p>

            <NeumorphismCard
              :elevation="1"
              class="demo-card demo-card--full"
              style="height: 600px; padding: 0; overflow: hidden"
            >
              <template #header>
                <div class="demo-header" style="padding: 16px 20px">
                  <h3 class="demo-title">文档查看器演示</h3>
                  <span class="demo-badge">文档树 · 搜索 · 主题切换</span>
                </div>
              </template>

              <DocViewer :root="docRoot" initial-path="guide/getting-started.md" />
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- DocEditor -->
          <section id="doc-editor" class="category-section">
            <h2 class="category-title">DocEditor</h2>
            <p class="category-desc">
              文档编辑器，包含文档树导航和 Markdown 编辑功能，支持未保存检测和 Ctrl+S 快捷键保存。
            </p>

            <NeumorphismCard
              :elevation="1"
              class="demo-card demo-card--full"
              style="height: 600px; padding: 0; overflow: hidden"
            >
              <template #header>
                <div class="demo-header" style="padding: 16px 20px">
                  <h3 class="demo-title">文档编辑器演示</h3>
                  <span class="demo-badge">编辑 · 保存 · 未保存检测</span>
                </div>
              </template>

              <DocEditor :root="docRoot" @save="handleSave" />
            </NeumorphismCard>

            <p v-if="savedContent" class="save-hint">{{ savedContent }}</p>
          </section>

          <!-- Footer -->
          <footer class="doc-footer">
            <NeumorphismDivider />
            <p>@echolab/ui-frame · 文档组件演示</p>
          </footer>
        </div>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped lang="scss">
@use '../../src/styles/variables.scss' as *;
@use '../../src/styles/mixins.scss' as *;

.doc-page {
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow);
}

.brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.sider-nav {
  padding: 12px 10px 24px;
}

.nav-group {
  margin-bottom: 18px;
}

.nav-group-title {
  display: block;
  padding: 8px 10px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--nm-text-placeholder);
}

.nav-link {
  display: block;
  padding: 6px 10px 6px 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);
  margin-bottom: 1px;
  position: relative;
  border-left: 2px solid transparent;

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
  }
}

.content-inner {
  margin: 0 auto;
  padding: 24px 20px 64px;

  @include nm-screen-sm {
    padding: 28px 28px 64px;
  }

  @include nm-screen-lg {
    padding: 36px 40px 72px;
  }

  @media (min-width: 1600px) {
    padding: 40px 56px 80px;
  }
}

.hero {
  padding: 12px 0 24px;

  @include nm-screen-lg {
    padding: 20px 0 28px;
  }
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.5px;

  @include nm-screen-sm {
    font-size: 32px;
  }

  @include nm-screen-lg {
    font-size: 36px;
    letter-spacing: -0.8px;
  }
}

.hero-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
  max-width: 640px;

  @include nm-screen-lg {
    font-size: 15px;
  }
}

.category-section {
  padding: 8px 0 4px;
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  padding-top: 8px;

  @include nm-screen-sm {
    font-size: 22px;
  }
}

.category-desc {
  font-size: 13px;
  color: var(--nm-text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 640px;
}

.demo-card {
  margin-bottom: 20px;
  scroll-margin-top: 80px;

  &:last-child {
    margin-bottom: 0;
  }
}

.demo-card--full {
  @include nm-screen-lg {
    grid-column: 1 / -1;
  }
}

/* MarkdownRenderer 需要 overflow: visible 以支持 sticky TOC */
.demo-card--renderer {
  overflow: visible;
}

.demo-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}

.demo-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;

  @include nm-screen-sm {
    font-size: 16px;
  }
}

.demo-badge {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  white-space: nowrap;
}

.save-hint {
  margin-top: 12px;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--nm-color-success);
  background: color-mix(in srgb, var(--nm-color-success) 8%, transparent);
  border-radius: var(--nm-border-radius-sm);
}

.doc-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  color: var(--nm-text-secondary);
  font-size: 13px;
}
</style>
