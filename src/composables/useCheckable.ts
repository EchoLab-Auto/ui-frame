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

  // Generate ID once — must be stable across the component's lifetime
  const initialCfg = options()
  const inputId = generateId(`nm-${initialCfg.prefix}`)

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
