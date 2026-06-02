# 使用文档

## 使用方式

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
import { NeumorphismButton, NeumorphismCard } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismCard variant="raised">
    <NeumorphismButton variant="raised" size="medium">
      点击我
    </NeumorphismButton>
  </NeumorphismCard>
</template>
```

## 组件文档

### NeumorphismButton

带有柔和凸起或凹陷阴影效果的按钮。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | `'raised' \| 'flat' \| 'pressed'` | `'raised'` | 阴影变体 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 按钮尺寸 |
| shape | `'rounded' \| 'pill' \| 'circle'` | `'rounded'` | 按钮形状 |
| disabled | `boolean` | `false` | 是否禁用 |
| loading | `boolean` | `false` | 是否加载中 |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | 原生按钮类型 |

```vue
<NeumorphismButton
  variant="raised"
  size="medium"
  shape="rounded"
  @click="handleClick"
>
  按钮文字
</NeumorphismButton>
```

### NeumorphismSwitch

带有太阳/月亮图标的主题切换开关。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `boolean` | `false` | 绑定值 |
| disabled | `boolean` | `false` | 是否禁用 |
| activeText | `string` | — | 开启状态文本 |
| inactiveText | `string` | — | 关闭状态文本 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 开关尺寸 |

```vue
<script setup>
import { ref } from 'vue'
const isDark = ref(false)
</script>

<template>
  <NeumorphismSwitch
    v-model="isDark"
    active-text="暗色"
    inactive-text="亮色"
    size="medium"
  />
</template>
```

### NeumorphismCard

带有凸起或凹陷阴影深度层级的容器。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | `'raised' \| 'pressed'` | `'raised'` | 阴影变体 |
| depth | `'shallow' \| 'medium' \| 'deep' \| 'very-deep'` | `'medium'` | 凹陷深度（仅 pressed 有效） |
| radius | `'small' \| 'medium' \| 'large' \| 'xl'` | `'large'` | 圆角大小 |
| hoverable | `boolean` | `false` | 是否启用悬停上浮效果 |
| noPadding | `boolean` | `false` | 是否移除内边距 |

```vue
<NeumorphismCard
  variant="raised"
  depth="medium"
  radius="large"
  :hoverable="true"
>
  <template #header>
    卡片头部
  </template>

  卡片内容...

  <template #footer>
    卡片底部
  </template>
</NeumorphismCard>
```

### NeumorphismInput

带有柔和凹陷阴影效果的输入框。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `string` | `''` | 绑定值 |
| type | `string` | `'text'` | 输入类型 |
| placeholder | `string` | — | 占位符 |
| disabled | `boolean` | `false` | 是否禁用 |
| readonly | `boolean` | `false` | 是否只读 |
| required | `boolean` | `false` | 是否必填 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 输入框尺寸 |
| label | `string` | — | 标签文字 |
| error | `string \| boolean` | — | 错误信息或状态 |

```vue
<script setup>
import { ref } from 'vue'
const value = ref('')
</script>

<template>
  <NeumorphismInput
    v-model="value"
    label="用户名"
    placeholder="请输入用户名"
    size="medium"
    :required="true"
    @enter="handleSubmit"
  >
    <template #prefix>
      <UserIcon />
    </template>
  </NeumorphismInput>
</template>
```

### ThemeProvider

管理应用全局的亮色/暗色主题状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultTheme | `'light' \| 'dark' \| 'auto'` | `'auto'` | 默认主题 |
| storageKey | `string` | `'nm-theme-preference'` | localStorage 存储键 |
| followSystem | `boolean` | `true` | 是否跟随系统偏好 |

```vue
<template>
  <ThemeProvider
    default-theme="auto"
    storage-key="app-theme"
    :follow-system="true"
    v-slot="{ isDark, toggleTheme, setTheme }"
  >
    <div>
      <NeumorphismButton @click="toggleTheme">
        切换主题
      </NeumorphismButton>
      <NeumorphismButton @click="setTheme('light')">
        亮色模式
      </NeumorphismButton>
    </div>
  </ThemeProvider>
</template>
```

子组件中也可以使用 `useTheme` 组合式函数：

```vue
<script setup>
import { useTheme } from '@echolab/ui-frame'

const { isDark, toggleTheme, setTheme } = useTheme()
</script>
```

## 主题系统

本库使用 CSS 自定义属性（变量）实现主题，所有组件自动响应主题变化。

### CSS 变量

```css
:root {
  /* 背景色 */
  --nm-bg-color: #ffffff;
  --nm-surface-color: #f0f0f0;

  /* 文字色 */
  --nm-text-primary: #555555;
  --nm-text-secondary: #888888;

  /* 阴影 */
  --nm-shadow-dark: rgba(0, 0, 0, 0.12);
  --nm-shadow-light: rgba(255, 255, 255, 0.95);
}

[data-theme="dark"] {
  --nm-bg-color: #1c1c1c;
  --nm-surface-color: #1a1a1a;
  --nm-text-primary: #c0c0c0;
  --nm-shadow-dark: rgba(0, 0, 0, 0.5);
  --nm-shadow-light: rgba(255, 255, 255, 0.08);
}
```
