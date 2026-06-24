<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/composables/useTable'
import type { TableColumn, SortDirection } from '@/composables/useTable'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import NeumorphismCheckbox from '@/components/NeumorphismCheckbox/NeumorphismCheckbox.vue'

export type { TableColumn }

export interface NeumorphismTableProps {
  data?: Record<string, unknown>[]
  columns?: TableColumn[]
  rowKey?: string
  selectable?: boolean | 'single' | 'multiple'
  selectedKeys?: string[]
  loading?: boolean
  emptyText?: string
  size?: 'small' | 'medium' | 'large'
  striped?: boolean
  hoverable?: boolean
  showHeader?: boolean
}

const props = withDefaults(defineProps<NeumorphismTableProps>(), {
  data: () => [],
  columns: () => [],
  rowKey: 'key',
  selectable: false,
  selectedKeys: () => [],
  loading: false,
  emptyText: '暂无数据',
  size: 'medium',
  striped: false,
  hoverable: true,
  showHeader: true,
})

const emit = defineEmits<{
  (e: 'update:selectedKeys', value: string[]): void
  (e: 'select', rowKey: string, row: Record<string, unknown>): void
  (e: 'selectAll', selected: boolean): void
  (e: 'sort', key: string, direction: SortDirection): void
}>()

const { t } = useLocale()

const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.table?.size ?? 'medium')
const resolvedEmptyText = computed(() => props.emptyText || t('tableEmpty'))

const selectedKeysRef = computed({
  get: () => props.selectedKeys,
  set: val => emit('update:selectedKeys', val),
})

const {
  resolvedColumns,
  displayData,
  sortState,
  toggleSort,
  isSelected,
  toggleSelect,
  selectAll,
  isAllSelected,
  isIndeterminate,
} = useTable({
  data: computed(() => props.data),
  columns: computed(() => props.columns),
  rowKey: computed(() => props.rowKey),
  selectable: computed(() => props.selectable),
  selectedKeys: selectedKeysRef,
})

function handleToggleSort(key: string) {
  toggleSort(key)
  emit('sort', key, sortState.value.direction)
}

function handleToggleSelect(row: Record<string, unknown>) {
  const key = String(row[props.rowKey] ?? '')
  toggleSelect(key)
  emit('select', key, row)
}

function handleSelectAll() {
  selectAll()
  emit('selectAll', isAllSelected.value)
}

function formatCellValue(row: Record<string, unknown>, column: TableColumn): string {
  const value = row[column.key]
  if (value == null) return ''
  return String(value)
}

function columnWidthStyle(column: TableColumn): Record<string, string> | undefined {
  if (!column.width && !column.minWidth) return undefined
  const result: Record<string, string> = {}
  if (column.width)
    result.width = typeof column.width === 'number' ? `${column.width}px` : column.width
  if (column.minWidth)
    result.minWidth = typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth
  return result
}

const classList = computed(() => [
  'nm-table',
  `nm-table--${resolvedSize.value}`,
  {
    'nm-table--striped': props.striped,
    'nm-table--hoverable': props.hoverable,
    'nm-table--loading': props.loading,
  },
])

const showSelectionColumn = computed(
  () => props.selectable === true || props.selectable === 'multiple'
)
</script>

