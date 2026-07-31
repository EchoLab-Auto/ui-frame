import { ref, computed, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  /** 分组名 — 相同 group 的选项在下拉中归为一组展示 */
  group?: string
}

export type SelectModelValue = string | number | (string | number)[] | undefined

export interface SelectGroup {
  /** 分组名；未分组的选项归入空串组 */
  name: string
  options: SelectOption[]
}

export interface UseSelectOptions {
  /** v-model value（单选为标量，多选为数组） */
  modelValue: Ref<SelectModelValue>
  /** Available options */
  options: Ref<SelectOption[]> | ComputedRef<SelectOption[]>
  /** Whether the select is disabled */
  disabled?: Ref<boolean>
  /** 多选模式 */
  multiple?: Ref<boolean>
  /** 过滤文本（filterable 模式由组件层写入，composable 据此收窄导航与渲染列表） */
  filterText?: Ref<string>
}

export interface UseSelectReturn {
  isOpen: Ref<boolean>
  /** 单选：当前选中项 */
  selectedOption: ComputedRef<SelectOption | undefined>
  /** 多选：当前选中项数组（单选时为 0/1 个元素的数组） */
  selectedOptions: ComputedRef<SelectOption[]>
  /** 按 filterText 过滤后的选项（无过滤文本时等于 options） */
  filteredOptions: ComputedRef<SelectOption[]>
  /** 按 group 字段分组后的视图，保持选项原始顺序 */
  groupedOptions: ComputedRef<SelectGroup[]>
  /** 多选键盘导航的高亮项 value（单选模式不使用 —— 单选箭头键即时改选中值） */
  activeValue: Ref<string | number | undefined>
  isSelected: (option: SelectOption) => boolean
  toggleOpen: () => void
  close: () => void
  selectOption: (option: SelectOption) => void
  /** 多选：从选中集中移除单个值 */
  removeValue: (value: string | number) => void
  clearValue: (value?: string | number | (string | number)[]) => void
  handleKeydown: (event: KeyboardEvent) => void
  handleBlur: (relatedTarget: EventTarget | null, currentTarget: HTMLElement) => void
}

/**
 * Headless select — encapsulates open/close, keyboard navigation, and
 * option selection logic without any rendering. Use with your own UI.
 *
 * 单选与原生 `<select>` 一致：箭头键即时切换选中值；
 * 多选引入 activeValue 高亮项，Enter/Space 切换选中（即时选中在多选下无语义）。
 */
