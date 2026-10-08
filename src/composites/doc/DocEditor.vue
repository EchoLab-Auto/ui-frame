<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProDocNode } from './types.js'
import { useDocLayout } from './useDocLayout'
import NeumorphismLayout from '@/components/NeumorphismLayout/NeumorphismLayout.vue'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismThemeToggle from '@/components/NeumorphismThemeToggle/NeumorphismThemeToggle.vue'
import NeumorphismTree from '@/components/NeumorphismTree/NeumorphismTree.vue'
import NeumorphismDivider from '@/components/NeumorphismDivider/NeumorphismDivider.vue'
import NeumorphismTag from '@/components/NeumorphismTag/NeumorphismTag.vue'
import NeumorphismContainer from '@/components/NeumorphismContainer/NeumorphismContainer.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import DocTreeIcon from './DocTreeIcon.vue'

export interface DocEditorProps {
  /** 文档树根节点 */
  root: ProDocNode
  /** 初始选中的文档路径 */
  initialPath?: string
  /** 自定义样式类名 */
  className?: string
}

const props = withDefaults(defineProps<DocEditorProps>(), {
  className: '',
})

const emit = defineEmits<{
  (e: 'save', path: string, content: string): void
  (e: 'docLink', path: string): void
}>()

const {
  selectedPath,
  selectedKeys,
  expandedKeys,
  treeData,
  displayNode,
  themeModel,
  handleTreeSelect,
} = useDocLayout({ root: props.root, initialPath: props.initialPath })

/** 编辑缓存 LRU 限制 */
const MAX_EDIT_CACHE = 50
const editedContent = ref<Record<string, string>>({})
const editAccessOrder = ref<string[]>([])

/** 安全地设置编辑内容，带 LRU 淘汰 */
function setEditContent(path: string, content: string) {
  const order = editAccessOrder.value.filter(p => p !== path)
  order.push(path)

  while (order.length > MAX_EDIT_CACHE) {
    const oldest = order.shift()!
    if (oldest !== path) {
      delete editedContent.value[oldest]
    }
  }

  editAccessOrder.value = order
  editedContent.value[path] = content
}

/** 获取当前编辑内容 */
function getCurrentContent(node: ProDocNode): string {
  return editedContent.value[node.path] ?? node.content
}

/** 处理内容变化 */
function handleContentChange(value: string) {
  if (!displayNode.value) return
  setEditContent(displayNode.value.path, value)
}

/** 处理保存 */
function handleSave() {
  if (!displayNode.value) return
  emit('save', displayNode.value.path, getCurrentContent(displayNode.value))
}

/** 处理文档链接 */
function handleDocLink(path: string) {
  selectedPath.value = path
  emit('docLink', path)
}

/** 是否有未保存的更改 */
const hasChanges = computed(() => {
  if (!displayNode.value) return false
  const edited = editedContent.value[displayNode.value.path]
  return edited !== undefined && edited !== displayNode.value.content
})

/** 键盘快捷键 */
function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}
</script>

