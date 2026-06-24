<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDatePicker } from '@/composables/useDatePicker'
import { useFormField } from '@/composables/useFormField'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useLocale } from '@/composables/useLocale'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'
import NeumorphismPopover from '@/components/NeumorphismPopover/NeumorphismPopover.vue'

export interface NeumorphismDatePickerProps {
  modelValue?: Date | null
  placeholder?: string
  format?: string
  disabled?: boolean
  clearable?: boolean
  size?: 'small' | 'medium' | 'large'
  minDate?: Date
  maxDate?: Date
  firstDayOfWeek?: number
  label?: string
  required?: boolean
  error?: string | boolean
  name?: string
  id?: string
}

const props = withDefaults(defineProps<NeumorphismDatePickerProps>(), {
  modelValue: null,
  placeholder: '',
  format: 'yyyy-MM-dd',
  disabled: false,
  clearable: true,
  size: 'medium',
  firstDayOfWeek: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | null): void
  (e: 'change', value: Date | null): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const { resolveProp } = useNeumorphismSetup()
const { t } = useLocale()

const resolvedSize = computed(() => resolveProp(props.size, undefined, 'medium'))
const resolvedFormat = computed(() => resolveProp(props.format, undefined, 'yyyy-MM-dd'))
const resolvedPlaceholder = computed(() => props.placeholder || t('datePickerPlaceholder'))
const resolvedClearLabel = computed(() => t('datePickerClear'))
const resolvedTodayLabel = computed(() => t('datePickerToday'))
const resolvedPrevMonthLabel = computed(() => t('datePickerPrevMonth'))
const resolvedNextMonthLabel = computed(() => t('datePickerNextMonth'))
const resolvedPrevYearLabel = computed(() => t('datePickerPrevYear'))
const resolvedNextYearLabel = computed(() => t('datePickerNextYear'))

// ---- Model ref ----
const modelRef = computed({
  get: () => props.modelValue ?? null,
  set: (val: Date | null) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

// ---- Headless date picker composable ----
const {
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
  formatDate,
  goToToday,
} = useDatePicker({
  modelValue: modelRef,
  minDate: computed(() => props.minDate),
  maxDate: computed(() => props.maxDate),
  format: resolvedFormat,
  firstDayOfWeek: computed(() => props.firstDayOfWeek),
})

// ---- Form field integration ----
const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } = useFormField(() => ({
  id: props.id,
  size: resolvedSize.value,
  disabled: props.disabled,
  error: props.error,
  prefix: 'datepicker',
}))

// ---- Popover state (controlled by popover component) ----
const popoverRef = ref<InstanceType<typeof NeumorphismPopover>>()
const isOpen = ref(false)

function onPopoverVisibleChange(visible: boolean) {
  isOpen.value = visible
}

function onDayClick(day: import('@/composables/useDatePicker').DayCell) {
  if (day.isDisabled) return
  selectDate(day.date)
  // Close popover after selection
  popoverRef.value?.hide()
}

function onTodayClick() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  selectDate(today)
  goToToday()
  popoverRef.value?.hide()
}

function onClear(event: Event) {
  event.stopPropagation()
  emit('update:modelValue', null)
  emit('change', null)
}

// Sync calendar view to selected date when it changes externally
watch(selectedDate, date => {
  if (date) {
    currentYear.value = date.getFullYear()
    currentMonth.value = date.getMonth() + 1
  }
})

// ---- Trigger display text ----
const displayText = computed(() => {
  if (selectedDate.value) {
    return formatDate(selectedDate.value)
  }
  return ''
})

// ---- Class list ----
const classList = computed(() => [
  ...baseClassList('nm-datepicker').value,
  {
    'nm-datepicker--open': isOpen.value,
    'nm-datepicker--has-value': selectedDate.value !== null,
  },
])

// ---- Month names for header display ----
const monthNames = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return { year, monthName: months[month - 1] }
})
</script>

