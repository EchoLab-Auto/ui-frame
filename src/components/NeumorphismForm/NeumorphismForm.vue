<script setup lang="ts">
import { computed, provide, reactive } from 'vue'
import { validateFieldValue } from '@/composables/useFormValidation'
import type { FormRule } from '@/composables/useFormValidation'

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

function validateField(name: string): boolean {
  const fieldRules = props.rules[name] || []
  const value = props.model[name]

  const errorMsg = validateFieldValue(value, fieldRules)
  if (errorMsg) {
    errors[name] = errorMsg
    return false
  }

  delete errors[name]
  return true
}

function validateAll(): boolean {
  let valid = true
  for (const name of Object.keys(props.rules)) {
    if (!validateField(name)) valid = false
  }
  for (const name of Object.keys(props.model)) {
    if (!props.rules[name]) delete errors[name]
  }
  emit('validate', valid)
  return valid
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

provide('nm-form', {
  model: props.model,
  rules: props.rules,
  errors,
  validateField,
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
