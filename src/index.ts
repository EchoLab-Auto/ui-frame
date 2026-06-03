import type { App } from 'vue'

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
} from './components'

// Composables
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

// Utilities
export { generateId, debounce, isEmpty } from './utils'

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
} as const

export function install(app: App): void {
  for (const [name, component] of Object.entries(NAME_TO_COMPONENT)) {
    app.component(name, component)
  }
}

// Default export (for app.use())
export default {
  install,
  version: '__VERSION__',
}
