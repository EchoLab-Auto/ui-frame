<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import NeumorphismTabs from '@/components/NeumorphismTabs/NeumorphismTabs.vue'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import NeumorphismTextarea from '@/components/NeumorphismTextarea/NeumorphismTextarea.vue'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

export interface MarkdownEditorProps {
  /** Markdown 内容 */
  value: string
  /** 自定义样式类名 */
  className?: string
  /** 启用自动保存 */
  autoSave?: boolean
  /** 自动保存间隔（毫秒），默认 30000 */
  autoSaveInterval?: number
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
  className: '',
  autoSave: false,
  autoSaveInterval: 30000,
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
// 编辑工具栏 — 在光标位置插入 Markdown 语法
// ==========================================

const editPanelRef = ref<HTMLDivElement | null>(null)
const previewPanelRef = ref<HTMLDivElement | null>(null)
let syncingScroll = false

/** 获取 textarea 元素 */
function getTextarea(): HTMLTextAreaElement | null {
  return editPanelRef.value?.querySelector('textarea') as HTMLTextAreaElement | null
}

/** 在光标位置插入文本（包裹选中内容） */
function insertAtCursor(before: string, after: string, placeholder: string) {
  const ta = getTextarea()
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = ta.value.slice(start, end) || placeholder
  const newValue = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end)
  emit('change', newValue)
  // 恢复焦点并选中 placeholder 文本以方便替换
  nextTick(() => {
    ta.focus()
    const newCursor = start + before.length
    ta.setSelectionRange(newCursor, newCursor + selected.length)
  })
}

/** 在当前位置插入整行 */
function insertLine(prefix: string, placeholder: string) {
  const ta = getTextarea()
  if (!ta) return
  const start = ta.selectionStart
  const before = ta.value.slice(0, start)
  const after = ta.value.slice(start)
  const needsLineBreak = before.length > 0 && !before.endsWith('\n')
  const lineStart = needsLineBreak ? '\n' : ''
  const insertion = `${lineStart}${prefix} ${placeholder}\n`
  const newValue = before + insertion + after
  emit('change', newValue)
  nextTick(() => {
    ta.focus()
    const pos = start + insertion.length - placeholder.length - 2
    ta.setSelectionRange(pos, pos + placeholder.length)
  })
}

function insertBold() {
  insertAtCursor('**', '**', '粗体文字')
}
function insertItalic() {
  insertAtCursor('_', '_', '斜体文字')
}
function insertHeading() {
  insertLine('##', '标题')
}
function insertLink() {
  insertAtCursor('[', '](url)', '链接文字')
}
function insertImage() {
  insertLine('![alt text]', '(url)')
}
function insertCode() {
  insertAtCursor('`', '`', '代码')
}
function insertCodeBlock() {
  insertLine('```\n', 'code\n```')
}
function insertList() {
  insertLine('-', '列表项')
}
function insertTable() {
  const md = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n'
  const ta = getTextarea()
  if (!ta) return
  const start = ta.selectionStart
  const newValue = ta.value.slice(0, start) + md + ta.value.slice(ta.selectionEnd)
  emit('change', newValue)
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(start + 3, start + 3)
  })
}

// ==========================================
// 拖拽图片上传
// ==========================================

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (!file?.type.startsWith('image/')) return
  e.preventDefault()
  e.stopPropagation()

  const reader = new FileReader()
  const fileName = file.name
  reader.onload = () => {
    const ta = getTextarea()
    if (!ta) return
    const start = ta.selectionStart
    const imageMd = `![${fileName}](${reader.result as string})`
    const newValue = ta.value.slice(0, start) + imageMd + ta.value.slice(start)
    emit('change', newValue)
    nextTick(() => {
      ta.focus()
      ta.setSelectionRange(start + imageMd.length, start + imageMd.length)
    })
  }
  reader.readAsDataURL(file)
}

function handleDragOver(e: DragEvent) {
  if (e.dataTransfer?.types.includes('Files')) {
    e.preventDefault()
  }
}

// ==========================================
// 自动保存
// ==========================================

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave() {
  if (!props.autoSave) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    emit('change', props.value)
  }, props.autoSaveInterval)
}

watch(
  () => props.value,
  () => {
    scheduleAutoSave()
  }
)

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

// ==========================================
// 分栏同步滚动
// ==========================================

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
    <!-- Formatting toolbar -->
    <div class="neumorphism-editor-toolbar">
      <div class="neumorphism-editor-toolbar-left">
        <NeumorphismButton variant="flat" size="small" title="粗体 (Ctrl+B)" @click="insertBold">
          <strong>B</strong>
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="斜体 (Ctrl+I)" @click="insertItalic">
          <em>I</em>
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="标题" @click="insertHeading">
          H
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="链接" @click="insertLink">
          🔗
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="图片" @click="insertImage">
          🖼
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="行内代码" @click="insertCode">
          &lt;/&gt;
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="代码块" @click="insertCodeBlock">
          📋
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="无序列表" @click="insertList">
          •≡
        </NeumorphismButton>
        <NeumorphismButton variant="flat" size="small" title="表格" @click="insertTable">
          ⏏
        </NeumorphismButton>
      </div>
      <div class="neumorphism-editor-toolbar-right">
        <NeumorphismTabs
          v-model="mode"
          :tabs="tabs"
          size="small"
          class="neumorphism-editor-mode-tabs"
        />
        <span class="editor-stat">{{ lineCount }} 行 · {{ charCount }} 字</span>
      </div>
    </div>

    <!-- Editor panels -->
    <div class="neumorphism-editor-panels" :class="`neumorphism-mode-${mode}`">
      <!-- Edit panel -->
      <div
        ref="editPanelRef"
        class="neumorphism-editor-panel neumorphism-editor-panel--edit"
        :class="{ hidden: mode === 'preview' }"
        @scroll="syncPreviewScroll"
        @drop="handleDrop"
        @dragover="handleDragOver"
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
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

.neumorphism-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 16px;
  flex-shrink: 0;
  background-color: var(--nm-surface-color);
  border-bottom: 1px solid var(--nm-border-subtle);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

.neumorphism-editor-toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.neumorphism-editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.neumorphism-editor-mode-tabs {
  max-width: 280px;
}

.editor-stat {
  font-size: 12px;
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
}

.neumorphism-editor-panels {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  gap: 16px;
  padding: 16px;
  background-color: var(--nm-bg-color);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
}

.neumorphism-editor-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
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
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    border-color var(--nm-transition-slow);
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
