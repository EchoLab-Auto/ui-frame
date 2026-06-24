<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useAutoComplete } from '@/composables/useAutoComplete'
import type { AutoCompleteOption } from '@/composables/useAutoComplete'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import NeumorphismInput from '@/components/NeumorphismInput/NeumorphismInput.vue'

export type { AutoCompleteOption as NeumorphismAutoCompleteOption }

export interface NeumorphismAutoCompleteProps {
  /** v-model value (the selected option's value) */
  modelValue?: string | number
  /** Available options for local filtering */
  options?: AutoCompleteOption[]
  /** Placeholder text when input is empty */
  placeholder?: string
  /** Whether the autocomplete is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Show a clear button when there is a value */
  clearable?: boolean
  /** External loading state (for async search) */
  loading?: boolean
  /** Label displayed above the input */
  label?: string
  /** Debounce delay in ms for async search */
  debounce?: number
  /** Async search function */
  searchFn?: (query: string) => Promise<AutoCompleteOption[]>
}

const props = withDefaults(defineProps<NeumorphismAutoCompleteProps>(), {
  modelValue: undefined,
  options: () => [],
  placeholder: '',
  disabled: false,
  size: 'medium',
  clearable: true,
  loading: false,
  debounce: 300,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
  (e: 'select', option: AutoCompleteOption): void
  (e: 'search', query: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

// ---- Config cascade via useNeumorphismSetup ----
const { resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() =>
  resolveProp<'small' | 'medium' | 'large'>(props.size, undefined, 'medium')
)

// ---- v-model sync ----
const modelRef = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
  },
})

// ---- Loading ref for composable ----
const loadingRef = computed(() => props.loading)

// ---- Headless autocomplete composable ----
const {
  inputValue,
  isOpen,
  filteredOptions,
  activeIndex,
  highlightMatch,
  selectOption,
  handleKeydown,
  handleInput,
  open,
  close,
  cleanupTimers,
} = useAutoComplete({
  modelValue: modelRef,
  options: computed(() => props.options),
  searchFn: props.searchFn,
  loading: loadingRef,
  debounceMs: props.debounce,
})

// ---- Dropdown positioning ----
const triggerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

function updateDropdownPosition() {
  if (!triggerRef.value || typeof window === 'undefined') return
  const rect = triggerRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
    width: rect.width,
  }
}

watch(isOpen, open => {
  if (open) {
    nextTick(updateDropdownPosition)
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
    }
  } else {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }
})

// ---- Click outside detection ----
function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value || props.disabled) return
  const target = event.target as Node
  if (triggerRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  close()
}

function registerClickOutside() {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocumentClick, true)
  }
}

function unregisterClickOutside() {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocumentClick, true)
  }
}

watch(isOpen, open => {
  if (open) {
    nextTick(registerClickOutside)
  } else {
    unregisterClickOutside()
  }
})

onBeforeUnmount(() => {
  unregisterClickOutside()
  cleanupTimers()
})

// ---- Scroll active option into view ----
watch(activeIndex, idx => {
  if (!dropdownRef.value || idx < 0) return
  nextTick(() => {
    const active = dropdownRef.value?.querySelector(
      '.nm-autocomplete__option--active'
    ) as HTMLElement | null
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  })
})

