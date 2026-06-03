<script setup lang="ts">
import { computed } from 'vue'

export interface NeumorphismPaginationProps {
  modelValue?: number
  total?: number
  pageSize?: number
  size?: 'small' | 'medium' | 'large'
  showTotal?: boolean
  showJumper?: boolean
  maxVisiblePages?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<NeumorphismPaginationProps>(), {
  modelValue: 1,
  total: 0,
  pageSize: 10,
  size: 'medium',
  showTotal: false,
  showJumper: false,
  maxVisiblePages: 7,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const currentPage = computed(() => Math.min(Math.max(1, props.modelValue), totalPages.value))

function changePage(page: number) {
  if (props.disabled || page < 1 || page > totalPages.value || page === currentPage.value) return
  emit('update:modelValue', page)
  emit('change', page)
}

const visiblePages = computed(() => {
  const max = props.maxVisiblePages
  const total = totalPages.value
  const current = currentPage.value

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half = Math.floor(max / 2)
  let start = current - half
  let end = current + half

  if (start < 1) { end += (1 - start); start = 1 }
  if (end > total) { start -= (end - total); end = total }

  start = Math.max(1, start)
  end = Math.min(total, end)

  const pages: (number | string)[] = []
  if (start > 1) pages.push(1)
  if (start > 2) pages.push('prev-ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('next-ellipsis')
  if (end < total) pages.push(total)

  return pages
})

const classList = computed(() => [
  'nm-pagination',
  `nm-pagination--${props.size}`,
  { 'nm-pagination--disabled': props.disabled },
])
</script>

<template>
  <nav :class="classList" role="navigation" aria-label="分页导航">
    <span v-if="showTotal" class="nm-pagination__total">
      共 {{ total }} 条
    </span>

    <ul class="nm-pagination__list">
      <li>
        <button
          class="nm-pagination__btn"
          :disabled="currentPage <= 1 || disabled"
          :aria-label="'上一页'"
          @click="changePage(currentPage - 1)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </li>

      <li
        v-for="page in visiblePages"
        :key="String(page)"
      >
        <span
          v-if="typeof page === 'string'"
          class="nm-pagination__ellipsis"
          aria-hidden="true"
        >...</span>
        <button
          v-else
          class="nm-pagination__btn"
          :class="{ 'nm-pagination__btn--active': page === currentPage }"
          :aria-label="`第 ${page} 页`"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="changePage(page)"
          type="button"
        >
          {{ page }}
        </button>
      </li>

      <li>
        <button
          class="nm-pagination__btn"
          :disabled="currentPage >= totalPages || disabled"
          :aria-label="'下一页'"
          @click="changePage(currentPage + 1)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </li>
    </ul>

    <div v-if="showJumper" class="nm-pagination__jumper">
      跳至
      <input
        class="nm-pagination__jumper-input"
        type="number"
        :min="1"
        :max="totalPages"
        :value="currentPage"
        @change="changePage(Number(($event.target as HTMLInputElement).value))"
        :disabled="disabled"
      >
      页
    </div>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  user-select: none;

  &--disabled { opacity: 0.6; }
}

.nm-pagination__total {
  font-size: 14px;
  color: var(--nm-text-secondary);
}

.nm-pagination__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
}

.nm-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 8px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--nm-text-primary);
  background-color: var(--nm-surface-color);
  @include nm-raised(2px, 4px);
  transition: all var(--nm-transition-fast);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    @include nm-raised(3px, 6px);
  }

  &:active:not(:disabled) {
    @include nm-inset(2px, 3px);
    transform: translateY(0);
  }

  &--active {
    color: #fff;
    background-color: var(--nm-primary-color);
    @include nm-inset(1px, 3px);
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
  font-size: 14px;
}

.nm-pagination__jumper {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--nm-text-secondary);
}

.nm-pagination__jumper-input {
  width: 50px;
  padding: 6px 8px;
  border: none;
  text-align: center;
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  font-size: 14px;
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
  .nm-pagination__btn { min-width: 30px; height: 30px; font-size: 12px; }
}
.nm-pagination--large {
  .nm-pagination__btn { min-width: 46px; height: 46px; font-size: 16px; }
}
</style>
