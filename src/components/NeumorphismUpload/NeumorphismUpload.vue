<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { useUpload } from '@/composables/useUpload'
import type { UploadFile, UploadStatus } from '@/composables/useUpload'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useLocale } from '@/composables/useLocale'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { UPLOAD_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type { UploadFile, UploadStatus }

export type UploadSize = 'small' | 'medium' | 'large'

export interface NeumorphismUploadProps {
  /** v-model bound file list */
  modelValue?: UploadFile[]
  /** Accepted MIME types / extensions, e.g. "image/*,.pdf" */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxCount?: number
  /** Allow multiple file selection */
  multiple?: boolean
  /** Whether the upload is disabled */
  disabled?: boolean
  /** Enable drag-and-drop zone */
  drag?: boolean
  /** File list display style */
  listType?: 'text' | 'picture' | 'picture-card'
  /** Whether to show the file list */
  showUploadList?: boolean
  /**
   * 尺寸——拖拽触发区的最小高度 px（数字，主几何量），或三档预设名。
   *
   * 数字即「触发区最小高度」：锚点表里 Upload 只有这一个指标（72 / 100 / 140），
   * 所以数字路径只影响拖拽区，非拖拽的按钮触发区仍按 medium 档的内距渲染。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | UploadSize
  /** Whether to auto upload after file selection */
  autoUpload?: boolean
  /** Override trigger label text */
  triggerText?: string
  /** Override drop hint text */
  dropText?: string
  /** Override remove button aria-label */
  removeLabel?: string
  /** Override preview aria-label */
  previewLabel?: string
}

const props = withDefaults(defineProps<NeumorphismUploadProps>(), {
  autoUpload: undefined,
  drag: undefined,
  showUploadList: undefined,
  modelValue: () => [],
  accept: undefined,
  maxSize: undefined,
  maxCount: undefined,
  multiple: false,
  disabled: false,
  triggerText: '',
  dropText: '',
  removeLabel: '',
  previewLabel: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', files: UploadFile[]): void
  (e: 'change', files: UploadFile[]): void
  (e: 'preview', file: UploadFile): void
  (e: 'remove', file: UploadFile): void
  (e: 'exceed', excessCount: number): void
}>()

// ---- cascading config -----------------------------------------------------

const { config, resolveProp } = useNeumorphismSetup()
const { t } = useLocale()

/** 尺寸原始取值：显式 prop > 全局配置 `upload.size` > 档位默认 medium */
const rawSize = computed<number | UploadSize>(() =>
  resolveProp(props.size, config.value.upload?.size, 'medium' as number | UploadSize)
)

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, UPLOAD_SCALE.primary.md)
    : undefined
)

/** 字符串通道：数字路径下不挂档位类，这里只用于档位类名与语义兜底 */
const resolvedSize = computed<UploadSize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(UPLOAD_SCALE, numericSize.value)
)

const resolvedDrag = computed(() => resolveProp(props.drag, config.value.upload?.drag, true))
const resolvedShowUploadList = computed(() =>
  resolveProp(props.showUploadList, config.value.upload?.showUploadList, true)
)
const resolvedListType = computed(() =>
  resolveProp(props.listType, config.value.upload?.listType, 'text')
)
const resolvedAutoUpload = computed(() =>
  resolveProp(props.autoUpload, config.value.upload?.autoUpload, false)
)

const triggerTextLabel = computed(() => props.triggerText || t('uploadSelectFile'))
const dropTextLabel = computed(() => props.dropText || t('uploadDropFile'))
const resolvedRemoveLabel = computed(() => props.removeLabel || t('uploadRemove'))

// ---- composable -----------------------------------------------------------

const acceptRef = computed(() => props.accept)
const maxSizeRef = computed(() => props.maxSize)
const maxCountRef = computed(() => props.maxCount)
const multipleRef = computed(() => props.multiple)
const autoUploadRef = computed(() => resolvedAutoUpload.value)

const {
  files,
  dragOver,
  removeFile,
  fileInputRef,
  handleDrag,
  handleDragLeave,
  handleDrop,
  handleFileInput,
} = useUpload({
  accept: acceptRef,
  maxSize: maxSizeRef,
  maxCount: maxCountRef,
  multiple: multipleRef,
  autoUpload: autoUploadRef,
  onExceed: count => emit('exceed', count),
})

// Track which file id is hovered (for picture overlay)
const hoveredFileId = ref<string | null>(null)

