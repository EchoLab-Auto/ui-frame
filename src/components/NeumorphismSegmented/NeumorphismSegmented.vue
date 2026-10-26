<script setup lang="ts">
import { computed, ref, toRef, watch, nextTick } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useSegmented, type SegmentedOption } from '@/composables/useSegmented'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { SEGMENTED_SCALE } from '@/utils/controlScales'

export type { SegmentedOption }
export type SegmentedSize = 'small' | 'medium' | 'large'

export interface NeumorphismSegmentedProps {
  /** 选中值（v-model） */
  modelValue?: string | number
  /** 可选项 */
  options: SegmentedOption[]
  /**
   * 尺寸——单段最小高度 px（数字，主几何量），或三档预设名。
   *
   * 数字即「单段最小高度」：字号与内距按锚点表（26 / 32 / 38）分段线性插值，
   * 尺寸施加在内部 `.nm-segmented__item` 上（变量挂根节点）。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | SegmentedSize
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

/** 尺寸原始取值：显式 prop > 全局配置 `segmented.size` > 档位默认 medium */
const rawSize = computed<number | SegmentedSize>(() =>
  resolveProp(props.size, config.value.segmented?.size, 'medium' as number | SegmentedSize)
)

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, SEGMENTED_SCALE.primary.md)
    : undefined
)

/** 字符串通道：数字路径下不挂档位类，这里只用于档位类名与语义兜底 */
const resolvedSize = computed<SegmentedSize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined
    ? undefined
    : resolveControlScale(SEGMENTED_SCALE, numericSize.value)
)

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
  // 数字与档位类互斥：几何全由内联 `--nm-segmented-sz-*` 决定
  numericSize.value === undefined ? `nm-segmented--${resolvedSize.value}` : 'nm-segmented--sized',
  { 'nm-segmented--disabled': resolvedDisabled.value },
])
</script>

<template>
  <div
    ref="groupRef"
    :class="classList"
    :style="sizeStyle"
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
  // 圆角同心：外框 --nm-border-radius-md(16) - padding --nm-spacing-2xs(2) = 14。
  // 用 calc 表达几何关系，改外框圆角/内边距时内项自动跟随。
  border-radius: calc(var(--nm-border-radius-md) - var(--nm-spacing-2xs));
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

  // 按下：非选中项即时压入感
  &:active:not(&--disabled):not(&--active) {
    background-color: var(--nm-surface-color);
    box-shadow:
      inset 2px 2px 4px var(--nm-shadow-dark),
      inset -2px -2px 4px var(--nm-shadow-light);
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
  @include nm-touch-min;
}
.nm-segmented--medium .nm-segmented__item {
  padding: var(--nm-spacing-xs) var(--nm-spacing-md);
  min-height: 32px;
  @include nm-touch-min;
}
.nm-segmented--large .nm-segmented__item {
  padding: var(--nm-spacing-sm) var(--nm-spacing-lg);
  font-size: var(--nm-font-lg);
  min-height: 38px;
  @include nm-touch-min;
}

// ---------- 数字尺寸（`:size="36"`）----------
// 尺寸施加在**内部** `.nm-segmented__item` 上：变量挂根节点（内联下发），
// 子选择器消费。与三档 class 互斥，不存在覆盖之争。
.nm-segmented--sized .nm-segmented__item {
  padding: var(--nm-segmented-sz-pad-y) var(--nm-segmented-sz-pad-x);
  // 注：medium 档位不写 font-size（继承根上的 --nm-font-md = 13px），锚点表给的是
  // 14px——这 1px 是既有档位类与锚点表之间的历史差异，数字路径按锚点表走。
  font-size: var(--nm-segmented-sz-font);
  min-height: var(--nm-segmented-sz-height);
  @include nm-touch-min;
}

@media (prefers-reduced-motion: reduce) {
  .nm-segmented__item {
    transition: none;
  }
}
</style>
