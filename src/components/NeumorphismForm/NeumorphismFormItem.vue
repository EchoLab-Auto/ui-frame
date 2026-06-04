<script setup lang="ts">
import { computed, ref, inject, onMounted, onBeforeUnmount, watch } from 'vue'
import { validateFieldValue } from '@/composables/useFormValidation'
import type { FormRule } from '@/composables/useFormValidation'
import { FormKey } from '@/composables/injectionKeys'
import { generateId } from '@/utils'

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

const form = inject(FormKey, null)

const localError = ref('')
const formError = computed(() => (props.name ? form?.errors[props.name] : undefined))
const displayError = computed(() => props.error || formError.value || localError.value)

const fieldId = computed(() => props.name ? `nm-field-${props.name}` : generateId('nm-field'))

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

// Register with parent form when name is provided
onMounted(() => {
  if (props.name && form) {
    form.registerField(props.name, validate)
  }
})

watch(
  () => props.name,
  (newName, oldName) => {
    if (oldName && form) form.unregisterField(oldName)
    if (newName && form) form.registerField(newName, validate)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (props.name && form) {
    form.unregisterField(props.name)
  }
})

defineExpose({ validate, clearError, fieldId })
</script>

<template>
  <div
    class="nm-form-item"
    :class="{ 'nm-form-item--error': !!displayError }"
  >
    <label
      v-if="label"
      :for="name ? fieldId : undefined"
      class="nm-form-item__label"
      :style="form?.labelWidth ? { width: form.labelWidth } : undefined"
    >
      {{ label }}
      <span v-if="required" class="nm-form-item__required">*</span>
    </label>
    <div class="nm-form-item__content">
      <slot :error="displayError" :validate="validate" :field-id="fieldId" />
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