<template>
  <div class="nm-datepicker__wrapper">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />

    <NeumorphismPopover
      ref="popoverRef"
      :disabled="disabled"
      :width="'trigger'"
      :show-arrow="false"
      trigger="click"
      @visible-change="onPopoverVisibleChange"
    >
      <!-- Trigger: input-like display area -->
      <div
        :class="classList"
        :aria-label="label || resolvedPlaceholder"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="'dialog'"
        @focus="(e: FocusEvent) => handleFocus(e, emit)"
        @blur="(e: FocusEvent) => handleBlur(e, emit)"
      >
        <span
          class="nm-datepicker__value"
          :class="{ 'nm-datepicker__value--placeholder': !selectedDate }"
        >
          {{ displayText || resolvedPlaceholder }}
        </span>
        <span class="nm-datepicker__actions">
          <button
            v-if="clearable && selectedDate"
            class="nm-datepicker__clear"
            type="button"
            :aria-label="resolvedClearLabel"
            @click="onClear"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <!-- Calendar icon -->
          <svg
            class="nm-datepicker__icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </div>

      <!-- Calendar dropdown content -->
      <template #content>
        <div class="nm-datepicker__calendar" role="dialog" :aria-label="label || 'Date picker'">
          <!-- Header: navigation -->
          <div class="nm-datepicker__header">
            <button
              class="nm-datepicker__nav-btn"
              type="button"
              :aria-label="resolvedPrevYearLabel"
              @click="prevYear"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
            <button
              class="nm-datepicker__nav-btn"
              type="button"
              :aria-label="resolvedPrevMonthLabel"
              @click="prevMonth"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="nm-datepicker__header-label">
              {{ monthNames.monthName }} {{ monthNames.year }}
            </span>
            <button
              class="nm-datepicker__nav-btn"
              type="button"
              :aria-label="resolvedNextMonthLabel"
              @click="nextMonth"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              class="nm-datepicker__nav-btn"
              type="button"
              :aria-label="resolvedNextYearLabel"
              @click="nextYear"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>

          <!-- Weekday headers -->
          <div class="nm-datepicker__weekdays">
            <span v-for="(wd, idx) in weekdays" :key="idx" class="nm-datepicker__weekday">
              {{ wd }}
            </span>
          </div>

          <!-- Day cells grid -->
          <div class="nm-datepicker__days">
            <button
              v-for="(cell, idx) in calendarDays"
              :key="idx"
              class="nm-datepicker__day"
              :class="{
                'nm-datepicker__day--other-month': !cell.isCurrentMonth,
                'nm-datepicker__day--today': cell.isToday,
                'nm-datepicker__day--selected': cell.isSelected,
                'nm-datepicker__day--disabled': cell.isDisabled,
                'nm-datepicker__day--in-range': cell.isInRange,
              }"
              type="button"
              :disabled="cell.isDisabled"
              :aria-label="`${monthNames.monthName} ${cell.day}, ${cell.date.getFullYear()}`"
              :aria-selected="cell.isSelected"
              :aria-current="cell.isToday ? 'date' : undefined"
              @click="onDayClick(cell)"
            >
              {{ cell.day }}
            </button>
          </div>

          <!-- Footer: Today button -->
          <div class="nm-datepicker__footer">
            <button class="nm-datepicker__today-btn" type="button" @click="onTodayClick">
              {{ resolvedTodayLabel }}
            </button>
          </div>
        </div>
      </template>
    </NeumorphismPopover>

    <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ---- Wrapper ----
.nm-datepicker__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

// ---- Trigger (input-like display) ----
.nm-datepicker {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 8px);
  @include nm-theme-transition;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--focused,
  &--open {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
  }

  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px var(--nm-color-error);
  }
}

// ---- Trigger sizes ----
.nm-datepicker--small {
  min-height: var(--nm-field-min-height-sm);
  padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);

  .nm-datepicker__value {
    font-size: var(--nm-field-font-sm);
  }
}

.nm-datepicker--medium {
  min-height: var(--nm-field-min-height-md);
  padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
}

