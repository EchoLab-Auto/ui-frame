import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTable } from './useTable'
import type { TableColumn } from './useTable'

describe('useTable', () => {
  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
    { key: 'role', label: 'Role' },
  ]

  function setup(
    data = [
      { name: 'Alice', age: 30, role: 'Admin' },
      { name: 'Bob', age: 25, role: 'User' },
      { name: 'Charlie', age: 35, role: 'Editor' },
    ],
    opts: Record<string, unknown> = {}
  ) {
    return useTable({
      data: ref(data),
      columns: ref(columns),
      rowKey: ref('name'),
      ...(opts as Record<string, unknown>),
    })
  }

  // --- Sorting ---

  describe('sorting', () => {
    it('should sort ascending by default', () => {
      const { toggleSort, displayData } = setup()
      toggleSort('name')
      expect(displayData.value.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('should toggle to descending', () => {
      const { toggleSort, displayData } = setup()
      toggleSort('name')
      toggleSort('name')
      expect(displayData.value.map(r => r.name)).toEqual(['Charlie', 'Bob', 'Alice'])
    })

    it('should clear sort on third toggle', () => {
      const { toggleSort, displayData } = setup()
      toggleSort('name')
      toggleSort('name')
      toggleSort('name')
      expect(displayData.value.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('should sort numbers correctly', () => {
      const { toggleSort, displayData } = setup()
      toggleSort('age')
      expect(displayData.value.map(r => r.age)).toEqual([25, 30, 35])
    })

    it('should use custom sorter', () => {
      const customColumns: TableColumn[] = [
        {
          key: 'name',
          label: 'Name',
          sortable: true,
          sorter: (a, b) => String(b).localeCompare(String(a)),
        },
      ]
      const { toggleSort, displayData } = useTable({
        data: ref([{ name: 'Alice' }, { name: 'Bob' }]),
        columns: ref(customColumns),
        rowKey: ref('name'),
      })
      toggleSort('name')
      expect(displayData.value.map(r => r.name)).toEqual(['Bob', 'Alice'])
    })

    it('should set sort explicitly', () => {
      const { setSort, displayData } = setup()
      setSort('age', 'descend')
      expect(displayData.value.map(r => r.age)).toEqual([35, 30, 25])
    })
  })

  // --- Filtering ---

  describe('filtering', () => {
    it('should filter by exact match', () => {
      const { setFilter, displayData } = setup(undefined, {
        columns: ref([{ key: 'role', label: 'Role', filterable: true }]),
      })
      setFilter('role', ['Admin'])
      expect(displayData.value.map(r => r.name)).toEqual(['Alice'])
    })

    it('should filter with multiple values', () => {
      const { setFilter, displayData } = setup(undefined, {
        columns: ref([{ key: 'role', label: 'Role', filterable: true }]),
      })
      setFilter('role', ['Admin', 'User'])
      expect(displayData.value.map(r => r.name)).toEqual(['Alice', 'Bob'])
    })

    it('should clear filter when empty values', () => {
      const { setFilter, displayData } = setup(undefined, {
        columns: ref([{ key: 'role', label: 'Role', filterable: true }]),
      })
      setFilter('role', ['Admin'])
      setFilter('role', [])
      expect(displayData.value.length).toBe(3)
    })

    it('should use custom filter function', () => {
      const { setFilter, displayData } = useTable({
        data: ref([
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
          { name: 'Charlie', age: 35 },
        ]),
        columns: ref([
          {
            key: 'age',
            label: 'Age',
            filterable: true,
            filter: (val, filterVal) => (val as number) >= (filterVal as number),
          },
        ]),
        rowKey: ref('name'),
      })
      setFilter('age', [30])
      expect(displayData.value.map(r => r.name)).toEqual(['Alice', 'Charlie'])
    })
  })

  // --- Pagination ---

  describe('pagination', () => {
    it('should paginate correctly', () => {
      const { displayData } = useTable({
        data: ref(Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i + 1}` }))),
        columns: ref([{ key: 'name', label: 'Name' }]),
        rowKey: ref('name'),
        pagination: {
          enabled: ref(true),
          pageSize: ref(3),
          currentPage: ref(1),
        },
      })
      expect(displayData.value.length).toBe(3)
      expect(displayData.value[0].name).toBe('Item 1')
    })

    it('should show second page', () => {
      const { displayData } = useTable({
        data: ref(Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i + 1}` }))),
        columns: ref([{ key: 'name', label: 'Name' }]),
        rowKey: ref('name'),
        pagination: {
          enabled: ref(true),
          pageSize: ref(3),
          currentPage: ref(2),
        },
      })
      expect(displayData.value[0].name).toBe('Item 4')
    })
  })

  // --- Selection ---

  describe('selection', () => {
    it('should select single row', () => {
      const selectedKeys = ref<string[]>([])
      const { toggleSelect, isSelected } = setup(undefined, {
        selectable: ref(true),
        selectedKeys,
      })
      toggleSelect('Alice')
      expect(isSelected('Alice')).toBe(true)
      expect(isSelected('Bob')).toBe(false)
    })

    it('should deselect on second toggle', () => {
      const selectedKeys = ref<string[]>([])
      const { toggleSelect, isSelected } = setup(undefined, {
        selectable: ref(true),
        selectedKeys,
      })
      toggleSelect('Alice')
      toggleSelect('Alice')
      expect(isSelected('Alice')).toBe(false)
    })

    it('should select multiple rows', () => {
      const selectedKeys = ref<string[]>([])
      const { toggleSelect, isSelected } = setup(undefined, {
        selectable: ref(true as const),
        selectedKeys,
      })
      toggleSelect('Alice')
      toggleSelect('Bob')
      expect(isSelected('Alice')).toBe(true)
      expect(isSelected('Bob')).toBe(true)
    })

    it('should support single selection mode', () => {
      const selectedKeys = ref<string[]>([])
      const { toggleSelect, isSelected } = setup(undefined, {
        selectable: ref('single' as const),
        selectedKeys,
      })
      toggleSelect('Alice')
      toggleSelect('Bob')
      expect(isSelected('Alice')).toBe(false)
      expect(isSelected('Bob')).toBe(true)
    })

    it('should select all visible rows', () => {
      const selectedKeys = ref<string[]>([])
      const { selectAll, isAllSelected } = setup(undefined, {
        selectable: ref(true as const),
        selectedKeys,
      })
      selectAll()
      expect(isAllSelected.value).toBe(true)
    })

    it('should deselect all on second selectAll', () => {
      const selectedKeys = ref<string[]>([])
      const { selectAll, isAllSelected, isIndeterminate } = setup(undefined, {
        selectable: ref(true as const),
        selectedKeys,
      })
      selectAll()
      selectAll()
      expect(isAllSelected.value).toBe(false)
      expect(isIndeterminate.value).toBe(false)
    })
  })

  // --- Combined sort + filter + pagination ---

  it('should apply sort then filter then pagination', () => {
    const { displayData, setFilter, setSort } = useTable({
      data: ref(
        Array.from({ length: 10 }, (_, i) => ({
          name: `Item ${String.fromCharCode(65 + i)}`,
          category: i < 5 ? 'A' : 'B',
          value: i + 1,
        }))
      ),
      columns: ref([
        { key: 'name', label: 'Name', sortable: true },
        { key: 'category', label: 'Category', filterable: true },
      ]),
      rowKey: ref('name'),
      pagination: {
        enabled: ref(true),
        pageSize: ref(2),
        currentPage: ref(1),
      },
    })

    // Filter to category A (Items A-E)
    setFilter('category', ['A'])
    setSort('name', 'descend')
    // Category A items: E, D, C, B, A (sorted descending)
    // Page 1 (size 2): E, D
    expect(displayData.value.map(r => r.name)).toEqual(['Item E', 'Item D'])
  })
})
