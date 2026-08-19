<script setup lang="ts">
import { computed, ref, toRef, watch, nextTick } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useSegmented, type SegmentedOption } from '@/composables/useSegmented'

export type { SegmentedOption }
export type SegmentedSize = 'small' | 'medium' | 'large'

export interface NeumorphismSegmentedProps {
  /** 选中值（v-model） */
  modelValue?: string | number
  /** 可选项 */
  options: SegmentedOption[]
  size?: SegmentedSize
  disabled?: boolean
  /** 无障碍组标签（默认取 locale segmentedLabel） */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismSegmentedProps>(), {
  modelValue: undefined,
  size: undefined,
  disabled: undefined,
  ariaLabel: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() => resolveProp(props.size, config.value.segmented?.size, 'medium'))
const resolvedDisabled = computed(() =>
  resolveProp(props.disabled, config.value.segmented?.disabled, false)
)
const resolvedAriaLabel = computed(() => props.ariaLabel || t('segmentedLabel'))

const modelRef = computed<string | number | undefined>({
  get: () => props.modelValue,
  set: value => {
    // useSegmented 只会写入具体的 option.value，undefined 分支仅为类型完备
    if (value !== undefined) emit('update:modelValue', value)
  },
})

const { isActive, isItemDisabled, select, focusIndex, tabindexFor, handleKeydown } = useSegmented({
  modelValue: modelRef,
  options: toRef(props, 'options'),
  disabled: resolvedDisabled,
  onChange: value => emit('change', value),
})

const groupRef = ref<HTMLElement | null>(null)

// roving tabindex 的真实 DOM 焦点移动（仅当焦点已在组内，避免抢焦点）
watch(focusIndex, async index => {
  await nextTick()
  const group = groupRef.value
  if (!group || !group.contains(document.activeElement)) return
  const items = group.querySelectorAll<HTMLButtonElement>('.nm-segmented__item')
  items[index]?.focus()
})

const classList = computed(() => [
  'nm-segmented',
  `nm-segmented--${resolvedSize.value}`,
  { 'nm-segmented--disabled': resolvedDisabled.value },
])
</script>

<template>
  <div
    ref="groupRef"
    :class="classList"
    role="radiogroup"
    :aria-label="resolvedAriaLabel"
    @keydown="handleKeydown"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      class="nm-segmented__item"
      :class="{
        'nm-segmented__item--active': isActive(option),
        'nm-segmented__item--disabled': isItemDisabled(option),
      }"
      role="radio"
      :aria-checked="isActive(option)"
      :disabled="isItemDisabled(option)"
      :tabindex="tabindexFor(index)"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-segmented {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-2xs);
  padding: var(--nm-spacing-2xs);
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-surface-color);
  @include nm-inset(2px, 5px);

  &--disabled {
    opacity: 0.6;
  }
}

.nm-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background: transparent;
  color: var(--nm-text-secondary);
  font-size: var(--nm-font-md);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.2s ease,
    box-shadow 0.25s $nm-ease-spring,
    background-color 0.25s ease;

  @media (hover: hover) {
    &:hover:not(&--active):not(&--disabled) {
      color: var(--nm-text-primary);
    }
  }

  // 选中项浮出凹陷轨道 —— 凸起符合物理隐喻
  &--active {
    background-color: var(--nm-surface-raised);
    color: var(--nm-text-primary);
    font-weight: 600;
    @include nm-raised(2px, 4px);
  }

  &--disabled {
    color: var(--nm-text-disabled);
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 1px;
  }
}

.nm-segmented--small .nm-segmented__item {
  padding: var(--nm-spacing-2xs) var(--nm-spacing-sm);
  font-size: var(--nm-font-sm);
  min-height: 26px;
}
.nm-segmented--medium .nm-segmented__item {
  padding: var(--nm-spacing-xs) var(--nm-spacing-md);
  min-height: 32px;
}
.nm-segmented--large .nm-segmented__item {
  padding: var(--nm-spacing-sm) var(--nm-spacing-lg);
  font-size: var(--nm-font-lg);
  min-height: 38px;
}

@media (prefers-reduced-motion: reduce) {
  .nm-segmented__item {
    transition: none;
  }
}
</style>
