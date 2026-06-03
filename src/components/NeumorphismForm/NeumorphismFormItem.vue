<script setup lang="ts">
import { computed, ref } from 'vue'
import { validateFieldValue } from '@/composables/useFormValidation'
import type { FormRule } from '@/composables/useFormValidation'

export type { FormRule }

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

  const errorMsg = validateFieldValue(value, fieldRules)
  if (errorMsg) {
    localError.value = errorMsg
    return false
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
  color: var(--nm-color-error);
  margin-left: 2px;
}

.nm-form-item__content {
  width: 100%;
}

.nm-form-item__error {
  font-size: 12px;
  color: var(--nm-color-error);
  margin-top: 4px;
}
</style>
