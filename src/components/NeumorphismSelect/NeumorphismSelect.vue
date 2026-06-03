<script setup lang="ts">
import { computed, ref } from 'vue'
import { generateId } from '@/utils'

export interface NeumorphismSelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface NeumorphismSelectProps {
  modelValue?: string | number
  options?: NeumorphismSelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  label?: string
  required?: boolean
  error?: string | boolean
  name?: string
  id?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<NeumorphismSelectProps>(), {
  modelValue: '',
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  size: 'medium',
  clearable: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const selectId = computed(() => props.id || generateId('nm-select'))
const isOpen = ref(false)
const isFocused = ref(false)

const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue)
)

const classList = computed(() => [
  'nm-select',
  `nm-select--${props.size}`,
  {
    'nm-select--open': isOpen.value,
    'nm-select--focused': isFocused.value,
    'nm-select--disabled': props.disabled,
    'nm-select--error': !!props.error,
    'nm-select--has-value': props.modelValue !== '' && props.modelValue !== undefined,
  },
])

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function selectOption(option: NeumorphismSelectOption) {
  if (option.disabled || props.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

function clearValue(event: Event) {
  event.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true
  emit('focus', event)
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.key === 'Escape') { isOpen.value = false; return }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleOpen(); return }
  if (event.key === 'ArrowDown' && !isOpen.value) { event.preventDefault(); isOpen.value = true; return }
  if (!isOpen.value) return

  const opts = props.options.filter((o) => !o.disabled)
  const idx = opts.findIndex((o) => o.value === props.modelValue)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const next = idx + 1 < opts.length ? opts[idx + 1] : opts[0]
    if (next) selectOption(next)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    const prev = idx - 1 >= 0 ? opts[idx - 1] : opts[opts.length - 1]
    if (prev) selectOption(prev)
  } else if (event.key === 'Home') {
    event.preventDefault()
    if (opts[0]) selectOption(opts[0])
  } else if (event.key === 'End') {
    event.preventDefault()
    if (opts[opts.length - 1]) selectOption(opts[opts.length - 1])
  }
}

function onBlurContainer(e: FocusEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    isOpen.value = false
    isFocused.value = false
  }
}
</script>

<template>
  <div class="nm-select__wrapper">
    <label v-if="label" :for="selectId" class="nm-select__label">
      {{ label }}
      <span v-if="required" class="nm-select__required">*</span>
    </label>
    <div
      :class="classList"
      :tabindex="disabled ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :aria-labelledby="label ? selectId : undefined"
      @click="toggleOpen"
      @focus="handleFocus"
      @blur="onBlurContainer"
      @keydown="handleKeydown"
    >
      <span class="nm-select__value" :class="{ 'nm-select__value--placeholder': !selectedOption }">
        {{ selectedOption?.label || placeholder }}
      </span>
      <span class="nm-select__actions">
        <button
          v-if="clearable && selectedOption"
          class="nm-select__clear"
          type="button"
          @click="clearValue"
          :aria-label="'清除选择'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <svg
          class="nm-select__arrow"
          :class="{ 'nm-select__arrow--open': isOpen }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </span>

      <transition name="nm-select-dropdown">
        <div v-if="isOpen" class="nm-select__dropdown" role="listbox" :aria-label="label || '选项列表'">
          <div
            v-for="option in options"
            :key="option.value"
            class="nm-select__option"
            :class="{
              'nm-select__option--selected': option.value === modelValue,
              'nm-select__option--disabled': option.disabled,
            }"
            role="option"
            :aria-selected="option.value === modelValue"
            :aria-disabled="option.disabled"
            @click.stop="selectOption(option)"
          >
            {{ option.label }}
          </div>
          <div v-if="options.length === 0" class="nm-select__option nm-select__option--empty">
            暂无选项
          </div>
        </div>
      </transition>
    </div>
    <div v-if="error && typeof error === 'string'" class="nm-select__error">{{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-select__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-select__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-primary);
}

.nm-select__required {
  color: #e74c3c;
  margin-left: 2px;
}

.nm-select {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 8px);
  @include nm-theme-transition;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--focused,
  &--open {
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
  }
}

.nm-select__value {
  flex: 1;
  font-size: 14px;
  color: var(--nm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--placeholder { color: var(--nm-text-placeholder); }
}

.nm-select__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.nm-select__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-secondary);
  border-radius: 50%;
  transition: color var(--nm-transition-fast);
  &:hover { color: var(--nm-text-primary); }
}

.nm-select__arrow {
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);
  &--open { transform: rotate(180deg); }
}

.nm-select__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  padding: 4px;
}

.nm-select__option {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  transition: background-color var(--nm-transition-fast);

  &:hover:not(&--disabled):not(&--empty) {
    background-color: var(--nm-surface-raised);
  }

  &--selected {
    color: var(--nm-primary-color);
    font-weight: 600;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--empty {
    color: var(--nm-text-placeholder);
    cursor: default;
  }
}

// Sizes
.nm-select--small {
  min-height: 36px;
  padding: 6px 12px;
  .nm-select__value { font-size: 13px; }
}

.nm-select--medium {
  min-height: 48px;
  padding: 10px 16px;
}

.nm-select--large {
  min-height: 60px;
  padding: 14px 20px;
  .nm-select__value { font-size: 16px; }
}

.nm-select__error {
  font-size: 12px;
  color: #e74c3c;
}

// Dropdown transition
.nm-select-dropdown-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.nm-select-dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nm-select-dropdown-enter-from { opacity: 0; transform: translateY(-6px); }
.nm-select-dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
