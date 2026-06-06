<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { generateId } from '@/utils'
import { RadioGroupKey } from '@/composables/injectionKeys'

export interface NeumorphismRadioGroupProps {
  modelValue?: unknown
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  name?: string
  direction?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<NeumorphismRadioGroupProps>(), {
  disabled: false,
  size: 'medium',
  direction: 'horizontal',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'change', value: unknown): void
}>()

const groupName = computed(() => props.name || generateId('nm-radio-group'))

function setValue(val: unknown) {
  emit('update:modelValue', val)
  emit('change', val)
}

provide(RadioGroupKey, {
  modelValue: toRef(props, 'modelValue'),
  name: groupName,
  disabled: toRef(props, 'disabled'),
  size: toRef(props, 'size'),
  setValue,
})

const classList = computed(() => ['nm-radio-group', `nm-radio-group--${props.direction}`])
</script>

<template>
  <div :class="classList" role="radiogroup" :aria-orientation="direction">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.nm-radio-group {
  display: flex;

  &--horizontal {
    flex-wrap: wrap;
    gap: 12px 24px;
  }

  &--vertical {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