// ---- two-way sync ---------------------------------------------------------

// Sync external modelValue into internal files on mount
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    files.value = [...props.modelValue]
  }
})

// Sync internal files back to modelValue
watch(
  () => files.value,
  val => {
    emit('update:modelValue', [...val])
    emit('change', [...val])
  },
  { deep: true }
)

// Sync external modelValue changes back (e.g. parent clearing)
let externalSync = true
watch(
  () => props.modelValue,
  val => {
    if (!externalSync) {
      externalSync = true
      return
    }
    // Avoid loop: only sync when external list is different
    const externalIds = (val || [])
      .map(f => f.id)
      .sort()
      .join(',')
    const internalIds = files.value
      .map(f => f.id)
      .sort()
      .join(',')
    if (externalIds !== internalIds) {
      externalSync = false
      // Clean up old ObjectURLs
      for (const f of files.value) {
        if (f.url?.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(f.url)
          } catch {
            /* */
          }
        }
      }
      files.value = val ? [...val] : []
    }
  },
  { immediate: true, deep: true }
)

// ---- actions --------------------------------------------------------------

function onRemove(file: UploadFile) {
  emit('remove', file)
  removeFile(file.id)
}

function onPreview(file: UploadFile) {
  emit('preview', file)
}

function onTriggerClick() {
  if (props.disabled) return
  dragOver.value = false
  fileInputRef.value?.click()
}

// ---- template helpers -----------------------------------------------------

