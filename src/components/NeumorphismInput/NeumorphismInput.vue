<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useFormField } from '@/composables/useFormField'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'

export type InputSize = 'small' | 'medium' | 'large'

export interface NeumorphismInputProps {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: InputSize
  maxlength?: number | string
  minlength?: number | string
  name?: string
  id?: string
  autocomplete?: string
  error?: string | boolean
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

const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } =
  useFormField(() => ({
    id: props.id,
    size: props.size,
    disabled: props.disabled,
    error: props.error,
    prefix: 'input',
  }))

const hasValue = computed(() => props.modelValue.length > 0)

const classList = computed(() => [
  ...baseClassList('nm-input').value,
  {
    'nm-input--readonly': props.readonly,
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

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
  if (event.key === 'Enter') {
    emit('enter', props.modelValue)
  }
}
</script>

<template>
  <div class="nm-input__wrapper">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />

    <div :class="classList">
      <div v-if="$slots.prefix" class="nm-input__prefix">
        <slot name="prefix" />
      </div>

      <input
        :id="fieldId"
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
        :aria-errormessage="errorMessage ? `${fieldId}-error` : undefined"
        :aria-describedby="errorMessage ? `${fieldId}-error` : undefined"
        class="nm-input__field"
        @input="handleInput"
        @change="handleChange"
        @focus="(e: FocusEvent) => handleFocus(e, emit)"
        @blur="(e: FocusEvent) => handleBlur(e, emit)"
        @keydown="handleKeydown"
      >

      <div v-if="$slots.suffix" class="nm-input__suffix">
        <slot name="suffix" />
      </div>
    </div>

    <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
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

  &:not(.nm-input--disabled):not(.nm-input--focused):hover {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
  }

  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transition:
      box-shadow 0.25s ease,
      background-color var(--nm-transition-slow);
  }

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

// Size variants
.nm-input--small {
  min-height: 36px;
  .nm-input__field { padding: 6px 12px; font-size: 13px; }
  .nm-input__prefix, .nm-input__suffix { padding: 6px 10px; }
}

.nm-input--medium {
  min-height: 48px;
  .nm-input__field { padding: 10px 16px; font-size: 14px; }
  .nm-input__prefix, .nm-input__suffix { padding: 10px 14px; }
}

.nm-input--large {
  min-height: 60px;
  .nm-input__field { padding: 14px 20px; font-size: 16px; }
  .nm-input__prefix, .nm-input__suffix { padding: 14px 16px; }
}

.nm-input__prefix,
.nm-input__suffix {
  display: flex;
  align-items: center;
  color: var(--nm-text-secondary);
  flex-shrink: 0;
}

.nm-input__prefix { padding-right: 0; }
.nm-input__suffix { padding-left: 0; }
</style>
