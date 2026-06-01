# @echolab/ui-frame

A Vue 3 UI component library featuring **Neumorphism (Soft UI)** design — soft, tactile shadows that create a realistic 3D embossed effect.

> Inspired by the elegant inset/convex shadow aesthetics of physical interfaces.

## ✨ Features

- 🎨 **Neumorphism Design** — Soft凸起 and 凹陷 shadow effects
- 🌓 **Light / Dark Theme** — Built-in theme system with auto-detection
- 📦 **Tree-shakable** — Import only what you need
- 🔧 **TypeScript** — Full type definitions included
- 🎯 **Vue 3 Composition API** — Modern Vue development

## 📦 Installation

### Install from npm registry (recommended)

```bash
npm install @echolab/ui-frame
```

```bash
yarn add @echolab/ui-frame
```

```bash
pnpm add @echolab/ui-frame
```

### Install from GitHub

If the package is not published to npm yet, you can install directly from GitHub:

```bash
# Install from the main branch
npm install EchoLab-Auto/ui-frame

# Or install from a specific branch/tag
npm install EchoLab-Auto/ui-frame#main
npm install EchoLab-Auto/ui-frame#v1.0.0
```

```bash
yarn add EchoLab-Auto/ui-frame
```

```bash
pnpm add EchoLab-Auto/ui-frame
```

**Note:** When installing from GitHub, the `prepare` script will automatically run the build process. Make sure you have a Node.js version ≥ 18 installed.

## 🚀 Usage

### Full Import

```ts
import { createApp } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(NeumorphismUI)
app.mount('#app')
```

### On-Demand Import

```vue
<script setup>
import { NeumorphismButton, NeumorphismCard } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
</script>

<template>
  <NeumorphismCard variant="raised">
    <NeumorphismButton variant="raised" size="medium">
      Click Me
    </NeumorphismButton>
  </NeumorphismCard>
</template>
```

## 🧩 Components

### NeumorphismButton

A button with soft凸起 or 凹陷 shadow effects.

```vue
<NeumorphismButton
  variant="raised"     <!-- 'raised' | 'flat' | 'pressed' -->
  size="medium"        <!-- 'small' | 'medium' | 'large' -->
  shape="rounded"      <!-- 'rounded' | 'pill' | 'circle' -->
  :disabled="false"
  :loading="false"
  @click="handleClick"
>
  Button Text
</NeumorphismButton>
```

### NeumorphismSwitch

A theme toggle switch with sun/moon icons, inspired by ui-example.

```vue
<script setup>
import { ref } from 'vue'
const isDark = ref(false)
</script>

<template>
  <NeumorphismSwitch
    v-model="isDark"
    active-text="Dark"
    inactive-text="Light"
    size="medium"        <!-- 'small' | 'medium' | 'large' -->
  />
</template>
```

### NeumorphismCard

A container with raised or pressed shadow depth levels.

```vue
<NeumorphismCard
  variant="raised"     <!-- 'raised' | 'pressed' -->
  depth="medium"       <!-- 'shallow' | 'medium' | 'deep' | 'very-deep' -->
  radius="large"       <!-- 'small' | 'medium' | 'large' | 'xl' -->
  :hoverable="true"
>
  <template #header>
    Card Header
  </template>

  Card content goes here...

  <template #footer>
    Card Footer
  </template>
</NeumorphismCard>
```

### NeumorphismInput

An input field with soft凹陷 shadow effect.

```vue
<script setup>
import { ref } from 'vue'
const value = ref('')
</script>

<template>
  <NeumorphismInput
    v-model="value"
    label="Username"
    placeholder="Enter your name"
    size="medium"        <!-- 'small' | 'medium' | 'large' -->
    :required="true"
    error=""
    @enter="handleSubmit"
  >
    <template #prefix>
      <UserIcon />
    </template>
  </NeumorphismInput>
</template>
```

### ThemeProvider

Manages light/dark theme state across your application.

```vue
<template>
  <ThemeProvider
    default-theme="auto"        <!-- 'light' | 'dark' | 'auto' -->
    storage-key="app-theme"
    :follow-system="true"
    v-slot="{ isDark, toggleTheme, setTheme }"
  >
    <div>
      <NeumorphismButton @click="toggleTheme">
        Toggle Theme
      </NeumorphismButton>
      <NeumorphismButton @click="setTheme('light')">
        Light Mode
      </NeumorphismButton>
    </div>
  </ThemeProvider>
</template>
```

You can also use the `useTheme` composable in child components:

```vue
<script setup>
import { useTheme } from '@echolab/ui-frame'

const { isDark, toggleTheme, setTheme } = useTheme()
</script>
```

## 🎨 Theme System

The library uses CSS custom properties for theming. All components automatically respond to theme changes.

### Available CSS Variables

```css
:root {
  /* Background */
  --nm-bg-color: #ffffff;
  --nm-surface-color: #f0f0f0;

  /* Text */
  --nm-text-primary: #555555;
  --nm-text-secondary: #888888;

  /* Shadows */
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

## 📄 License

MIT

## 🔗 Repository

[https://github.com/EchoLab-Auto/ui-frame](https://github.com/EchoLab-Auto/ui-frame)
