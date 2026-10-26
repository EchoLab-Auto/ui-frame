<script setup lang="ts">
import { computed } from 'vue'
import { useCollapse } from '@/composables/useCollapse'
import type { CollapseItem } from '@/composables/useCollapse'
import { generateId } from '@/utils'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { COLLAPSE_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type { CollapseItem }

export type CollapseSize = 'small' | 'medium' | 'large'

export interface NeumorphismCollapseProps {
  modelValue?: string[]
  accordion?: boolean
  items?: CollapseItem[]
  /**
   * 尺寸——px 标题字号（数字，主几何量），或三档预设名。
   *
   * 数字即「标题字号」：标题内距按三锚点（13 / 15 / 16）分段线性插值，
   * 所以 `:size="15"` 与 `size="medium"` 逐像素相同，`:size="14"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | CollapseSize
}

const props = withDefaults(defineProps<NeumorphismCollapseProps>(), {
  accordion: undefined,
  modelValue: () => [],
  items: () => [],
})

const { config, resolveProp } = useNeumorphismSetup()

/** 数字尺寸的语义是「标题字号」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 15

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.collapse?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<CollapseSize>(() => {
  const raw = props.size ?? config.value.collapse?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale）；变量在根节点，消费在标题按钮上 */
const sizeStyle = computed(() =>
  numericSize.value === undefined
    ? undefined
    : resolveControlScale(COLLAPSE_SCALE, numericSize.value)
)
const resolvedAccordion = computed(() =>
  resolveProp(props.accordion, config.value.collapse?.accordion, false)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}>()

const activeKeys = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

// Use headless collapse composable for all behavioral logic
const { toggle, isActive } = useCollapse({
  modelValue: activeKeys,
  items: computed(() => props.items),
  accordion: computed(() => resolvedAccordion.value),
})

const collapseId = generateId('nm-collapse')

// 数字与档位类互斥：数字路径统一挂 `--sized`，几何量全部来自内联变量
const classList = computed(() => [
  'nm-collapse',
  numericSize.value === undefined ? `nm-collapse--${resolvedSize.value}` : 'nm-collapse--sized',
])
</script>

<template>
  <div :class="classList" :style="sizeStyle">
    <div
      v-for="item in items"
      :key="item.key"
      class="nm-collapse__item"
      :class="{
        'nm-collapse__item--active': isActive(item.key),
        'nm-collapse__item--disabled': item.disabled,
      }"
    >
      <h3 class="nm-collapse__header">
        <button
          :id="`${collapseId}-${item.key}-header`"
          class="nm-collapse__trigger"
          type="button"
          :aria-expanded="isActive(item.key)"
          :aria-controls="`${collapseId}-${item.key}-panel`"
          :aria-disabled="item.disabled"
          :disabled="item.disabled"
          @click="toggle(item.key)"
        >
          <!-- @slot Custom header rendering. Bind: item, active -->
          <slot :name="`header-${item.key}`" :item="item" :active="isActive(item.key)">
            <span class="nm-collapse__title">{{ item.title }}</span>
          </slot>
          <span
            class="nm-collapse__icon"
            :class="{ 'nm-collapse__icon--active': isActive(item.key) }"
          >
            <NeumorphismIcon name="chevron-down" size="sm" />
          </span>
        </button>
      </h3>

      <div
        :id="`${collapseId}-${item.key}-panel`"
        class="nm-collapse__panel"
        :class="{ 'nm-collapse__panel--collapsed': !isActive(item.key) }"
        role="region"
        :aria-labelledby="`${collapseId}-${item.key}-header`"
      >
        <div class="nm-collapse__content">
          <div class="nm-collapse__content-inner">
            <slot :name="item.key" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-collapse {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
}

.nm-collapse__item {
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);

  &--disabled {
    opacity: 0.5;
  }
}

.nm-collapse__header {
  margin: 0;
}

.nm-collapse__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--nm-collapse-trigger-padding-y-md) var(--nm-collapse-trigger-padding-x-md);
  border: none;
  cursor: pointer;
  font-size: var(--nm-collapse-trigger-font-md);
  font-weight: 500;
  color: var(--nm-text-primary);
  background: none;
  text-align: left;
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(2px, 5px);
  transition: all var(--nm-transition-normal);

  @media (hover: hover) {
    &:hover:not(:disabled) {
      @include nm-raised(3px, 7px);
      transform: translateY(-1px);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
    @include nm-inset(2px, 5px);
    transition:
      transform 0.1s $nm-ease-compress,
      box-shadow 0.1s $nm-ease-compress;
  }

  &[aria-expanded='true'] {
    @include nm-inset(2px, 5px);
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) 0 0;
  }

  &:disabled {
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }
}

.nm-collapse__title {
  flex: 1;
  color: var(--nm-text-primary);
}

.nm-collapse__icon {
  display: flex;
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);

  &--active {
    transform: rotate(180deg);
  }
}

.nm-collapse__panel {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--collapsed {
    grid-template-rows: 0fr;
  }
}

.nm-collapse__content {
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.nm-collapse__panel--collapsed .nm-collapse__content {
  opacity: 0;
}

.nm-collapse__content-inner {
  padding: var(--nm-collapse-content-padding-y) var(--nm-collapse-content-padding-x);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .nm-collapse__panel,
  .nm-collapse__content {
    transition: none;
  }
}

// Sizes
.nm-collapse--small .nm-collapse__trigger {
  padding: var(--nm-collapse-trigger-padding-y-sm) var(--nm-collapse-trigger-padding-x-sm);
  font-size: var(--nm-collapse-trigger-font-sm);
}
.nm-collapse--large .nm-collapse__trigger {
  padding: var(--nm-collapse-trigger-padding-y-lg) var(--nm-collapse-trigger-padding-x-lg);
  font-size: var(--nm-collapse-trigger-font-lg);
}

// 数字尺寸（`:size="14"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// medium 档没有独立 class（就是 `.nm-collapse__trigger` 的基础规则），所以这条
// `--sized` 规则一并承担 medium 的「数值版」：选择器与 small/large 同层级，
// 声明与基础规则 + 三档类一致（内距 + 标题字号）。
.nm-collapse--sized .nm-collapse__trigger {
  padding: var(--nm-collapse-sz-pad-y) var(--nm-collapse-sz-pad-x);
  font-size: var(--nm-collapse-sz-font);
}
</style>
