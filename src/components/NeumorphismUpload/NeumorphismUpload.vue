<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { useUpload } from '@/composables/useUpload'
import type { UploadFile, UploadStatus } from '@/composables/useUpload'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useLocale } from '@/composables/useLocale'

export type { UploadFile, UploadStatus }

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
  /** Component size */
  size?: 'small' | 'medium' | 'large'
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
  modelValue: () => [],
  accept: undefined,
  maxSize: undefined,
  maxCount: undefined,
  multiple: false,
  disabled: false,
  drag: true,
  listType: 'text',
  showUploadList: true,
  size: 'medium',
  autoUpload: false,
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

const resolvedSize = computed(() => resolveProp(props.size, config.value.upload?.size, 'medium'))
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
  `nm-upload--${resolvedSize.value}`,
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
  <div :class="classList" role="group" aria-label="file upload">
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
          <svg
            v-if="dragOver"
            class="nm-upload__trigger-icon nm-upload__trigger-icon--drop"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <svg
            v-else
            class="nm-upload__trigger-icon"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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
        <svg
          class="nm-upload__trigger-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
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
            <svg
              v-else-if="file.status === 'done'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <!-- Error cross -->
            <svg
              v-else-if="file.status === 'error'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <!-- Pending file icon -->
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13,2 13,9 20,9" />
            </svg>
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                type="button"
                class="nm-upload__card-remove"
                :aria-label="`${resolvedRemoveLabel} ${file.name}`"
                @click.stop="onRemove(file)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3,6 5,6 21,6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
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

  &:hover:not(&--disabled):not(&--dragover) {
    border-color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
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
  width: 24px;
  height: 24px;
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

    &:hover {
      text-decoration: underline;
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

  &:hover {
    color: var(--nm-color-error);
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
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
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

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      6px 6px 12px var(--nm-shadow-dark),
      -6px -6px 12px var(--nm-shadow-light);
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

  &:hover .nm-upload__card-actions {
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
  background: rgba(0, 0, 0, 0.2);
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
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity var(--nm-transition-fast);
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
  background: rgba(255, 255, 255, 0.9);
  color: var(--nm-text-primary);
  cursor: pointer;
  transition: color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-primary-color);
  }
}

.nm-upload__card-remove:hover {
  color: var(--nm-color-error);
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