<template>
  <div :class="`neumorphism-doc-editor ${props.className}`" @keydown="handleKeyDown">
    <NeumorphismLayout show-header show-sider :sider-width="280" collapsible>
      <!-- Header -->
      <template #header-left>
        <span class="neumorphism-editor-brand"
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
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="M15 5l4 4" />
          </svg>
          Doc Editor</span
        >
      </template>

      <template #header-center>
        <NeumorphismThemeToggle v-model="themeModel" size="small" />
      </template>

      <template #header-right>
        <div class="neumorphism-editor-actions">
          <NeumorphismTag v-if="hasChanges" variant="warning" size="small"> 未保存 </NeumorphismTag>
          <NeumorphismButton
            variant="raised"
            size="small"
            :disabled="!hasChanges"
            @click="handleSave"
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
            </svg>
            保存
          </NeumorphismButton>
        </div>
      </template>

      <!-- Sider -->
      <template #sider="{ collapsed }">
        <div v-if="!collapsed" class="neumorphism-editor-sider">
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
        <div v-else class="neumorphism-editor-sider-collapsed">
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
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </div>
      </template>

      <!-- Main editing area -->
      <template #default>
        <NeumorphismContainer no-padding class="neumorphism-editor-container">
          <NeumorphismCard :elevation="-3" no-padding class="neumorphism-editor-card">
            <div v-if="displayNode" class="neumorphism-editor-layout">
              <header class="neumorphism-editor-header">
                <div>
                  <h1 class="neumorphism-editor-title">{{ displayNode.title }}</h1>
                  <div class="neumorphism-editor-meta">
                    <NeumorphismTag v-if="displayNode.path" variant="primary" size="small" rounded>
                      {{ displayNode.path }}
                    </NeumorphismTag>
                    <NeumorphismTag v-if="hasChanges" variant="warning" size="small">
                      已修改
                    </NeumorphismTag>
                  </div>
                </div>
                <NeumorphismButton
                  variant="raised"
                  size="small"
                  :disabled="!hasChanges"
                  @click="handleSave"
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
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>
                  保存
                </NeumorphismButton>
              </header>

              <NeumorphismDivider />

              <div class="neumorphism-editor-body">
                <MarkdownEditor
                  :value="getCurrentContent(displayNode)"
                  @change="handleContentChange"
                  @doc-link="handleDocLink"
                />
              </div>
            </div>

            <div v-else class="neumorphism-editor-empty">
              <NeumorphismCard
                :elevation="2"
                hoverable="bulge"
                class="neumorphism-editor-empty-icon"
              >
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
              <p>请从左侧选择一篇文档进行编辑</p>
              <NeumorphismButton
                variant="raised"
                size="small"
                @click="selectedPath = treeData[0]?.key ?? ''"
              >
                打开第一篇
              </NeumorphismButton>
            </div>
          </NeumorphismCard>
        </NeumorphismContainer>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped>
.neumorphism-doc-editor {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

/* Header */
.neumorphism-editor-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-weight: 700;
  font-size: var(--nm-font-2xl);
}

.neumorphism-doc-icon {
  width: var(--nm-icon-size-sm);
  height: var(--nm-icon-size-sm);
  flex-shrink: 0;
}

.neumorphism-editor-actions {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-14);
}

/* Sider */
.neumorphism-editor-sider {
  padding: var(--nm-spacing-12);
}

.neumorphism-editor-sider-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-top: var(--nm-spacing-md);
  /* 尺寸由 .neumorphism-doc-icon-lg 承担 */
}

/* Main Container */
.neumorphism-editor-container {
  padding: var(--nm-spacing-20);
}

.neumorphism-editor-card {
  height: 100%;
}

/* Editor Layout */
.neumorphism-editor-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Editor Header */
.neumorphism-editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--nm-spacing-md);
  flex-wrap: wrap;
  padding: var(--nm-spacing-20) var(--nm-spacing-lg) var(--nm-spacing-md);
}

.neumorphism-editor-title {
  margin: 0 0 var(--nm-spacing-10);
  font-size: var(--nm-heading-h3-size);
  font-weight: 700;
  color: var(--nm-text-primary);
}

.neumorphism-editor-meta {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  flex-wrap: wrap;
}

/* Editor Body */
.neumorphism-editor-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Empty State */
.neumorphism-editor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-md);
  min-height: 400px;
  text-align: center;
  color: var(--nm-text-placeholder);
}

.neumorphism-editor-empty-icon {
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

/* Responsive */
@media (max-width: 767px) {
  .neumorphism-editor-container {
    padding: var(--nm-spacing-12);
  }

  .neumorphism-editor-header {
    padding: var(--nm-spacing-md);
  }

  .neumorphism-editor-title {
    font-size: var(--nm-heading-h4-size);
  }
}
</style>
