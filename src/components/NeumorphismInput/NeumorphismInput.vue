<script setup lang="ts">
import { computed, useSlots, useAttrs } from 'vue'
import { useFormField } from '@/composables/useFormField'
import { useConfig } from '@/composables/useConfig'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'

defineOptions({ inheritAttrs: false })

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
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
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

const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.input?.size ?? 'medium')

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
const attrs = useAttrs()

const inputAttrs = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      result[key] = attrs[key]
    }
  }
  return result
})

const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } = useFormField(() => ({
  id: props.id,
  size: resolvedSize.value,
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
  <div class="nm-input__wrapper" :class="attrs.class" :style="attrs.style">
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
        :inputmode="inputmode"
        :aria-invalid="!!error"
        :aria-errormessage="errorMessage ? `${fieldId}-error` : undefined"
        :aria-describedby="errorMessage ? `${fieldId}-error` : undefined"
        class="nm-input__field"
        v-bind="inputAttrs"
        @input="handleInput"
        @change="handleChange"
        @focus="(e: FocusEvent) => handleFocus(e, emit)"
        @blur="(e: FocusEvent) => handleBlur(e, emit)"
        @keydown="handleKeydown"
      />

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
    box-shadow 0.35s $nm-ease-spring,
    background-color var(--nm-transition-slow),
    transform 0.3s $nm-ease-spring;

  &:not(.nm-input--disabled):not(.nm-input--focused):hover {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
    transform: translateY(-1px);
  }

  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transition:
      box-shadow 0.3s $nm-ease-spring,
      background-color var(--nm-transition-slow),
      transform 0.3s $nm-ease-spring;
    transform: translateY(-1px);
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

  // Error shake animation
  &--error-shake {
    animation: nm-input-shake 0.4s $nm-ease-compress;
  }
}

@keyframes nm-input-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-input {
    transition: none;
  }
  .nm-input--error-shake {
    animation: none;
  }
}

.nm-input__field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: var(--nm-font-base);
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
  min-height: var(--nm-field-min-height-sm);
  .nm-input__field {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
    font-size: var(--nm-field-font-sm);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-affix-padding-x-sm);
  }
}

.nm-input--medium {
  min-height: var(--nm-field-min-height-md);
  .nm-input__field {
    padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
    font-size: var(--nm-field-font-md);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-md) var(--nm-field-affix-padding-x-md);
  }
}

.nm-input--large {
  min-height: var(--nm-field-min-height-lg);
  .nm-input__field {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
    font-size: var(--nm-field-font-lg);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-affix-padding-x-lg);
  }
}

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
</style>
