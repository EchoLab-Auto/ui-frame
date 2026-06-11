import type { App } from 'vue'
import { computed } from 'vue'
import type { NeumorphismGlobalConfig } from './composables/useConfig'
import { ConfigKey } from './composables/useConfig'
import type { NeumorphismPluginOptions, ComponentOverrides } from './extensions/types'

import {
  NeumorphismButton,
  NeumorphismSwitch,
  NeumorphismCard,
  NeumorphismInput,
  ThemeProvider,
  NeumorphismCheckbox,
  NeumorphismRadio,
  NeumorphismRadioGroup,
  NeumorphismSelect,
  NeumorphismTextarea,
  NeumorphismForm,
  NeumorphismFormItem,
  NeumorphismModal,
  NeumorphismToastProvider,
  NeumorphismTooltip,
  NeumorphismTabs,
  NeumorphismBreadcrumb,
  NeumorphismPagination,
  NeumorphismAvatar,
  NeumorphismBadge,
  NeumorphismTag,
  NeumorphismProgress,
  NeumorphismSkeleton,
  NeumorphismTable,
  NeumorphismDivider,
  NeumorphismCollapse,
  NeumorphismContainer,
  NeumorphismRow,
  NeumorphismCol,
  NeumorphismLayout,
  NeumorphismThemeToggle,
  NeumorphismTree,
  NeumorphismTreeNode,
  NeumorphismCanvas,
} from './components'

import './styles/index.scss'

// Individual component exports — re-export all components and types from the barrel
export * from './components'
export type * from './components'

// Composables — theme
export { useTheme, provideTheme, createTheme } from './composables/useTheme'

export type { Theme, ThemeOptions, ThemeContext } from './composables/useTheme'

// Composables — headless behavior (business logic without UI)
export { useSelect } from './composables/useSelect'
export type { UseSelectOptions, UseSelectReturn, SelectOption } from './composables/useSelect'

export { useTabs } from './composables/useTabs'
export type {
  UseTabsOptions,
  UseTabsReturn,
  TabItem as HeadlessTabItem,
} from './composables/useTabs'

export { usePagination } from './composables/usePagination'
export type { UsePaginationOptions, UsePaginationReturn } from './composables/usePagination'

export { useTree } from './composables/useTree'
export type {
  UseTreeOptions,
  UseTreeReturn,
  TreeNodeData as HeadlessTreeNodeData,
} from './composables/useTree'

export { useTable } from './composables/useTable'
export type {
  UseTableOptions,
  UseTableReturn,
  TableColumn,
  SortDirection,
  SortState,
  SelectionMode,
} from './composables/useTable'

export { useCollapse } from './composables/useCollapse'
export type {
  UseCollapseOptions,
  UseCollapseReturn,
  CollapseItem as HeadlessCollapseItem,
} from './composables/useCollapse'

export { useModal } from './composables/useModal'
export type { UseModalOptions, UseModalReturn } from './composables/useModal'

export { useToast } from './composables/useToast'
export type {
  UseToastOptions,
  UseToastReturn,
  ToastOptions as HeadlessToastOptions,
  ToastItem as HeadlessToastItem,
  ToastType as HeadlessToastType,
  ToastPosition as HeadlessToastPosition,
} from './composables/useToast'

export { useTooltip } from './composables/useTooltip'
export type {
  UseTooltipOptions,
  UseTooltipReturn,
  TooltipPosition as HeadlessTooltipPosition,
  TooltipTrigger as HeadlessTooltipTrigger,
} from './composables/useTooltip'

export { useTouchDevice } from './composables/useTouchDevice'
export { useCheckable } from './composables/useCheckable'
export type { UseCheckableOptions } from './composables/useCheckable'
export { useFormField } from './composables/useFormField'
export type { FormFieldConfig, FieldSize } from './composables/useFormField'
export { validateFieldValue } from './composables/useFormValidation'
export type { FormRule as HeadlessFormRule } from './composables/useFormValidation'