export function useSelect(opts: UseSelectOptions): UseSelectReturn {
  const { modelValue, options, disabled, multiple, filterText } = opts

  const isOpen = ref(false)

  const isMultiple = computed(() => multiple?.value ?? false)

  // ==========================================
  // 值规范化 — 多选下容忍外部传入标量/空值
  // ==========================================
  function asArray(val: SelectModelValue): (string | number)[] {
    if (Array.isArray(val)) return val
    if (val === undefined || val === null || val === '') return []
    return [val]
  }

  const selectedValues = computed(() => asArray(modelValue.value))

  const selectedOption = computed(() => options.value.find(o => o.value === modelValue.value))

  const selectedOptions = computed(() =>
    options.value.filter(o => selectedValues.value.includes(o.value))
  )

  function isSelected(option: SelectOption) {
    if (isMultiple.value) return selectedValues.value.includes(option.value)
    return modelValue.value === option.value
  }

  // ==========================================
  // 过滤与分组
  // ==========================================
  const filteredOptions = computed(() => {
    const query = filterText?.value.trim().toLowerCase()
    if (!query) return options.value
    return options.value.filter(o => o.label.toLowerCase().includes(query))
  })

  const groupedOptions = computed<SelectGroup[]>(() => {
    const groups: SelectGroup[] = []
    const byName = new Map<string, SelectGroup>()
    for (const option of filteredOptions.value) {
      const name = option.group ?? ''
      let group = byName.get(name)
      if (!group) {
        group = { name, options: [] }
        byName.set(name, group)
        groups.push(group)
      }
      group.options.push(option)
    }
    return groups
  })

  // ==========================================
  // 多选键盘高亮项
  // ==========================================
  const activeValue = ref<string | number | undefined>(undefined)

  function enabledOptions() {
    return filteredOptions.value.filter(o => !o.disabled)
  }

  function initActiveValue() {
    const enabled = enabledOptions()
    if (enabled.length === 0) {
      activeValue.value = undefined
      return
    }
    // 优先高亮最后一个选中项，否则第一项
    const selected = selectedValues.value
    const lastSelected = selected[selected.length - 1]
    const found = enabled.find(o => o.value === lastSelected)
    activeValue.value = (found ?? enabled[0]).value
  }

  watch(isOpen, open => {
    if (open && isMultiple.value) initActiveValue()
  })

  // ==========================================
  // Typeahead 键盘搜索
  // ==========================================
  const typeaheadBuffer = ref('')
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

  function resetTypeahead() {
    typeaheadBuffer.value = ''
    if (typeaheadTimer) {
      clearTimeout(typeaheadTimer)
      typeaheadTimer = null
    }
  }

  // Clear any pending typeahead timer if the component unmounts mid-keystroke,
  // so the 500ms callback can't fire on a disposed instance.
  onBeforeUnmount(resetTypeahead)

  function appendTypeahead(char: string) {
    typeaheadBuffer.value += char.toLowerCase()
    if (typeaheadTimer) clearTimeout(typeaheadTimer)
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer.value = ''
    }, 500)

    // 查找匹配项
    const enabledOpts = enabledOptions()
    const buffer = typeaheadBuffer.value
    // 先查找前缀匹配
    let match = enabledOpts.find(o => o.label.toLowerCase().startsWith(buffer))
    if (!match) {
      // 退而求其次：查找包含匹配的
      match = enabledOpts.find(o => o.label.toLowerCase().includes(buffer))
    }
    if (match) {
      if (isMultiple.value) {
        // 多选：typeahead 只移动高亮，不直接改选中集
        activeValue.value = match.value
      } else {
        navigateToOption(match)
      }
    }
  }

  function toggleOpen() {
    if (disabled?.value) return
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
    resetTypeahead()
  }

  function navigateToOption(option: SelectOption) {
    if (option.disabled || disabled?.value) return
    modelValue.value = option.value
  }

  function toggleMultipleOption(option: SelectOption) {
    if (option.disabled || disabled?.value) return
    const current = asArray(modelValue.value)
    const idx = current.indexOf(option.value)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(option.value)
    }
    modelValue.value = current
    activeValue.value = option.value
    // 多选挑选下一项时应看到完整列表
    if (filterText) filterText.value = ''
  }

  function selectOption(option: SelectOption) {
    if (option.disabled || disabled?.value) return
    if (isMultiple.value) {
      // 多选：切换选中并保持展开
      toggleMultipleOption(option)
      resetTypeahead()
      return
    }
    modelValue.value = option.value
    isOpen.value = false
    resetTypeahead()
  }

  function removeValue(value: string | number) {
    if (disabled?.value) return
    modelValue.value = asArray(modelValue.value).filter(v => v !== value)
  }

  function clearValue(value?: string | number | (string | number)[]) {
    if (disabled?.value) return
    if (isMultiple.value) {
      modelValue.value = value ?? []
    } else {
      modelValue.value = value as string | number | undefined
    }
    isOpen.value = false
    resetTypeahead()
  }

  // ==========================================
  // 键盘导航
  // ==========================================
  function moveActive(delta: 1 | -1) {
    const enabled = enabledOptions()
    if (enabled.length === 0) return
    const idx = enabled.findIndex(o => o.value === activeValue.value)
    const next =
      idx === -1
        ? delta === 1
          ? enabled[0]
          : enabled[enabled.length - 1]
        : enabled[(idx + delta + enabled.length) % enabled.length]
    if (next) activeValue.value = next.value
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled?.value) return

    if (event.key === 'Escape') {
      isOpen.value = false
      resetTypeahead()
      return
    }

    // ---- 多选键盘交互：高亮 + 确认 ----
    if (isMultiple.value) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
          return
        }
        // isOpen 的 watch 是异步刷新的 —— 打开后立刻按 Enter 时高亮项可能尚未初始化
        if (activeValue.value === undefined) initActiveValue()
        const active = enabledOptions().find(o => o.value === activeValue.value)
        if (active) toggleMultipleOption(active)
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
          return
        }
        moveActive(1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!isOpen.value) return
        moveActive(-1)
        return
      }
      if (!isOpen.value) return
      if (event.key === 'Home') {
        event.preventDefault()
        const first = enabledOptions()[0]
        if (first) activeValue.value = first.value
      } else if (event.key === 'End') {
        event.preventDefault()
        const enabled = enabledOptions()
        const last = enabled[enabled.length - 1]
        if (last) activeValue.value = last.value
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        appendTypeahead(event.key)
      }
      return
    }

    // ---- 单选键盘交互：与原生 <select> 一致的即时选中 ----
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

    const enabledOpts = enabledOptions()
    if (enabledOpts.length === 0) return

    const idx = enabledOpts.findIndex(o => o.value === modelValue.value)

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
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Typeahead: printable character
      event.preventDefault()
      appendTypeahead(event.key)
    }
  }

  function handleBlur(relatedTarget: EventTarget | null, currentTarget: HTMLElement) {
    if (!currentTarget.contains(relatedTarget as Node)) {
      isOpen.value = false
      resetTypeahead()
    }
  }

  return {
    isOpen,
    selectedOption,
    selectedOptions,
    filteredOptions,
    groupedOptions,
    activeValue,
    isSelected,
    toggleOpen,
    close,
    selectOption,
    removeValue,
    clearValue,
    handleKeydown,
    handleBlur,
  }
}
