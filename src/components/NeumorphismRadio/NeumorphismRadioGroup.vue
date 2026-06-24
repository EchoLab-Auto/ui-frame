<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { generateId } from '@/utils'
import { RadioGroupKey } from '@/composables/injectionKeys'
import { useNeumorphismSetup } from '@/extensions/createComponent'

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

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.radioGroup?.size, 'medium')
)
const resolvedDirection = computed(() =>
  resolveProp(props.direction, config.value.radioGroup?.direction, 'horizontal')
)

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
  size: computed(() => resolvedSize.value),
  setValue,
})

const classList = computed(() => ['nm-radio-group', `nm-radio-group--${resolvedDirection.value}`])
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

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
