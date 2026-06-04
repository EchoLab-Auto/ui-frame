import { computed, type Ref, type ComputedRef } from 'vue'

export interface UsePaginationOptions {
  /** v-model current page */
  modelValue: Ref<number>
  /** Total number of items */
  total: Ref<number> | ComputedRef<number>
  /** Items per page */
  pageSize?: Ref<number> | ComputedRef<number>
  /** Maximum visible page buttons */
  maxVisiblePages?: Ref<number> | ComputedRef<number>
  /** Whether pagination is disabled */
  disabled?: Ref<boolean>
}

export interface UsePaginationReturn {
  /** Total number of pages */
  totalPages: ComputedRef<number>
  /** Current page (clamped) */
  currentPage: ComputedRef<number>
  /** Array of visible page numbers and ellipsis markers */
  visiblePages: ComputedRef<(number | 'prev-ellipsis' | 'next-ellipsis')[]>
  /** Change to a specific page */
  changePage: (page: number) => void
  /** Go to previous page */
  prevPage: () => void
  /** Go to next page */
  nextPage: () => void
  /** Whether previous button should be disabled */
  isPrevDisabled: ComputedRef<boolean>
  /** Whether next button should be disabled */
  isNextDisabled: ComputedRef<boolean>
}

/**
 * Headless pagination — encapsulates page calculation, ellipsis logic,
 * and page navigation. Use with your own UI rendering.
 */
export function usePagination(opts: UsePaginationOptions): UsePaginationReturn {
  const { modelValue, total } = opts
  const pageSize = opts.pageSize ?? computed(() => 10)
  const maxVisiblePages = opts.maxVisiblePages ?? computed(() => 7)
  const disabled = opts.disabled ?? computed(() => false)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value))
  )

  const currentPage = computed(() =>
    Math.min(Math.max(1, modelValue.value), totalPages.value)
  )

  function changePage(page: number) {
    if (isNaN(page) || !isFinite(page)) return
    const p = Math.round(page)
    if (disabled.value || p < 1 || p > totalPages.value || p === currentPage.value) return
    modelValue.value = p
  }

  function prevPage() {
    changePage(currentPage.value - 1)
  }

  function nextPage() {
    changePage(currentPage.value + 1)
  }

  const isPrevDisabled = computed(() => currentPage.value <= 1 || disabled.value)
  const isNextDisabled = computed(() => currentPage.value >= totalPages.value || disabled.value)

  const visiblePages = computed(() => {
    const max = maxVisiblePages.value
    const total = totalPages.value
    const current = currentPage.value

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const half = Math.floor(max / 2)
    let start = current - half
    let end = current + half

    if (start < 1) {
      end += 1 - start
      start = 1
    }
    if (end > total) {
      start -= end - total
      end = total
    }

    start = Math.max(1, start)
    end = Math.min(total, end)

    const pages: (number | 'prev-ellipsis' | 'next-ellipsis')[] = []
    if (start > 1) pages.push(1)
    if (start > 2) pages.push('prev-ellipsis')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('next-ellipsis')
    if (end < total) pages.push(total)

    return pages
  })

  return {
    totalPages,
    currentPage,
    visiblePages,
    changePage,
    prevPage,
    nextPage,
    isPrevDisabled,
    isNextDisabled,
  }
}
