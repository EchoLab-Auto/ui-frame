import type { InjectionKey, Ref } from 'vue'
import type { FormRule } from './useFormValidation'

export interface RadioGroupContext {
  modelValue: unknown
  name: string
  disabled: boolean
  size: string
  setValue: (val: unknown) => void
}

export interface FormContext {
  model: Record<string, unknown>
  rules: Record<string, FormRule[]>
  errors: Record<string, string>
  labelWidth?: string
  size?: string
  validateField: (name: string) => boolean
  registerField: (name: string, validateFn: (value: unknown) => boolean) => void
  unregisterField: (name: string) => void
}

export interface RowGutterContext {
  x: Ref<number>
  y: Ref<number>
}

export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol('nm-radio-group')
export const FormKey: InjectionKey<FormContext> = Symbol('nm-form')
export const RowGutterKey: InjectionKey<RowGutterContext> = Symbol('nm-row-gutter')
