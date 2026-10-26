<script setup lang="ts" generic="T">
import { computed, useSlots } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { LIST_SCALE } from '@/utils/controlScales'

export type ListSize = 'small' | 'medium' | 'large'

export interface NeumorphismListProps<T> {
  /** Data array to render (when not using manual slot) */
  items?: T[]
  /** Show border around the list */
  bordered?: boolean
  /** Show dividers between items */
  split?: boolean
  /**
   * 尺寸——px 字号（数字，主几何量），或三档预设名。
   *
   * 数字即「字号」：行内距与头尾内距按三锚点（12 / 14 / 15）分段线性插值，
   * 所以 `:size="14"` 与 `size="medium"` 逐像素相同，`:size="14.5"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | ListSize
  /** Enable hover effect on items */
  hoverable?: boolean
  /** Show loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<NeumorphismListProps<T>>(), {
  bordered: undefined,
  hoverable: undefined,
  split: undefined,
  items: () => [],
  loading: false,
})

const slots = useSlots()

const { config, resolveProp } = useNeumorphismSetup()

/** 数字尺寸的语义是「字号」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 14

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.list?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<ListSize>(() => {
  const raw = props.size ?? config.value.list?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(LIST_SCALE, numericSize.value)
)
const resolvedBordered = computed(() =>
  resolveProp(props.bordered, config.value.list?.bordered, true)
)
const resolvedSplit = computed(() => resolveProp(props.split, config.value.list?.split, true))
const resolvedHoverable = computed(() =>
  resolveProp(props.hoverable, config.value.list?.hoverable, true)
)

const { t } = useLocale()

const emit = defineEmits<{
  (e: 'item-click', item: T, index: number): void
}>()

const isEmpty = computed(() => !props.loading && props.items.length === 0)

const classList = computed(() => [
  'nm-list',
  numericSize.value === undefined ? `nm-list--${resolvedSize.value}` : 'nm-list--sized',
  {
    'nm-list--bordered': resolvedBordered.value,
    'nm-list--split': resolvedSplit.value,
    'nm-list--hoverable': resolvedHoverable.value,
    'nm-list--loading': props.loading,
    'nm-list--empty': isEmpty.value,
  },
])

function handleItemClick(item: T, index: number) {
  emit('item-click', item, index)
}

function getItemKey(item: T, index: number): string | number {
  const record = item as { id?: string | number; key?: string | number }
  return record?.id ?? record?.key ?? index
}
</script>

<template>
  <div :class="classList" :style="sizeStyle" role="list" :aria-label="t('listLabel')">
    <!-- Header slot -->
    <div v-if="$slots.header" class="nm-list__header">
      <slot name="header" />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="nm-list__loading">
      <slot name="loading">
        <span class="nm-list__spinner" aria-hidden="true" />
        <span class="nm-list__loading-text">{{ t('listLoading') }}</span>
      </slot>
    </div>

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="nm-list__empty">
      <slot name="empty">
        <span class="nm-list__empty-text">{{ t('listEmpty') }}</span>
      </slot>
    </div>

    <!-- Items -->
    <template v-else>
      <div
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        class="nm-list__item"
        :class="{
          'nm-list__item--last': index === items.length - 1,
          'nm-list__item--clickable': !!slots.default,
        }"
        role="listitem"
        :tabindex="slots.default ? 0 : undefined"
        @click="handleItemClick(item, index)"
        @keydown.enter="handleItemClick(item, index)"
        @keydown.space.prevent="handleItemClick(item, index)"
      >
        <slot name="default" :item="item" :index="index">
          {{ item }}
        </slot>
      </div>
    </template>

    <!-- Footer slot -->
    <div v-if="$slots.footer" class="nm-list__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-list {
  display: flex;
  flex-direction: column;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-theme-transition;

  &--bordered {
    @include nm-raised(3px, 8px);
  }

  &--empty {
    justify-content: center;
    min-height: 120px;
  }
}

// --- Size variants ---

.nm-list--small {
  font-size: var(--nm-font-sm);

  .nm-list__item {
    padding: var(--nm-spacing-xs) var(--nm-spacing-sm);
  }

  .nm-list__header,
  .nm-list__footer {
    padding: var(--nm-spacing-xs) var(--nm-spacing-sm);
    font-size: var(--nm-font-sm);
  }
}

.nm-list--medium {
  font-size: var(--nm-font-base);

  .nm-list__item {
    padding: var(--nm-spacing-sm) var(--nm-spacing-md);
  }

  .nm-list__header,
  .nm-list__footer {
    padding: var(--nm-spacing-sm) var(--nm-spacing-md);
    font-size: var(--nm-font-base);
  }
}

.nm-list--large {
  font-size: var(--nm-font-lg);

  .nm-list__item {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
  }

  .nm-list__header,
  .nm-list__footer {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
    font-size: var(--nm-font-lg);
  }
}

// 数字尺寸（`:size="14.5"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 选择器结构与上面三档类逐一对应：字号落在根节点（行内元素继承），
// 内距落在行/头/尾——换了层级就会多出「档位改了数字没改」的偏差。
.nm-list--sized {
  font-size: var(--nm-list-sz-font);

  .nm-list__item {
    padding: var(--nm-list-sz-pad-y) var(--nm-list-sz-pad-x);
  }

  .nm-list__header,
  .nm-list__footer {
    padding: var(--nm-list-sz-pad-y) var(--nm-list-sz-pad-x);
    font-size: var(--nm-list-sz-font);
  }
}

// --- Header ---

.nm-list__header {
  border-bottom: 1px solid var(--nm-shadow-dark);
  color: var(--nm-text-primary);
  font-weight: 600;
}

// --- Footer ---

.nm-list__footer {
  border-top: 1px solid var(--nm-shadow-dark);
  color: var(--nm-text-secondary);
}

// --- Items ---

.nm-list__item {
  display: flex;
  align-items: center;
  color: var(--nm-text-primary);
  transition:
    background-color 0.25s $nm-ease-ambient,
    box-shadow 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring;
  cursor: default;

  &--clickable {
    cursor: pointer;
    // 触屏：可点行高 ≥44px
    @include nm-touch-min(null, 44px);

    // 键盘焦点内环（列表行紧凑排列）
    @include nm-focus-ring(-2px);

    // 按下：即时压入感
    &:active {
      background-color: var(--nm-surface-raised);
      transform: translateY(1px);
      transition: transform 0.1s $nm-ease-compress;
    }
  }

  // Split dividers between items
  .nm-list--split &:not(&--last) {
    border-bottom: 1px solid var(--nm-shadow-dark);
  }
}

// --- Hoverable ---

.nm-list--hoverable {
  .nm-list__item {
    @media (hover: hover) {
      &:hover {
        background-color: var(--nm-surface-raised);
        transform: translateY(-1px);
        box-shadow:
          3px 3px 6px var(--nm-shadow-dark),
          -2px -2px 4px var(--nm-shadow-light);
      }
    }

    &:active {
      transform: translateY(0);
      box-shadow:
        inset 2px 2px 4px var(--nm-shadow-dark),
        inset -1px -1px 2px var(--nm-shadow-light);
      transition:
        transform 0.1s $nm-ease-compress,
        box-shadow 0.1s $nm-ease-compress;
    }
  }
}

// --- Loading ---

.nm-list__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-xl);
  color: var(--nm-text-placeholder);
}

.nm-list__loading-text {
  color: var(--nm-text-secondary);
  font-size: var(--nm-font-base);
}

.nm-list__spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--nm-shadow-dark);
  border-top-color: var(--nm-primary-color);
  border-radius: var(--nm-border-radius-full);
  animation: nm-list-spin 0.8s linear infinite;
}

@keyframes nm-list-spin {
  to {
    transform: rotate(360deg);
  }
}

// --- Empty ---

.nm-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--nm-spacing-xl);
}

.nm-list__empty-text {
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-base);
  user-select: none;
}

// --- Reduced motion ---

@media (prefers-reduced-motion: reduce) {
  .nm-list__item {
    transition: none;
  }

  .nm-list__spinner {
    animation: none;
  }
}
</style>
