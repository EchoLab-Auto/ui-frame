import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface UseSelectOptions {
  /** v-model value */
  modelValue: Ref<string | number>
  /** Available options */
  options: Ref<SelectOption[]> | ComputedRef<SelectOption[]>
  /** Whether the select is disabled */
  disabled?: Ref<boolean>
}

export interface UseSelectReturn {
  isOpen: Ref<boolean>
  selectedOption: ComputedRef<SelectOption | undefined>
  toggleOpen: () => void
  close: () => void
  selectOption: (option: SelectOption) => void
  clearValue: (value?: string | number) => void
  handleKeydown: (event: KeyboardEvent) => void
  handleBlur: (relatedTarget: EventTarget | null, currentTarget: HTMLElement) => void
}

/**
 * Headless select — encapsulates open/close, keyboard navigation, and
 * option selection logic without any rendering. Use with your own UI.
 */
export function useSelect(opts: UseSelectOptions): UseSelectReturn {
  const { modelValue, options, disabled } = opts

  const isOpen = ref(false)

  const selectedOption = computed(() =>
    options.value.find((o) => o.value === modelValue.value)
  )

  function toggleOpen() {
    if (disabled?.value) return
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  function navigateToOption(option: SelectOption) {
    if (option.disabled || disabled?.value) return
    modelValue.value = option.value
  }

  function selectOption(option: SelectOption) {
    if (option.disabled || disabled?.value) return
    modelValue.value = option.value
    isOpen.value = false
  }

  function clearValue(value?: string | number) {
    modelValue.value = (value ?? undefined) as string | number
    isOpen.value = false
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled?.value) return

    if (event.key === 'Escape') {
      isOpen.value = false
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleOpen()
      return
    }
    if (event.key === 'ArrowDown' && !isOpen.value) {
      event.preventDefault()
      isOpen.value = true
      return
    }
    if (!isOpen.value) return

    const enabledOpts = options.value.filter((o) => !o.disabled)
    if (enabledOpts.length === 0) return

    const idx = enabledOpts.findIndex((o) => o.value === modelValue.value)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = idx + 1 < enabledOpts.length ? enabledOpts[idx + 1] : enabledOpts[0]
      if (next) navigateToOption(next)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = idx - 1 >= 0 ? enabledOpts[idx - 1] : enabledOpts[enabledOpts.length - 1]
      if (prev) navigateToOption(prev)
    } else if (event.key === 'Home') {
      event.preventDefault()
      if (enabledOpts[0]) navigateToOption(enabledOpts[0])
    } else if (event.key === 'End') {
      event.preventDefault()
      if (enabledOpts[enabledOpts.length - 1]) navigateToOption(enabledOpts[enabledOpts.length - 1])
    }
  }

  function handleBlur(relatedTarget: EventTarget | null, currentTarget: HTMLElement) {
    if (!currentTarget.contains(relatedTarget as Node)) {
      isOpen.value = false
    }
  }

  return {
    isOpen,
    selectedOption,
    toggleOpen,
    close,
    selectOption,
    clearValue,
    handleKeydown,
    handleBlur,
  }
}
