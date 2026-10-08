<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDocLayout } from './useDocLayout'
import { resolveCanvasGraph } from './flow-graph'
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
import DocFlowCanvas from './DocFlowCanvas.vue'
import DocTreeIcon from './DocTreeIcon.vue'

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
  docTree,
  handleTreeSelect,
  handleDocLink,
  handleSearchSelect,
} = useDocLayout({ root: props.root, initialPath: props.initialPath })

function onDocLink(path: string) {
  handleDocLink(emit, path)
}

// ==========================================
// 画布视图 —— 流程优先 / 层级地图回退 / 点击钻取（抽象 → 具体）
// ==========================================

/** 视图模式：文档正文 / 流程画布 */
const viewMode = ref<'doc' | 'canvas'>('doc')

/** 当前节点的画布图（无流程且无子级时为 null，画布入口禁用） */
const canvasGraph = computed(() =>
  displayNode.value ? resolveCanvasGraph(displayNode.value) : null
)

/** 切换文档时回到文档视图（新文档的画布语义由用户重新选择） */
watch(displayNode, () => {
  viewMode.value = 'doc'
})

/**
 * 画布钻取：链接路径在树 key 上做三级归一（无前导斜杠存储 / 加斜杠 / 去斜杠），
 * 命中后以真实节点 path 选中（避免 selectedNode 落空回退到首页）。
 * 目标仍可出画布（有流程或有子级）→ 保持画布继续钻取；
 * 否则落回文档视图 —— 抽象→具体的终点是正文。
 */
function onCanvasNavigate(path: string) {
  const target =
    docTree.value.findByPath(path) ??
    docTree.value.findByPath(`/${path}`) ??
    docTree.value.findByPath(path.replace(/^\//, ''))
  if (!target) return
  handleDocLink(emit, target.path)
  if (!resolveCanvasGraph(target)) {
    viewMode.value = 'doc'
  }
}
</script>

<template>
  <div :class="`neumorphism-doc-viewer ${props.className}`">
    <NeumorphismLayout show-header show-sider :sider-width="280" collapsible>
      <!-- Header -->
      <template #header-left>
        <span class="neumorphism-header-brand"
          ><svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          Doc Viewer</span
        >
      </template>

      <template #header-right>
        <!-- 视图切换：文档正文 / 流程画布 -->
        <div class="neumorphism-view-switch" role="tablist" aria-label="视图切换">
          <NeumorphismButton
            size="small"
            :variant="viewMode === 'doc' ? 'pressed' : 'raised'"
            role="tab"
            :aria-selected="viewMode === 'doc'"
            @click="viewMode = 'doc'"
          >
            <svg
              class="neumorphism-doc-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
            文档
          </NeumorphismButton>
          <NeumorphismButton
            size="small"
            :variant="viewMode === 'canvas' ? 'pressed' : 'raised'"
            role="tab"
            :aria-selected="viewMode === 'canvas'"
            :disabled="!canvasGraph"
            :title="canvasGraph ? '流程画布' : '当前文档无流程图与子文档'"
            @click="viewMode = 'canvas'"
          >
            <svg
              class="neumorphism-doc-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
              <path d="M8 2v16M16 6v16" />
            </svg>
            画布
          </NeumorphismButton>
        </div>
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
          >
            <template #icon="{ node }">
              <DocTreeIcon :name="String(node.icon ?? 'file')" />
            </template>
          </NeumorphismTree>
        </div>
        <div v-else class="neumorphism-sider-collapsed">
          <svg
            class="neumorphism-doc-icon-lg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
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
                    <svg
                      class="neumorphism-doc-icon-inline"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path
                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                      />
                    </svg>
                    { displayNode.children.length } 个子项
                  </NeumorphismTag>
                </div>
              </div>

              <NeumorphismDivider />

              <!-- Document Body -->
              <div class="neumorphism-doc-body">
                <Transition name="neumorphism-doc-switch" mode="out-in">
                  <MarkdownRenderer
                    v-if="viewMode === 'doc'"
                    :key="displayNode.path"
                    :content="displayNode.body"
                    @doc-link="onDocLink"
                  />
                  <DocFlowCanvas
                    v-else-if="canvasGraph"
                    :key="`${displayNode.path}:canvas`"
                    :graph="canvasGraph"
                    height="calc(100vh - 320px)"
                    @navigate="onCanvasNavigate"
                  />
                </Transition>
              </div>
            </template>

            <template v-else>
              <div class="neumorphism-empty-state">
                <NeumorphismCard :elevation="2" hoverable="bulge" class="neumorphism-empty-icon">
                  <span class="neumorphism-doc-empty-icon">
                    <svg
                      class="neumorphism-doc-icon-3xl"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
                      />
                    </svg>
                  </span>
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
.neumorphism-doc-icon {
  width: var(--nm-icon-size-sm);
  height: var(--nm-icon-size-sm);
  flex-shrink: 0;
}

.neumorphism-header-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-weight: 700;
  font-size: var(--nm-font-2xl);
}

/* 视图切换分段控件 */
.neumorphism-view-switch {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
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
  margin-top: var(--nm-spacing-xs);
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
  padding: var(--nm-spacing-xs);
}

.neumorphism-search-item {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-2xs);
  padding: var(--nm-spacing-10) var(--nm-spacing-14);
  cursor: pointer;
  border-radius: var(--nm-border-radius-sm);
  transition: background-color 0.15s ease;
}

