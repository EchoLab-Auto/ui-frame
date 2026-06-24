<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { usePagination } from '@/composables/usePagination'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export interface NeumorphismPaginationProps {
  modelValue?: number
  total?: number
  pageSize?: number
  size?: 'small' | 'medium' | 'large'
  showTotal?: boolean
  showJumper?: boolean
  maxVisiblePages?: number
  disabled?: boolean
  prevLabel?: string
  nextLabel?: string
  totalLabel?: string
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
  prevLabel: '上一页',
  nextLabel: '下一页',
  totalLabel: '共',
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.pagination?.size, 'medium')
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
  `nm-pagination--${resolvedSize.value}`,
  { 'nm-pagination--disabled': props.disabled },
])

function onJumperChange(event: Event) {
  changePage(Number((event.target as HTMLInputElement).value))
}

const { t } = useLocale()
</script>

<template>
  <nav :class="classList" role="navigation" :aria-label="t('paginationLabel')">
    <span v-if="resolvedShowTotal" class="nm-pagination__total">
      {{ t('paginationTotal', { total }) }}
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
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
            :aria-label="`第 ${page} 页`"
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </li>
    </ul>

    <div v-if="resolvedShowJumper" class="nm-pagination__jumper">
      跳至
      <input
        class="nm-pagination__jumper-input"
        type="number"
        :min="1"
        :max="totalPages"
        :value="modelValue"
        :disabled="disabled"
        @change="onJumperChange"
      />
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
  padding: 0 8px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  font-size: var(--nm-font-base);
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
  gap: 6px;
  font-size: var(--nm-font-base);
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
  }
}
.nm-pagination--large {
  .nm-pagination__btn {
    min-width: 46px;
    height: 46px;
    font-size: var(--nm-font-xl);
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
