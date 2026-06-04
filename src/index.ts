import type { App } from 'vue'
import { computed } from 'vue'
import type { NeumorphismGlobalConfig } from './composables/useConfig'
import { ConfigKey } from './composables/useConfig'

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

// Individual component exports
export {
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
}

// Type exports
export type {
  NeumorphismButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from './components'

export type { NeumorphismSwitchProps } from './components'

export type {
  NeumorphismCardProps,
  CardVariant,
  CardDepth,
} from './components'

export type { NeumorphismInputProps, InputSize } from './components'

export type { ThemeProviderProps } from './components'

export type { NeumorphismCheckboxProps } from './components'

export type {
  NeumorphismRadioProps,
  NeumorphismRadioGroupProps,
} from './components'

export type {
  NeumorphismSelectProps,
  NeumorphismSelectOption,
} from './components'

export type { NeumorphismTextareaProps } from './components'

export type {
  NeumorphismFormProps,
  NeumorphismFormItemProps,
  FormRule,
} from './components'

export type { NeumorphismModalProps } from './components'

export type {
  NeumorphismToastProviderProps,
  ToastOptions,
  ToastType,
  ToastPosition,
  ToastItem,
} from './components'

export type {
  NeumorphismTooltipProps,
  TooltipPosition,
  TooltipTrigger,
} from './components'

export type { NeumorphismTabsProps, TabItem } from './components'

export type {
  NeumorphismBreadcrumbProps,
  BreadcrumbItem,
} from './components'

export type { NeumorphismPaginationProps } from './components'

export type { NeumorphismAvatarProps, AvatarSize } from './components'

export type { NeumorphismBadgeProps } from './components'

export type { NeumorphismTagProps, TagVariant } from './components'

export type {
  NeumorphismProgressProps,
  ProgressVariant,
} from './components'

export type { NeumorphismSkeletonProps } from './components'

export type {
  NeumorphismDividerProps,
  DividerDirection,
  DividerAlign,
} from './components'

export type {
  NeumorphismCollapseProps,
  CollapseItem,
} from './components'

export type {
  NeumorphismContainerProps,
  NeumorphismRowProps,
  RowAlign,
  RowJustify,
  NeumorphismColProps,
  ColSpan,
  ColOffset,
  NeumorphismLayoutProps,
  NeumorphismThemeToggleProps,
  NeumorphismTreeProps,
  NeumorphismTreeNodeProps,
  TreeNodeData,
  NeumorphismCanvasProps,
} from './components'

// Composables — theme
export {
  useTheme,
  provideTheme,
  createTheme,
} from './composables/useTheme'

export type {
  Theme,
  ThemeOptions,
  ThemeContext,
} from './composables/useTheme'

// Composables — headless behavior (business logic without UI)
export { useSelect } from './composables/useSelect'
export type { UseSelectOptions, UseSelectReturn, SelectOption } from './composables/useSelect'

export { useTabs } from './composables/useTabs'
export type { UseTabsOptions, UseTabsReturn, TabItem as HeadlessTabItem } from './composables/useTabs'

export { usePagination } from './composables/usePagination'
export type { UsePaginationOptions, UsePaginationReturn } from './composables/usePagination'

export { useTree } from './composables/useTree'
export type { UseTreeOptions, UseTreeReturn, TreeNodeData as HeadlessTreeNodeData } from './composables/useTree'

export { useCollapse } from './composables/useCollapse'
export type { UseCollapseOptions, UseCollapseReturn, CollapseItem as HeadlessCollapseItem } from './composables/useCollapse'

export { useModal } from './composables/useModal'
export type { UseModalOptions, UseModalReturn } from './composables/useModal'

export { useToast } from './composables/useToast'
export type { UseToastOptions, UseToastReturn, ToastOptions as HeadlessToastOptions, ToastItem as HeadlessToastItem, ToastType as HeadlessToastType, ToastPosition as HeadlessToastPosition } from './composables/useToast'

export { useTooltip } from './composables/useTooltip'
export type { UseTooltipOptions, UseTooltipReturn, TooltipPosition as HeadlessTooltipPosition, TooltipTrigger as HeadlessTooltipTrigger } from './composables/useTooltip'

export { useTouchDevice } from './composables/useTouchDevice'
export { useCheckable } from './composables/useCheckable'
export type { UseCheckableOptions } from './composables/useCheckable'
export { useFormField } from './composables/useFormField'
export type { FormFieldConfig, FieldSize } from './composables/useFormField'
export { validateFieldValue } from './composables/useFormValidation'
export type { FormRule as HeadlessFormRule } from './composables/useFormValidation'

// Utilities
export { generateId, debounce, isEmpty } from './utils'

// Config exports
export { useConfig, ConfigKey } from './composables/useConfig'
export type { NeumorphismGlobalConfig } from './composables/useConfig'

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

export function install(app: App, options?: NeumorphismGlobalConfig): void {
  // Provide global config for all components to use as defaults
  if (options) {
    app.provide(ConfigKey, computed(() => options))
  }

  for (const [name, component] of Object.entries(NAME_TO_COMPONENT)) {
    app.component(name, component)
  }
}

// Default export (for app.use())
export default {
  install,
  version: '__VERSION__',
}
