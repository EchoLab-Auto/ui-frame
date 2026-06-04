<script setup lang="ts">
import { computed, provide, reactive, onBeforeUnmount } from 'vue'
import { validateFieldValue } from '@/composables/useFormValidation'
import type { FormRule } from '@/composables/useFormValidation'
import { FormKey } from '@/composables/injectionKeys'

export type { FormRule }

export interface NeumorphismFormProps {
  model?: Record<string, unknown>
  rules?: Record<string, FormRule[]>
  labelWidth?: string
  size?: 'small' | 'medium' | 'large'
  direction?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<NeumorphismFormProps>(), {
  model: () => ({}),
  rules: () => ({}),
  direction: 'vertical',
})

const emit = defineEmits<{
  (e: 'submit', model: Record<string, unknown>): void
  (e: 'validate', valid: boolean): void
}>()

const errors = reactive<Record<string, string>>({})
const fieldValidators = new Map<string, (value: unknown) => boolean>()

function validateField(name: string): boolean {
  // Try rules-based validation first
  const fieldRules = props.rules[name]
  if (fieldRules) {
    const value = props.model[name]
    const errorMsg = validateFieldValue(value, fieldRules)
    if (errorMsg) {
      errors[name] = errorMsg
      return false
    }
  }

  // Also run the FormItem's own validator if registered
  const itemValidator = fieldValidators.get(name)
  if (itemValidator) {
    if (!itemValidator(props.model[name])) {
      return false
    }
  } else if (!fieldRules) {
    // No rules and no registered validator — clean up any stale error
    delete errors[name]
    return true
  }

  delete errors[name]
  return true
}

function validateAll(): boolean {
  let valid = true
  // Validate all fields that have rules or registered validators
  const allNames = new Set([
    ...Object.keys(props.rules),
    ...fieldValidators.keys(),
  ])
  for (const name of allNames) {
    if (!validateField(name)) valid = false
  }
  // Clean up errors for fields no longer in rules or validators
  for (const name of Object.keys(errors)) {
    if (!allNames.has(name)) delete errors[name]
  }
  emit('validate', valid)
  return valid
}

function registerField(name: string, validateFn: (value: unknown) => boolean) {
  fieldValidators.set(name, validateFn)
}

function unregisterField(name: string) {
  fieldValidators.delete(name)
  delete errors[name]
}

function handleSubmit(event: Event) {
  event.preventDefault()
  if (validateAll()) {
    emit('submit', { ...props.model })
  }
}

function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k])
}

provide(FormKey, {
  model: props.model,
  rules: props.rules,
  errors,
  labelWidth: props.labelWidth,
  size: props.size,
  validateField,
  registerField,
  unregisterField,
})

onBeforeUnmount(() => {
  fieldValidators.clear()
})

const classList = computed(() => [
  'nm-form',
  `nm-form--${props.direction}`,
])

defineExpose({ validateAll, validateField, clearErrors })
</script>

<template>
  <form :class="classList" @submit="handleSubmit" novalidate>
    <slot :errors="errors" :validate-all="validateAll" :clear-errors="clearErrors" />
  </form>
</template>

<style scoped lang="scss">
.nm-form {
  display: flex;
  flex-direction: column;

  &--horizontal {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }

  &--vertical {
    gap: 0;
  }
}
</style>