const classList = computed(() => [
  'nm-upload',
  // 数字与档位类互斥：几何全由内联 `--nm-upload-sz-*` 决定
  numericSize.value === undefined ? `nm-upload--${resolvedSize.value}` : 'nm-upload--sized',
  `nm-upload--list-${resolvedListType.value}`,
  {
    'nm-upload--disabled': props.disabled,
    'nm-upload--drag': resolvedDrag.value,
    'nm-upload--dragover': dragOver.value,
  },
])

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div :class="classList" :style="sizeStyle" role="group" aria-label="file upload">
    <!-- ===================== Hidden file input ====================== -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="nm-upload__input"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileInput"
    />

    <!-- ===================== Upload trigger ========================= -->
    <div
      v-if="resolvedDrag"
      class="nm-upload__trigger"
      :class="{
        'nm-upload__trigger--dragover': dragOver,
        'nm-upload__trigger--disabled': disabled,
      }"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled"
      :aria-label="dragOver ? dropTextLabel : triggerTextLabel"
      @click="onTriggerClick"
      @dragover="handleDrag"
      @dragenter="handleDrag"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @keydown.enter.prevent="onTriggerClick"
      @keydown.space.prevent="onTriggerClick"
    >
      <!-- @slot Custom trigger content. Bind: dragOver, disabled -->
      <slot name="trigger" :drag-over="dragOver" :disabled="disabled">
        <div class="nm-upload__trigger-content">
          <NeumorphismIcon
            v-if="dragOver"
            name="upload"
            size="3xl"
            class="nm-upload__trigger-icon nm-upload__trigger-icon--drop"
            aria-hidden="true"
          />
          <NeumorphismIcon
            name="plus"
            size="3xl"
            class="nm-upload__trigger-icon"
            aria-hidden="true"
          />
          <span class="nm-upload__trigger-text">
            {{ dragOver ? dropTextLabel : triggerTextLabel }}
          </span>
        </div>
      </slot>
    </div>

    <!-- Button-only trigger (drag disabled) -->
    <div
      v-else
      class="nm-upload__button"
      :class="{ 'nm-upload__button--disabled': disabled }"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled"
      :aria-label="triggerTextLabel"
      @click="onTriggerClick"
      @keydown.enter.prevent="onTriggerClick"
      @keydown.space.prevent="onTriggerClick"
    >
      <slot name="trigger" :drag-over="false" :disabled="disabled">
        <NeumorphismIcon name="plus" size="xl" class="nm-upload__trigger-icon" aria-hidden="true" />
        <span>{{ triggerTextLabel }}</span>
      </slot>
    </div>

    <!-- ===================== File list ============================== -->
    <transition-group
      v-if="resolvedShowUploadList && files.length > 0"
      name="nm-upload-item"
      tag="div"
      class="nm-upload__list"
      :class="`nm-upload__list--${resolvedListType}`"
      role="list"
      aria-label="uploaded files"
    >
      <!-- --- text type ------------------------------------------------- -->
      <template v-if="resolvedListType === 'text'">
        <div
          v-for="file in files"
          :key="file.id"
          class="nm-upload__item"
          :class="`nm-upload__item--${file.status}`"
          role="listitem"
        >
          <span class="nm-upload__item-icon" aria-hidden="true">
            <!-- Status spinner -->
            <svg
              v-if="file.status === 'uploading'"
              class="nm-upload__spinner"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
            </svg>
            <!-- Done check -->
            <NeumorphismIcon v-else-if="file.status === 'done'" name="check" size="md" />
            <!-- Error cross -->
            <NeumorphismIcon v-else-if="file.status === 'error'" name="circle-close" size="md" />
            <!-- Pending file icon -->
            <NeumorphismIcon v-else name="file" size="md" />
          </span>
          <a
            v-if="file.url"
            class="nm-upload__item-name nm-upload__item-name--link"
            href="#"
            @click.prevent="onPreview(file)"
          >
            {{ file.name }}
          </a>
          <span v-else class="nm-upload__item-name">{{ file.name }}</span>
          <span class="nm-upload__item-size">{{ formatFileSize(file.size) }}</span>
          <span v-if="file.error" class="nm-upload__item-error">{{ file.error }}</span>
          <!-- Uploading progress bar -->
          <div v-if="file.status === 'uploading'" class="nm-upload__progress">
            <div
              class="nm-upload__progress-bar"
              :style="{ width: `${file.progress}%` }"
              role="progressbar"
              :aria-valuenow="Math.round(file.progress)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${file.name} ${Math.round(file.progress)}%`"
            />
          </div>
          <button
            class="nm-upload__remove"
            type="button"
            :aria-label="`${resolvedRemoveLabel} ${file.name}`"
            @click="onRemove(file)"
          >
            <NeumorphismIcon name="close" size="sm" />
          </button>
        </div>
      </template>

      <!-- --- picture type ----------------------------------------------- -->
      <template v-for="file in files" :key="file.id">
        <div
          v-if="resolvedListType === 'picture' && file.url"
          class="nm-upload__item nm-upload__item--picture"
          :class="`nm-upload__item--${file.status}`"
          role="listitem"
          @mouseenter="hoveredFileId = file.id"
          @mouseleave="hoveredFileId = null"
        >
          <button
            class="nm-upload__item-thumb"
            type="button"
            :aria-label="`${props.previewLabel || t('uploadPreview')} ${file.name}`"
            @click="onPreview(file)"
          >
            <img :src="file.url" :alt="file.name" class="nm-upload__item-img" />
            <span v-if="hoveredFileId === file.id" class="nm-upload__item-overlay">
              <NeumorphismIcon name="eye" size="xl" />
            </span>
          </button>
          <div class="nm-upload__item-info">
            <a
              class="nm-upload__item-name nm-upload__item-name--link"
              href="#"
              @click.prevent="onPreview(file)"
            >
              {{ file.name }}
            </a>
            <span class="nm-upload__item-size">{{ formatFileSize(file.size) }}</span>
          </div>
          <button
            class="nm-upload__remove"
            type="button"
            :aria-label="`${resolvedRemoveLabel} ${file.name}`"
            @click="onRemove(file)"
          >
            <NeumorphismIcon name="close" size="sm" />
          </button>
        </div>
      </template>

      <!-- --- picture-card type ------------------------------------------ -->
      <template v-for="file in files" :key="`card-${file.id}`">
        <div
          v-if="resolvedListType === 'picture-card' && file.url"
          class="nm-upload__item nm-upload__item--card"
          :class="`nm-upload__item--${file.status}`"
          role="listitem"
        >
          <div class="nm-upload__card-inner" @click="onPreview(file)">
            <img :src="file.url" :alt="file.name" class="nm-upload__card-img" />
            <div v-if="file.status === 'uploading'" class="nm-upload__card-progress">
              <div
                class="nm-upload__progress-bar"
                :style="{ width: `${file.progress}%` }"
                role="progressbar"
                :aria-valuenow="Math.round(file.progress)"
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <div class="nm-upload__card-actions">
              <button
                type="button"
                class="nm-upload__card-preview"
                :aria-label="`${props.previewLabel || t('uploadPreview')} ${file.name}`"
                @click.stop="onPreview(file)"
              >
                <NeumorphismIcon name="eye" size="md" />
              </button>
              <button
                type="button"
                class="nm-upload__card-remove"
                :aria-label="`${resolvedRemoveLabel} ${file.name}`"
                @click.stop="onRemove(file)"
              >
                <NeumorphismIcon name="trash" size="md" />
              </button>
            </div>
          </div>
          <span class="nm-upload__card-name">{{ file.name }}</span>
        </div>
      </template>
    </transition-group>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Root
