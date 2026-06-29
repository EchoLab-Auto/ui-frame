<script setup lang="ts">
import { useDocLayout } from './useDocLayout'
import type { ProDocNode } from './types.js'
import NeumorphismLayout from '@/components/NeumorphismLayout/NeumorphismLayout.vue'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismThemeToggle from '@/components/NeumorphismThemeToggle/NeumorphismThemeToggle.vue'
import NeumorphismTree from '@/components/NeumorphismTree/NeumorphismTree.vue'
import NeumorphismDivider from '@/components/NeumorphismDivider/NeumorphismDivider.vue'
import NeumorphismTag from '@/components/NeumorphismTag/NeumorphismTag.vue'
import NeumorphismContainer from '@/components/NeumorphismContainer/NeumorphismContainer.vue'
import NeumorphismInput from '@/components/NeumorphismInput/NeumorphismInput.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

export interface DocViewerProps {
  /** 文档树根节点 */
  root: ProDocNode
  /** 初始选中的文档路径 */
  initialPath?: string
  /** 自定义样式类名 */
  className?: string
}

const props = withDefaults(defineProps<DocViewerProps>(), {
  className: '',
})

const emit = defineEmits<{
  (e: 'docLink', path: string): void
}>()

const {
  selectedPath,
  selectedKeys,
  expandedKeys,
  treeData,
  displayNode,
  themeModel,
  searchQuery,
  searchResults,
  handleTreeSelect,
  handleDocLink,
  handleSearchSelect,
} = useDocLayout({ root: props.root, initialPath: props.initialPath })

function onDocLink(path: string) {
  handleDocLink(emit, path)
}
</script>

<template>
  <div :class="`neumorphism-doc-viewer ${props.className}`">
    <NeumorphismLayout show-header show-sider :sider-width="280" collapsible>
      <!-- Header -->
      <template #header-left>
        <span class="neumorphism-header-brand">📚 Doc Viewer</span>
      </template>

      <template #header-right>
        <div class="neumorphism-header-search">
          <NeumorphismInput
            v-model="searchQuery"
            size="small"
            placeholder="搜索文档..."
            class="neumorphism-search-input"
          />
          <!-- Search results dropdown -->
          <div v-if="searchResults.length > 0" class="neumorphism-search-dropdown">
            <ul class="neumorphism-search-list">
              <li
                v-for="node in searchResults"
                :key="node.id"
                class="neumorphism-search-item"
                @click="handleSearchSelect(node)"
              >
                <span class="neumorphism-search-title">{{ node.title }}</span>
                <span class="neumorphism-search-path">{{ node.path }}</span>
              </li>
            </ul>
          </div>
        </div>
        <NeumorphismThemeToggle v-model="themeModel" size="small" />
      </template>

      <!-- Sider -->
      <template #sider="{ collapsed }">
        <div v-if="!collapsed" class="neumorphism-sider-content">
          <NeumorphismTree
            v-model:selected-keys="selectedKeys"
            v-model:expanded-keys="expandedKeys"
            :data="treeData"
            show-search
            search-placeholder="搜索文档..."
            @node-select="handleTreeSelect"
          />
        </div>
        <div v-else class="neumorphism-sider-collapsed">📚</div>
      </template>

      <!-- Main Content -->
      <template #default>
        <NeumorphismContainer no-padding class="neumorphism-main-container">
          <NeumorphismCard :elevation="-3" no-padding class="neumorphism-content-card">
            <template v-if="displayNode">
              <!-- Doc Header -->
              <div class="neumorphism-doc-header">
                <h1 class="neumorphism-doc-title">{{ displayNode.title }}</h1>
                <div class="neumorphism-doc-meta">
                  <NeumorphismTag v-if="displayNode.path" variant="primary" size="small" rounded>
                    {{ displayNode.path }}
                  </NeumorphismTag>
                  <NeumorphismTag
                    v-if="displayNode.children.length > 0"
                    variant="info"
                    size="small"
                    rounded
                  >
                    📁 {{ displayNode.children.length }} 个子项
                  </NeumorphismTag>
                </div>
              </div>

              <NeumorphismDivider />

              <!-- Document Body -->
              <div class="neumorphism-doc-body">
                <Transition name="neumorphism-doc-switch" mode="out-in">
                  <MarkdownRenderer
                    :key="displayNode.path"
                    :content="displayNode.body"
                    @doc-link="onDocLink"
                  />
                </Transition>
              </div>
            </template>

            <template v-else>
              <div class="neumorphism-empty-state">
                <NeumorphismCard :elevation="2" hoverable="bulge" class="neumorphism-empty-icon">
                  <span class="neumorphism-empty-emoji">📂</span>
                </NeumorphismCard>
                <p>请从左侧选择一篇文档</p>
                <NeumorphismButton
                  variant="raised"
                  size="small"
                  @click="selectedPath = treeData[0]?.key ?? ''"
                >
                  打开第一篇
                </NeumorphismButton>
              </div>
            </template>
          </NeumorphismCard>
        </NeumorphismContainer>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped>
.neumorphism-doc-viewer {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

/* Header */
.neumorphism-header-brand {
  font-weight: 700;
  font-size: 17px;
}

/* Header search */
.neumorphism-header-search {
  position: relative;
}

.neumorphism-search-input {
  width: 220px;
}

.neumorphism-search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 4px;
  background-color: var(--nm-surface-raised);
  border-radius: var(--nm-border-radius-md);
  box-shadow:
    6px 6px 12px var(--nm-shadow-dark),
    -6px -6px 12px var(--nm-shadow-light);
  max-height: 320px;
  overflow-y: auto;
}

.neumorphism-search-list {
  list-style: none;
  margin: 0;
  padding: 4px;
}

.neumorphism-search-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: var(--nm-border-radius-sm);
  transition: background-color 0.15s ease;
}

.neumorphism-search-item:hover {
  background-color: var(--nm-bg-color);
}

.neumorphism-search-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-primary);
}

.neumorphism-search-path {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
}

/* Sider */
.neumorphism-sider-content {
  padding: 12px;
}

.neumorphism-sider-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-top: 16px;
  font-size: 20px;
}

/* Main Content */
.neumorphism-main-container {
  padding: 24px 20px;
}

.neumorphism-content-card {
  min-height: 100%;
  overflow: visible; /* 允许 sticky/fixed TOC 超出卡片边界 */
}

/* Document Header */
.neumorphism-doc-header {
  padding: 20px 28px 0;
}

.neumorphism-doc-title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--nm-text-primary);
}

.neumorphism-doc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Document Body */
.neumorphism-doc-body {
  padding: 32px 28px;
}

/* Empty State */
.neumorphism-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  text-align: center;
  color: var(--nm-text-placeholder);
}

.neumorphism-empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.neumorphism-empty-emoji {
  font-size: 40px;
}

/* Document switch transition */
.neumorphism-doc-switch-enter-active,
.neumorphism-doc-switch-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.neumorphism-doc-switch-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.neumorphism-doc-switch-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Responsive */
@media (max-width: 768px) {
  .neumorphism-main-container {
    padding: 16px 12px;
  }

  .neumorphism-doc-header {
    padding: 16px 20px 0;
  }

  .neumorphism-doc-title {
    font-size: 22px;
  }

  .neumorphism-doc-body {
    padding: 20px;
  }
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .neumorphism-doc-switch-enter-active,
  .neumorphism-doc-switch-leave-active {
    transition: none !important;
  }

  .neumorphism-doc-switch-enter-from,
  .neumorphism-doc-switch-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
