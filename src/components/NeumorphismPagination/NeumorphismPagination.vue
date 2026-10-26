<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { usePagination } from '@/composables/usePagination'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { PAGINATION_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type PaginationSize = 'small' | 'medium' | 'large'

export interface NeumorphismPaginationProps {
  modelValue?: number
  total?: number
  pageSize?: number
  /**
   * 尺寸——px 页码按钮高（数字，主几何量），或三档预设名。
   *
   * 数字即「页码按钮高」：按钮最小宽度与字号按三锚点（30 / 38 / 46）
   * 分段线性插值，所以 `:size="38"` 与 `size="medium"` 逐像素相同，
   * `:size="42"` 落在 medium / large 之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | PaginationSize
  showTotal?: boolean
  showJumper?: boolean
  maxVisiblePages?: number
  disabled?: boolean
  prevLabel?: string
  nextLabel?: string
  totalLabel?: string
}

const props = withDefaults(defineProps<NeumorphismPaginationProps>(), {
  showJumper: undefined,
  showTotal: undefined,
  modelValue: 1,
  total: 0,
  disabled: false,
  prevLabel: '上一页',
  nextLabel: '下一页',
  // totalLabel 缺省保持 undefined：未显式传入时走 locale `paginationTotal`，保持向后兼容
  totalLabel: undefined,
})

const { config, resolveProp } = useNeumorphismSetup()

/** 数字尺寸的语义是「页码按钮高」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 38

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.pagination?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<PaginationSize>(() => {
  const raw = props.size ?? config.value.pagination?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale）；变量在根节点，消费在页码按钮上 */
const sizeStyle = computed(() =>
  numericSize.value === undefined
    ? undefined
    : resolveControlScale(PAGINATION_SCALE, numericSize.value)
)
const resolvedShowTotal = computed(() =>
  resolveProp(props.showTotal, config.value.pagination?.showTotal, false)
)
const resolvedShowJumper = computed(() =>
  resolveProp(props.showJumper, config.value.pagination?.showJumper, false)
)
const resolvedMaxVisiblePages = computed(() =>
  resolveProp(props.maxVisiblePages, config.value.pagination?.maxVisiblePages, 7)
)
const resolvedPageSize = computed(() =>
  resolveProp(props.pageSize, config.value.pagination?.pageSize, 10)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

// Use headless pagination composable for all behavioral logic
const currentPage = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const { totalPages, visiblePages, changePage, prevPage, nextPage, isPrevDisabled, isNextDisabled } =
  usePagination({
    modelValue: currentPage,
    total: computed(() => props.total),
    pageSize: computed(() => resolvedPageSize.value),
    maxVisiblePages: computed(() => resolvedMaxVisiblePages.value),
    disabled: computed(() => props.disabled),
  })

const classList = computed(() => [
  'nm-pagination',
  numericSize.value === undefined ? `nm-pagination--${resolvedSize.value}` : 'nm-pagination--sized',
  { 'nm-pagination--disabled': props.disabled },
])

function onJumperChange(event: Event) {
  changePage(Number((event.target as HTMLInputElement).value))
}

const { t } = useLocale()

// 显式传入 totalLabel 时覆盖总数文案模板（支持 {total} 占位符），否则走 locale
const resolvedTotalText = computed(() => {
  if (props.totalLabel) return props.totalLabel.replace(/\{total\}/g, String(props.total))
  return t('paginationTotal', { total: props.total })
})

// 跳页器文案：locale 模板含 {input} 占位符，拆为输入框前后两段（英文后置段为空）
const jumperParts = computed(() => {
  const [pre = '', post = ''] = t('paginationJumper').split('{input}')
  return { pre: pre.trim(), post: post.trim() }
})
</script>

<template>
  <nav :class="classList" :style="sizeStyle" role="navigation" :aria-label="t('paginationLabel')">
    <span v-if="resolvedShowTotal" class="nm-pagination__total">
      {{ resolvedTotalText }}
    </span>

    <ul class="nm-pagination__list">
      <li>
        <button
          class="nm-pagination__btn"
          :disabled="isPrevDisabled"
          :aria-label="prevLabel"
          type="button"
          @click="prevPage"
        >
          <NeumorphismIcon name="chevron-left" size="md" />
        </button>
      </li>

      <!-- @slot Custom page item rendering. Bind: page, active -->
      <slot
        v-for="page in visiblePages"
        :key="String(page)"
        name="page-item"
        :page="page"
        :active="page === modelValue"
      >
        <li>
          <span v-if="typeof page === 'string'" class="nm-pagination__ellipsis" aria-hidden="true"
            >...</span
          >
          <button
            v-else
            class="nm-pagination__btn"
            :class="{ 'nm-pagination__btn--active': page === modelValue }"
            :aria-label="t('paginationPageLabel', { page })"
            :aria-current="page === modelValue ? 'page' : undefined"
            type="button"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </li>
      </slot>

      <li>
        <button
          class="nm-pagination__btn"
          :disabled="isNextDisabled"
          :aria-label="nextLabel"
          type="button"
          @click="nextPage"
        >
          <NeumorphismIcon name="chevron-right" size="md" />
        </button>
      </li>
    </ul>

    <div v-if="resolvedShowJumper" class="nm-pagination__jumper">
      {{ jumperParts.pre }}
      <input
        class="nm-pagination__jumper-input"
        type="number"
        :min="1"
        :max="totalPages"
        :value="modelValue"
        :disabled="disabled"
        @change="onJumperChange"
      />
      {{ jumperParts.post }}
    </div>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-pagination {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-12);
  flex-wrap: wrap;
  user-select: none;

  &--disabled {
    opacity: 0.6;
  }
}

.nm-pagination__total {
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
}

.nm-pagination__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--nm-spacing-xs);
}

