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
        <span class="neumorphism-editor-brand">📝 Doc Editor</span>
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
            💾 保存
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
          />
        </div>
        <div v-else class="neumorphism-editor-sider-collapsed">📝</div>
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
                  💾 保存
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
                <span class="neumorphism-editor-empty-emoji">📂</span>
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
  font-weight: 700;
  font-size: 17px;
}

.neumorphism-editor-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* Sider */
.neumorphism-editor-sider {
  padding: 12px;
}

.neumorphism-editor-sider-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-top: 16px;
  font-size: 20px;
}

/* Main Container */
.neumorphism-editor-container {
  padding: 20px;
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
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px 16px;
}

.neumorphism-editor-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--nm-text-primary);
}

.neumorphism-editor-meta {
  display: flex;
  align-items: center;
  gap: 8px;
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
  gap: 16px;
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

.neumorphism-editor-empty-emoji {
  font-size: 40px;
}

/* Responsive */
@media (max-width: 768px) {
  .neumorphism-editor-container {
    padding: 12px;
  }

  .neumorphism-editor-header {
    padding: 16px;
  }

  .neumorphism-editor-title {
    font-size: 20px;
  }
}
</style>
