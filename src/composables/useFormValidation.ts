import type { LocaleMessages } from '@/locales/types'

export interface FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  validator?: (value: unknown) => boolean | string
  /** @internal Reserved for future per-rule trigger support. Not yet implemented. */
  trigger?: 'change' | 'blur' | 'input'
}

const DEFAULT_MESSAGES: Required<
  Pick<
    LocaleMessages,
    | 'formRequired'
    | 'formMinLength'
    | 'formMaxLength'
    | 'formPattern'
    | 'formMin'
    | 'formMax'
    | 'formValidator'
  >
> = {
  formRequired: '必填字段',
  formMinLength: '最少 {min} 个字符',
  formMaxLength: '最多 {max} 个字符',
  formPattern: '格式不正确',
  formMin: '不能小于 {min}',
  formMax: '不能大于 {max}',
  formValidator: '验证失败',
}

function interpolate(message: string, params?: Record<string, number | string>): string {
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`))
}

/**
 * 验证单个字段值，返回错误消息（空字符串表示通过）
 */
export function validateFieldValue(
  value: unknown,
  rules: FormRule[],
  localeMessages?: Partial<LocaleMessages>
): string {
  const msg = (key: keyof typeof DEFAULT_MESSAGES, params?: Record<string, number | string>) =>
    interpolate(localeMessages?.[key] ?? DEFAULT_MESSAGES[key], params)

  for (const rule of rules) {
    // Required check — applies to null, undefined, and empty strings
    if (rule.required && (value == null || value === '')) {
      return rule.message || msg('formRequired')
    }

    // Skip type-specific checks when value is null/undefined/empty
    if (value == null || value === '') {
      continue
    }

    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || msg('formMinLength', { min: rule.minLength })
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || msg('formMaxLength', { max: rule.maxLength })
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || msg('formPattern')
      }
    }
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || msg('formMin', { min: rule.min })
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || msg('formMax', { max: rule.max })
      }
    }
    if (rule.validator) {
      const result = rule.validator(value)
      if (typeof result === 'string') return result
      if (result === false) return rule.message || msg('formValidator')
    }
  }
  return ''
}
