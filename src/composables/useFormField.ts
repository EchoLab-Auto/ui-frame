import { computed, ref } from 'vue'
import { generateId } from '@/utils'

/**
 * 字段尺寸：主几何量（最小高度）的 px 值。
 *
 * 组件把 `resolveControlScale` 的结果作为内联 CSS 变量挂在根节点，本
 * composable 只负责判 `--sized` 类（见 `utils/controlScale`）。
 */
export type FieldSize = number

export interface FormFieldConfig {
  /** 组件 props */
  id?: string
  size: FieldSize
  disabled: boolean
  error?: string | boolean
  /** generateId 前缀  */
  prefix: 'input' | 'textarea' | 'select' | 'datepicker'
}

/**
 * Input/Textarea/Select 共享表单字段逻辑
 */
export function useFormField(config: () => FormFieldConfig) {
  const isFocused = ref(false)

  const cfg = computed(config)

  // Generate ID once — if no explicit id is provided, the auto-generated one stays stable
  const initialCfg = config()
  const fieldId = initialCfg.id || generateId(`nm-${initialCfg.prefix}`)

  const errorMessage = computed(() => (typeof cfg.value.error === 'string' ? cfg.value.error : ''))

  const hasError = computed(() => !!cfg.value.error)

  function baseClassList(baseClass: string) {
    return computed(() => [
      baseClass,
      // 数字尺寸挂 `--sized` 而不是 `--<数字>`：几何量全部来自组件根节点的
      // 内联 CSS 变量，档位 class 一行不动，两条路径互不覆盖
      `${baseClass}--sized`,
      {
        [`${baseClass}--focused`]: isFocused.value,
        [`${baseClass}--disabled`]: cfg.value.disabled,
        [`${baseClass}--error`]: hasError.value,
      },
    ])
  }

  function handleFocus(event: FocusEvent, emit: (e: 'focus', ev: FocusEvent) => void) {
    isFocused.value = true
    emit('focus', event)
  }

  function handleBlur(event: FocusEvent, emit: (e: 'blur', ev: FocusEvent) => void) {
    isFocused.value = false
    emit('blur', event)
  }

  return {
    isFocused,
    fieldId,
    errorMessage,
    hasError,
    baseClassList,
    handleFocus,
    handleBlur,
  }
}