.nm-datepicker--large {
  min-height: var(--nm-field-min-height-lg);
  padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);

  .nm-datepicker__value {
    font-size: var(--nm-field-font-lg);
  }
}

// ---- Trigger value text ----
.nm-datepicker__value {
  flex: 1;
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--placeholder {
    color: var(--nm-text-placeholder);
  }
}

// ---- Trigger actions ----
.nm-datepicker__actions {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  flex-shrink: 0;
}

.nm-datepicker__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-secondary);
  border-radius: var(--nm-border-radius-full);
  transition: color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-text-primary);
  }
}

.nm-datepicker__icon {
  color: var(--nm-text-secondary);
  flex-shrink: 0;
}

// ==========================================
// Calendar Dropdown
// ==========================================

.nm-datepicker__calendar {
  width: 280px;
  padding: var(--nm-spacing-sm);
  user-select: none;
}

// ---- Header ----
.nm-datepicker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  margin-bottom: var(--nm-spacing-sm);
  padding: 0 var(--nm-spacing-xs);
}

.nm-datepicker__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-secondary);
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);

  &:hover {
    background-color: var(--nm-surface-raised);
    color: var(--nm-text-primary);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  &:active {
    @include nm-inset(2px, 4px);
  }
}

.nm-datepicker__header-label {
  flex: 1;
  text-align: center;
  font-size: var(--nm-font-base);
  font-weight: 600;
  color: var(--nm-text-primary);
  min-width: 0;
  white-space: nowrap;
}

// ---- Weekday headers ----
.nm-datepicker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.nm-datepicker__weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: var(--nm-font-xs);
  font-weight: 600;
  color: var(--nm-text-secondary);
  text-transform: uppercase;
}

// ---- Day cells grid ----
.nm-datepicker__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.nm-datepicker__day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  transition:
    background-color 0.25s $nm-ease-ambient,
    box-shadow 0.25s $nm-ease-ambient,
    color 0.25s $nm-ease-ambient;
  position: relative;

  &:hover:not(&--disabled):not(&--selected) {
    background-color: var(--nm-surface-raised);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  // Other month days (dimmed)
  &--other-month {
    color: var(--nm-text-disabled);
    cursor: default;

    &:hover {
      background: none;
      box-shadow: none;
    }
  }

  // Today highlight (outline ring)
  &--today:not(&--selected) {
    color: var(--nm-primary-color);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: var(--nm-border-radius-sm);
      border: 2px solid var(--nm-primary-color);
      pointer-events: none;
    }
  }

  // Selected day (primary bg + inset shadow)
  &--selected {
    background-color: var(--nm-primary-color);
    color: var(--nm-text-on-primary);
    font-weight: 600;
    @include nm-inset(2px, 4px);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-strong),
      inset -3px -3px 6px var(--nm-shadow-light-strong),
      0 0 8px color-mix(in srgb, var(--nm-primary-color) 40%, transparent);
  }

  // In-range (subtle background, for future range support)
  &--in-range:not(&--selected) {
    background-color: color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
    border-radius: 0;
  }

  // Disabled
  &--disabled {
    color: var(--nm-text-disabled);
    cursor: not-allowed;
    opacity: 0.5;
  }
}

// ---- Footer ----
.nm-datepicker__footer {
  display: flex;
  justify-content: center;
  margin-top: var(--nm-spacing-sm);
  padding-top: var(--nm-spacing-sm);
  border-top: 1px solid
    var(--nm-border-subtle, color-mix(in srgb, var(--nm-text-placeholder) 12%, transparent));
}

.nm-datepicker__today-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--nm-font-sm);
  font-weight: 500;
  color: var(--nm-primary-color);
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);

  &:hover {
    background-color: color-mix(in srgb, var(--nm-primary-color) 10%, transparent);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  &:active {
    @include nm-inset(2px, 4px);
  }
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-datepicker__day,
  .nm-datepicker__nav-btn,
  .nm-datepicker__today-btn {
    transition: none;
  }
}
</style>