// ==========================================
.nm-upload {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-md);
}

.nm-upload__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// ==========================================
// Trigger (drag zone)
// ==========================================
.nm-upload__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  border: 2px dashed var(--nm-border-medium);
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-surface-color);
  cursor: pointer;
  user-select: none;
  outline: none;
  @include nm-theme-transition;

  &:focus-visible {
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }

  @media (hover: hover) {
    &:hover:not(&--disabled):not(&--dragover) {
      border-color: var(--nm-primary-color);
      background-color: var(--nm-surface-raised);
    }
  }

  &--dragover {
    border-color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
    @include nm-inset(4px, 8px);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-upload__trigger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-md);
}

.nm-upload__trigger-icon {
  color: var(--nm-text-secondary);
  transition:
    color var(--nm-transition-fast),
    transform var(--nm-transition-fast);

  &--drop {
    color: var(--nm-primary-color);
    transform: translateY(-2px);
  }
}

.nm-upload__trigger-text {
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
}

// ==========================================
// Button trigger (drag disabled)
// ==========================================
.nm-upload__button {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-button-padding-y-md) var(--nm-button-padding-x-md);
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-surface-color);
  cursor: pointer;
  user-select: none;
  outline: none;
  @include nm-raised(4px, 10px);
  @include nm-interactive;
  @include nm-active-press;
  @include nm-theme-transition;

  &:focus-visible {
    box-shadow:
      0 0 0 3px var(--nm-primary-color),
      4px 4px 10px var(--nm-shadow-dark),
      -4px -4px 10px var(--nm-shadow-light);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// ==========================================
// File list
// ==========================================
.nm-upload__list {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);

  &--picture-card {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

// ==========================================
// File item — text
// ==========================================
.nm-upload__item {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-xs) var(--nm-spacing-sm);
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  position: relative;
  @include nm-raised(2px, 6px);
  @include nm-theme-transition;

  &:has(.nm-upload__progress) {
    padding-bottom: 3px;
  }

  &--uploading {
    box-shadow:
      inset 2px 2px 4px var(--nm-shadow-dark),
      inset -2px -2px 4px var(--nm-shadow-light);
  }

  &--error {
    border: 1px solid var(--nm-color-error);
  }
}

.nm-upload__item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-icon-size-2xl);
  height: var(--nm-icon-size-2xl);
  color: var(--nm-text-secondary);
}

.nm-upload__spinner {
  animation: nm-upload-spin 0.8s linear infinite;
}

.nm-upload__item-name {
  flex: 1;
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  &--link {
    color: var(--nm-primary-color);
    cursor: pointer;

    @media (hover: hover) {
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.nm-upload__item-size {
  flex-shrink: 0;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);
}

.nm-upload__item-error {
  flex-shrink: 0;
  font-size: var(--nm-font-sm);
  color: var(--nm-color-error);
}

// ==========================================
// Progress bar inside items
// ==========================================
.nm-upload__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border-radius: 0 0 var(--nm-border-radius-sm) var(--nm-border-radius-sm);
}

.nm-upload__progress-bar {
  height: 100%;
  background-color: var(--nm-primary-color);
  border-radius: 0 0 var(--nm-border-radius-sm) var(--nm-border-radius-sm);
  transition: width 0.3s $nm-ease-ambient;
  box-shadow: 0 0 6px color-mix(in srgb, var(--nm-primary-color) 40%, transparent);
}

// ==========================================
// Remove button
// ==========================================
.nm-upload__remove {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background: none;
  color: var(--nm-text-secondary);
  cursor: pointer;
  transition: color var(--nm-transition-fast);

  // 触屏：28×28 → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-color-error);
    }
  }
}

// ==========================================
// File item — picture
// ==========================================
.nm-upload__item--picture {
  .nm-upload__item-thumb {
    flex-shrink: 0;
    position: relative;
    width: 48px;
    height: 48px;
    border: none;
    border-radius: var(--nm-border-radius-sm);
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    background: none;
    @include nm-inset(1px, 3px);
  }

  .nm-upload__item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nm-upload__item-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--nm-mask-bg);
    color: var(--nm-on-mask-text);
    transition: opacity var(--nm-transition-fast);
  }

  .nm-upload__item-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
}

