import { computed } from 'vue'
import { generateId } from '@/utils'

export interface UseCheckableOptions {
  prefix: 'checkbox' | 'radio'
  isChecked: boolean
  isDisabled: boolean
  size: 'small' | 'medium' | 'large'
  /** 额外类名（如 indeterminate） */
  extraClasses?: Record<string, boolean>
}

/**
 * Checkbox/Radio 共享切换逻辑
 */
export function useCheckable(options: () => UseCheckableOptions) {
  const opts = computed(options)

  const inputId = computed(() =>
    generateId(`nm-${opts.value.prefix}`)
  )

  const classList = computed(() => [
    `nm-${opts.value.prefix}`,
    `nm-${opts.value.prefix}--${opts.value.size}`,
    {
      [`nm-${opts.value.prefix}--checked`]: opts.value.isChecked,
      [`nm-${opts.value.prefix}--disabled`]: opts.value.isDisabled,
      ...opts.value.extraClasses,
    },
  ])

  return { inputId, classList }
}
