import { computed, ref } from 'vue'
import { generateId } from '@/utils'

export type FieldSize = 'small' | 'medium' | 'large'

export interface FormFieldConfig {
  /** 组件 props */
  id?: string
  size: 'small' | 'medium' | 'large'
  disabled: boolean
  error?: string | boolean
  /** generateId 前缀  */
  prefix: 'input' | 'textarea' | 'select'
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

  const errorMessage = computed(() =>
    typeof cfg.value.error === 'string' ? cfg.value.error : ''
  )

  const hasError = computed(() => !!cfg.value.error)

  function baseClassList(baseClass: string) {
    return computed(() => [
      baseClass,
      `${baseClass}--${cfg.value.size}`,
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
