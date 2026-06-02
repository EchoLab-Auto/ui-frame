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
  <NeumorphismCard :elevation="2">
    <NeumorphismButton variant="raised" size="medium">
      点击我
    </NeumorphismButton>
  </NeumorphismCard>
</template>
```

---

## 组件文档

### NeumorphismButton

带有柔和凸起或凹陷阴影效果的按钮。三层阴影（环境遮挡 + 定向阴影 + 边缘高光），悬停/点击采用弹性缓动。

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

---

### NeumorphismSwitch

带有太阳/月亮图标的切换开关。图标采用交叉淡入淡出过渡，滑块以临界阻尼曲线平滑滑动（无过冲回弹）。

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

---

### NeumorphismCard

统一台阶高度模型的容器组件。`elevation` 正数凸起、负数凹陷、零值平齐，|elevation| 控制阴影强度（1–4）。

`hoverable` 支持两种悬停模式：
- `'bulge'` — 台阶升高 2 级（凸起更凸，凹陷回平，不跨越零点）
- `'sink'` — 台阶降低 2 级（凹陷更深，凸起回平，不跨越零点）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| elevation | `number` | `2` | 台阶高度：正=凸起，负=凹陷，0=平齐 |
| hoverable | `boolean \| 'bulge' \| 'sink'` | `false` | 悬停动效模式 |
| radius | `'small' \| 'medium' \| 'large' \| 'xl'` | `'large'` | 圆角大小 |
| noPadding | `boolean` | `false` | 是否移除内边距 |
| variant | `'raised' \| 'pressed'` | — | **[已弃用]** 请使用 `elevation` |
| depth | `'shallow' \| 'medium' \| 'deep' \| 'very-deep'` | — | **[已弃用]** 请使用 `elevation` 绝对值 |

```vue
<!-- 凸起 2 级，悬停膨胀到 4 级 -->
<NeumorphismCard :elevation="2" hoverable="bulge">
  <template #header>
    <strong>卡片标题</strong>
  </template>
  这是卡片的主要内容区域。
  <template #footer>
    <span>2024-01-01</span>
  </template>
</NeumorphismCard>

<!-- 凹陷 2 级，悬停下沉到 4 级 -->
<NeumorphismCard :elevation="-2" hoverable="sink">
  悬停时凹陷更深
</NeumorphismCard>

<!-- 平齐，悬停膨胀到 2 级 -->
<NeumorphismCard :elevation="0" hoverable="bulge">
  悬停时从平面凸起
</NeumorphismCard>
```

#### 台阶高度对照表

| elevation | 效果 | 阴影强度 |
|-----------|------|----------|
| 4 | 强凸起 | 16px/36px |
| 3 | 中强凸起 | 12px/28px |
| 2 | 默认凸起 | 8px/20px |
| 1 | 轻微凸起 | 4px/10px |
| 0 | 平齐（与背景融合） | 无 |
| -1 | 轻微凹陷 | 4px/10px |
| -2 | 默认凹陷 | 8px/20px |
| -3 | 中强凹陷 | 12px/28px |
| -4 | 强凹陷 | 16px/36px |

---

### NeumorphismInput

带有柔和凹陷阴影效果的输入框。悬停时凹陷加深，聚焦时出现主色光环。

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

插槽：

| 插槽 | 说明 |
|------|------|
| `prefix` | 输入框前缀（图标等） |
| `suffix` | 输入框后缀（图标、清空按钮等） |

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

---

### ThemeProvider

管理应用全局的亮色/暗色主题状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultTheme | `'light' \| 'dark' \| 'auto'` | `'auto'` | 默认主题 |
| storageKey | `string` | `'nm-theme-preference'` | localStorage 存储键 |
| followSystem | `boolean` | `true` | 是否跟随系统偏好 |

插槽 props：

| 属性 | 类型 | 说明 |
|------|------|------|
| isDark | `boolean` | 当前是否为暗色主题 |
| toggleTheme | `() => void` | 切换亮/暗主题 |
| setTheme | `(t: Theme) => void` | 设置为指定主题 |
| theme | `Ref<Theme>` | 当前主题设置值 |
| currentTheme | `Ref<'light' \| 'dark'>` | 实际生效的主题 |

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

---

## 主题系统

本库使用 CSS 自定义属性实现主题，所有组件自动响应主题变化。

```css
:root {
  --nm-bg-color: #e0e0e0;
  --nm-surface-color: #e0e0e0;
  --nm-surface-raised: #e5e5e5;

  --nm-text-primary: #555555;
  --nm-text-secondary: #888888;
  --nm-text-disabled: #bbbbbb;
  --nm-text-placeholder: #aaaaaa;

  --nm-primary-color: #6c7ae0;

  --nm-shadow-dark: rgba(0, 0, 0, 0.15);
  --nm-shadow-light: rgba(255, 255, 255, 0.8);
  --nm-shadow-dark-deep: rgba(0, 0, 0, 0.18);
  --nm-shadow-light-deep: rgba(255, 255, 255, 0.85);

  --nm-border-radius-sm: 8px;
  --nm-border-radius-md: 16px;
  --nm-border-radius-lg: 24px;
  --nm-border-radius-xl: 32px;
  --nm-border-radius-full: 9999px;

  --nm-transition-fast: 0.2s ease;
  --nm-transition-normal: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  --nm-transition-slow: 0.5s ease;
}

[data-theme="dark"] {
  --nm-bg-color: #1c1c1c;
  --nm-surface-color: #1c1c1c;
  --nm-surface-raised: #222222;

  --nm-text-primary: #c0c0c0;
  --nm-text-secondary: #888888;
  --nm-text-disabled: #505050;
  --nm-text-placeholder: #666666;

  --nm-primary-color: #7b8cf0;

  --nm-shadow-dark: rgba(0, 0, 0, 0.5);
  --nm-shadow-light: rgba(255, 255, 255, 0.06);
  --nm-shadow-dark-deep: rgba(0, 0, 0, 0.6);
  --nm-shadow-light-deep: rgba(255, 255, 255, 0.1);
}
```
