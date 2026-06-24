import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

// ==========================================
// Types
// ==========================================

export interface AutoCompleteOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface UseAutoCompleteOptions {
  /** v-model value (the selected option's value) */
  modelValue: Ref<string | number | undefined>
  /** Available options for local filtering */
  options?: Ref<AutoCompleteOption[]>
  /** Async search function — when provided, filtering is server-side */
  searchFn?: (query: string) => Promise<AutoCompleteOption[]>
  /** External loading ref (shared between composable and component) */
  loading?: Ref<boolean>
  /** Debounce delay in ms for async search (default 300) */
  debounceMs?: number
}

export interface UseAutoCompleteReturn {
  /** Current text in the input field */
  inputValue: Ref<string>
  /** Whether the dropdown is open */
  isOpen: Ref<boolean>
  /** Filtered options to display in the dropdown */
  filteredOptions: ComputedRef<AutoCompleteOption[]>
  /** Index of the keyboard-navigated (active) option, -1 if none */
  activeIndex: Ref<number>
  /** Generate an HTML string with matching portions wrapped in <mark> tags */
  highlightMatch: (label: string) => string
  /** Select an option — sets modelValue, updates inputValue, closes dropdown */
  selectOption: (option: AutoCompleteOption) => void
  /** Handle keyboard events for navigation */
  handleKeydown: (event: KeyboardEvent) => void
  /** Handle input value changes */
  handleInput: (value: string) => void
  /** Open the dropdown */
  open: () => void
  /** Close the dropdown */
  close: () => void
  /** Clean up internal timers (call in onBeforeUnmount) */
  cleanupTimers: () => void
}

// ==========================================
// Helpers
// ==========================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ==========================================
// Composable
// ==========================================

/**
 * Headless autocomplete — encapsulates filtering, keyboard navigation,
 * async search with debounce, match highlighting, and open/close logic.
 *
 * Use with your own UI rendering (e.g., NeumorphismAutoComplete).
 */
export function useAutoComplete(opts: UseAutoCompleteOptions): UseAutoCompleteReturn {
  const { modelValue, options, searchFn, loading, debounceMs = 300 } = opts

  // ---- State ----
  const inputValue = ref('')
  const isOpen = ref(false)
  const activeIndex = ref(-1)
  const asyncOptions = ref<AutoCompleteOption[]>([])
  const isLoading = ref(false)

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  // Stop all timers on cleanup (called by the component's onBeforeUnmount)
  function cleanupTimers() {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
  }

  // ---- Option source (local or async) ----
  const sourceOptions = computed(() => {
    if (searchFn) return asyncOptions.value
    return options?.value ?? []
  })

  // ---- Filtered options ----
  const filteredOptions = computed(() => {
    const query = inputValue.value.trim().toLowerCase()
    // If async mode, results come pre-filtered from the search function
    if (searchFn) return sourceOptions.value
    // Local filtering
    if (!query) return sourceOptions.value
    return sourceOptions.value.filter(opt => opt.label.toLowerCase().includes(query))
  })

  // ---- Highlight matching text in a label ----
  function highlightMatch(label: string): string {
    const query = inputValue.value.trim()
    if (!query) return escapeHtml(label)

    const lowerLabel = label.toLowerCase()
    const lowerQuery = query.toLowerCase()
    let result = ''
    let pos = 0

    while (pos < label.length) {
      const idx = lowerLabel.indexOf(lowerQuery, pos)
      if (idx === -1) {
        result += escapeHtml(label.slice(pos))
        break
      }
      // Non-matching portion (before match)
      result += escapeHtml(label.slice(pos, idx))
      // Matching portion (wrapped in mark)
      result +=
        '<mark class="nm-autocomplete__mark">' +
        escapeHtml(label.slice(idx, idx + query.length)) +
        '</mark>'
      pos = idx + query.length
    }

    return result
  }

  // ---- Async search with debounce ----
  function performAsyncSearch(query: string) {
    if (!searchFn) return

    if (searchTimer) clearTimeout(searchTimer)

    const trimmed = query.trim()
    if (!trimmed) {
      asyncOptions.value = []
      isLoading.value = false
      if (loading) loading.value = false
      return
    }

    isLoading.value = true
    if (loading) loading.value = true

    searchTimer = setTimeout(async () => {
      try {
        const results = await searchFn(trimmed)
        asyncOptions.value = results
      } catch {
        asyncOptions.value = []
      } finally {
        isLoading.value = false
        if (loading) loading.value = false
      }
    }, debounceMs)
  }

  // ---- Sync inputValue when modelValue changes externally ----
  watch(
    modelValue,
    val => {
      if (val === undefined || val === '' || val === null) {
        // Don't overwrite what the user is typing
        return
      }
      // Only sync if the value actually changed and we're not mid-typing
      const allOpts = sourceOptions.value
      const opt = allOpts.find(o => o.value === val)
      if (opt && opt.label !== inputValue.value) {
        inputValue.value = opt.label
      }
    },
    { flush: 'sync' }
  )

  // ---- Reset active index when filtered options change ----
  watch(filteredOptions, () => {
    activeIndex.value = -1
  })

  // ---- Actions ----

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    activeIndex.value = -1
  }

  function selectOption(option: AutoCompleteOption) {
    if (option.disabled) return
    modelValue.value = option.value
    inputValue.value = option.label
    isOpen.value = false
    activeIndex.value = -1
  }

  function handleInput(value: string) {
    inputValue.value = value
    activeIndex.value = -1

    if (searchFn) {
      performAsyncSearch(value)
    }

    // Open dropdown whenever the user types
    if (!isOpen.value) {
      isOpen.value = true
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    const enabledOpts = filteredOptions.value.filter(o => !o.disabled)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
          return
        }
        if (enabledOpts.length === 0) return
        activeIndex.value = activeIndex.value + 1 >= enabledOpts.length ? 0 : activeIndex.value + 1
        break

      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
          return
        }
        if (enabledOpts.length === 0) return
        activeIndex.value =
          activeIndex.value - 1 < 0 ? enabledOpts.length - 1 : activeIndex.value - 1
        break

      case 'Enter':
        if (!isOpen.value || enabledOpts.length === 0) return
        event.preventDefault()
        if (activeIndex.value >= 0 && activeIndex.value < enabledOpts.length) {
          selectOption(enabledOpts[activeIndex.value])
        }
        break

      case 'Escape':
        event.preventDefault()
        isOpen.value = false
        activeIndex.value = -1
        break
    }
  }

  // Return cleanup for the component to call
  return {
    inputValue,
    isOpen,
    filteredOptions,
    activeIndex,
    highlightMatch,
    selectOption,
    handleKeydown,
    handleInput,
    open,
    close,
    // Expose cleanup for lifecycle integration
    cleanupTimers,
  }
}
