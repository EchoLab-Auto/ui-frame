<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/composables/useTable'
import type { TableColumn, SortDirection } from '@/composables/useTable'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { TABLE_SCALE } from '@/utils/controlScales'
import NeumorphismCheckbox from '@/components/NeumorphismCheckbox/NeumorphismCheckbox.vue'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type { TableColumn }

export type TableSize = 'small' | 'medium' | 'large'

export interface NeumorphismTableProps {
  data?: Record<string, unknown>[]
  columns?: TableColumn[]
  rowKey?: string
  selectable?: boolean | 'single' | 'multiple'
  selectedKeys?: string[]
  loading?: boolean
  emptyText?: string
  /**
   * 尺寸——px 单元格上下内距（数字，行密度），或三档预设名。
   *
   * 数字即「行密度」：上下内距是主几何量，左右内距与单元格字号按三锚点
   * （8 / 12 / 16）分段线性插值，所以 `:size="12"` 与 `size="medium"` 逐像素
   * 相同，`:size="10"` 落在 small / medium 之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | TableSize
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
  striped: undefined,
  hoverable: undefined,
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
/** 数字尺寸的语义是「单元格上下内距」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 12

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.table?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<TableSize>(() => {
  const raw = props.size ?? config.value.table?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale）；变量在根节点，消费在单元格上 */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(TABLE_SCALE, numericSize.value)
)
const resolvedStriped = computed(() => props.striped ?? config.value.table?.striped ?? false)
const resolvedHoverable = computed(() => props.hoverable ?? config.value.table?.hoverable ?? true)
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
  numericSize.value === undefined ? `nm-table--${resolvedSize.value}` : 'nm-table--sized',
  {
    'nm-table--striped': resolvedStriped.value,
    'nm-table--hoverable': resolvedHoverable.value,
    'nm-table--loading': props.loading,
  },
])

const showSelectionColumn = computed(
  () => props.selectable === true || props.selectable === 'multiple'
)
</script>

<template>
  <div :class="classList" :style="sizeStyle">
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
              :tabindex="column.sortable ? 0 : undefined"
              :aria-sort="
                column.sortable
                  ? sortState.key === column.key
                    ? sortState.direction === 'ascend'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined
              "
              @click="column.sortable ? handleToggleSort(column.key) : undefined"
              @keydown.enter="column.sortable ? handleToggleSort(column.key) : undefined"
              @keydown.space.prevent="column.sortable ? handleToggleSort(column.key) : undefined"
            >
              <span class="nm-table__th-content">
                <slot name="header" :column="column">
                  {{ column.label }}
                </slot>
                <!-- Sort indicator -->
                <span v-if="column.sortable" class="nm-table__sort-icon" aria-hidden="true">
                  <NeumorphismIcon name="chevron-up" size="xs" />
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
              'nm-table__tr--clickable': selectable === 'single',
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
  // 横向滚动（2026-10 iOS 复检）：此前 overflow: hidden 把超宽列直接裁掉，
  // 手指也滑不出来 —— 不是"暂时看不到"而是**永久不可达**。圆角裁剪由
  // 外层自身 border-radius + 内容内边距保持。
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
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
    border-bottom: 1px solid var(--nm-border-subtle);
    white-space: nowrap;
    user-select: none;
    transition: color 0.2s ease;

    &--sortable {
      cursor: pointer;

      @media (hover: hover) {
        &:hover {
          color: var(--nm-text-primary);
        }
      }

      // 键盘焦点内环（表头单元格紧凑排列）
      @include nm-focus-ring(-2px);

      // 按下：即时加深文字对比
      &:active {
        color: var(--nm-text-primary);
        background-color: var(--nm-surface-raised);
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
      border-bottom: 1px solid color-mix(in srgb, var(--nm-border-subtle) 60%, transparent);
    }

    // 可点行（selectable=single）：指针反馈 + 按下即时反馈
    &--clickable {
      cursor: pointer;

      &:active {
        background-color: var(--nm-surface-raised);
        box-shadow:
          inset 1px 1px 2px var(--nm-shadow-dark),
          inset -1px -1px 2px var(--nm-shadow-light);
      }
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
    background-color: color-mix(in srgb, var(--nm-border-subtle) 30%, transparent);
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
  background-color: color-mix(in srgb, var(--nm-bg-color) 60%, transparent);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  /* 组件内部层级（非全局浮层，从 1 起） */
  z-index: 1;
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

// 数字尺寸（`:size="10"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 表格没有 `--medium` 档位类（medium 就是 `.nm-table__th/td` 的基础规则），所以
// 这条规则同时承担 medium 的「数值版」：选择器结构、声明与 small/large 完全一致。
.nm-table--sized {
  .nm-table__th,
  .nm-table__td {
    padding: var(--nm-table-sz-pad-y) var(--nm-table-sz-pad-x);
    font-size: var(--nm-table-sz-font);
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
