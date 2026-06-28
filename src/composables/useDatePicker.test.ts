import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDatePicker } from './useDatePicker'

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

describe('useDatePicker', () => {
  it('should initialize with selected date', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { selectedDate, formatDate } = useDatePicker({ modelValue })
    expect(selectedDate.value).not.toBeNull()
    expect(formatDate(selectedDate.value)).toBe('2025-06-15')
  })

  it('should initialize with null date', () => {
    const modelValue = ref<Date | null>(null)
    const { selectedDate } = useDatePicker({ modelValue })
    expect(selectedDate.value).toBeNull()
  })

  it('should select a date', () => {
    const modelValue = ref<Date | null>(null)
    const { selectDate } = useDatePicker({ modelValue })
    const date = makeDate(2025, 8, 10)
    selectDate(date)
    expect(modelValue.value).not.toBeNull()
    expect(modelValue.value!.getFullYear()).toBe(2025)
    expect(modelValue.value!.getMonth()).toBe(7) // 0-based
    expect(modelValue.value!.getDate()).toBe(10)
  })

  it('should navigate months', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { currentYear, currentMonth, prevMonth, nextMonth } = useDatePicker({
      modelValue,
    })
    expect(currentYear.value).toBe(2025)
    expect(currentMonth.value).toBe(6)
    nextMonth()
    expect(currentMonth.value).toBe(7)
    prevMonth()
    expect(currentMonth.value).toBe(6)
  })

  it('should wrap month navigation across year boundary', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 1, 1))
    const { currentYear, currentMonth, prevMonth } = useDatePicker({ modelValue })
    prevMonth()
    expect(currentYear.value).toBe(2024)
    expect(currentMonth.value).toBe(12)
  })

  it('should navigate years', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { currentYear, prevYear, nextYear } = useDatePicker({ modelValue })
    nextYear()
    expect(currentYear.value).toBe(2026)
    prevYear()
    expect(currentYear.value).toBe(2025)
  })

  it('should jump to today', () => {
    const modelValue = ref<Date | null>(makeDate(2020, 1, 1))
    const { currentYear, currentMonth, goToToday } = useDatePicker({ modelValue })
    goToToday()
    const today = new Date()
    expect(currentYear.value).toBe(today.getFullYear())
    expect(currentMonth.value).toBe(today.getMonth() + 1)
  })

  it('should generate calendar days', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { calendarDays } = useDatePicker({ modelValue })
    expect(calendarDays.value.length).toBe(42) // 6 rows x 7 cols
    // Should have both current month and surrounding days
    const currentMonthDays = calendarDays.value.filter(d => d.isCurrentMonth)
    expect(currentMonthDays.length).toBeGreaterThan(0)
  })

  it('should mark today correctly', () => {
    const modelValue = ref<Date | null>(null)
    const { calendarDays } = useDatePicker({ modelValue })
    const todayCell = calendarDays.value.find(d => d.isToday)
    if (todayCell) {
      const today = new Date()
      expect(todayCell.date.getFullYear()).toBe(today.getFullYear())
      expect(todayCell.date.getMonth()).toBe(today.getMonth())
      expect(todayCell.date.getDate()).toBe(today.getDate())
    }
  })

  it('should mark selected date in calendar', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { calendarDays } = useDatePicker({ modelValue })
    const selectedCell = calendarDays.value.find(d => d.isSelected)
    expect(selectedCell).toBeDefined()
    expect(selectedCell!.day).toBe(15)
  })

  it('should check if date is selected', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { isSelected } = useDatePicker({ modelValue })
    expect(isSelected(makeDate(2025, 6, 15))).toBe(true)
    expect(isSelected(makeDate(2025, 6, 16))).toBe(false)
  })

  it('should check if date is today', () => {
    const modelValue = ref<Date | null>(null)
    const { isToday } = useDatePicker({ modelValue })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(isToday(today)).toBe(true)
  })

  it('should check if date is disabled by min/max', () => {
    const modelValue = ref<Date | null>(null)
    const { isDisabled } = useDatePicker({
      modelValue,
      minDate: makeDate(2025, 1, 1),
      maxDate: makeDate(2025, 12, 31),
    })
    expect(isDisabled(makeDate(2024, 12, 31))).toBe(true)
    expect(isDisabled(makeDate(2025, 6, 15))).toBe(false)
    expect(isDisabled(makeDate(2026, 1, 1))).toBe(true)
  })

  it('should format date with custom format', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { formatDate } = useDatePicker({
      modelValue,
      format: 'MM/dd/yyyy',
    })
    expect(formatDate(modelValue.value)).toBe('06/15/2025')
  })

  it('should format date with different tokens', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 1, 5))
    const { formatDate } = useDatePicker({
      modelValue,
      format: 'yy-M-d',
    })
    expect(formatDate(modelValue.value)).toBe('25-1-5')
  })

  it('should format null date', () => {
    const modelValue = ref<Date | null>(null)
    const { formatDate } = useDatePicker({ modelValue })
    expect(formatDate(null)).toBe('')
  })

  it('should return weekdays', () => {
    const modelValue = ref<Date | null>(null)
    const { weekdays } = useDatePicker({ modelValue })
    expect(weekdays.value.length).toBe(7)
    // Default starts with Sunday
    expect(weekdays.value[0]).toBe('Su')
  })

  it('should respect firstDayOfWeek', () => {
    const modelValue = ref<Date | null>(null)
    const { weekdays } = useDatePicker({
      modelValue,
      firstDayOfWeek: 1, // Monday
    })
    expect(weekdays.value[0]).toBe('Mo')
  })

  it('should count isInRange as false for single date mode', () => {
    const modelValue = ref<Date | null>(makeDate(2025, 6, 15))
    const { isInRange } = useDatePicker({ modelValue })
    expect(isInRange(makeDate(2025, 6, 16))).toBe(false)
  })
})
