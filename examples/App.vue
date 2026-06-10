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
    <NeumorphismLayout show-header :sider-width="0">
      <!-- ===== HEADER ===== -->
      <template #header-left>
        <span class="brand">@echolab/ui-frame</span>
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
      </template>

      <template #header-right>
        <NeumorphismThemeToggle v-model="themeValue" size="small" />
      </template>

      <!-- ===== MAIN CONTENT ===== -->
      <template #default>
        <router-view />
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped lang="scss">
@use '../src/styles/mixins.scss' as *;

.showcase-root {
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
  margin-right: 24px;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 4px;
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
  position: relative;

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
</style>
