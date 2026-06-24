import { ref, computed, type Ref, type ComputedRef } from 'vue'

// ==========================================
// Types
// ==========================================

/** A single day cell in the calendar grid */
export interface DayCell {
  /** Full Date object for this cell */
  date: Date
  /** Day of month (1-31) */
  day: number
  /** Whether this cell belongs to the currently displayed month */
  isCurrentMonth: boolean
  /** Whether this cell represents today */
  isToday: boolean
  /** Whether this cell is currently selected */
  isSelected: boolean
  /** Whether this cell is disabled (outside min/max bounds) */
  isDisabled: boolean
  /** Whether this cell falls within a selected range (for future range support) */
  isInRange: boolean
}

export interface UseDatePickerOptions {
  /** v-model value — the selected date */
  modelValue: Ref<Date | null>
  /** Minimum selectable date */
  minDate?: Ref<Date | undefined> | Date
  /** Maximum selectable date */
  maxDate?: Ref<Date | undefined> | Date
  /** Display format string (e.g. 'yyyy-MM-dd') */
  format?: Ref<string | undefined> | string
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: Ref<number | undefined> | number
}

export interface UseDatePickerReturn {
  /** Currently displayed year */
  currentYear: Ref<number>
  /** Currently displayed month (1-based) */
  currentMonth: Ref<number>
  /** Flat array of 42 day cells for the calendar grid (6 rows x 7 cols) */
  calendarDays: ComputedRef<DayCell[]>
  /** Array of weekday header labels */
  weekdays: ComputedRef<string[]>
  /** The currently selected date (from modelValue) */
  selectedDate: ComputedRef<Date | null>
  /** Select a date */
  selectDate: (date: Date) => void
  /** Navigate to previous month */
  prevMonth: () => void
  /** Navigate to next month */
  nextMonth: () => void
  /** Navigate to previous year */
  prevYear: () => void
  /** Navigate to next year */
  nextYear: () => void
  /** Check if a date is the selected date */
  isSelected: (date: Date) => boolean
  /** Check if a date is today */
  isToday: (date: Date) => boolean
  /** Check if a date falls within a potential range (for future range support) */
  isInRange: (date: Date) => boolean
  /** Check if a date is disabled (outside min/max bounds) */
  isDisabled: (date: Date) => boolean
  /** Format a date to display string using the configured format */
  formatDate: (date: Date | null) => string
  /** Navigate to today's month/year */
  goToToday: () => void
}

// ==========================================
// Helpers
// ==========================================

/** Create a Date set to midnight for the given year/month/day (1-based month) */
function createDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Clone a Date set to midnight */
function cloneDate(date: Date): Date {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  return d
}

/** Check if two dates represent the same calendar day */
function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Get the day of week adjusted for firstDayOfWeek (0-based index in the week) */
function adjustedDayOfWeek(date: Date, firstDayOfWeek: number): number {
  return (date.getDay() - firstDayOfWeek + 7) % 7
}

/**
 * Format a Date to string using a simple pattern.
 * Supported tokens: yyyy, yy, MM, M, dd, d
 */
function format(date: Date, pattern: string): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return pattern
    .replace(/yyyy/g, String(year))
    .replace(/yy/g, String(year).slice(-2))
    .replace(/MM/g, String(month).padStart(2, '0'))
    .replace(/M/g, String(month))
    .replace(/dd/g, String(day).padStart(2, '0'))
    .replace(/d/g, String(day))
}

// ==========================================
// Default weekday labels (short)
// ==========================================
const DEFAULT_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ==========================================
// Composable
// ==========================================

/**
 * Headless date picker — encapsulates calendar state, navigation, day cell
 * computation, date validation, and formatting without any rendering.
 *
 * Use with your own UI. The `NeumorphismDatePicker` component provides
 * a ready-to-use neumorphism-styled implementation.
 */
