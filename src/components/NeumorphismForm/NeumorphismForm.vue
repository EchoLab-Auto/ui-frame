<script setup lang="ts">
import { computed, provide, reactive } from 'vue'
import type { FormRule } from './NeumorphismFormItem.vue'

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

  for (const rule of fieldRules) {
    if (rule.required && (value == null || value === '')) {
      errors[name] = rule.message || '必填字段'
      return false
    }
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) { errors[name] = rule.message || `最少 ${rule.minLength} 个字符`; return false }
      if (rule.maxLength && value.length > rule.maxLength) { errors[name] = rule.message || `最多 ${rule.maxLength} 个字符`; return false }
      if (rule.pattern && !rule.pattern.test(value)) { errors[name] = rule.message || '格式不正确'; return false }
    }
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) { errors[name] = rule.message || `不能小于 ${rule.min}`; return false }
      if (rule.max !== undefined && value > rule.max) { errors[name] = rule.message || `不能大于 ${rule.max}`; return false }
    }
    if (rule.validator) {
      const result = rule.validator(value)
      if (typeof result === 'string') { errors[name] = result; return false }
      if (result === false) { errors[name] = rule.message || '验证失败'; return false }
    }
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
