# 用户指南

> 面向使用 `@echolab/ui-frame` 构建应用的用户，以教程和最佳实践为主。

---

## 目录

- [快速开始](#快速开始)
- [主题配置](#主题配置)
- [全局配置](#全局配置)
- [响应式布局](#响应式布局)
- [表单验证](#表单验证)
- [自定义主题](#自定义主题)
- [Headless Composables 使用](#headless-composables-使用)
- [Doc 文档渲染](#doc-文档渲染)
- [子路径导出](#子路径导出)
- [扩展组件](#扩展组件)
- [国际化](#国际化)
- [弹出层与下拉菜单](#弹出层与下拉菜单)
- [提示与空状态](#提示与空状态)
- [文件上传](#文件上传)
- [导航模式](#导航模式)
- [步骤流程](#步骤流程)
- [最佳实践](#最佳实践)

---

## 快速开始

### 安装

```bash
npm install @echolab/ui-frame
```

### 全量引入

最简单的方式，所有组件全局注册：

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

如果你只使用部分组件，可以按需引入以减少打包体积：

```vue
<script setup>
import { NeumorphismButton, NeumorphismCard } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismCard :elevation="2">
    <NeumorphismButton variant="raised" size="medium">点击我</NeumorphismButton>
  </NeumorphismCard>
</template>
```

---

## 主题配置

### 使用 ThemeProvider

在应用根组件包裹 `ThemeProvider`，管理全局主题状态：

```vue
<template>
  <ThemeProvider default-theme="auto" storage-key="app-theme">
    <App />
  </ThemeProvider>
</template>
```

### 在任意组件中切换主题

```vue
<script setup>
import { useTheme } from '@echolab/ui-frame'

const { isDark, toggleTheme, setTheme } = useTheme()
</script>

<template>
  <div>
    <NeumorphismButton @click="toggleTheme">
      {{ isDark ? '切换到亮色' : '切换到暗色' }}
    </NeumorphismButton>
    <NeumorphismButton @click="setTheme('light')">强制亮色</NeumorphismButton>
  </div>
</template>
```

### 使用 ThemeToggle 组件

```vue
<script setup>
import { ref } from 'vue'

const theme = ref('auto')
</script>

<template>
  <NeumorphismThemeToggle v-model="theme" />
</template>
```

---

## 全局配置

通过 `app.use` 一次性配置所有组件的默认行为：

```ts
app.use(NeumorphismUI, {
  // 按钮默认中等尺寸
  button: { size: 'medium' },
  // 输入框默认中等尺寸
  input: { size: 'medium' },
  // 选择器默认中等尺寸且可清空
  select: { size: 'medium', clearable: true },
  // 模态框默认点击遮罩可关闭
  modal: { maskClosable: true },
  // Toast 默认右上角、最多 5 条
  toast: { position: 'top-right', maxCount: 5 },
  // 分页默认不显示总数
  pagination: { showTotal: false },
})
```

**配置优先级**：显式传入的 prop > 全局配置 > 组件硬编码默认值。

---

## 响应式布局

### 使用 Container + Row + Col

```vue
<template>
  <NeumorphismContainer>
    <NeumorphismRow :gutter="16">
      <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
        <NeumorphismCard :elevation="1">卡片 1</NeumorphismCard>
      </NeumorphismCol>
      <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
        <NeumorphismCard :elevation="1">卡片 2</NeumorphismCard>
      </NeumorphismCol>
      <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
        <NeumorphismCard :elevation="1">卡片 3</NeumorphismCard>
      </NeumorphismCol>
      <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
        <NeumorphismCard :elevation="1">卡片 4</NeumorphismCard>
      </NeumorphismCol>
    </NeumorphismRow>
  </NeumorphismContainer>
</template>
```

### 经典后台布局

```vue
<template>
  <NeumorphismLayout show-header show-sider show-footer :sider-width="240" collapsible>
    <template #header-left>
      <strong>My App</strong>
    </template>

    <template #header-right>
      <NeumorphismAvatar initials="U" size="small" />
    </template>

    <template #sider="{ collapsed }">
      <nav v-if="!collapsed">
        <a href="#">首页</a>
        <a href="#">用户</a>
        <a href="#">设置</a>
      </nav>
    </template>

    <template #default>
      <h1>页面内容</h1>
      <p>主内容区域</p>
    </template>

    <template #footer>
      <span>© 2024 My App</span>
    </template>
  </NeumorphismLayout>
</template>
```

---

## 表单验证

### 基本表单

```vue
<script setup>
import { ref } from 'vue'

const formModel = ref({
  username: '',
  email: '',
  password: '',
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '至少 3 个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '至少 6 个字符' },
  ],
}

function handleSubmit(model) {
  console.log('表单提交:', model)
}
</script>

<template>
  <NeumorphismForm :model="formModel" :rules="formRules" @submit="handleSubmit">
    <NeumorphismFormItem label="用户名" name="username" :required="true">
      <NeumorphismInput v-model="formModel.username" placeholder="请输入用户名" />
    </NeumorphismFormItem>

    <NeumorphismFormItem label="邮箱" name="email">
      <NeumorphismInput v-model="formModel.email" placeholder="例如 user@example.com" />
    </NeumorphismFormItem>

    <NeumorphismFormItem label="密码" name="password">
      <NeumorphismInput v-model="formModel.password" type="password" placeholder="至少 6 个字符" />
    </NeumorphismFormItem>

    <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
  </NeumorphismForm>
</template>
```

### 自定义校验器

```ts
const formRules = {
  age: [
    {
      validator: value => Number(value) >= 18,
      message: '年龄必须大于等于 18 岁',
    },
  ],
}
```

---

## 自定义主题

覆盖 CSS 自定义属性即可自定义主题，无需修改组件源码：

```css
/* 全局覆盖 */
:root {
  --nm-primary-color: #ff6b6b;
  --nm-border-radius-md: 20px;
  --nm-button-padding-y-md: 16px;
}

/* 暗色主题覆盖 */
[data-theme='dark'] {
  --nm-primary-color: #ff8585;
  --nm-bg-color: #121212;
}
```

### 常用 Token

| Token                   | 说明     | 默认值（亮色） |
| ----------------------- | -------- | -------------- |
| `--nm-bg-color`         | 背景色   | `#e0e0e0`      |
| `--nm-primary-color`    | 主色     | `#6c7ae0`      |
| `--nm-border-radius-md` | 中等圆角 | `16px`         |
| `--nm-transition-fast`  | 快速过渡 | `0.2s ease`    |

完整 Token 列表请参考 [API 文档 - 主题系统](api.md#主题系统)。

---

## Headless Composables 使用

Headless Composables 让你可以用自己的 UI 渲染组件，同时复用完整的业务逻辑。

### 自定义 Select

```vue
<script setup>
import { ref, computed } from 'vue'
import { useSelect } from '@echolab/ui-frame'

const myValue = ref('vue')
const myOptions = computed(() => [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular', value: 'angular' },
])

const { isOpen, selectedOption, toggleOpen, selectOption, handleKeydown } = useSelect({
  modelValue: myValue,
  options: myOptions,
})
</script>

<template>
  <div class="my-custom-select" @click="toggleOpen" @keydown="handleKeydown" tabindex="0">
    <span>{{ selectedOption?.label || '请选择...' }}</span>
    <span v-if="isOpen">▲</span>
    <span v-else>▼</span>

    <div v-if="isOpen" class="my-dropdown">
      <div v-for="opt in myOptions" :key="opt.value" @click.stop="selectOption(opt)">
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-custom-select {
  /* 完全自定义的样式 */
  border: 2px solid var(--nm-primary-color);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.my-dropdown {
  position: absolute;
  background: var(--nm-bg-color);
  border: 2px solid var(--nm-primary-color);
}
</style>
```

### 自定义 Pagination

```vue
<script setup>
import { ref, computed } from 'vue'
import { usePagination } from '@echolab/ui-frame'

const page = ref(1)

const {
  totalPages,
  currentPage,
  visiblePages,
  changePage,
  prevPage,
  nextPage,
  isPrevDisabled,
  isNextDisabled,
} = usePagination({
  modelValue: page,
  total: computed(() => 100),
  pageSize: computed(() => 10),
})
</script>

<template>
  <div class="my-pagination">
    <button :disabled="isPrevDisabled" @click="prevPage">←</button>
    <button
      v-for="p in visiblePages"
      :key="String(p)"
      :class="{ active: p === currentPage }"
      :disabled="typeof p === 'string'"
      @click="typeof p === 'number' && changePage(p)"
    >
      {{ typeof p === 'string' ? '…' : p }}
    </button>
    <button :disabled="isNextDisabled" @click="nextPage">→</button>
  </div>
</template>
```

---

## 扩展组件

### 覆盖默认组件

```ts
import { defineComponent, h } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'

// 自定义按钮组件
const MyCustomButton = defineComponent({
  props: ['variant', 'size'],
  setup(props, { slots }) {
    return () => h('button', { class: `my-btn my-btn--${props.size}` }, slots.default?.())
  },
})

const app = createApp(App)
app.use(NeumorphismUI, {
  components: {
    NeumorphismButton: MyCustomButton,
  },
})
```

### 添加组件前缀

```ts
app.use(NeumorphismUI, {
  prefix: 'Nm',
  // 注册后组件名为 NmNeumorphismButton
})
```

---

## 国际化

### 切换语言

```vue
<script setup>
import { useLocale, provideLocale } from '@echolab/ui-frame'

// 在根组件中设置默认语言
provideLocale('zh-CN')
</script>
```

```vue
<script setup>
import { useLocale } from '@echolab/ui-frame'

const { t, locale, setLocale } = useLocale()

function switchLanguage() {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}
</script>

<template>
  <div>
    <p>{{ t('buttonLoading') }}</p>
    <NeumorphismButton @click="switchLanguage">
      {{ locale === 'zh-CN' ? 'English' : '中文' }}
    </NeumorphismButton>
  </div>
</template>
```

**可用语言：**

| 语言代码 | 语言     |
| -------- | -------- |
| `zh-CN`  | 简体中文 |
| `en-US`  | 英文     |

---

## 弹出层与下拉菜单

### Popover

`NeumorphismPopover` 是一个通用的弹出层容器，支持 hover / click / focus 等多种触发方式，并自动检测边界避免溢出。

```vue
<template>
  <NeumorphismPopover position="bottom" trigger="click">
    <NeumorphismButton>点击打开</NeumorphismButton>

    <template #content>
      <div style="padding: 12px">
        <p>这是弹出的内容</p>
        <NeumorphismButton size="small">确认</NeumorphismButton>
      </div>
    </template>
  </NeumorphismPopover>
</template>
```

**常用场景：**

| 场景     | 推荐配置                                    |
| -------- | ------------------------------------------- |
| 文字提示 | `position="auto" trigger="hover"`           |
| 操作菜单 | `position="bottom" trigger="click"`         |
| 表单帮助 | `position="right" trigger="focus"`          |
| 完全手动 | `trigger="manual"` + 调用 `show()`/`hide()` |

### Dropdown

`NeumorphismDropdown` 基于 Popover 封装，专用于下拉菜单场景：

```vue
<script setup>
const items = [
  { key: 'edit', label: '编辑', icon: '✏️' },
  { key: 'share', label: '分享', icon: '🔗', divided: true },
  { key: 'delete', label: '删除', icon: '🗑', danger: true, disabled: false },
]
</script>

<template>
  <NeumorphismDropdown :items="items" @select="handleAction">
    <NeumorphismButton>操作 ▼</NeumorphismButton>
  </NeumorphismDropdown>
</template>
```

---

## 提示与空状态

### Alert 提示条

有四种语义类型：`info`、`success`、`warning`、`error`。支持自动关闭和手动关闭。

```vue
<template>
  <NeumorphismAlert
    type="success"
    title="操作成功"
    message="您的更改已保存"
    :duration="5000"
    @close="handleClose"
  />

  <NeumorphismAlert type="error" message="提交失败，请检查网络后重试" />
</template>
```

**Alert 模式：**

- **持久提示**：`duration="0"`（默认），用户手动关闭
- **自动消失**：设置 `duration`（毫秒），到期自动淡出
- **无图标**：`:icon="false"`
- **无边框色条**：`:bordered="false"`

### Empty 空状态

```vue
<template>
  <NeumorphismEmpty description="暂无数据">
    <NeumorphismButton variant="flat">刷新</NeumorphismButton>
  </NeumorphismEmpty>
</template>
```

---

## 文件上传

`NeumorphismUpload` 支持拖拽上传、文件列表展示、图片预览：

```vue
<script setup>
import { ref } from 'vue'

const fileList = ref([])

function handleChange(files) {
  console.log('文件列表变更:', files)
}
function handleRemove(file) {
  console.log('移除文件:', file.name)
}
</script>

<template>
  <!-- 拖拽上传区域 -->
  <NeumorphismUpload
    v-model="fileList"
    accept="image/*,.pdf"
    :max-size="5 * 1024 * 1024"
    :max-count="5"
    multiple
    list-type="picture"
    @change="handleChange"
    @remove="handleRemove"
  />

  <!-- 仅按钮触发 -->
  <NeumorphismUpload v-model="fileList" :drag="false" />
</template>
```

**三种列表展示样式：**

| listType         | 说明                     |
| ---------------- | ------------------------ |
| `'text'`         | 文本行，显示文件名和大小 |
| `'picture'`      | 显示缩略图 + 文件信息    |
| `'picture-card'` | 卡片式缩略图网格         |

---

## 导航模式

### 使用 Menu 构建侧边菜单

```vue
<script setup>
const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  {
    key: 'settings',
    label: '设置',
    icon: '⚙️',
    children: [
      { key: 'profile', label: '个人资料' },
      { key: 'security', label: '安全设置' },
    ],
  },
  { key: 'help', label: '帮助', icon: '❓', divided: true },
]
</script>

<template>
  <NeumorphismMenu
    :items="menuItems"
    mode="vertical"
    default-active="dashboard"
    @select="handleMenuSelect"
  />
</template>
```

### 使用 NavMenu 构建顶部导航

```vue
<template>
  <NeumorphismNavMenu
    :items="navItems"
    mode="horizontal"
    show-indicator
    @select="handleNavSelect"
  />
</template>
```

NavMenu 在 `horizontal` 模式下，子菜单以 Popover 下拉形式展开；`vertical` 模式下以内联展开子菜单。

### 使用 Drawer 构建侧边抽屉

```vue
<script setup>
const visible = ref(false)
</script>

<template>
  <NeumorphismButton @click="visible = true">打开抽屉</NeumorphismButton>

  <NeumorphismDrawer v-model="visible" title="用户设置" position="right" :width="400">
    <p>抽屉内容...</p>

    <template #footer>
      <NeumorphismButton variant="flat" @click="visible = false">取消</NeumorphismButton>
      <NeumorphismButton @click="saveSettings">保存</NeumorphismButton>
    </template>
  </NeumorphismDrawer>
</template>
```

Drawer 支持四个方向 (`left` / `right` / `top` / `bottom`)，具备焦点锁定和 Escape 关闭。

---

## 步骤流程

```vue
<script setup>
const current = ref(0)

const steps = [
  { key: 'info', title: '填写信息', description: '输入基本信息' },
  { key: 'verify', title: '验证身份', description: '通过邮箱验证' },
  { key: 'done', title: '完成', description: '提交注册' },
]
</script>

<template>
  <NeumorphismSteps :steps="steps" v-model:current="current" />

  <NeumorphismButton @click="current--" :disabled="current === 0">上一步</NeumorphismButton>
  <NeumorphismButton @click="current++" :disabled="current === steps.length - 1"
    >下一步</NeumorphismButton
  >
</template>
```

---

## 最佳实践

### 1. 优先使用全局配置

不要在每个组件上重复传入相同的 props，通过全局配置统一管理：

```ts
// ✅ 推荐
app.use(NeumorphismUI, {
  button: { size: 'medium' },
  input: { size: 'medium' },
})

// ❌ 避免
<NeumorphismButton size="medium" />
<NeumorphismInput size="medium" />
```

### 2. 利用台阶高度模型

Card 的 `elevation` 是正数凸起、负数凹陷，合理搭配可以营造层次：

```vue
<!-- 页面背景层：平齐或轻微凹陷 -->
<NeumorphismCard :elevation="-1">
  <!-- 内容卡片：凸起 -->
  <NeumorphismCard :elevation="2" hoverable="bulge">
    内容
  </NeumorphismCard>
</NeumorphismCard>
```

### 3. 使用 Headless Composables 构建自定义组件

当默认组件的视觉风格不满足需求时，使用 Headless Composables 复用行为逻辑，自定义 UI：

```ts
// 复用 useSelect 的键盘导航和 ARIA 逻辑
const { isOpen, selectedOption, toggleOpen, selectOption, handleKeydown } = useSelect({...})
```

### 4. 响应式断点使用

在组件样式中使用本库提供的 SCSS mixins：

```scss
@use '@echolab/ui-frame/src/styles/mixins.scss' as *;

.my-component {
  padding: 16px;

  @include nm-screen-md {
    padding: 24px;
  }

  @include nm-screen-lg {
    padding: 32px;
  }
}
```

### 5. 触屏设备适配

利用 `useTouchDevice` 检测设备类型，调整交互：

```vue
<script setup>
import { useTouchDevice } from '@echolab/ui-frame'

const { isTouch } = useTouchDevice()
</script>

<template>
  <NeumorphismButton :size="isTouch ? 'large' : 'medium'"> 提交 </NeumorphismButton>
</template>
```

### 6. 尊重用户动画偏好

```scss
@use '@echolab/ui-frame/src/styles/mixins.scss' as *;

.my-animated-element {
  transition: transform 0.3s ease;

  @include nm-reduced-motion {
    transition: none;
  }
}
```

### 7. 表单验证最佳实践

- 在 `FormItem` 上设置 `:required="true"` 以显示必填标记
- 在 `Form` 上统一配置 `rules`，在 `FormItem` 上可覆盖特定字段规则
- 使用 `Form` 的 `@submit` 事件处理提交，而非按钮的 `@click`

```vue
<NeumorphismForm :model="model" :rules="rules" @submit="handleSubmit">
  <NeumorphismFormItem label="用户名" name="username" :required="true">
    <NeumorphismInput v-model="model.username" />
  </NeumorphismFormItem>
  <NeumorphismButton type="submit">提交</NeumorphismButton>
</NeumorphismForm>
```

---

## Doc 文档渲染

文档渲染模块提供一套完整的文档站点构建能力，包括 Markdown 渲染、文档树导航和编辑器。

### 基础文档查看器

```vue
<script setup>
import { DocViewer } from '@echolab/ui-frame/doc'
import '@echolab/ui-frame/dist/style.css'

const docRoot = {
  id: 'root',
  title: '文档中心',
  path: '/',
  content: '',
  body: '',
  meta: {},
  order: 0,
  children: [
    {
      id: 'guide',
      title: '快速开始',
      path: '/guide',
      content: '# 快速开始\n\n欢迎使用...',
      body: '# 快速开始\n\n欢迎使用...',
      meta: {},
      order: 1,
      children: [],
    },
    {
      id: 'api',
      title: 'API 参考',
      path: '/api',
      content: '# API 参考\n\n## 组件...',
      body: '# API 参考\n\n## 组件...',
      meta: {},
      order: 2,
      children: [],
    },
  ],
}
</script>

<template>
  <DocViewer :root="docRoot" initial-path="/guide" />
</template>
```

### Markdown 渲染组件

```vue
<script setup>
import { MarkdownRenderer } from '@echolab/ui-frame/doc'

const content = `# 标题

这是一段 **加粗** 的文字。

\`\`\`ts
const hello = 'world'
\`\`\`
`
</script>

<template>
  <MarkdownRenderer :content="content" />
</template>
```

### Markdown 编辑器

```vue
<script setup>
import { ref } from 'vue'
import { MarkdownEditor } from '@echolab/ui-frame/doc'

const value = ref('# 编辑中\n\n在这里输入 Markdown...')
</script>

<template>
  <MarkdownEditor v-model="value" @change="v => (value = v)" />
</template>
```

### 从文件构建文档树

```vue
<script setup>
import { DocViewer, parseFrontmatter, buildDocTree } from '@echolab/ui-frame/doc'
import { ref, onMounted } from 'vue'

const docRoot = ref(null)

onMounted(async () => {
  // 假设通过 import.meta.glob 获取所有 markdown 文件
  const modules = import.meta.glob('/docs/**/*.md', { as: 'raw' })
  const nodes = []

  for (const [path, loader] of Object.entries(modules)) {
    const content = await loader()
    const { meta, body } = parseFrontmatter(content)
    nodes.push({
      id: path,
      title: meta.title || extractTitle(content),
      path,
      content,
      body,
      meta,
      order: meta.order || 0,
      children: [],
    })
  }

  const tree = buildDocTree(nodes)
  docRoot.value = tree.root
})
</script>

<template>
  <DocViewer v-if="docRoot" :root="docRoot" />
</template>
```

---

## 子路径导出

为了进一步减少打包体积，可以使用子路径按需引入：

### 按需引入 composables

```ts
// 只引入需要的 composable，不引入全部组件
import { useSelect } from '@echolab/ui-frame/composables/useSelect'
import { useTheme } from '@echolab/ui-frame/composables/useTheme'
```

### 按需引入工具函数

```ts
import { debounce } from '@echolab/ui-frame/utils'
import { generateId } from '@echolab/ui-frame/utils'
```

### 按需引入扩展系统

```ts
import { ComponentRegistry } from '@echolab/ui-frame/extensions'
```

### 按需引入文档渲染

```ts
import { MarkdownRenderer } from '@echolab/ui-frame/doc'
```

> 使用子路径导出时，样式文件仍需全局引入一次：
> `import '@echolab/ui-frame/dist/style.css'`
