---
id: comp-doc
title: 'Doc 文档组件'
x: 1709
y: 1693
group: 使用
---

# Doc 文档组件

> 文档渲染模块——库内**组合组件**的典型代表：由主库基础组件（Layout / Tree / Card / Button / Input / Tag / Canvas 等）与 headless composable 拼装而成，消费 `ProDocNode` 文档树数据契约，交付「文档站点 / 知识库」的完整场景。经子路径 `@echolab-auto/ui-frame/doc` 引入。源码：`src/composites/doc/`。

```ts
import { DocViewer, MarkdownRenderer } from '@echolab-auto/ui-frame/doc'
import type { ProDocNode } from '@echolab-auto/ui-frame/doc'
```

> **依赖**：Markdown 渲染基于 `marked`；XSS 净化可选动态加载 `dompurify`（可选 peer 依赖，未安装时跳过净化）。

---

## 组件分层

模块内部的组件分两层（两类划分见 [组件总览](../components.md#组件分类基础组件与组合组件)）：组合组件消费数据契约、现成可用；元组件是纯 UI 原语，性质上属于基础组件，可脱离本模块自由组装：

```
组合组件（数据驱动，现成可用）
├─ DocViewer          文档查看器：树导航 + 搜索 + Markdown 正文 + 流程画布视图
├─ DocEditor          文档编辑器：DocViewer 骨架 + Markdown 编辑 + 保存事件
├─ MarkdownRenderer   Markdown 渲染器：TOC scroll-spy + 代码高亮 + 内嵌流程图
├─ MarkdownEditor     Markdown 编辑器：工具栏 + 编辑/预览/分栏 + 自动保存
└─ DocFlowCanvas      prodoc-flow 流程图画布：布局渲染 + 节点拖拽

元组件（纯 UI 原语，自由组装）
├─ DocCodeBlock       代码块卡片：高亮 + 行号 + 复制
├─ DocTocNav          目录导航面板：层级折叠 + 激活高亮
└─ TocNodeItem        目录树单项（DocTocNav 的递归子件）

Headless 逻辑（无 UI）
└─ useMarkdownToc / useScrollSpy / useDocLayout
   parser / doc-tree / tree-utils / flow-parser / flow-layout / flow-graph / highlight
```

| 组合组件           | 由哪些基础组件拼成                                                                                                        | 数据契约            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `DocViewer`        | Layout + Tree + Input（搜索）+ ThemeToggle + Button + Tag + Container + Card + Divider + MarkdownRenderer + DocFlowCanvas | `ProDocNode` 文档树 |
| `DocEditor`        | 同 DocViewer 骨架，正文区换为 MarkdownEditor                                                                              | `ProDocNode` 文档树 |
| `MarkdownRenderer` | Card + DocCodeBlock + DocTocNav + DocFlowCanvas（prodoc-flow 块）                                                         | Markdown 字符串     |
| `MarkdownEditor`   | Tabs + Button（工具栏）+ Textarea + MarkdownRenderer（预览）                                                              | Markdown 字符串     |
| `DocFlowCanvas`    | Canvas（缩放/平移）+ SVG 节点与连线                                                                                       | `ProDocFlowGraph`   |

**共同约定**：纯渲染层——不持业务状态、不发网络请求；文档选中、保存、节点移动等意图全部经事件上交宿主（`docLink` / `save` / `nodeMove` / `flowNodeMove`），由宿主持久化。

---

## DocViewer 文档查看器

完整的文档浏览体验：侧边栏文档树（可搜索、可折叠）、Markdown 正文渲染、文档内链接跳转、亮/暗主题切换。

| Props         | 类型         | 默认值 | 说明                 |
| ------------- | ------------ | ------ | -------------------- |
| `root`        | `ProDocNode` | —      | 文档树根节点（必需） |
| `initialPath` | `string`     | —      | 初始选中的文档路径   |
| `className`   | `string`     | `''`   | 自定义样式类名       |

| Events    | 参数           | 说明                                 |
| --------- | -------------- | ------------------------------------ |
| `docLink` | `path: string` | 文档内链接点击（宿主可做路由同步等） |

**亮点**：

- **双视图**：📄 文档 / 🗺 画布切换。画布视图把当前文档的 prodoc-flow 流程图（无流程时回退为子文档层级地图）渲染为可交互节点图，点击节点逐级钻取（抽象 → 具体），无子内容的终点自动落回正文视图
- 树导航由 headless `useDocLayout` 驱动（DocViewer / DocEditor 共享），支持搜索过滤
- 正文 `docLink` 链接在树 key 上做多级归一匹配，命中后选中对应节点

```vue
<script setup lang="ts">
import { DocViewer, buildDocTree } from '@echolab-auto/ui-frame/doc'

// buildDocTree 接收「路径 → Markdown 原文」表，返回虚拟根节点
const root = buildDocTree({
  'guide.md': '# 指南\n\n欢迎使用……',
  'api.md': '# API\n\n……',
})
</script>

<template>
  <DocViewer :root="root" initial-path="guide.md" @doc-link="p => console.log(p)" />
</template>
```

---

## DocEditor 文档编辑器

在 DocViewer 同款骨架上把正文区换成 MarkdownEditor，增加保存能力。

| Props / Events | 说明                                                             |
| -------------- | ---------------------------------------------------------------- |
| Props          | 同 DocViewer（`root` / `initialPath` / `className`）             |
| `save`         | `(path: string, content: string)` — 保存当前文档，由宿主写回存储 |
| `docLink`      | `(path: string)` — 文档内链接点击                                |

**亮点**：

- **编辑缓存 LRU**：各文档的未保存改动按 path 缓存（上限 50 篇，超出淘汰最久未访问），切换文档不丢草稿
- 未保存文档在顶栏显示「未保存」Tag；`Ctrl/Cmd + S` 快捷保存
- 保存按钮在有改动时才可用

---

## MarkdownRenderer 渲染器

Markdown 正文的渲染核心，DocViewer / DocEditor / MarkdownEditor 的预览区都复用它，也可单独使用（如渲染 Agent 回复）。

| Props             | 类型                    | 默认值  | 说明                                                      |
| ----------------- | ----------------------- | ------- | --------------------------------------------------------- |
| `content`         | `string`                | —       | Markdown 内容（必需）                                     |
| `className`       | `string`                | `''`    | 自定义样式类名                                            |
| `showToc`         | `boolean`               | `true`  | 是否显示右侧目录（TOC）                                   |
| `scrollContainer` | `HTMLElement \| string` | —       | 滚动容器；不传则自动向上查找 `.nm-layout__content`        |
| `flowEditable`    | `boolean`               | `false` | prodoc-flow 画布节点可拖拽编辑（松手触发 `flowNodeMove`） |

| Events         | 参数                               | 说明                                                    |
| -------------- | ---------------------------------- | ------------------------------------------------------- |
| `docLink`      | `path: string`                     | 相对链接点击（文档内跳转，宿主负责选中目标文档）        |
| `flowNodeMove` | `{ id, x, y, source, blockIndex }` | 流程图节点拖拽松手；`source` 为该块源码，供宿主定位写回 |

**亮点**：

- **目录 scroll-spy**：`useMarkdownToc` 提取标题树 + `useScrollSpy`（IntersectionObserver）跟踪激活标题，点击平滑滚动并高亮锁定 800ms 防闪烁；遵循 prefers-reduced-motion
- **代码块**：`DocCodeBlock` 挂载渲染，自研 `highlightCode` 正则高亮（零依赖）、行号、一键复制
- **内嵌流程图**：` ```prodoc-flow ` 代码块解析为 `ProDocFlowGraph`，由 `DocFlowCanvas` 渲染成可交互画布；节点可声明文档链接，点击触发 `docLink` 跳转
- **安全**：marked 输出可经 DOMPurify（可选 peer 依赖，动态加载）净化；链接白名单过滤
- 移动端 TOC 折叠为浮层

---

## MarkdownEditor 编辑器

| Props              | 类型      | 默认值  | 说明                  |
| ------------------ | --------- | ------- | --------------------- |
| `value`            | `string`  | —       | Markdown 内容（必需） |
| `className`        | `string`  | `''`    | 自定义样式类名        |
| `autoSave`         | `boolean` | `false` | 启用自动保存          |
| `autoSaveInterval` | `number`  | `30000` | 自动保存间隔（毫秒）  |

| Events    | 参数            | 说明                               |
| --------- | --------------- | ---------------------------------- |
| `change`  | `value: string` | 内容变化（自动保存也经此事件发出） |
| `docLink` | `path: string`  | 预览区文档内链接点击               |

**亮点**：

- **三种模式**：✏️ 编辑 / ⬌ 分栏 / 👁 预览，分栏模式左右同步滚动
- **格式化工具栏**：在光标处插入标题、加粗、斜体、代码块、链接、列表等 Markdown 语法
- 状态栏显示字数 / 行数统计

---

## DocFlowCanvas 流程图画布

把解析后的 prodoc-flow 图渲染为可缩放/平移的交互画布（内嵌 `NeumorphismCanvas`）。

| Props      | 类型              | 默认值    | 说明                                  |
| ---------- | ----------------- | --------- | ------------------------------------- |
| `graph`    | `ProDocFlowGraph` | —         | 已解析的流程图（解析职责在调用方）    |
| `height`   | `string`          | `'480px'` | 画布高度（CSS 值）                    |
| `showGrid` | `boolean`         | `true`    | 是否显示点阵网格                      |
| `editable` | `boolean`         | `false`   | 节点可拖拽编辑（松手触发 `nodeMove`） |

| Events     | 参数           | 说明                            |
| ---------- | -------------- | ------------------------------- |
| `navigate` | `path: string` | 点击带文档链接的节点            |
| `nodeMove` | `{ id, x, y }` | 拖拽松手：节点新坐标（画布 px） |

**亮点**：

- 布局由 `layoutProDocFlow` 计算（分层布局），拖拽预览实时重排（O(V+E)，边自动跟随）
- 箭头 marker id 实例级唯一，多画布共存互不干扰
- 画布自身具备缩放（Ctrl/Cmd + 滚轮）、平移（空格 + 拖拽）、一键适配与全屏能力（继承自 NeumorphismCanvas）

---

## 元组件

| 组件           | 职责           | 关键 props / 接口                                                                                      |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `DocCodeBlock` | 代码块卡片     | `code`、`lang`（text/plain 不高亮）、`showLineNumbers`；一键复制（`useClipboard`）                     |
| `DocTocNav`    | 目录导航面板   | `items`（`TocNode[]`）、`activeId`、`title`、`framed`；`select(id)` 事件；expose `scrollTocToActive()` |
| `TocNodeItem`  | 目录树递归子件 | 一般经 DocTocNav 间接使用                                                                              |

元组件不依赖 `ProDocNode` 数据契约，可脱离查看器自由组装——例如用 `useMarkdownToc` + `useScrollSpy` + `DocTocNav` 给任意长文页面加目录导航：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocTocNav, useMarkdownToc, useScrollSpy } from '@echolab-auto/ui-frame/doc'

const contentRef = ref<HTMLElement | null>(null)
const { tocTree } = useMarkdownToc(markdown)
const { activeHeading, scrollToHeading } = useScrollSpy({ content: contentRef })
</script>

<template>
  <div ref="contentRef" v-html="html" />
  <DocTocNav :items="tocTree" :active-id="activeHeading" @select="scrollToHeading" />
</template>
```

---

## 侧边栏文档树：渲染规则与排版逻辑

DocViewer / DocEditor 的侧边栏文档树由 `buildDocTree`（建树）→ `nodeToTreeData`（节点转换）→ `useDocLayout`（选中/搜索/布局状态）三级流水线驱动，规则全部内置，无需配置。

### 树构建规则（buildDocTree）

输入「路径 → Markdown 原文」表，输出虚拟根节点：

- **过滤**：仅 `.md` 结尾的路径成为节点，其余忽略
- **父子推导**：`guide/getting-started.md` 的父节点依次尝试 ① 上级目录的 `guide/index.md` → ② 上级文件 `guide.md` → ③ 都缺失则挂到根节点下
- **排序**：frontmatter `order`（数值，缺省 `9999`）升序；`order` 相同按 `title` 字典序（`localeCompare`）
- **虚拟根**：返回的 root（`id: 'root'`、`path: ''`）自身不渲染，侧边栏数据 = `root.children`

### 节点渲染规则（nodeToTreeData / getNodeIcon）

| 属性    | 取值规则                                                              |
| ------- | --------------------------------------------------------------------- |
| `key`   | 节点 `path`（选中态、URL hash 均以此为准）                            |
| `label` | 节点 `title`（frontmatter `title`，缺省取首个一级标题）               |
| `icon`  | 有子节点固定为 📁；叶子按路径关键词匹配（小写、首个命中生效，见下表） |

| 路径包含  | 图标 | 路径包含    | 图标 |
| --------- | ---- | ----------- | ---- |
| `api`     | 🔌   | `install`   | 📦   |
| `guide`   | 📖   | `changelog` | 📝   |
| `config`  | ⚙️   | `faq`       | ❓   |
| `example` | 💡   | 兜底        | 📄   |

### 选中与展开（useDocLayout）

- **初始选中优先级**：`initialPath` prop → URL hash → 第一个子节点
- **选中落空回退**：路径找不到节点时，正文回退显示第一个子节点（不会白屏）
- **展开状态**：`expandedKeys` 默认为 `[]`（初始全部收起），经 `v-model:expanded-keys` 由 NeumorphismTree 双向维护
- **URL hash 同步**：选中变化经 `history.replaceState` 写入 `#path`；监听 `hashchange` 支持浏览器前进/后退；`syncUrlHash: false` 可关闭（SSR 下自动禁用）
- **搜索**：顶栏搜索框全局匹配**标题 + 正文**（小写包含），跳过根节点，最多返回 10 条，选中后清空查询；侧边栏树另有 NeumorphismTree 内置 `show-search` 按标题过滤

### 排版逻辑

```
NeumorphismLayout（show-header show-sider，sider-width 280，collapsible）
├─ header-left    📚 品牌文案
├─ header-right   视图切换（📄 文档 / 🗺 画布）→ 全局搜索框（结果下拉：标题 + 路径）→ ThemeToggle
├─ sider          NeumorphismTree（v-model 选中/展开，show-search）；
│                 折叠态仅显示 📚 占位；移动端断点下 Layout 自动折叠
└─ 内容区          NeumorphismContainer(no-padding)
                  └─ NeumorphismCard(elevation -3，凹陷井)
                     ├─ 文档头：H1 标题 + path Tag + 「📁 N 个子项」Tag
                     ├─ NeumorphismDivider
                     └─ MarkdownRenderer（文档切换带 out-in 过渡）
```

DocEditor 复用同一排版骨架，差异仅在：header 右侧为「未保存 Tag + 保存按钮」，正文区为 MarkdownEditor。

---

## 数据契约

组合组件消费的文档节点由工具函数从 Markdown 源构建：

```ts
interface ProDocNode {
  id: string // pathToId(path) 生成
  title: string // frontmatter title 或首个一级标题
  path: string // 文档路径（树 key）
  content: string // 完整 Markdown 原文
  body: string // 剥离 frontmatter 后的正文
  meta: Record<string, unknown> // frontmatter 参数区
  children: ProDocNode[]
  order: number
}
```

| 构建函数                          | 说明                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `createNode`                      | `(path, content) => ProDocNode` 单节点                                       |
| `buildDocTree`                    | `(files: Record<string, string>) => ProDocNode` 由路径层级自动建树（虚拟根） |
| `createDocTree`                   | `(root) => DocTree` 已有根节点时包装                                         |
| `flattenDocTree` / `getAncestors` | 树遍历工具                                                                   |

frontmatter 参数区（`id` / `title` / `x` / `y` / `group` / `link`）即本项目 `document/` 目录采用的 ProDoc 格式——本组件群正是渲染这套文档群的运行时。

---

## 深入

- [组件总览](../components.md) — 基础组件 / 组合组件分层定义与全组件分类目录
- [API 参考](../api.md#doc-文档渲染) — 完整 Props/Events/工具函数签名（含 useDocLayout / flow-parser 等）
- [文档规范](../../develop/documentation-guide.md) — ProDoc 参数区规范（文档群格式）