// ---- Dropdown style ----
const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`,
}))

// ---- Handlers ----
function onSelectOption(option: AutoCompleteOption) {
  selectOption(option)
  emit('select', option)
}

function onInputKeydown(event: KeyboardEvent) {
  handleKeydown(event)
}

// Expose focus/blur passthrough
function onInputFocus(event: FocusEvent) {
  emit('focus', event)
  if (!isOpen.value && inputValue.value.length > 0) {
    open()
  }
}

function onInputBlur(event: FocusEvent) {
  // Let click on dropdown option fire before blur closes the dropdown
  setTimeout(() => {
    if (dropdownRef.value && document.activeElement) {
      if (dropdownRef.value.contains(document.activeElement)) return
    }
    emit('blur', event)
    close()
  }, 150)
}

function onClear() {
  inputValue.value = ''
  modelRef.value = undefined
  activeIndex.value = -1
  emit('update:modelValue', undefined)
  emit('search', '')
  close()
}

function onSearch(value: string) {
  emit('search', value)
  handleInput(value)
}

// ---- Class list ----
const wrapperClass = computed(() => [
  'nm-autocomplete',
  `nm-autocomplete--${resolvedSize.value}`,
  {
    'nm-autocomplete--disabled': props.disabled,
    'nm-autocomplete--open': isOpen.value,
    'nm-autocomplete--has-value': inputValue.value.length > 0,
  },
])

const hasFilteredOptions = computed(() => filteredOptions.value.length > 0)
const showEmpty = computed(
  () => !hasFilteredOptions.value && inputValue.value.trim().length > 0 && !loadingRef.value
)
const isLoadingState = computed(() => loadingRef.value)
</script>

<template>
  <div ref="triggerRef" :class="wrapperClass">
    <NeumorphismInput
      :model-value="inputValue"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="resolvedSize"
      :autocomplete="'off'"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      aria-autocomplete="list"
      @update:model-value="onSearch"
      @focus="onInputFocus"
      @blur="onInputBlur"
      @keydown="onInputKeydown"
    >
      <!-- Suffix: clear button + loading spinner + dropdown arrow -->
      <template #suffix>
        <div class="nm-autocomplete__suffix">
          <!-- Clear button -->
          <button
            v-if="clearable && inputValue.length > 0 && !isLoadingState"
            class="nm-autocomplete__clear"
            type="button"
            aria-label="Clear"
            @mousedown.prevent
            @click.stop="onClear"
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

          <!-- Loading spinner -->
          <span v-if="isLoadingState" class="nm-autocomplete__spinner" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
            </svg>
          </span>

          <!-- Dropdown arrow -->
          <svg
            class="nm-autocomplete__arrow"
            :class="{ 'nm-autocomplete__arrow--open': isOpen }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </template>
    </NeumorphismInput>

    <!-- Dropdown (teleported to body for correct z-index stacking) -->
    <teleport to="body">
      <transition name="nm-autocomplete-dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :class="['nm-autocomplete__dropdown', { 'nm-autocomplete__dropdown--empty': showEmpty }]"
          role="listbox"
          :style="dropdownStyle"
        >
          <!-- Options -->
          <template v-if="hasFilteredOptions">
            <div
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              class="nm-autocomplete__option"
              :class="{
                'nm-autocomplete__option--active': index === activeIndex,
                'nm-autocomplete__option--disabled': option.disabled,
              }"
              role="option"
              :aria-selected="index === activeIndex"
              :aria-disabled="option.disabled"
              @mousedown.prevent
              @click.stop="onSelectOption(option)"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="nm-autocomplete__option-label" v-html="highlightMatch(option.label)" />
            </div>
          </template>

          <!-- Empty state -->
          <div v-else-if="showEmpty" class="nm-autocomplete__empty">
            {{ 'No matching results' }}
          </div>

          <!-- Loading state -->
          <div v-else-if="isLoadingState" class="nm-autocomplete__loading">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="nm-autocomplete__loading-icon"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
            </svg>
            <span>Searching…</span>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Wrapper
// ==========================================

.nm-autocomplete {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  width: 100%;

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

// ==========================================
// Suffix actions (clear + spinner + arrow)
// ==========================================

.nm-autocomplete__suffix {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  flex-shrink: 0;
}

.nm-autocomplete__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-secondary);
  border-radius: var(--nm-border-radius-full);
  transition: color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 1px;
  }
}

.nm-autocomplete__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nm-primary-color);
  animation: nm-autocomplete-spin 0.8s linear infinite;
}

@keyframes nm-autocomplete-spin {
  to {
    transform: rotate(360deg);
  }
}

.nm-autocomplete__arrow {
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);
  flex-shrink: 0;

  &--open {
    transform: rotate(180deg);
  }
}

// ==========================================
// Dropdown panel (teleported to body)
// ==========================================

.nm-autocomplete__dropdown {
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  @include nm-theme-transition;
  padding: var(--nm-spacing-xs);

  &--empty {
    min-height: 48px;
    display: flex;
    align-items: center;
  }
}

// ==========================================
// Option items
// ==========================================

.nm-autocomplete__option {
  display: flex;
  align-items: center;
  padding: var(--nm-select-option-padding-y, 6px) var(--nm-select-option-padding-x, 12px);
  font-size: var(--nm-select-option-font, var(--nm-font-base));
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  transition:
    background-color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring,
    box-shadow 0.25s $nm-ease-ambient;

  &:last-child {
    margin-bottom: 0;
  }

  &--active {
    background-color: var(--nm-surface-raised);
    transform: translateX(3px);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  &:hover:not(&--disabled) {
    background-color: var(--nm-surface-raised);
    transform: translateX(3px);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// ---- Highlighted match text ----
.nm-autocomplete__option-label {
  :deep(.nm-autocomplete__mark) {
    font-weight: 600;
    color: var(--nm-primary-color);
    background: transparent;
  }
}

// ==========================================
// Empty state
// ==========================================

.nm-autocomplete__empty {
  padding: var(--nm-select-option-padding-y, 6px) var(--nm-select-option-padding-x, 12px);
  font-size: var(--nm-font-base);
  color: var(--nm-text-placeholder);
  text-align: center;
  width: 100%;
}

// ==========================================
// Loading state
// ==========================================

.nm-autocomplete__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-select-option-padding-y, 10px) var(--nm-select-option-padding-x, 12px);
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
  width: 100%;
}

.nm-autocomplete__loading-icon {
  animation: nm-autocomplete-spin 0.8s linear infinite;
  color: var(--nm-primary-color);
  flex-shrink: 0;
}

// ==========================================
// Dropdown transition
// ==========================================

.nm-autocomplete-dropdown-enter-active {
  transition:
    opacity 0.25s $nm-ease-decelerate,
    transform 0.25s $nm-ease-spring;
}

.nm-autocomplete-dropdown-leave-active {
  transition:
    opacity 0.15s $nm-ease-accelerate,
    transform 0.15s $nm-ease-accelerate;
}

.nm-autocomplete-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.nm-autocomplete-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

// ==========================================
// Accessibility: reduced motion
// ==========================================

@media (prefers-reduced-motion: reduce) {
  .nm-autocomplete__option {
    transition: none;
  }

  .nm-autocomplete__spinner,
  .nm-autocomplete__loading-icon {
    animation: none;
  }

  .nm-autocomplete-dropdown-enter-active,
  .nm-autocomplete-dropdown-leave-active {
    transition: none;
  }
}
</style>
