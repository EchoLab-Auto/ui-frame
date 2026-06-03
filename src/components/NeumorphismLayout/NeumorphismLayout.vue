<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTouchDevice } from '@/composables/useTouchDevice'

export interface NeumorphismLayoutProps {
  /** 是否显示顶部导航 */
  showHeader?: boolean
  /** 是否显示侧边栏 */
  showSider?: boolean
  /** 侧边栏宽度 */
  siderWidth?: number
  /** 侧边栏是否可折叠 */
  collapsible?: boolean
  /** 侧边栏是否默认折叠 */
  defaultCollapsed?: boolean
  /** 侧边栏折叠后宽度 */
  collapsedWidth?: number
  /** 是否移动端自动折叠侧边栏 */
  mobileAutoCollapse?: boolean
}

const props = withDefaults(defineProps<NeumorphismLayoutProps>(), {
  showHeader: true,
  showSider: false,
  siderWidth: 240,
  collapsible: false,
  defaultCollapsed: false,
  collapsedWidth: 64,
  mobileAutoCollapse: true,
})

const emit = defineEmits<{
  (e: 'collapse', collapsed: boolean): void
}>()

const { isMobile } = useTouchDevice()

const collapsed = ref(props.defaultCollapsed)
const mobileDrawerOpen = ref(false)

const effectiveCollapsed = computed(() => {
  if (props.mobileAutoCollapse && isMobile.value) return true
  return collapsed.value
})

function toggleCollapse() {
  if (isMobile.value) {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
  } else {
    collapsed.value = !collapsed.value
    emit('collapse', collapsed.value)
  }
}

function closeMobileDrawer() {
  mobileDrawerOpen.value = false
}

const classList = computed(() => [
  'nm-layout',
  {
    'nm-layout--has-sider': props.showSider,
    'nm-layout--sider-collapsed': effectiveCollapsed.value,
    'nm-layout--mobile': isMobile.value,
    'nm-layout--drawer-open': mobileDrawerOpen.value,
  },
])

const siderStyle = computed(() => ({
  width: effectiveCollapsed.value ? `${props.collapsedWidth}px` : `${props.siderWidth}px`,
}))
</script>

<template>
  <div :class="classList">
    <!-- Header -->
    <header v-if="showHeader" class="nm-layout__header">
      <div class="nm-layout__header-left">
        <button
          v-if="showSider && collapsible"
          class="nm-layout__collapse-btn"
          type="button"
          :aria-label="effectiveCollapsed ? '展开侧边栏' : '折叠侧边栏'"
          @click="toggleCollapse"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="effectiveCollapsed" d="M16 18l-6-6 6-6" />
            <path v-else d="M8 18l6-6-6-6" />
          </svg>
        </button>
        <slot name="header-left" />
      </div>
      <div class="nm-layout__header-center">
        <slot name="header-center" />
      </div>
      <div class="nm-layout__header-right">
        <slot name="header-right" />
      </div>
    </header>

    <div class="nm-layout__body">
      <!-- Mobile drawer overlay -->
      <transition name="nm-layout-fade">
        <div
          v-if="isMobile && mobileDrawerOpen"
          class="nm-layout__drawer-overlay"
          @click="closeMobileDrawer"
          @touchmove.prevent
        />
      </transition>

      <!-- Sider -->
      <aside
        v-if="showSider"
        class="nm-layout__sider"
        :class="{ 'nm-layout__sider--drawer': isMobile, 'nm-layout__sider--open': mobileDrawerOpen }"
        :style="!isMobile ? siderStyle : undefined"
      >
        <div class="nm-layout__sider-inner">
          <slot name="sider" :collapsed="effectiveCollapsed" />
        </div>
      </aside>

      <!-- Content -->
      <main class="nm-layout__content" @click="isMobile && mobileDrawerOpen ? closeMobileDrawer() : undefined">
        <slot />
      </main>
    </div>

    <!-- Footer -->
    <footer v-if="$slots.footer" class="nm-layout__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.nm-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  @include nm-theme-transition;
}

// ---- Header ----
.nm-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  flex-shrink: 0;
  background-color: var(--nm-surface-color);
  z-index: 100;

  @include nm-screen-md {
    height: 64px;
    padding: 0 24px;
  }
}

.nm-layout__header-left,
.nm-layout__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.nm-layout__header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.nm-layout__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: none;

  &:hover {
    color: var(--nm-text-primary);
    background-color: var(--nm-surface-raised);
  }
}

// ---- Body ----
.nm-layout__body {
  display: flex;
  flex: 1;
  position: relative;
}

// ---- Sider ----
.nm-layout__sider {
  flex-shrink: 0;
  background-color: var(--nm-surface-color);
  transition: width var(--nm-transition-normal);
  overflow: hidden;
  z-index: 90;

  &:not(&--drawer) {
    border-right: 1px solid rgba(128, 128, 128, 0.1);
  }

  &--drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 8px 0 24px var(--nm-shadow-dark);

    &.nm-layout__sider--open {
      transform: translateX(0);
    }
  }
}

.nm-layout__sider-inner {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// ---- Drawer overlay ----
.nm-layout__drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 150;
}

.nm-layout-fade-enter-active,
.nm-layout-fade-leave-active {
  transition: opacity 0.25s ease;
}
.nm-layout-fade-enter-from,
.nm-layout-fade-leave-to {
  opacity: 0;
}

// ---- Content ----
.nm-layout__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

// ---- Footer ----
.nm-layout__footer {
  flex-shrink: 0;
  padding: 16px;
  text-align: center;
  color: var(--nm-text-secondary);
  font-size: 13px;

  @include nm-screen-md {
    padding: 20px 24px;
  }
}

// ---- Theme transition helper ----
.nm-layout {
  transition: background-color var(--nm-transition-slow);
}
</style>
