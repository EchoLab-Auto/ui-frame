<script setup lang="ts">
import { computed } from 'vue'
import { provideTheme, type Theme, type ThemeOptions } from '@/composables/useTheme'

export interface ThemeProviderProps {
  /** Default theme mode */
  defaultTheme?: Theme
  /** localStorage key for theme persistence */
  storageKey?: string
  /** Whether to follow system preference when theme is 'auto' */
  followSystem?: boolean
}

const props = withDefaults(defineProps<ThemeProviderProps>(), {
  defaultTheme: 'auto',
  storageKey: 'nm-theme-preference',
  followSystem: true,
})

const options = computed<ThemeOptions>(() => ({
  defaultTheme: props.defaultTheme,
  storageKey: props.storageKey,
  followSystem: props.followSystem,
}))

// Pass the computed options directly so provideTheme can watch
// defaultTheme changes at runtime automatically.
const themeContext = provideTheme(options)
</script>

<template>
  <div class="nm-theme-provider nm-root">
    <slot
      :theme="themeContext.theme"
      :current-theme="themeContext.currentTheme"
      :is-dark="themeContext.isDark"
      :set-theme="themeContext.setTheme"
      :toggle-theme="themeContext.toggleTheme"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-theme-provider {
  min-height: 100%;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  @include nm-theme-transition;
}
</style>
