---
id: comp-theme-provider
title: 'ThemeProvider（主题提供者）'
x: 3277
y: 1916
group: 使用
---

# ThemeProvider

> 主题上下文的挂载点——内部调用 `provideTheme` 创建独立的 `ThemeContext` 并注入子树：负责 `<html data-theme>` 写入、localStorage 持久化与系统偏好跟随；同时以作用域插槽把主题状态直接交给默认内容。源码：`src/components/ThemeProvider/`。

```vue
<ThemeProvider default-theme="auto">
  <App />
</ThemeProvider>
```

---

## 可配置项

### Props

| 名称           | 类型                          | 默认值                  | 说明                                   |
| -------------- | ----------------------------- | ----------------------- | -------------------------------------- |
| `defaultTheme` | `'light' \| 'dark' \| 'auto'` | `'auto'`                | 默认主题模式（无存储偏好时生效）       |
| `storageKey`   | `string`                      | `'nm-theme-preference'` | localStorage 持久化键                  |
| `followSystem` | `boolean`                     | `true`                  | 主题为 `auto` 时是否跟随系统深浅色偏好 |

### Events / Slots

| 名称      | 说明                                                                      |
| --------- | ------------------------------------------------------------------------- |
| 默认 slot | 作用域插槽，暴露 `{ theme, currentTheme, isDark, setTheme, toggleTheme }` |

---

## 用法

```vue
<!-- 作用域插槽直接驱动自定义切换按钮 -->
<ThemeProvider v-slot="{ isDark, toggleTheme }">
  <button @click="toggleTheme">{{ isDark ? '切换到浅色' : '切换到深色' }}</button>
</ThemeProvider>
```

子树任意位置经 `useTheme()` 取同一上下文：

```ts
import { useTheme } from '@echolab-auto/ui-frame'

const { theme, currentTheme, isDark, setTheme, toggleTheme } = useTheme()
// theme：用户设定（含 'auto'）；currentTheme：实际生效的 'light' | 'dark'
```

SSR / 防闪烁（FOUC）：在 `index.html` 的 `<head>` 内、任何 CSS 加载之前内联：

```html
<script>
  %s
</script>
<!-- 其中 %s 为 getAntiFlickerScript() 的返回串；键不一致时传入自定义 storageKey -->
```

```ts
import { getAntiFlickerScript } from '@echolab-auto/ui-frame'
// 返回一段立即执行脚本：读取 localStorage 偏好，
// dark（或 auto + 系统深色）时在 Vue 水合前给 <html> 打上 data-theme="dark"
```

---

## 交互动画详解

### 主题解析与持久化

- 初始化顺序：localStorage 存储值（校验合法值，脏数据忽略）→ `defaultTheme` prop；`setTheme` 同时写回存储
- 生效主题写入 `<html data-theme="dark">`（浅色为移除属性），全部 token 经 CSS 变量切换；Provider 根节点自带 `nm-theme-transition` 过渡
- `followSystem` 且主题为 `auto` 时监听 `prefers-color-scheme` 变化实时切换
- props 经 computed 传入 `provideTheme`：**运行期修改 `defaultTheme` 会自动同步**；`storageKey` / `followSystem` 仅在初始化时读取，运行期修改需重挂载 Provider

### 上下文体系

| 函数                 | 说明                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| `provideTheme(opts)` | 创建并注入上下文（Provider 内部即调它；opts 可传 ref/computed 以联动）   |
| `useTheme()`         | 注入上下文；无 Provider 时创建独立兜底上下文并随组件卸载销毁（SSR 安全） |
| `createTheme(opts)`  | 创建完全独立的主题状态（不进注入树）                                     |

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 主题过渡与 reduced-motion 通用约定
- [API 参考](../api.md) — `useTheme` / `provideTheme` / `getAntiFlickerScript` 完整签名
