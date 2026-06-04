<script setup lang="ts">
import { computed } from 'vue'
import { useSelect } from '@/composables/useSelect'
import type { SelectOption } from '@/composables/useSelect'
import { useFormField } from '@/composables/useFormField'
import { useConfig } from '@/composables/useConfig'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'

export type { SelectOption as NeumorphismSelectOption }

export interface NeumorphismSelectProps {
  modelValue?: string | number
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  label?: string
  required?: boolean
  error?: string | boolean
  name?: string
  id?: string
  clearable?: boolean
  emptyText?: string
  clearLabel?: string
  listLabel?: string
}

const props = withDefaults(defineProps<NeumorphismSelectProps>(), {
  modelValue: '',
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  size: 'medium',
  clearable: false,
  emptyText: '暂无选项',
  clearLabel: '清除选择',
  listLabel: '选项列表',
})

const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.select?.size ?? 'medium')

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

// Use headless select composable for all behavioral logic
const modelRef = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const { isOpen, selectedOption, toggleOpen, clearValue, handleKeydown, handleBlur: onSelectBlur } =
  useSelect({
    modelValue: modelRef,
    options: computed(() => props.options),
    disabled: computed(() => props.disabled),
  })

const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } =
  useFormField(() => ({
    id: props.id,
    size: resolvedSize.value,
    disabled: props.disabled,
    error: props.error,
    prefix: 'select',
  }))

const classList = computed(() => [
  ...baseClassList('nm-select').value,
  {
    'nm-select--open': isOpen.value,
    'nm-select--has-value': props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null,
  },
])

function onClear(event: Event) {
  event.stopPropagation()
  clearValue()
}

function onContainerBlur(e: FocusEvent) {
  onSelectBlur(e.relatedTarget, e.currentTarget as HTMLElement)
  handleBlur(e, emit)
}
</script>

<template>
  <div class="nm-select__wrapper">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />
    <div
      :class="classList"
      :tabindex="disabled ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :aria-labelledby="label ? fieldId : undefined"
      @click="toggleOpen"
      @focus="(e: FocusEvent) => handleFocus(e, emit)"
      @blur="onContainerBlur"
      @keydown="handleKeydown"
    >
      <span class="nm-select__value" :class="{ 'nm-select__value--placeholder': !selectedOption }">
        <!-- @slot Custom selected value display -->
        <slot name="value" :option="selectedOption">
          {{ selectedOption?.label || placeholder }}
        </slot>
      </span>
      <span class="nm-select__actions">
        <button
          v-if="clearable && selectedOption"
          class="nm-select__clear"
          type="button"
          @click="onClear"
          :aria-label="clearLabel"
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
          <!-- @slot Custom option rendering. Bind: option, selected, index -->
          <slot
            v-for="(option, index) in options"
            :key="option.value"
            name="option"
            :option="option"
            :selected="option.value === modelValue"
            :index="index"
          >
            <div
              class="nm-select__option"
              :class="{
                'nm-select__option--selected': option.value === modelValue,
                'nm-select__option--disabled': option.disabled,
              }"
              role="option"
              :aria-selected="option.value === modelValue"
              :aria-disabled="option.disabled"
              @click.stop="modelRef = option.value"
            >
              {{ option.label }}
            </div>
          </slot>
          <div v-if="options.length === 0" class="nm-select__option nm-select__option--empty">
            {{ emptyText }}
          </div>
        </div>
      </transition>
    </div>
    <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
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
      0 0 0 2px var(--nm-color-error);
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

// Dropdown transition
.nm-select-dropdown-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.nm-select-dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nm-select-dropdown-enter-from { opacity: 0; transform: translateY(-6px); }
.nm-select-dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
