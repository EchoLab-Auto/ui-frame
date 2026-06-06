<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useSelect } from '@/composables/useSelect'
import type { SelectOption } from '@/composables/useSelect'
import { useFormField } from '@/composables/useFormField'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
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
  placeholder: '',
  disabled: false,
  size: 'medium',
  clearable: false,
  emptyText: '',
  clearLabel: '',
  listLabel: '',
})

const config = useConfig()
const { t } = useLocale()
const resolvedSize = computed(() => props.size ?? config.value.select?.size ?? 'medium')
const resolvedPlaceholder = computed(() => props.placeholder || t('selectPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText || t('selectEmpty'))
const resolvedClearLabel = computed(() => props.clearLabel || t('selectClear'))
const resolvedListLabel = computed(() => props.listLabel || t('selectListLabel'))

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

// Use headless select composable for all behavioral logic
const modelRef = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const {
  isOpen,
  selectedOption,
  toggleOpen,
  selectOption,
  clearValue,
  handleKeydown,
  handleBlur: onSelectBlur,
} = useSelect({
  modelValue: modelRef,
  options: computed(() => props.options),
  disabled: computed(() => props.disabled),
})

const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } = useFormField(() => ({
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
    'nm-select--has-value':
      props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null,
  },
])

function onClear(event: Event) {
  event.stopPropagation()
  clearValue()
}

const triggerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + window.scrollY + 6,
    left: rect.left + window.scrollX,
    width: rect.width,
  }
}

watch(isOpen, open => {
  if (open) {
    nextTick(updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
  } else {
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
  }
})

const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`,
}))

function onContainerBlur(e: FocusEvent) {
  // When dropdown is teleported to body, focus may move to dropdown items.
  // Don't close in that case — let the click handler do its work.
  if (dropdownRef.value?.contains(e.relatedTarget as Node)) {
    return
  }
  onSelectBlur(e.relatedTarget, e.currentTarget as HTMLElement)
  handleBlur(e, emit)
}
</script>

<template>
  <div class="nm-select__wrapper">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />
    <div
      ref="triggerRef"
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
          {{ selectedOption?.label || resolvedPlaceholder }}
        </slot>
      </span>
      <span class="nm-select__actions">
        <button
          v-if="clearable && selectedOption"
          class="nm-select__clear"
          type="button"
          :aria-label="resolvedClearLabel"
          @click="onClear"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <svg
          class="nm-select__arrow"
          :class="{ 'nm-select__arrow--open': isOpen }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>

      <teleport to="body">
        <transition name="nm-select-dropdown">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            class="nm-select__dropdown"
            role="listbox"
            :aria-label="label || resolvedListLabel"
            :style="dropdownStyle"
          >
            <!-- @slot Custom option rendering. Bind: option, selected, index, select -->
            <slot
              v-for="(option, index) in options"
              :key="option.value"
              name="option"
              :option="option"
              :selected="option.value === modelValue"
              :index="index"
              :select="selectOption"
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
                @click.stop="selectOption(option)"
              >
                {{ option.label }}
              </div>
            </slot>
            <div v-if="options.length === 0" class="nm-select__option nm-select__option--empty">
              {{ resolvedEmptyText }}
            </div>
          </div>
        </transition>
      </teleport>
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

  &--placeholder {
    color: var(--nm-text-placeholder);
  }
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
  &:hover {
    color: var(--nm-text-primary);
  }
}

.nm-select__arrow {
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);
  &--open {
    transform: rotate(180deg);
  }
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
  transition:
    background-color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring,
    box-shadow 0.25s $nm-ease-ambient;
  position: relative;

  &:hover:not(&--disabled):not(&--empty) {
    background-color: var(--nm-surface-raised);
    transform: translateX(3px);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  &--selected {
    color: var(--nm-primary-color);
    font-weight: 600;
  }

  &--selected::after {
    content: '';
    position: absolute;
    right: 12px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--nm-primary-color);
    box-shadow: 0 0 6px rgba(108, 122, 224, 0.4);
    animation: nm-select-dot-pop 0.35s $nm-ease-bounce;
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
  .nm-select__value {
    font-size: 13px;
  }
}

.nm-select--medium {
  min-height: 48px;
  padding: 10px 16px;
}

.nm-select--large {
  min-height: 60px;
  padding: 14px 20px;
  .nm-select__value {
    font-size: 16px;
  }
}

// Dropdown transition
.nm-select-dropdown-enter-active {
  transition:
    opacity 0.25s $nm-ease-decelerate,
    transform 0.25s $nm-ease-spring;
}
.nm-select-dropdown-leave-active {
  transition:
    opacity 0.15s $nm-ease-accelerate,
    transform 0.15s $nm-ease-accelerate;
}
.nm-select-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
.nm-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@keyframes nm-select-dot-pop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-select__option {
    transition: none;
  }
  .nm-select__option--selected::after {
    animation: none;
  }
}
</style>