@media (hover: hover) {
  .neumorphism-search-item:hover {
    background-color: var(--nm-bg-color);
  }
}

.neumorphism-search-title {
  font-size: var(--nm-font-base);
  font-weight: 500;
  color: var(--nm-text-primary);
}

.neumorphism-search-path {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
}

/* Sider */
.neumorphism-sider-content {
  padding: var(--nm-spacing-12);
}

.neumorphism-sider-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-top: var(--nm-spacing-md);
  /* 尺寸由 .neumorphism-doc-icon-lg 承担 */
}

/* Main Content */
.neumorphism-main-container {
  padding: var(--nm-spacing-lg) var(--nm-spacing-20);
}

.neumorphism-content-card {
  min-height: 100%;
  overflow: visible; /* 允许 sticky/fixed TOC 超出卡片边界 */
}

/* Document Header */
.neumorphism-doc-header {
  padding: var(--nm-spacing-20) 28px 0;
}

.neumorphism-doc-title {
  margin: 0 0 var(--nm-spacing-12);
  font-size: var(--nm-heading-h2-size);
  font-weight: 700;
  color: var(--nm-text-primary);
}

.neumorphism-doc-meta {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  flex-wrap: wrap;
}

/* Document Body */
.neumorphism-doc-body {
  padding: var(--nm-spacing-xl) 28px;
}

/* Empty State */
.neumorphism-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-md);
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

.neumorphism-doc-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 图标尺寸档（emoji 替换为 SVG 后由类承担） */
.neumorphism-doc-icon-lg {
  width: var(--nm-icon-size-lg);
  height: var(--nm-icon-size-lg);
  flex-shrink: 0;
}

.neumorphism-doc-icon-3xl {
  width: var(--nm-icon-size-3xl);
  height: var(--nm-icon-size-3xl);
  flex-shrink: 0;
}

.neumorphism-doc-icon-inline {
  width: var(--nm-icon-size-sm);
  height: var(--nm-icon-size-sm);
  flex-shrink: 0;
  vertical-align: -2px;
  margin-right: var(--nm-spacing-2xs);
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
    padding: var(--nm-spacing-md) var(--nm-spacing-12);
  }

  .neumorphism-doc-header {
    padding: var(--nm-spacing-md) var(--nm-spacing-20) 0;
  }

  .neumorphism-doc-title {
    font-size: var(--nm-heading-h3-size);
  }

  .neumorphism-doc-body {
    padding: var(--nm-spacing-20);
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
