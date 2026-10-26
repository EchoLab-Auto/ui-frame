<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { generateId } from '@/utils'
import { RadioGroupKey } from '@/composables/injectionKeys'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type RadioGroupSize = 'small' | 'medium' | 'large'

export interface NeumorphismRadioGroupProps {
  modelValue?: unknown
  disabled?: boolean
  /**
   * 整组尺寸——级联给每个子 `NeumorphismRadio`（子项自身的 size 被覆盖）。
   *
   * 数字 = 圆圈直径 px：Group 只负责把值原样透传，插值交给子 Radio 完成
   * （见 `RADIO_SCALE`），这样单个 Radio 与 Group 走的是同一条数字通道。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留。
   */
  size?: number | RadioGroupSize
  name?: string
  direction?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<NeumorphismRadioGroupProps>(), {
  disabled: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed<number | RadioGroupSize>(() =>
  resolveProp(props.size, config.value.radioGroup?.size, 'medium' as number | RadioGroupSize)
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
    gap: var(--nm-spacing-12) var(--nm-spacing-lg);
  }

  &--vertical {
    flex-direction: column;
    gap: var(--nm-spacing-12);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
