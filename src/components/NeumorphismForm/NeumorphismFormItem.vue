<script setup lang="ts">
import { computed, ref } from 'vue'

export interface FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  validator?: (value: unknown) => boolean | string
  trigger?: 'change' | 'blur' | 'input'
}

export interface NeumorphismFormItemProps {
  label?: string
  required?: boolean
  error?: string
  rules?: FormRule[]
  name?: string
}

const props = withDefaults(defineProps<NeumorphismFormItemProps>(), {
  rules: () => [],
})

const localError = ref('')

const displayError = computed(() => props.error || localError.value)

function validate(value: unknown): boolean {
  const fieldRules = props.rules
  if (!fieldRules.length) return true

  for (const rule of fieldRules) {
    if (rule.required && (value == null || value === '')) {
      localError.value = rule.message || '必填字段'
      return false
    }
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        localError.value = rule.message || `最少 ${rule.minLength} 个字符`
        return false
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        localError.value = rule.message || `最多 ${rule.maxLength} 个字符`
        return false
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        localError.value = rule.message || '格式不正确'
        return false
      }
    }
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        localError.value = rule.message || `不能小于 ${rule.min}`
        return false
      }
      if (rule.max !== undefined && value > rule.max) {
        localError.value = rule.message || `不能大于 ${rule.max}`
        return false
      }
    }
    if (rule.validator) {
      const result = rule.validator(value)
      if (typeof result === 'string') { localError.value = result; return false }
      if (result === false) { localError.value = rule.message || '验证失败'; return false }
    }
  }

  localError.value = ''
  return true
}

function clearError() {
  localError.value = ''
}

defineExpose({ validate, clearError })
</script>

<template>
  <div class="nm-form-item" :class="{ 'nm-form-item--error': !!displayError }">
    <label v-if="label" class="nm-form-item__label">
      {{ label }}
      <span v-if="required" class="nm-form-item__required">*</span>
    </label>
    <div class="nm-form-item__content">
      <slot :error="displayError" :validate="validate" />
    </div>
    <div v-if="displayError" class="nm-form-item__error" role="alert">
      {{ displayError }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.nm-form-item {
  margin-bottom: 20px;
}

.nm-form-item__label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-primary);
  margin-bottom: 6px;
}

.nm-form-item__required {
  color: #e74c3c;
  margin-left: 2px;
}

.nm-form-item__content {
  width: 100%;
}

.nm-form-item__error {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}
</style>
