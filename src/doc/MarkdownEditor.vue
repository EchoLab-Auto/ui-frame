<script setup lang="ts">
import { ref, computed } from 'vue'
import NeumorphismTabs from '@/components/NeumorphismTabs/NeumorphismTabs.vue'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismTextarea from '@/components/NeumorphismTextarea/NeumorphismTextarea.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

export interface MarkdownEditorProps {
  /** Markdown 内容 */
  value: string
  /** 自定义样式类名 */
  className?: string
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
  className: '',
})

const emit = defineEmits<{
  (e: 'change', value: string): void
  (e: 'docLink', path: string): void
}>()

const mode = ref<'edit' | 'preview' | 'split'>('split')

function handleDocLink(path: string) {
  emit('docLink', path)
}

const tabs = [
  { key: 'edit', label: '✏️ 编辑' },
  { key: 'split', label: '⬌ 分栏' },
  { key: 'preview', label: '👁 预览' },
]

/** 内容字数统计 */
const charCount = computed(() => props.value.length)
const lineCount = computed(() => props.value.split('\n').length)

// ==========================================
// 分栏同步滚动
// ==========================================
const editPanelRef = ref<HTMLDivElement | null>(null)
const previewPanelRef = ref<HTMLDivElement | null>(null)
let syncingScroll = false

function syncPreviewScroll() {
  if (syncingScroll || mode.value !== 'split') return
  const textarea = editPanelRef.value?.querySelector('textarea') as HTMLTextAreaElement | null
  const preview = previewPanelRef.value
  if (!textarea || !preview) return

  const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
  syncingScroll = true
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
  requestAnimationFrame(() => {
    syncingScroll = false
  })
}

function syncEditScroll() {
  if (syncingScroll || mode.value !== 'split') return
  const textarea = editPanelRef.value?.querySelector('textarea') as HTMLTextAreaElement | null
  const preview = previewPanelRef.value
  if (!textarea || !preview) return

  const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1)
  syncingScroll = true
  textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight)
  requestAnimationFrame(() => {
    syncingScroll = false
  })
}
</script>

<template>
  <div :class="`neumorphism-markdown-editor ${props.className}`">
    <!-- Mode toolbar -->
    <div class="neumorphism-editor-toolbar">
      <NeumorphismTabs
        v-model="mode"
        :tabs="tabs"
        size="small"
        class="neumorphism-editor-mode-tabs"
      />
      <span class="editor-stat">{{ lineCount }} 行 · {{ charCount }} 字</span>
    </div>

    <!-- Editor panels -->
    <div class="neumorphism-editor-panels" :class="`neumorphism-mode-${mode}`">
      <!-- Edit panel -->
      <div
        ref="editPanelRef"
        class="neumorphism-editor-panel neumorphism-editor-panel--edit"
        :class="{ hidden: mode === 'preview' }"
        @scroll="syncPreviewScroll"
      >
        <NeumorphismCard :elevation="-3" no-padding class="edit-card">
          <NeumorphismTextarea
            class="neumorphism-editor-textarea"
            :model-value="props.value"
            placeholder="在此输入 Markdown..."
            :auto-resize="false"
            :show-count="false"
            @update:model-value="(v: string) => emit('change', v)"
          />
        </NeumorphismCard>
      </div>

      <!-- Preview panel -->
      <div
        ref="previewPanelRef"
        class="neumorphism-editor-panel neumorphism-editor-panel--preview"
        :class="{ hidden: mode === 'edit' }"
        @scroll="syncEditScroll"
      >
        <NeumorphismCard :elevation="-2" no-padding class="preview-card">
          <MarkdownRenderer :content="props.value" :show-toc="false" @doc-link="handleDocLink" />
        </NeumorphismCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.neumorphism-markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.neumorphism-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  flex-shrink: 0;
  background-color: var(--nm-surface-color);
  border-bottom: 1px solid var(--nm-border-subtle);
}

.neumorphism-editor-mode-tabs {
  max-width: 280px;
}

.editor-stat {
  font-size: 12px;
  color: var(--nm-text-placeholder);
  font-family: 'SF Mono', Monaco, monospace;
}

.neumorphism-editor-panels {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  gap: 16px;
  padding: 16px;
  background-color: var(--nm-bg-color);
}

.neumorphism-editor-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.neumorphism-editor-panel.hidden {
  display: none;
}

.edit-card,
.preview-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edit-card {
  background-color: var(--nm-surface-raised);
}

.preview-card {
  background-color: var(--nm-surface-raised);
  padding: 24px;
  overflow-y: auto;
}

/* Override NeumorphismTextarea to behave like a code editor */
.neumorphism-editor-textarea :deep(.nm-textarea__field) {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 14px;
  line-height: 1.65;
  resize: none;
  height: 100%;
}

/* Single mode adjustments */
.neumorphism-mode-edit .neumorphism-editor-panel--edit,
.neumorphism-mode-preview .neumorphism-editor-panel--preview {
  max-width: 100%;
}

@media (max-width: 768px) {
  .neumorphism-editor-panels.neumorphism-mode-split {
    flex-direction: column;
  }

  .neumorphism-editor-panels.neumorphism-mode-split .neumorphism-editor-panel {
    flex: none;
    height: 50%;
  }

  .neumorphism-editor-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
