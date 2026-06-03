<script setup lang="ts">
import { computed, inject } from 'vue'
import { generateId } from '@/utils'

export interface NeumorphismRadioProps {
  modelValue?: unknown
  value: unknown
  disabled?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  name?: string
  id?: string
}

const props = withDefaults(defineProps<NeumorphismRadioProps>(), {
  disabled: false,
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'change', value: unknown): void
}>()

const radioGroup = inject<{
  modelValue: unknown
  name: string
  disabled: boolean
  size: 'small' | 'medium' | 'large'
  setValue: (val: unknown) => void
} | null>('nm-radio-group', null)

const inputId = computed(() => props.id || generateId('nm-radio'))

const isChecked = computed(() => {
  if (radioGroup) return radioGroup.modelValue === props.value
  return props.modelValue === props.value
})

const isDisabled = computed(() => props.disabled || radioGroup?.disabled || false)
const radioSize = computed(() => radioGroup?.size || props.size)

function handleChange(): void {
  if (isDisabled.value) return
  if (radioGroup) {
    radioGroup.setValue(props.value)
  } else {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}

const classList = computed(() => [
  'nm-radio',
  `nm-radio--${radioSize.value}`,
  {
    'nm-radio--checked': isChecked.value,
    'nm-radio--disabled': isDisabled.value,
  },
])
</script>

<template>
  <label :class="classList" :for="inputId">
    <span class="nm-radio__input-wrapper">
      <input
        :id="inputId"
        type="radio"
        class="nm-radio__input"
        :checked="isChecked"
        :disabled="isDisabled"
        :name="radioGroup?.name || name"
        :value="value"
        @change="handleChange"
      >
      <span class="nm-radio__circle" aria-hidden="true">
        <span class="nm-radio__dot" />
      </span>
    </span>
    <span v-if="label || $slots.default" class="nm-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-radio {
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

.nm-radio__input-wrapper {
  position: relative;
  display: inline-flex;
}

.nm-radio__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.nm-radio__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--nm-surface-color);
  @include nm-inset(2px, 4px);
  transition: all var(--nm-transition-normal);
}

.nm-radio__dot {
  border-radius: 50%;
  background-color: var(--nm-primary-color);
  transform: scale(0);
  @include nm-raised(1px, 2px);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nm-radio--checked .nm-radio__dot {
  transform: scale(1);
}

.nm-radio__label {
  font-size: 14px;
  color: var(--nm-text-primary);
  transition: color var(--nm-transition-slow);
}

.nm-radio__input:focus-visible + .nm-radio__circle {
  box-shadow:
    inset 2px 2px 4px var(--nm-shadow-dark),
    inset -2px -2px 4px var(--nm-shadow-light),
    0 0 0 3px var(--nm-primary-color);
}

// Sizes
.nm-radio--small {
  .nm-radio__circle { width: 18px; height: 18px; }
  .nm-radio__dot { width: 8px; height: 8px; }
}
.nm-radio--medium {
  .nm-radio__circle { width: 24px; height: 24px; }
  .nm-radio__dot { width: 12px; height: 12px; }
}
.nm-radio--large {
  .nm-radio__circle { width: 30px; height: 30px; }
  .nm-radio__dot { width: 16px; height: 16px; }
}
</style>
