import { inject, computed, type ComputedRef } from 'vue'
import type { InjectionKey } from 'vue'

// ==========================================
// Global Configuration System
// ==========================================

export interface NeumorphismGlobalConfig {
  /** Default button props applied to all NeumorphismButton instances */
  button?: {
    variant?: 'raised' | 'flat' | 'pressed'
    size?: 'small' | 'medium' | 'large'
    shape?: 'rounded' | 'pill' | 'circle'
  }
  /** Default input props applied to all NeumorphismInput instances */
  input?: {
    size?: 'small' | 'medium' | 'large'
  }
  /** Default select props */
  select?: {
    size?: 'small' | 'medium' | 'large'
    clearable?: boolean
    emptyText?: string
    placeholder?: string
  }
  /** Default modal props */
  modal?: {
    size?: 'small' | 'medium' | 'large'
    maskClosable?: boolean
    closable?: boolean
    showClose?: boolean
    destroyOnClose?: boolean
  }
  /** Default toast props */
  toast?: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
    maxCount?: number
  }
  /** Default tooltip props */
  tooltip?: {
    position?: 'top' | 'bottom' | 'left' | 'right'
    trigger?: 'hover' | 'click' | 'focus'
    offset?: number
    delay?: number
  }
  /** Default tabs props */
  tabs?: {
    position?: 'top' | 'left' | 'right'
    size?: 'small' | 'medium' | 'large'
  }
  /** Default pagination props */
  pagination?: {
    size?: 'small' | 'medium' | 'large'
    showTotal?: boolean
    showJumper?: boolean
    maxVisiblePages?: number
    pageSize?: number
  }
  /** Default collapse props */
  collapse?: {
    size?: 'small' | 'medium' | 'large'
    accordion?: boolean
  }
  /** Default form props */
  form?: {
    size?: 'small' | 'medium' | 'large'
    labelWidth?: string
    direction?: 'horizontal' | 'vertical'
  }
  /** Default tag props */
  tag?: {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
    size?: 'small' | 'medium' | 'large'
    rounded?: boolean
  }
  /** Default progress props */
  progress?: {
    variant?: 'primary' | 'success' | 'warning' | 'error'
    size?: 'small' | 'medium' | 'large'
    showLabel?: boolean
  }
  /** Default avatar props */
  avatar?: {
    size?: 'small' | 'medium' | 'large'
    shape?: 'circle' | 'rounded'
  }
  /** Default tree props */
  tree?: {
    showSearch?: boolean
    multiple?: boolean
    searchPlaceholder?: string
  }
  /** Default theme config */
  theme?: {
    defaultTheme?: 'light' | 'dark' | 'auto'
    storageKey?: string
    followSystem?: boolean
  }
  /** Whether to use RTL (right-to-left) direction */
  rtl?: boolean
  /** Extension: consumers can add custom component config sections. */
  [configSection: string]: unknown
}

export const ConfigKey: InjectionKey<ComputedRef<NeumorphismGlobalConfig>> =
  Symbol('nm-global-config')

const DEFAULT_CONFIG: NeumorphismGlobalConfig = {}

/**
 * Returns the global config merged with component-level defaults.
 * Components should use this to resolve their props.
 *
 * @example
 * ```ts
 * const config = useConfig()
 * const size = props.size ?? config.value.button?.size ?? 'medium'
 * ```
 */
export function useConfig(): ComputedRef<NeumorphismGlobalConfig> {
  const config = inject(ConfigKey, computed(() => DEFAULT_CONFIG))
  return config
}