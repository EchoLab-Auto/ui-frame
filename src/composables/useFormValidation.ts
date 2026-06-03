export interface FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  validator?: (value: unknown) => boolean | string
  trigger?: 'change' | 'blur' | 'input'
}

/**
 * 验证单个字段值，返回错误消息（空字符串表示通过）
 */
export function validateFieldValue(value: unknown, rules: FormRule[]): string {
  for (const rule of rules) {
    if (rule.required && (value == null || value === '')) {
      return rule.message || '必填字段'
    }
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `最少 ${rule.minLength} 个字符`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `最多 ${rule.maxLength} 个字符`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || '格式不正确'
      }
    }
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `不能小于 ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `不能大于 ${rule.max}`
      }
    }
    if (rule.validator) {
      const result = rule.validator(value)
      if (typeof result === 'string') return result
      if (result === false) return rule.message || '验证失败'
    }
  }
  return ''
}
