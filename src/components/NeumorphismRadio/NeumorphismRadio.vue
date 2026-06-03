<script setup lang="ts">
import { computed, inject } from 'vue'
import { useCheckable } from '@/composables/useCheckable'
import { RadioGroupKey } from '@/composables/injectionKeys'

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

const radioGroup = inject(RadioGroupKey, null)

const isChecked = computed(() => {
  if (radioGroup) return radioGroup.modelValue === props.value
  return props.modelValue === props.value
})

const isDisabled = computed(() => props.disabled || radioGroup?.disabled || false)
const radioSize = computed<'small' | 'medium' | 'large'>(
  () => (radioGroup?.size || props.size) as 'small' | 'medium' | 'large'
)

const { inputId, classList } = useCheckable(() => ({
  prefix: 'radio',
  isChecked: isChecked.value,
  isDisabled: isDisabled.value,
  size: radioSize.value,
}))

function handleChange(): void {
  if (isDisabled.value) return
  if (radioGroup) {
    radioGroup.setValue(props.value)
  } else {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
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
@use '@/styles/_checkable.scss' as *;

@include checkable-root('radio');
@include checkable-input-wrapper('radio');
@include checkable-hidden-input('radio');
@include checkable-indicator-base('radio', 'circle');
@include checkable-label('radio');
@include checkable-focus-ring('radio', 'circle');

// Radio-specific: circle + dot
.nm-radio__circle {
  border-radius: 50%;
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

// Sizes (with dot dimensions)
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
