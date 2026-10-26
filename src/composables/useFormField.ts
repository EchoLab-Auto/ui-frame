import { computed, ref } from 'vue'
import { generateId } from '@/utils'

/**
 * 字段尺寸：数字 = 主几何量（最小高度）px，字符串 = 兼容档位别名。
 *
 * 数字与档位是两条互斥的渲染路径：数字走 `--sized` 类 + 内联 CSS 变量
 * （见 `utils/controlScale`），档位继续用三档 class，锚点处两者逐像素一致。
 */
export type FieldSize = number | 'small' | 'medium' | 'large'

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
      typeof cfg.value.size === 'number'
        ? `${baseClass}--sized`
        : `${baseClass}--${cfg.value.size}`,
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
