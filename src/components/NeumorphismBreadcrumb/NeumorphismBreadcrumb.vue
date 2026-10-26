<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { BREADCRUMB_SCALE } from '@/utils/controlScales'

export type BreadcrumbSize = 'small' | 'medium' | 'large'

export interface BreadcrumbItem {
  label: string
  to?: string
  disabled?: boolean
}

export interface NeumorphismBreadcrumbProps {
  items?: BreadcrumbItem[]
  separator?: string
  /**
   * 尺寸——px 字号（数字，主几何量），或三档预设名。
   *
   * 数字即「字号」：按三锚点（12 / 14 / 16）定位，所以 `:size="14"` 与
   * `size="medium"` 逐像素相同，`:size="15"` 落在 medium / large 之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | BreadcrumbSize
}

const props = withDefaults(defineProps<NeumorphismBreadcrumbProps>(), {
  items: () => [],
  separator: '/',
})

// 尺寸走数字/档位双通道（见下），这里只需全局配置，用不到 resolveProp
const { config } = useNeumorphismSetup()

/** 数字尺寸的语义是「字号」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 14

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.breadcrumb?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<BreadcrumbSize>(() => {
  const raw = props.size ?? config.value.breadcrumb?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined
    ? undefined
    : resolveControlScale(BREADCRUMB_SCALE, numericSize.value)
)

const { t } = useLocale()

const emit = defineEmits<{
  (e: 'itemClick', item: BreadcrumbItem, index: number): void
}>()

// 数字与档位类互斥：数字路径统一挂 `--sized`，几何量全部来自内联变量
const classList = computed(() => [
  'nm-breadcrumb',
  numericSize.value === undefined ? `nm-breadcrumb--${resolvedSize.value}` : 'nm-breadcrumb--sized',
])

function handleClick(item: BreadcrumbItem, index: number) {
  if (item.disabled) return
  emit('itemClick', item, index)
}
</script>

<template>
  <nav :class="classList" :style="sizeStyle" :aria-label="t('breadcrumbLabel')">
    <ol class="nm-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="nm-breadcrumb__item"
        :class="{
          'nm-breadcrumb__item--active': index === items.length - 1,
          'nm-breadcrumb__item--disabled': item.disabled,
        }"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        <span
          class="nm-breadcrumb__text"
          :class="{ 'nm-breadcrumb__text--link': index !== items.length - 1 && !item.disabled }"
          :role="index !== items.length - 1 ? 'link' : undefined"
          :tabindex="index !== items.length - 1 && !item.disabled ? 0 : -1"
          @click="handleClick(item, index)"
          @keydown.enter="handleClick(item, index)"
          @keydown.space.prevent="handleClick(item, index)"
        >
          {{ item.label }}
        </span>

        <span v-if="index < items.length - 1" class="nm-breadcrumb__separator" aria-hidden="true">
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-breadcrumb {
  @include nm-theme-transition;
}

.nm-breadcrumb__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--nm-spacing-xs);
}

.nm-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);

  &--active .nm-breadcrumb__text {
    font-weight: 600;
    color: var(--nm-text-primary);
  }

  &--disabled .nm-breadcrumb__text {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-breadcrumb__text {
  padding: var(--nm-spacing-xs) var(--nm-spacing-sm);
  border-radius: var(--nm-border-radius-sm);
  cursor: default;

  // 触屏：面包屑链接命中高度 ≥44px
  @include nm-touch-min(null, 44px);
  transition:
    color 0.25s $nm-ease-ambient,
    background-color 0.25s $nm-ease-ambient,
    box-shadow 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring;

  &--link {
    cursor: pointer;
    color: var(--nm-text-secondary);
    @include nm-raised(1px, 2px);

    @media (hover: hover) {
      &:hover {
        color: var(--nm-primary-color);
        background-color: var(--nm-surface-raised);
        transform: translateY(-1px);
        box-shadow:
          3px 3px 6px var(--nm-shadow-dark),
          -2px -2px 4px var(--nm-shadow-light);
      }
    }

    &:active {
      transform: translateY(0);
      @include nm-inset(1px, 2px);
      transition:
        transform 0.1s $nm-ease-compress,
        box-shadow 0.1s $nm-ease-compress;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--nm-primary-color);
    }
  }
}

.nm-breadcrumb__separator {
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-md);
  user-select: none;
  transition: color 0.3s ease;
}

// Sizes
.nm-breadcrumb--small {
  font-size: var(--nm-font-sm);
}
.nm-breadcrumb--medium {
  font-size: var(--nm-font-base);
}
.nm-breadcrumb--large {
  font-size: var(--nm-font-xl);
}

// 数字尺寸（`:size="15"`）：字号来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类；声明与上面三档类保持一致，
// 锚点处 `:size="14"` 才与 `size="medium"` 逐像素相同。
.nm-breadcrumb--sized {
  font-size: var(--nm-breadcrumb-sz-font);
}

@media (prefers-reduced-motion: reduce) {
  .nm-breadcrumb__text {
    transition: none;
  }
}
</style>
