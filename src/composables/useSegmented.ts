import { ref, watch, type Ref } from 'vue'

export interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface UseSegmentedOptions {
  /** 当前选中值（v-model 绑定引用） */
  modelValue: Ref<string | number | undefined>
  /** 可选项列表 */
  options: Ref<SegmentedOption[]>
  /** 整体禁用 */
  disabled?: Ref<boolean>
  /** 选中变化回调 */
  onChange?: (value: string | number) => void
}

export interface UseSegmentedReturn {
  /** 某项是否选中 */
  isActive: (option: SegmentedOption) => boolean
  /** 某项是否禁用（整体禁用或自身禁用） */
  isItemDisabled: (option: SegmentedOption) => boolean
  /** 选中某项（禁用项忽略）；同步 roving 焦点索引 */
  select: (option: SegmentedOption) => void
  /** roving tabindex：当前可聚焦项索引 */
  focusIndex: Ref<number>
  /** 某项的 tabindex（0 可聚焦，-1 不可） */
  tabindexFor: (index: number) => 0 | -1
  /** 方向键 / Home / End 导航并选中（ARIA radiogroup 模式） */
  handleKeydown: (event: KeyboardEvent) => void
}

/**
 * Headless 分段选择器 —— 单选语义 + roving tabindex 键盘导航。
 * 选中逻辑与视觉分离，可搭配任意分段控件 UI 使用。
 *
 * 键盘导航遵循 ARIA radiogroup 模式：focusIndex 初始落在选中项
 * （否则首个可用项），点击与键盘均同步焦点索引；options 收缩时钳制。
 * 组件层负责在 focusIndex 变化后移动真实 DOM 焦点。
 */
export function useSegmented(options: UseSegmentedOptions): UseSegmentedReturn {
  const { modelValue } = options

  function isActive(option: SegmentedOption): boolean {
    return modelValue.value === option.value
  }

  function isItemDisabled(option: SegmentedOption): boolean {
    return Boolean(options.disabled?.value || option.disabled)
  }

  function enabledIndexes(): number[] {
    return options.options.value
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !isItemDisabled(option))
      .map(({ index }) => index)
  }

  /** 焦点落点：选中项 > 首个可用项 > 0 */
  function resolveFocusIndex(): number {
    const opts = options.options.value
    const selectedIndex = opts.findIndex(o => o.value === modelValue.value && !isItemDisabled(o))
    if (selectedIndex >= 0) return selectedIndex
    const enabled = enabledIndexes()
    return enabled.length > 0 ? enabled[0] : 0
  }

  const focusIndex = ref(resolveFocusIndex())

  // options 列表变化时钳制焦点索引（收缩 / 选中项被禁用等）
  watch(
    () => options.options.value,
    () => {
      const current = options.options.value[focusIndex.value]
      if (!current || isItemDisabled(current)) {
        focusIndex.value = resolveFocusIndex()
      }
    }
  )

  // 外部赋新选中值时焦点跟随（若当前焦点项已被禁用或越界由上方 watch 兜底）
  watch(modelValue, () => {
    const selectedIndex = options.options.value.findIndex(
      o => o.value === modelValue.value && !isItemDisabled(o)
    )
    if (selectedIndex >= 0) focusIndex.value = selectedIndex
  })

  function select(option: SegmentedOption): void {
    if (isItemDisabled(option)) return
    modelValue.value = option.value
    const index = options.options.value.indexOf(option)
    if (index >= 0) focusIndex.value = index
    options.onChange?.(option.value)
  }

  function tabindexFor(index: number): 0 | -1 {
    return index === focusIndex.value ? 0 : -1
  }

  function moveFocus(direction: 1 | -1): void {
    const enabled = enabledIndexes()
    if (enabled.length === 0) return
    const current = enabled.indexOf(focusIndex.value)
    const next =
      current === -1 ? enabled[0] : enabled[(current + direction + enabled.length) % enabled.length]
    focusIndex.value = next
    select(options.options.value[next])
  }

  function handleKeydown(event: KeyboardEvent): void {
    const enabled = enabledIndexes()
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(-1)
        break
      case 'Home':
        if (enabled.length > 0) {
          event.preventDefault()
          focusIndex.value = enabled[0]
          select(options.options.value[enabled[0]])
        }
        break
      case 'End':
        if (enabled.length > 0) {
          event.preventDefault()
          focusIndex.value = enabled[enabled.length - 1]
          select(options.options.value[enabled[enabled.length - 1]])
        }
        break
    }
  }

  return { isActive, isItemDisabled, select, focusIndex, tabindexFor, handleKeydown }
}
