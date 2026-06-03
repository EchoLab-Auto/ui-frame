<script setup lang="ts">
import { computed } from 'vue'
import { generateId } from '@/utils'

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

const inputId = computed(() => props.id || generateId('nm-checkbox'))

const isChecked = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (props.disabled) return
    emit('update:modelValue', value)
    emit('change', value)
  },
})

const classList = computed(() => [
  'nm-checkbox',
  `nm-checkbox--${props.size}`,
  {
    'nm-checkbox--checked': isChecked.value,
    'nm-checkbox--disabled': props.disabled,
    'nm-checkbox--indeterminate': props.indeterminate,
  },
])

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

.nm-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  color: var(--nm-text-primary);

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.nm-checkbox__input-wrapper {
  position: relative;
  display: inline-flex;
}

.nm-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.nm-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--nm-surface-color);
  border-radius: 6px;
  @include nm-inset(2px, 4px);
  transition: all var(--nm-transition-normal);
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

.nm-checkbox__label {
  font-size: 14px;
  color: var(--nm-text-primary);
  transition: color var(--nm-transition-slow);
}

.nm-checkbox__input:focus-visible + .nm-checkbox__box {
  box-shadow:
    inset 2px 2px 4px var(--nm-shadow-dark),
    inset -2px -2px 4px var(--nm-shadow-light),
    0 0 0 3px var(--nm-primary-color);
}

// Sizes
.nm-checkbox--small .nm-checkbox__box { width: 18px; height: 18px; }
.nm-checkbox--medium .nm-checkbox__box { width: 24px; height: 24px; }
.nm-checkbox--large .nm-checkbox__box { width: 30px; height: 30px; }
</style>
