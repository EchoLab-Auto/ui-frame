<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { generateId } from '@/utils'

export type InputSize = 'small' | 'medium' | 'large'

export interface NeumorphismInputProps {
  /** v-model binding */
  modelValue?: string
  /** Input type attribute */
  type?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the input is readonly */
  readonly?: boolean
  /** Whether the input is required */
  required?: boolean
  /** Input size */
  size?: InputSize
  /** Maximum length */
  maxlength?: number | string
  /** Minimum length */
  minlength?: number | string
  /** Native input name attribute */
  name?: string
  /** Native input id (auto-generated if not provided) */
  id?: string
  /** Native autocomplete attribute */
  autocomplete?: string
  /** Error message or state */
  error?: string | boolean
  /** Label text */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismInputProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  size: 'medium',
  autocomplete: 'off',
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

const slots = useSlots()
const inputId = computed(() => props.id || generateId('nm-input'))
const isFocused = ref(false)

const hasValue = computed(() => props.modelValue.length > 0)

const classList = computed(() => [
  'nm-input',
  `nm-input--${props.size}`,
  {
    'nm-input--focused': isFocused.value,
    'nm-input--disabled': props.disabled,
    'nm-input--readonly': props.readonly,
    'nm-input--error': !!props.error,
    'nm-input--has-prefix': !!slots.prefix,
    'nm-input--has-suffix': !!slots.suffix,
    'nm-input--has-label': !!props.label,
    'nm-input--filled': hasValue.value,
  },
])

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

function handleChange(event: Event): void {
  emit('change', event)
}

function handleFocus(event: FocusEvent): void {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event: FocusEvent): void {
  isFocused.value = false
  emit('blur', event)
}

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
  if (event.key === 'Enter') {
    emit('enter', props.modelValue)
  }
}
</script>

<template>
  <div class="nm-input__wrapper">
    <label
      v-if="label"
      :for="inputId"
      class="nm-input__label"
    >
      {{ label }}
      <span v-if="required" class="nm-input__required">*</span>
    </label>

    <div :class="classList">
      <div v-if="$slots.prefix" class="nm-input__prefix">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :name="name"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-errormessage="error && typeof error === 'string' ? `${inputId}-error` : undefined"
        :aria-describedby="error && typeof error === 'string' ? `${inputId}-error` : undefined"
        class="nm-input__field"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >

      <div v-if="$slots.suffix" class="nm-input__suffix">
        <slot name="suffix" />
      </div>
    </div>

    <div v-if="error && typeof error === 'string'" :id="`${inputId}-error`" class="nm-input__error-text" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-input__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-input__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-primary);
  transition: color var(--nm-transition-slow);
}

.nm-input__required {
  color: var(--nm-color-error);
  margin-left: 2px;
}

.nm-input {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  overflow: hidden;
  @include nm-inset(4px, 8px);
  transition:
    box-shadow 0.3s ease,
    background-color var(--nm-transition-slow);

  // Hover — slightly deepen the inset
  &:not(.nm-input--disabled):not(.nm-input--focused):hover {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
  }

  // Focus state — inset deepens + colored ring
  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transition:
      box-shadow 0.25s ease,
      background-color var(--nm-transition-slow);
  }

  // Error state
  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px var(--nm-color-error);

    &.nm-input--focused {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 3px var(--nm-color-error);
    }
  }

  // Disabled state
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.nm-input__field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: 14px;
  width: 100%;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// ---------- Size variants ----------

.nm-input--small {
  min-height: 36px;

  .nm-input__field {
    padding: 6px 12px;
    font-size: 13px;
  }

  .nm-input__prefix,
  .nm-input__suffix {
    padding: 6px 10px;
  }
}

.nm-input--medium {
  min-height: 48px;

  .nm-input__field {
    padding: 10px 16px;
    font-size: 14px;
  }

  .nm-input__prefix,
  .nm-input__suffix {
    padding: 10px 14px;
  }
}

.nm-input--large {
  min-height: 60px;

  .nm-input__field {
    padding: 14px 20px;
    font-size: 16px;
  }

  .nm-input__prefix,
  .nm-input__suffix {
    padding: 14px 16px;
  }
}

// Prefix / Suffix
.nm-input__prefix,
.nm-input__suffix {
  display: flex;
  align-items: center;
  color: var(--nm-text-secondary);
  flex-shrink: 0;
}

.nm-input__prefix {
  padding-right: 0;
}

.nm-input__suffix {
  padding-left: 0;
}

// Error text
.nm-input__error-text {
  font-size: 12px;
  color: var(--nm-color-error);
  margin-top: 2px;
}
</style>
