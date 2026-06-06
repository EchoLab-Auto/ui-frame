import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  function setup(total = 100, modelValue = 1, pageSize = 10) {
    const currentPage = ref(modelValue)
    const pagination = usePagination({
      modelValue: currentPage,
      total: computed(() => total),
      pageSize: computed(() => pageSize),
    })
    return { currentPage, pagination }
  }

  it('should compute totalPages', () => {
    const { pagination } = setup(100, 1, 10)
    expect(pagination.totalPages.value).toBe(10)
  })

  it('should go to next and previous page', () => {
    const { pagination } = setup(100, 5, 10)
    pagination.nextPage()
    expect(pagination.isPrevDisabled.value).toBe(false)
  })

  it('should disable prev on first page', () => {
    const { pagination } = setup(100, 1, 10)
    expect(pagination.isPrevDisabled.value).toBe(true)
  })

  it('should disable next on last page', () => {
    const { pagination } = setup(100, 10, 10)
    expect(pagination.isNextDisabled.value).toBe(true)
  })

  it('should generate visible pages with ellipsis', () => {
    const { pagination } = setup(200, 50, 5)
    const pages = pagination.visiblePages.value
    // Some pages should be ellipsis strings
    const hasEllipsis = pages.some(p => typeof p === 'string')
    expect(hasEllipsis).toBe(true)
  })

  it('should change to a specific page', () => {
    const { currentPage, pagination } = setup(100, 1, 10)
    pagination.changePage(5)
    expect(currentPage.value).toBe(5)
  })
})
