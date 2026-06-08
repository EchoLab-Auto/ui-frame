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
- [扩展组件](#扩展组件)
- [国际化](#国际化)
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
