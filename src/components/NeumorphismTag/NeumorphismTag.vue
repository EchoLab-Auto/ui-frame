<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { TAG_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type TagSize = 'small' | 'medium' | 'large'

export interface NeumorphismTagProps {
  closable?: boolean
  variant?: TagVariant
  /**
   * 尺寸——px 字号（数字，主几何量），或三档预设名。
   *
   * 数字即「字号」：内距与整体高度按三锚点（11 / 12 / 14）分段线性插值，
   * 所以 `:size="12"` 与 `size="medium"` 逐像素相同，`:size="13"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | TagSize
  disabled?: boolean
  rounded?: boolean
  /** Accessible label for the close button */
  closeLabel?: string
}

const props = withDefaults(defineProps<NeumorphismTagProps>(), {
  rounded: undefined,
  closable: false,
  disabled: false,
  closeLabel: '',
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedVariant = computed(() =>
  resolveProp(props.variant, config.value.tag?.variant, 'default')
)
/**
 * 数字尺寸的语义是「字号」，默认值取 medium 锚点。
 *
 * 0 / 负数 / NaN 一律回落到这里：字号 0 会让标签塌成一条线，负内距则会写出
 * 无效声明——这类「配置算错」应该在组件内兜住，而不是变成玄学布局。
 */
const DEFAULT_SIZE_PX = 12

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.tag?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/**
 * 字符串通道：只认档位别名。
 *
 * 显式传数字时 `resolvedSize` 仍是 `medium`，但渲染不会用到它（classList 走
 * `--sized`）——保留一个确定的档位名只是为了让类型与默认值语义单一。
 */
const resolvedSize = computed<TagSize>(() => {
  const raw = props.size ?? config.value.tag?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(TAG_SCALE, numericSize.value)
)

const resolvedRounded = computed(() => resolveProp(props.rounded, config.value.tag?.rounded, false))

const emit = defineEmits<{
  (e: 'close', event: MouseEvent): void
  (e: 'click', event: MouseEvent | KeyboardEvent): void
}>()

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel || t('tagClose'))

function handleClose(event: MouseEvent) {
  if (props.disabled) return
  event.stopPropagation()
  emit('close', event)
}

function handleClick(event: MouseEvent | KeyboardEvent) {
  if (props.disabled) return
  emit('click', event)
}

const classList = computed(() => [
  'nm-tag',
  `nm-tag--${resolvedVariant.value}`,
  numericSize.value === undefined ? `nm-tag--${resolvedSize.value}` : 'nm-tag--sized',
  {
    'nm-tag--rounded': resolvedRounded.value,
    'nm-tag--disabled': props.disabled,
    'nm-tag--closable': props.closable,
  },
])

const variantColors: Record<TagVariant, string> = {
  default: '',
  primary: 'var(--nm-primary-color)',
  success: 'var(--nm-color-success)',
  warning: 'var(--nm-color-warning)',
  error: 'var(--nm-color-error)',
  info: 'var(--nm-color-info)',
}

/**
 * 根节点内联样式 = 实色变体的 `--tag-color` + 数字尺寸的 `sz-*` 变量。
 *
 * 两件事都落在同一个 `:style` 上，所以在这里合并而不是在模板里写两张对象：
 * 模板侧只保留一个来源，少一次「谁覆盖谁」的推理。
 */
const rootStyle = computed(() => {
  const colorStyle =
    resolvedVariant.value === 'default'
      ? undefined
      : { '--tag-color': variantColors[resolvedVariant.value] }
  const sized = sizeStyle.value
  if (!colorStyle) return sized
  if (!sized) return colorStyle
  return { ...colorStyle, ...sized }
})
</script>

<template>
  <span
    :class="classList"
    :style="rootStyle"
    :role="disabled ? 'status' : 'button'"
    :tabindex="disabled ? undefined : 0"
    :aria-disabled="disabled || undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <span class="nm-tag__text">
      <slot />
    </span>
    <button
      v-if="closable"
      class="nm-tag__close"
      :aria-label="resolvedCloseLabel"
      type="button"
      @click="handleClose"
    >
      <NeumorphismIcon name="close" size="xs" />
    </button>
  </span>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-tag-gap);
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-sm);
  @include nm-raised(1px, 3px);
  transition:
    box-shadow 0.3s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    background-color 0.3s $nm-ease-ambient;
  user-select: none;
  white-space: nowrap;

  // 触屏：标签命中高度 ≥44px（视觉保持档位尺寸）
  @include nm-touch-min(null, 44px);

  &--rounded {
    border-radius: var(--nm-border-radius-full);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--closable {
    cursor: default;
  }

  @media (hover: hover) {
    &:hover:not(.nm-tag--disabled) {
      transform: translateY(-1px);
      box-shadow:
        3px 3px 8px var(--nm-shadow-dark),
        -2px -2px 6px var(--nm-shadow-light);
    }
  }

  &:active:not(.nm-tag--disabled) {
    transform: translateY(0);
    transition:
      transform 0.1s $nm-ease-compress,
      box-shadow 0.1s $nm-ease-compress;
  }

  // 焦点内环（相邻标签紧凑排列，外环会视觉打架）
  @include nm-focus-ring(-2px);

  // Colored variants
  &--primary,
  &--success,
  &--warning,
  &--error,
  &--info {
    background-color: var(--tag-color);
    color: var(--nm-text-on-primary);
    box-shadow:
      2px 2px 4px var(--nm-shadow-dark),
      -1px -1px 3px var(--nm-shadow-light-ambient-lg);

    .nm-tag__close {
      color: color-mix(in srgb, var(--nm-text-on-primary) 70%, transparent);
    }
    @media (hover: hover) {
      .nm-tag__close:hover {
        color: var(--nm-text-on-primary);
      }
    }

    @media (hover: hover) {
      &:hover:not(.nm-tag--disabled) {
        box-shadow:
          3px 3px 8px var(--nm-shadow-ambient-3xl),
          -2px -2px 6px var(--nm-shadow-light-ambient-md);
        filter: brightness(1.05);
      }
    }
  }
}

.nm-tag__text {
  font-size: var(--nm-font-md);
  font-weight: 500;
  line-height: 1;
}

.nm-tag__close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  transition:
    color 0.2s ease,
    transform 0.25s $nm-ease-spring;
  border-radius: var(--nm-border-radius-full);

  // 触屏：~16px → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-text-primary);
      transform: rotate(90deg);
    }
  }

  &:active {
    transform: rotate(90deg) scale(0.85);
  }

  @include nm-focus-ring(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .nm-tag {
    transition: none;
  }
  .nm-tag__close {
    transition: none;
  }
}

// Sizes
.nm-tag--small {
  padding: var(--nm-tag-padding-y-sm) var(--nm-tag-padding-x-sm);
  font-size: var(--nm-tag-font-sm);
  height: 22px;
}
.nm-tag--medium {
  padding: var(--nm-tag-padding-y-md) var(--nm-tag-padding-x-md);
  font-size: var(--nm-tag-font-md);
  height: 28px;
}
.nm-tag--large {
  padding: var(--nm-tag-padding-y-lg) var(--nm-tag-padding-x-lg);
  font-size: var(--nm-tag-font-lg);
  height: 34px;
}

// 数字尺寸（`:size="13"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 这里刻意与上面三档类保持**同一组声明**（含硬编码过的 height 也改走变量），
// 否则锚点处 `:size="12"` 与 `size="medium"` 就会差出一个高度。
.nm-tag--sized {
  padding: var(--nm-tag-sz-pad-y) var(--nm-tag-sz-pad-x);
  font-size: var(--nm-tag-sz-font);
  height: var(--nm-tag-sz-height);
}
</style>
