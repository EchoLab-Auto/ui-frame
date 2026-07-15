<script setup lang="ts">
import { useRoute } from 'vue-router'
import { provideTheme } from '../src/composables/useTheme'

const route = useRoute()

// ---- 全局主题（Provide 给整个组件树） ----
const themeContext = provideTheme()
const themeValue = themeContext.theme
const isDark = themeContext.isDark

const navItems = [
  { path: '/components', label: '组件总览' },
  { path: '/layout', label: '排版系统' },
  { path: '/doc', label: '文档组件' },
]
</script>

<template>
  <div class="showcase-root" :data-theme="isDark ? 'dark' : undefined">
    <!-- Top nav bar — simple fixed bar, NOT a NeumorphismLayout header -->
    <header class="top-bar">
      <span class="brand">@echolab-auto/ui-frame</span>
      <nav class="top-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="top-nav-link"
          :class="{ 'top-nav-link--active': route.path === item.path }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <NeumorphismThemeToggle v-model="themeValue" size="small" />
    </header>

    <!-- Page content — each page manages its own Layout -->
    <main class="page-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '../src/styles/mixins.scss' as *;

.showcase-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow);
}

// ---- Top navigation bar (not a NeumorphismLayout header) ----
.top-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  flex-shrink: 0;
  gap: 16px;
  background-color: var(--nm-surface-color);
  z-index: 100;

  @media (min-width: 768px) {
    height: 64px;
    padding: 0 24px;
  }
}

.brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.top-nav-link {
  display: block;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-radius: var(--nm-border-radius-md);
  transition: all var(--nm-transition-fast);

  &:hover {
    color: var(--nm-text-primary);
    background-color: var(--nm-surface-raised);
  }

  &--active {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-surface-raised);
  }
}

// ---- Page content fills remaining space ----
// display:flex so child pages fill via flex:1 (no fragile percentage heights)
.page-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