// ==========================================
// File item — picture-card
// ==========================================
.nm-upload__item--card {
  width: 120px;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
  padding: var(--nm-spacing-xs);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(3px, 8px);
  @include nm-theme-transition;

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      box-shadow:
        6px 6px 12px var(--nm-shadow-dark),
        -6px -6px 12px var(--nm-shadow-light);
    }
  }
}

.nm-upload__card-inner {
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: var(--nm-border-radius-sm);
  overflow: hidden;
  background-color: var(--nm-surface-color);
  cursor: pointer;

  @media (hover: hover) {
    @media (hover: hover) {
      &:hover .nm-upload__card-actions {
        opacity: 1;
      }
    }

    // 键盘可达性：聚焦到操作按钮时浮现
    &:focus-within .nm-upload__card-actions {
      opacity: 1;
    }
  }
  .nm-upload__card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nm-upload__card-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    overflow: hidden;
    background: color-mix(in srgb, var(--nm-mask-bg) 50%, transparent);
  }

  .nm-upload__card-progress .nm-upload__progress-bar {
    border-radius: 0;
    box-shadow: 0 0 8px color-mix(in srgb, var(--nm-primary-color) 50%, transparent);
  }

  .nm-upload__card-actions {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--nm-spacing-sm);
    background: var(--nm-mask-bg);
    background: var(--nm-mask-bg);
    opacity: 0;
    transition: opacity var(--nm-transition-fast);

    // 触屏设备（无悬停能力）常显——操作入口在触屏不可隐藏
    @media (hover: none) {
      opacity: 1;
    }
  }
}

.nm-upload__card-preview,
.nm-upload__card-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background: var(--nm-on-mask-surface);
  color: var(--nm-text-primary);
  cursor: pointer;
  transition: color var(--nm-transition-fast);

  // 触屏：32×32 → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-primary-color);
    }
  }
}

@media (hover: hover) {
  .nm-upload__card-remove:hover {
    color: var(--nm-color-error);
  }
}

.nm-upload__card-name {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

// ==========================================
// Sizes
// ==========================================
.nm-upload--small {
  .nm-upload__trigger {
    min-height: 72px;
  }
  .nm-upload__trigger-text {
    font-size: var(--nm-font-sm);
  }
  .nm-upload__button {
    padding: var(--nm-button-padding-y-sm) var(--nm-button-padding-x-sm);
    font-size: var(--nm-button-font-sm);
  }
}

.nm-upload--large {
  .nm-upload__trigger {
    min-height: 140px;
  }
  .nm-upload__trigger-text {
    font-size: var(--nm-font-lg);
  }
  .nm-upload__button {
    padding: var(--nm-button-padding-y-lg) var(--nm-button-padding-x-lg);
    font-size: var(--nm-button-font-lg);
  }
}

// ---------- 数字尺寸（`:size="120"`）----------
// 锚点表里 Upload 只有一个指标（触发区最小高度），所以数字路径只影响拖拽区。
// 非拖拽的按钮触发区没有对应锚点，就不臆造插值——保持 medium 档的内距。
.nm-upload--sized .nm-upload__trigger {
  min-height: var(--nm-upload-sz-trigger-height);
}

// ==========================================
// Transition group animations
// ==========================================
.nm-upload-item-enter-active {
  transition:
    opacity 0.3s $nm-ease-decelerate,
    transform 0.3s $nm-ease-spring;
}
.nm-upload-item-leave-active {
  transition:
    opacity 0.2s $nm-ease-accelerate,
    transform 0.2s $nm-ease-accelerate;
  position: absolute;
}
.nm-upload-item-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.nm-upload-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.nm-upload-item-move {
  transition: transform 0.3s $nm-ease-spring;
}

// ==========================================
// Animations
// ==========================================
@keyframes nm-upload-spin {
  to {
    transform: rotate(360deg);
  }
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-upload-item-enter-active,
  .nm-upload-item-leave-active,
  .nm-upload-item-move {
    transition: none;
  }
  .nm-upload__spinner {
    animation: none;
  }
  .nm-upload__progress-bar {
    transition: none;
  }
}
</style>