.nm-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 var(--nm-spacing-sm);
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  background-color: var(--nm-surface-color);
  @include nm-raised(2px, 4px);
  transition: all var(--nm-transition-fast);

  // 触屏：命中面积放宽至 ≥44×44（鼠标保持紧凑 38px）
  @include nm-touch-min;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      @include nm-raised(3px, 6px);
    }
  }

  &:active:not(:disabled) {
    @include nm-inset(2px, 3px);
    transform: translateY(0);
  }

  &--active {
    color: var(--nm-text-on-primary);
    background-color: var(--nm-primary-color);
    @include nm-inset(1px, 3px);
    animation: nm-pagination-active 0.4s $nm-ease-bounce;
    position: relative;
  }

  &--active::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      circle at center,
      var(--nm-shadow-light-ambient-md) 0%,
      transparent 70%
    );
    opacity: 0;
    animation: nm-pagination-glow 0.5s $nm-ease-decelerate;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }
}

.nm-pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-base);
}

.nm-pagination__jumper {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-6);
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
}

.nm-pagination__jumper-input {
  width: 50px;
  padding: var(--nm-spacing-6) var(--nm-spacing-sm);
  border: none;
  text-align: center;
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
  @include nm-inset(2px, 4px);
  outline: none;

  &:focus {
    box-shadow:
      inset 2px 2px 4px var(--nm-shadow-dark),
      inset -2px -2px 4px var(--nm-shadow-light),
      0 0 0 2px var(--nm-primary-color);
  }
}

// Sizes
.nm-pagination--small {
  .nm-pagination__btn {
    min-width: 30px;
    height: 30px;
    font-size: var(--nm-font-sm);
    @include nm-touch-min;
  }
}
.nm-pagination--large {
  .nm-pagination__btn {
    min-width: 46px;
    height: 46px;
    font-size: var(--nm-font-xl);
  }
}

// 数字尺寸（`:size="42"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 三档类是**内部元素**选择器（`.nm-pagination--* .nm-pagination__btn`），
// 因为几何量落在按钮而非根节点；`--sized` 必须写到同一个内部元素上，
// 变量本身仍挂在根节点。`nm-touch-min` 也照 small 档保留：数字再小，
// 触屏命中面积也不该缩水。
.nm-pagination--sized {
  .nm-pagination__btn {
    min-width: var(--nm-pagination-sz-min-width);
    height: var(--nm-pagination-sz-height);
    font-size: var(--nm-pagination-sz-font);
    @include nm-touch-min;
  }
}

@keyframes nm-pagination-active {
  0% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes nm-pagination-glow {
  0% {
    opacity: 0.5;
    transform: scale(0.5);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-pagination__btn {
    transition: none;
  }
  .nm-pagination__btn--active {
    animation: none;
  }
  .nm-pagination__btn--active::after {
    animation: none;
  }
}
</style>
