<script setup lang="ts">
import { computed, ref } from 'vue'
import { generateId } from '@/utils'

export interface NeumorphismTextareaProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large'
  maxlength?: number | string
  minlength?: number | string
  label?: string
  error?: string | boolean
  name?: string
  id?: string
  rows?: number | string
  autoResize?: boolean
  showCount?: boolean
}

const props = withDefaults(defineProps<NeumorphismTextareaProps>(), {
  modelValue: '',
  disabled: false,
  readonly: false,
  required: false,
  size: 'medium',
  rows: 4,
  autoResize: false,
  showCount: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', event: Event): void
  (e: 'change', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'enter', value: string): void
}>()

const textareaId = computed(() => props.id || generateId('nm-textarea'))
const isFocused = ref(false)
const textareaRef = ref<HTMLTextAreaElement>()

const classList = computed(() => [
  'nm-textarea',
  `nm-textarea--${props.size}`,
  {
    'nm-textarea--focused': isFocused.value,
    'nm-textarea--disabled': props.disabled,
    'nm-textarea--readonly': props.readonly,
    'nm-textarea--error': !!props.error,
    'nm-textarea--has-label': !!props.label,
  },
])

const charCount = computed(() => props.modelValue?.length || 0)

function adjustHeight() {
  if (!props.autoResize || !textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
}

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  emit('input', event)
  adjustHeight()
}

function handleFocus(event: FocusEvent) { isFocused.value = true; emit('focus', event) }
function handleBlur(event: FocusEvent) { isFocused.value = false; emit('blur', event) }
function handleChange(event: Event) { emit('change', event) }

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
  if (event.key === 'Enter' && !event.shiftKey) {
    emit('enter', props.modelValue)
  }
}
</script>

<template>
  <div class="nm-textarea__wrapper">
    <label v-if="label" :for="textareaId" class="nm-textarea__label">
      {{ label }}
      <span v-if="required" class="nm-textarea__required">*</span>
    </label>
    <div :class="classList">
      <textarea
        :id="textareaId"
        ref="textareaRef"
        class="nm-textarea__field"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :rows="rows"
        :name="name"
        :aria-invalid="!!error"
        :aria-errormessage="error && typeof error === 'string' ? `${textareaId}-error` : undefined"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
    </div>
    <div class="nm-textarea__footer">
      <div v-if="error && typeof error === 'string'" :id="`${textareaId}-error`" class="nm-textarea__error">
        {{ error }}
      </div>
      <span v-if="showCount && maxlength" class="nm-textarea__count">
        {{ charCount }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-textarea__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-textarea__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-primary);
}

.nm-textarea__required {
  color: #e74c3c;
  margin-left: 2px;
}

.nm-textarea {
  display: flex;
  width: 100%;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 8px);
  @include nm-theme-transition;

  &:not(.nm-textarea--disabled):not(.nm-textarea--focused):hover {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
  }

  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
  }

  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px rgba(231, 76, 60, 0.3);
    &.nm-textarea--focused {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 3px rgba(231, 76, 60, 0.5);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.nm-textarea__field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  width: 100%;

  &::placeholder { color: var(--nm-text-placeholder); }
  &:disabled { cursor: not-allowed; }
}

.nm-textarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.nm-textarea__error {
  font-size: 12px;
  color: #e74c3c;
}

.nm-textarea__count {
  font-size: 12px;
  color: var(--nm-text-placeholder);
  margin-left: auto;
}

// Sizes
.nm-textarea--small .nm-textarea__field { padding: 6px 12px; font-size: 13px; }
.nm-textarea--medium .nm-textarea__field { padding: 10px 16px; font-size: 14px; }
.nm-textarea--large .nm-textarea__field { padding: 14px 20px; font-size: 16px; }
</style>