// Locales
export { useLocale, provideLocale, getLocaleMessages, LocaleKey } from './composables/useLocale'
export type { LocaleMessages, Locale } from './locales'
export { zhCN, enUS } from './locales'

// Utilities
export { generateId, debounce, isEmpty } from './utils'

// Config exports
export { useConfig, ConfigKey } from './composables/useConfig'
export type { NeumorphismGlobalConfig } from './composables/useConfig'

// Extension system
export { ComponentRegistry } from './extensions/componentRegistry'
export { useNeumorphismSetup } from './extensions/createComponent'
export type { NeumorphismSetupContext } from './extensions/createComponent'
export type {
  ComponentOverrides,
  NeumorphismPluginOptions,
  ExtendedConfig,
} from './extensions/types'

// Public injection keys — for building custom components that participate in protocols
export { RadioGroupKey, FormKey, RowGutterKey } from './composables/injectionKeys'
export type { RadioGroupContext, FormContext, RowGutterContext } from './composables/injectionKeys'

// Install function — registers all components globally
const NAME_TO_COMPONENT = {
  NeumorphismButton,
  NeumorphismSwitch,
  NeumorphismCard,
  NeumorphismInput,
  ThemeProvider,
  NeumorphismCheckbox,
  NeumorphismRadio,
  NeumorphismRadioGroup,
  NeumorphismSelect,
  NeumorphismTextarea,
  NeumorphismForm,
  NeumorphismFormItem,
  NeumorphismModal,
  NeumorphismToastProvider,
  NeumorphismTooltip,
  NeumorphismTabs,
  NeumorphismBreadcrumb,
  NeumorphismPagination,
  NeumorphismAvatar,
  NeumorphismBadge,
  NeumorphismTag,
  NeumorphismProgress,
  NeumorphismSkeleton,
  NeumorphismTable,
  NeumorphismDivider,
  NeumorphismCollapse,
  NeumorphismContainer,
  NeumorphismRow,
  NeumorphismCol,
  NeumorphismLayout,
  NeumorphismThemeToggle,
  NeumorphismTree,
  NeumorphismTreeNode,
  NeumorphismCanvas,
} as const

/**
 * Register all built-in components plus any consumer-provided overrides.
 *
 * Supports both legacy and new plugin option formats:
 * - `app.use(NeumorphismUI, { button: { size: 'large' } })`   (legacy, unchanged)
 * - `app.use(NeumorphismUI, { config: {...}, components: {...}, prefix: 'X' })`   (new)
 */
export function install(
  app: App,
  options?: NeumorphismGlobalConfig | NeumorphismPluginOptions
): void {
  const raw = (options ?? {}) as Record<string, unknown>
  const isNew = 'config' in raw || 'components' in raw || 'prefix' in raw

  const pluginConfig: NeumorphismGlobalConfig | undefined = isNew
    ? (raw.config as NeumorphismGlobalConfig | undefined)
    : (options as NeumorphismGlobalConfig | undefined)

  const overrides: ComponentOverrides = isNew ? ((raw.components ?? {}) as ComponentOverrides) : {}

  const prefix: string = isNew ? ((raw.prefix ?? '') as string) : ''

  // Provide global config for all components to use as defaults
  if (pluginConfig) {
    app.provide(
      ConfigKey,
      computed(() => pluginConfig)
    )
  }

  // Register default components, applying overrides where they exist
  for (const [name, defaultComponent] of Object.entries(NAME_TO_COMPONENT)) {
    app.component(`${prefix}${name}`, overrides[name] ?? defaultComponent)
  }

  // Register any additional components not in the default set
  for (const [name, component] of Object.entries(overrides)) {
    if (!(name in NAME_TO_COMPONENT)) {
      app.component(`${prefix}${name}`, component)
    }
  }
}

// Default export (for app.use())
export default {
  install,
  version: '__VERSION__',
}