export function useDatePicker(opts: UseDatePickerOptions): UseDatePickerReturn {
  const { modelValue } = opts

  // Resolve options
  const resolvedFormat = computed(() => {
    const v = opts.format
    return typeof v === 'object' && 'value' in v ? v.value : ((v as string) ?? 'yyyy-MM-dd')
  })

  const resolvedFirstDayOfWeek = computed(() => {
    const v = opts.firstDayOfWeek
    return typeof v === 'object' && 'value' in v ? v.value : ((v as number) ?? 0)
  })

  const resolvedMinDate = computed(() => {
    const v = opts.minDate
    if (!v) return undefined
    return v instanceof Date ? v : (v as Ref<Date | undefined>).value
  })

  const resolvedMaxDate = computed(() => {
    const v = opts.maxDate
    if (!v) return undefined
    return v instanceof Date ? v : (v as Ref<Date | undefined>).value
  })

  // ---- State ----
  const selectedDate = computed(() => modelValue.value)

  // Initialize current view to the selected date's month, or today
  const initialDate = modelValue.value ? cloneDate(modelValue.value) : new Date()
  const currentYear = ref(initialDate.getFullYear())
  const currentMonth = ref(initialDate.getMonth() + 1) // 1-based

  // Sync view to selected date when it changes externally
  // (only when there IS a selected date — don't jump on clear)
  // Actually, we should sync when a date is set externally

  // ---- Calendar grid computation ----
  const calendarDays = computed<DayCell[]>(() => {
    const year = currentYear.value
    const month = currentMonth.value // 1-based
    const fdow = resolvedFirstDayOfWeek.value ?? 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sel = selectedDate.value
    const min = resolvedMinDate.value
    const max = resolvedMaxDate.value

    // First day of this month
    const firstOfMonth = createDate(year, month, 1)
    // Day of week of first day (adjusted): how many empty cells before it
    const startOffset = adjustedDayOfWeek(firstOfMonth, fdow)

    // Build 42 cells (6 weeks * 7 days)
    const cells: DayCell[] = []

    for (let i = 0; i < 42; i++) {
      const dayOffset = i - startOffset
      const cellDate = createDate(year, month, 1 + dayOffset)
      const cellMonth = cellDate.getMonth() + 1
      const cellYear = cellDate.getFullYear()

      const cellIsCurrentMonth = cellMonth === month && cellYear === year
      const cellIsToday = isSameDay(cellDate, today)
      const cellIsSelected = isSameDay(cellDate, sel)
      const cellIsDisabled =
        (min ? cellDate < cloneDate(min) : false) || (max ? cellDate > cloneDate(max) : false)
      const cellIsInRange = false // Reserved for future range support

      cells.push({
        date: cellDate,
        day: cellDate.getDate(),
        isCurrentMonth: cellIsCurrentMonth,
        isToday: cellIsToday,
        isSelected: cellIsSelected,
        isDisabled: cellIsDisabled,
        isInRange: cellIsInRange,
      })
    }

    return cells
  })

  // ---- Weekday headers ----
  const weekdays = computed<string[]>(() => {
    const fdow = resolvedFirstDayOfWeek.value ?? 0
    const result: string[] = []
    for (let i = 0; i < 7; i++) {
      const dayIndex = (fdow + i) % 7
      result.push(DEFAULT_WEEKDAYS[dayIndex])
    }
    return result
  })

  // ---- Navigation ----
  function prevMonth() {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth() {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  function prevYear() {
    currentYear.value--
  }

  function nextYear() {
    currentYear.value++
  }

  function goToToday() {
    const today = new Date()
    currentYear.value = today.getFullYear()
    currentMonth.value = today.getMonth() + 1
  }

  // ---- Date selection ----
  function selectDate(date: Date) {
    if (isDateDisabled(date)) return
    modelValue.value = cloneDate(date)
  }

  // ---- Date checks ----
  function isDateSelected(date: Date): boolean {
    return isSameDay(date, selectedDate.value)
  }

  function isDateToday(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isSameDay(date, today)
  }

  function isDateInRange(_date: Date): boolean {
    // Reserved for future range support
    return false
  }

  function isDateDisabled(date: Date): boolean {
    const min = resolvedMinDate.value
    const max = resolvedMaxDate.value
    const d = cloneDate(date)
    if (min && d < cloneDate(min)) return true
    if (max && d > cloneDate(max)) return true
    return false
  }

  // ---- Formatting ----
  function formatDate(date: Date | null): string {
    if (!date) return ''
    return format(date, resolvedFormat.value ?? 'yyyy-MM-dd')
  }

  return {
    currentYear,
    currentMonth,
    calendarDays,
    weekdays,
    selectedDate,
    selectDate,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    isSelected: isDateSelected,
    isToday: isDateToday,
    isInRange: isDateInRange,
    isDisabled: isDateDisabled,
    formatDate,
    goToToday,
  }
}