<template>
  <div :class="classList">
    <div class="nm-table__wrapper">
      <table class="nm-table__inner">
        <!-- Header -->
        <thead v-if="showHeader" class="nm-table__head">
          <tr>
            <!-- Selection column -->
            <th v-if="showSelectionColumn" class="nm-table__th nm-table__th--selection">
              <NeumorphismCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              />
            </th>
            <th
              v-for="column in resolvedColumns"
              :key="column.key"
              class="nm-table__th"
              :class="{
                'nm-table__th--sortable': column.sortable,
                'nm-table__th--active': sortState.key === column.key,
              }"
              :style="[columnWidthStyle(column), { textAlign: column.align }]"
              @click="column.sortable ? handleToggleSort(column.key) : undefined"
            >
              <span class="nm-table__th-content">
                <slot name="header" :column="column">
                  {{ column.label }}
                </slot>
                <!-- Sort indicator -->
                <span v-if="column.sortable" class="nm-table__sort-icon" aria-hidden="true">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </span>
              </span>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="nm-table__body">
          <tr
            v-for="(row, rowIndex) in displayData"
            :key="String(row[rowKey] ?? rowIndex)"
            class="nm-table__tr"
            :class="{
              'nm-table__tr--selected': isSelected(String(row[rowKey] ?? '')),
            }"
            @click="selectable === 'single' ? handleToggleSelect(row) : undefined"
          >
            <!-- Selection cell -->
            <td v-if="showSelectionColumn" class="nm-table__td nm-table__td--selection">
              <NeumorphismCheckbox
                :model-value="isSelected(String(row[rowKey] ?? ''))"
                @change="handleToggleSelect(row)"
              />
            </td>
            <td
              v-for="column in resolvedColumns"
              :key="column.key"
              class="nm-table__td"
              :style="{ textAlign: column.align }"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :column="column"
                :value="row[column.key]"
                :index="rowIndex"
              >
                {{ formatCellValue(row, column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="displayData.length === 0 && !loading" class="nm-table__empty">
        <slot name="empty">
          <span class="nm-table__empty-text">{{ resolvedEmptyText }}</span>
        </slot>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading" class="nm-table__loading">
        <slot name="loading">
          <span class="nm-table__loading-spinner" />
          <span class="nm-table__loading-text">{{ t('tableLoading') }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-table {
  position: relative;
  width: 100%;
}

.nm-table__wrapper {
  position: relative;
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-surface-color);
  @include nm-inset(3px, 6px);
  overflow: hidden;
}

.nm-table__inner {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: auto;
}

// ---- Header ----
.nm-table__head {
  .nm-table__th {
    padding: var(--nm-table-cell-padding-y-md) var(--nm-table-cell-padding-x-md);
    font-size: var(--nm-font-md);
    font-weight: 600;
    color: var(--nm-text-secondary);
    text-align: left;
    background-color: var(--nm-surface-color);
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    white-space: nowrap;
    user-select: none;
    transition: color 0.2s ease;

    &--sortable {
      cursor: pointer;

      &:hover {
        color: var(--nm-text-primary);
      }
    }

    &--active {
      color: var(--nm-primary-color);

      .nm-table__sort-icon svg {
        opacity: 1;
        transform: rotate(0deg);
      }
    }

    &--selection {
      width: 48px;
      text-align: center;
    }
  }
}

.nm-table__th-content {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
}

.nm-table__sort-icon {
  display: inline-flex;
  color: var(--nm-text-placeholder);
  transition: color 0.2s ease;

  svg {
    opacity: 0.5;
    transform: rotate(180deg);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
}

// ---- Body ----
.nm-table__body {
  .nm-table__tr {
    transition:
      background-color 0.2s ease,
      box-shadow 0.3s $nm-ease-spring;

    &:not(:last-child) .nm-table__td {
      border-bottom: 1px solid rgba(128, 128, 128, 0.06);
    }
  }
}

.nm-table__td {
  padding: var(--nm-table-cell-padding-y-md) var(--nm-table-cell-padding-x-md);
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  background-color: transparent;
  transition: background-color 0.2s ease;

  &--selection {
    width: 48px;
    text-align: center;
  }
}

// Hover
.nm-table--hoverable {
  .nm-table__body .nm-table__tr {
    @media (hover: hover) {
      &:hover {
        background-color: var(--nm-surface-raised);
        box-shadow:
          inset 1px 1px 2px var(--nm-shadow-dark),
          inset -1px -1px 2px var(--nm-shadow-light);
      }
    }
  }
}

// Striped
.nm-table--striped {
  .nm-table__body .nm-table__tr:nth-child(even) {
    background-color: rgba(128, 128, 128, 0.03);
  }
}

// Selected
.nm-table__tr--selected {
  background-color: color-mix(in srgb, var(--nm-primary-color) 6%, transparent) !important;
  box-shadow:
    inset 2px 0 0 var(--nm-primary-color),
    inset -1px 0 0 transparent !important;
}

// ---- Empty state ----
.nm-table__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--nm-table-empty-padding-y) var(--nm-table-empty-padding-x);
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-base);
}

// ---- Loading overlay ----
.nm-table__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--nm-table-loading-gap);
  background-color: rgba(224, 224, 224, 0.6);
  backdrop-filter: blur(2px);
  z-index: 10;
}

[data-theme='dark'] .nm-table__loading {
  background-color: rgba(28, 28, 28, 0.6);
}

.nm-table__loading-spinner {
  width: var(--nm-spacing-lg);
  height: var(--nm-spacing-lg);
  border: 2px solid var(--nm-surface-color);
  border-top-color: var(--nm-primary-color);
  border-radius: var(--nm-border-radius-full);
  animation: nm-table-spin 0.8s linear infinite;
}

.nm-table__loading-text {
  font-size: var(--nm-font-md);
  color: var(--nm-text-secondary);
}

// ---- Sizes ----
.nm-table--small {
  .nm-table__th,
  .nm-table__td {
    padding: var(--nm-table-cell-padding-y-sm) var(--nm-table-cell-padding-x-sm);
    font-size: var(--nm-font-sm);
  }
}

.nm-table--large {
  .nm-table__th,
  .nm-table__td {
    padding: var(--nm-table-cell-padding-y-lg) var(--nm-table-cell-padding-x-lg);
    font-size: var(--nm-font-lg);
  }
}

// ---- Reduced motion ----
@media (prefers-reduced-motion: reduce) {
  .nm-table__loading-spinner {
    animation: none;
    border-top-color: var(--nm-text-placeholder);
  }
}

@keyframes nm-table-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
