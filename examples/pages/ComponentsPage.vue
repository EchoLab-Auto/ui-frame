<script setup lang="ts">
/**
 * 组件总览页。
 *
 * 页面本身只负责「外壳」：侧栏导航、scroll-spy、分类区块、页脚。
 * 每个组件的演示内容都在 `./demos/XxxDemo.vue` 里，元数据（标题 / 徽标 /
 * 锚点 / 是否整行）集中在 `./demos/index.ts`——侧栏、卡片标题、scroll-spy
 * 三处共用同一份数据，不会各自漂移。
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTheme } from '../../src/composables/useTheme'
import { DemoCard } from '../demo'
import { demoCategories, allDemoIds } from './demos'

// ---- 注入全局主题（由 App.vue provide） ----
const themeContext = useTheme()
const isDark = themeContext.isDark

// ---- 组件分类导航（由注册表派生） ----
const navCategories = computed(() =>
  demoCategories.map(category => ({
    title: category.title,
    items: category.items.map(item => ({ id: item.id, label: item.nav })),
  }))
)

// ---- 导航滚动 ----
let clickScrollToken = 0
let clickScrollTimer: ReturnType<typeof setTimeout> | null = null

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  activeSection.value = id
  clickScrollToken++
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const token = clickScrollToken
  clickScrollTimer = setTimeout(() => {
    clickScrollTimer = null
    if (token === clickScrollToken) {
      clickScrollToken = 0
      updateActiveSection()
    }
  }, 600)
}

// ---- 滚动监听（scroll-spy） ----
const HEADER_OFFSET = 120
const activeSection = ref(allDemoIds[0])
const allSectionIds = computed(() => allDemoIds)

let scrollTicking = false

function updateActiveSection() {
  let current = allSectionIds.value[0]
  for (const id of allSectionIds.value) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= HEADER_OFFSET + 10) {
      current = id
    }
  }
  activeSection.value = current
}

function onScroll() {
  if (clickScrollToken > 0) return
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateActiveSection()
      scrollTicking = false
    })
    scrollTicking = true
  }
}

// Resolve the actual scroll container (.nm-layout__content) for accurate scroll-spy
function getScrollContainer(): Element | null {
  return document.querySelector('.showcase .nm-layout__content')
}

onMounted(() => {
  nextTick(() => {
    const container = getScrollContainer()
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true })
    }
    updateActiveSection()
  })
})

onBeforeUnmount(() => {
  if (clickScrollTimer) clearTimeout(clickScrollTimer)
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', onScroll)
  }
})
</script>

<template>
  <div class="showcase" :data-theme="isDark ? 'dark' : undefined">
    <NeumorphismLayout
      :show-header="false"
      show-sider
      :sider-width="220"
      collapsible
      height="auto"
      style="flex: 1; min-height: 0"
    >
      <!-- ===== SIDER NAVIGATION ===== -->
      <template #sider="{ collapsed }">
        <nav v-if="!collapsed" class="sider-nav" aria-label="组件导航">
          <div v-for="category in navCategories" :key="category.title" class="nav-group">
            <span class="nav-group-title">{{ category.title }}</span>
            <a
              v-for="item in category.items"
              :key="item.id"
              :href="`#${item.id}`"
              class="nav-link"
              :class="{ 'nav-link--active': activeSection === item.id }"
              @click.prevent="scrollToSection(item.id)"
              >{{ item.label }}</a
            >
          </div>
        </nav>
      </template>

      <!-- ===== MAIN CONTENT ===== -->
      <template #default>
        <NeumorphismScrollbar variant="none" target=".showcase .nm-layout__sider-inner" />
        <NeumorphismScrollbar variant="dots" target=".showcase .nm-layout__content" />
        <div class="content-inner">
          <!-- Hero / 简介 -->
          <section class="hero">
            <h1 class="hero-title">@echolab-auto/ui-frame</h1>
            <p class="hero-desc">
              Vue 3 新拟态（Soft UI）UI 组件库，共
              <strong>50+</strong> 个组件。统一的台阶高度模型、300+ CSS 设计
              Token，暗色模式、移动端适配，全部视觉效果由 Token 驱动。
            </p>
            <div class="hero-links">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a>
              <span class="hero-links-sep">·</span>
              <a href="https://www.npmjs.com/package/@echolab-auto/ui-frame" target="_blank">npm</a>
            </div>
          </section>

          <NeumorphismDivider />

          <!-- 分类区块：标题 + 说明 + 该分类下的全部演示卡片 -->
          <template v-for="(category, index) in demoCategories" :key="category.title">
            <section class="category-section">
              <h2 class="category-title">{{ category.title }}</h2>
              <p class="category-desc">{{ category.desc }}</p>

              <DemoCard
                v-for="entry in category.items"
                :id="entry.id"
                :key="entry.id"
                :title="entry.title"
                :badge="entry.badge"
                :full="entry.full"
              >
                <component :is="entry.component" />
              </DemoCard>
            </section>

            <NeumorphismDivider v-if="index < demoCategories.length - 1" />
          </template>

          <!-- ===== 页脚 ===== -->
          <footer class="doc-footer">
            <NeumorphismDivider />
            <p>@echolab-auto/ui-frame · MIT 许可证 · 共 50+ 个组件</p>
            <p style="margin-top: 4px">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a> ·
              <a href="https://www.npmjs.com/package/@echolab-auto/ui-frame" target="_blank">npm</a>
            </p>
          </footer>
        </div>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped lang="scss">
@use '../../src/styles/mixins.scss' as *;

// 演示内容的通用排版（.demo-*）在 examples/styles/demo.scss，
// 这里只留页面外壳：侧栏、内容区、Hero、分类、页脚。

// ---- Root ----
// flex: 1 fills .page-content. display:flex passes the flex context
// down to the inner Layout, avoiding percentage height fragility.
.showcase {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow);
}

// ---- Sider Navigation ----
.sider-nav {
  padding: 12px 10px 24px;
}

.nav-group {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-group-title {
  display: block;
  padding: 8px 10px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--nm-text-placeholder);
}

.nav-link {
  display: block;
  padding: 6px 10px 6px 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);
  margin-bottom: 1px;
  position: relative;
  border-left: 2px solid transparent;

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
  }

  &--active {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-surface-raised);
    border-left-color: var(--nm-primary-color);
    border-radius: 0 var(--nm-border-radius-sm) var(--nm-border-radius-sm) 0;
  }
}

// ---- Content Area (fluid, no max-width) ----
.content-inner {
  margin: 0 auto;
  padding: 8px 20px 64px;

  @include nm-screen-sm {
    padding: 12px 28px 64px;
  }

  @include nm-screen-lg {
    padding: 16px 40px 72px;
  }

  @media (min-width: 1600px) {
    padding: 20px 56px 80px;
  }
}

// ---- Hero ----
.hero {
  padding: 0 0 24px;

  @include nm-screen-lg {
    padding: 4px 0 28px;
  }
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.5px;

  @include nm-screen-sm {
    font-size: 32px;
  }

  @include nm-screen-lg {
    font-size: 36px;
    letter-spacing: -0.8px;
  }
}

.hero-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
  max-width: 640px;

  @include nm-screen-lg {
    font-size: 15px;
  }
}

.hero-links {
  font-size: 14px;
  color: var(--nm-text-placeholder);

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.hero-links-sep {
  margin: 0 8px;
}

// ---- Category Section ----
.category-section {
  padding: 8px 0 4px;

  // Grid layout for demo cards on wider screens
  @include nm-screen-lg {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  // 2-column card grid at 1400px+
  @media (min-width: 1400px) {
    grid-template-columns: 1fr 1fr;
  }
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  padding-top: 8px;

  @include nm-screen-sm {
    font-size: 22px;
  }
}

.category-desc {
  font-size: 13px;
  color: var(--nm-text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 640px;

  @include nm-screen-lg {
    margin-bottom: 28px;
  }
}

// ---- Footer ----
.doc-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  color: var(--nm-text-secondary);
  font-size: 13px;

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
