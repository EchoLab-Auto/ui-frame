<script setup lang="ts">
import { computed } from 'vue'
import { useCheckable } from '@/composables/useCheckable'

export interface NeumorphismCheckboxProps {
  modelValue?: boolean
  disabled?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  name?: string
  id?: string
  indeterminate?: boolean
}

const props = withDefaults(defineProps<NeumorphismCheckboxProps>(), {
  modelValue: false,
  disabled: false,
  size: 'medium',
  indeterminate: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const isChecked = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (props.disabled) return
    emit('update:modelValue', value)
    emit('change', value)
  },
})

const { inputId, classList } = useCheckable(() => ({
  prefix: 'checkbox',
  isChecked: isChecked.value,
  isDisabled: props.disabled,
  size: props.size,
  extraClasses: { 'nm-checkbox--indeterminate': props.indeterminate },
}))

function handleChange(event: Event): void {
  if (props.disabled) { event.preventDefault(); return }
  isChecked.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <label :class="classList" :for="inputId">
    <span class="nm-checkbox__input-wrapper">
      <input
        :id="inputId"
        type="checkbox"
        class="nm-checkbox__input"
        :checked="isChecked"
        :disabled="disabled"
        :name="name"
        @change="handleChange"
      >
      <span class="nm-checkbox__box" aria-hidden="true">
        <svg v-if="indeterminate" class="nm-checkbox__icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <svg v-else-if="isChecked" class="nm-checkbox__icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </span>
    <span v-if="label || $slots.default" class="nm-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/_checkable.scss' as *;

@include checkable-root('checkbox');
@include checkable-input-wrapper('checkbox');
@include checkable-hidden-input('checkbox');
@include checkable-indicator-base('checkbox', 'box');
@include checkable-label('checkbox');
@include checkable-focus-ring('checkbox', 'box');
@include checkable-sizes('checkbox', 'box');

// Checkbox-specific
.nm-checkbox__box {
  border-radius: 6px;
}

.nm-checkbox--checked .nm-checkbox__box,
.nm-checkbox--indeterminate .nm-checkbox__box {
  background-color: var(--nm-primary-color);
  box-shadow:
    inset 1px 1px 2px rgba(0, 0, 0, 0.2),
    inset -1px -1px 2px rgba(255, 255, 255, 0.2);
}

.nm-checkbox__icon {
  width: 65%;
  height: 65%;
  color: #fff;
  transition: opacity var(--nm-transition-fast);
}
</style>
