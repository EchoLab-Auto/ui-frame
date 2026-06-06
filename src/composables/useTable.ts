import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface TableColumn {
  key: string
  label: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** Custom sort function. Return > 0 if a > b. */
  sorter?: (a: unknown, b: unknown) => number
  filterable?: boolean
  filters?: { text: string; value: unknown }[]
  /** Custom filter function. Return true to keep the row. */
  filter?: (rowValue: unknown, filterValue: unknown) => boolean
}

export type SortDirection = 'ascend' | 'descend' | null

export interface SortState {
  key: string
  direction: SortDirection
}

export type SelectionMode = 'single' | 'multiple'

export interface UseTableOptions {
  data: Ref<Record<string, unknown>[]> | ComputedRef<Record<string, unknown>[]>
  columns: Ref<TableColumn[]> | ComputedRef<TableColumn[]>
  rowKey?: Ref<string> | ComputedRef<string>
  selectable?: Ref<boolean | SelectionMode>
  selectedKeys?: Ref<string[]>
  pagination?: {
    enabled: Ref<boolean>
    pageSize: Ref<number>
    currentPage: Ref<number>
  }
}

export interface UseTableReturn {
  /** Columns resolved with defaults */
  resolvedColumns: ComputedRef<TableColumn[]>
  /** Display data after sort/filter/page */
  displayData: ComputedRef<Record<string, unknown>[]>
  /** Total count after filter (before pagination) */
  filteredTotal: ComputedRef<number>
  /** Current sort state */
  sortState: Ref<SortState>
  /** Active filter values per column key */
  filterState: Ref<Record<string, unknown[]>>
  /** Toggle sort for a column */
  toggleSort: (key: string) => void
  /** Set sort explicitly */
  setSort: (key: string, direction: SortDirection) => void
  /** Apply filters for a column */
  setFilter: (key: string, values: unknown[]) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Whether row is selected */
  isSelected: (rowKeyValue: string) => boolean
  /** Toggle row selection */
  toggleSelect: (rowKeyValue: string) => void
  /** Select all visible rows */
  selectAll: () => void
  /** Clear selection */
  clearSelection: () => void
  /** Selected row keys */
  selectedKeys: Ref<string[]>
  /** All row keys */
  allKeys: ComputedRef<string[]>
  /** Whether all visible rows are selected */
  isAllSelected: ComputedRef<boolean>
  /** Whether some (but not all) visible rows are selected */
  isIndeterminate: ComputedRef<boolean>
}

function defaultSort(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function getRowKey(row: Record<string, unknown>, keyField: string): string {
  const value = row[keyField]
  return value != null ? String(value) : ''
}

/**
 * Headless table — encapsulates sort, filter, selection, and pagination logic.
 * Use with your own UI rendering.
 */
export function useTable(opts: UseTableOptions): UseTableReturn {
  const { data, columns } = opts
  const rowKeyField = opts.rowKey ?? { value: 'key' }
  const selectable = opts.selectable ?? { value: false }
  const selectedKeysRef = opts.selectedKeys ?? ref<string[]>([])

  const sortState = ref<SortState>({ key: '', direction: null })
  const filterState = ref<Record<string, unknown[]>>({})

  const resolvedColumns = computed<TableColumn[]>(() =>
    columns.value.map(col => ({
      align: 'left',
      ...col,
    }))
  )

  // --- Sorting ---

  const sortedData = computed(() => {
    const list = [...data.value]
    const { key, direction } = sortState.value
    if (!key || !direction) return list

    const column = columns.value.find(c => c.key === key)
    if (!column?.sortable) return list

    list.sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      const result = column.sorter ? column.sorter(aVal, bVal) : defaultSort(aVal, bVal)
      return direction === 'ascend' ? result : -result
    })
    return list
  })

  // --- Filtering ---

  const filteredData = computed(() => {
    const activeFilters = filterState.value
    const keys = Object.keys(activeFilters).filter(k => activeFilters[k]?.length > 0)
    if (keys.length === 0) return sortedData.value

    return sortedData.value.filter(row => {
      for (const key of keys) {
        const column = columns.value.find(c => c.key === key)
        if (!column?.filterable) continue
        const rowValue = row[key]
        const filterValues = activeFilters[key]
        const match = column.filter
          ? filterValues.some(fv => column.filter!(rowValue, fv))
          : filterValues.includes(rowValue)
        if (!match) return false
      }
      return true
    })
  })

  const filteredTotal = computed(() => filteredData.value.length)

  // --- Pagination ---

  const displayData = computed(() => {
    const pag = opts.pagination
    if (!pag || !pag.enabled.value) return filteredData.value
    const start = (pag.currentPage.value - 1) * pag.pageSize.value
    return filteredData.value.slice(start, start + pag.pageSize.value)
  })

  // --- Sort actions ---

  function toggleSort(key: string) {
    const current = sortState.value
    if (current.key !== key) {
      sortState.value = { key, direction: 'ascend' }
    } else if (current.direction === 'ascend') {
      sortState.value = { key, direction: 'descend' }
    } else {
      sortState.value = { key: '', direction: null }
    }
  }

  function setSort(key: string, direction: SortDirection) {
    sortState.value = { key, direction }
  }

  // --- Filter actions ---

  function setFilter(key: string, values: unknown[]) {
    if (values.length === 0) {
      delete filterState.value[key]
    } else {
      filterState.value[key] = values
    }
  }

  function clearFilters() {
    filterState.value = {}
  }

  // --- Selection ---

  const allKeys = computed(() =>
    displayData.value.map(row => getRowKey(row, rowKeyField.value)).filter(Boolean)
  )

  function isSelected(rowKeyValue: string): boolean {
    if (!selectable.value) return false
    return selectedKeysRef.value.includes(rowKeyValue)
  }

  function toggleSelect(rowKeyValue: string) {
    if (!selectable.value) return
    const mode = selectable.value === true ? 'multiple' : (selectable.value as SelectionMode)
    const keys = selectedKeysRef.value
    const idx = keys.indexOf(rowKeyValue)

    if (mode === 'single') {
      selectedKeysRef.value = idx >= 0 ? [] : [rowKeyValue]
    } else {
      if (idx >= 0) {
        keys.splice(idx, 1)
      } else {
        keys.push(rowKeyValue)
      }
    }
  }

  function selectAll() {
    if (!selectable.value) return
    const visibleKeys = allKeys.value
    const allSelected = visibleKeys.every(k => selectedKeysRef.value.includes(k))
    if (allSelected) {
      // Deselect all visible
      selectedKeysRef.value = selectedKeysRef.value.filter(k => !visibleKeys.includes(k))
    } else {
      // Select all visible
      const set = new Set([...selectedKeysRef.value, ...visibleKeys])
      selectedKeysRef.value = [...set]
    }
  }

  function clearSelection() {
    selectedKeysRef.value = []
  }

  const isAllSelected = computed(() => {
    if (allKeys.value.length === 0) return false
    return allKeys.value.every(k => selectedKeysRef.value.includes(k))
  })

  const isIndeterminate = computed(() => {
    if (allKeys.value.length === 0) return false
    const hasSome = allKeys.value.some(k => selectedKeysRef.value.includes(k))
    return hasSome && !isAllSelected.value
  })

  return {
    resolvedColumns,
    displayData,
    filteredTotal,
    sortState,
    filterState,
    toggleSort,
    setSort,
    setFilter,
    clearFilters,
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedKeys: selectedKeysRef,
    allKeys,
    isAllSelected,
    isIndeterminate,
  }
}
