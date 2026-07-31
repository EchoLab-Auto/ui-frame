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
  NeumorphismAlert,
  NeumorphismPopover,
  NeumorphismDropdown,
  NeumorphismEmpty,
  NeumorphismProgress,
  NeumorphismScrollbar,
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
  NeumorphismLogo,
  NeumorphismFieldLabel,
  NeumorphismFieldError,
  NeumorphismSlider,
  NeumorphismInputNumber,
  NeumorphismDrawer,
  NeumorphismMenu,
  NeumorphismNavMenu,
  NeumorphismSteps,
  NeumorphismVirtualList,
  NeumorphismDatePicker,
  NeumorphismList,
  NeumorphismUpload,
  NeumorphismAutoComplete,
  NeumorphismChartBar,
  NeumorphismChartLine,
  NeumorphismChartPie,
  NeumorphismChartCandlestick,
} from './components'

import './styles/index.scss'

// Individual component exports — re-export all components and types from the barrel
export * from './components'
export type * from './components'

// Composables — focus stack (for nested modals/drawers)
export { useFocusStack } from './composables/useFocusStack'
export type { FocusStack } from './composables/useFocusStack'

// Composables — z-index layering system
export { useZIndex, Z_LAYERS, Z_STRIDE } from './composables/useZIndex'
export type { ZLayer } from './composables/useZIndex'

// Composables — swipe gestures
export { useSwipe } from './composables/useSwipe'
export type { SwipeDirection, UseSwipeOptions, UseSwipeReturn } from './composables/useSwipe'

// Composables — theme
export { useTheme, provideTheme, createTheme, getAntiFlickerScript } from './composables/useTheme'

export type { Theme, ThemeOptions, ThemeContext } from './composables/useTheme'

// Composables — headless behavior (business logic without UI)
export { useFloatingPosition } from './composables/useFloatingPosition'
export type {
  FloatingPlacement,
  FloatingRect,
  UseFloatingPositionOptions,
  UseFloatingPositionReturn,
} from './composables/useFloatingPosition'

export { useScrollbar } from './composables/useScrollbar'
export type {
  ScrollbarVariant,
  UseScrollbarOptions,
  UseScrollbarReturn,
} from './composables/useScrollbar'

export { useChartInteraction } from './composables/useChartInteraction'
export type {
  ChartInteractionSeries,
  ChartTooltipRow,
  ChartTooltipState,
  UseChartInteractionOptions,
  UseChartInteractionReturn,
} from './composables/useChartInteraction'

export { useSelect } from './composables/useSelect'
export type {
  UseSelectOptions,
  UseSelectReturn,
  SelectOption,
  SelectGroup,
  SelectModelValue,
} from './composables/useSelect'

export { usePixelLogoAnimation } from './composables/usePixelLogoAnimation'
export type {
  UsePixelLogoAnimationOptions,
  UsePixelLogoAnimationReturn,
} from './composables/usePixelLogoAnimation'

export { useReducedMotion, prefersReducedMotion } from './composables/useReducedMotion'
export type { UseReducedMotionReturn } from './composables/useReducedMotion'

export { useProgress } from './composables/useProgress'
export type { UseProgressOptions, UseProgressReturn, ProgressSize } from './composables/useProgress'

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

export { useAlert } from './composables/useAlert'
export type {
  UseAlertOptions,
  UseAlertReturn,
  AlertType as HeadlessAlertType,
} from './composables/useAlert'

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
export { useSlider } from './composables/useSlider'
export type { UseSliderOptions, UseSliderReturn } from './composables/useSlider'
export { useNumberInput } from './composables/useNumberInput'
export type { UseNumberInputOptions, UseNumberInputReturn } from './composables/useNumberInput'
export { usePopover } from './composables/usePopover'
export type {
  UsePopoverOptions,
  UsePopoverReturn,
  PopoverPosition,
  PopoverTrigger,
} from './composables/usePopover'
export { useSteps } from './composables/useSteps'
export type {
  UseStepsOptions,
  UseStepsReturn,
  StepItem as HeadlessStepItem,
  StepStatus as HeadlessStepStatus,
} from './composables/useSteps'
export { useDrawer } from './composables/useDrawer'
export type { UseDrawerOptions, UseDrawerReturn, DrawerPosition } from './composables/useDrawer'
export { useMenu } from './composables/useMenu'
export type {
  UseMenuOptions,
  UseMenuReturn,
  MenuItem as HeadlessMenuItem,
} from './composables/useMenu'
export { useVirtualList } from './composables/useVirtualList'
export type { UseVirtualListOptions, UseVirtualListReturn } from './composables/useVirtualList'
export { useDatePicker } from './composables/useDatePicker'
export type {
  UseDatePickerOptions,
  UseDatePickerReturn,
  DayCell,
} from './composables/useDatePicker'
export { useUpload } from './composables/useUpload'
export type {
  UseUploadOptions,
  UseUploadReturn,
  UploadFile,
  UploadStatus,
} from './composables/useUpload'
export { useAutoComplete } from './composables/useAutoComplete'
export type {
  AutoCompleteOption,
  UseAutoCompleteOptions,
  UseAutoCompleteReturn,
} from './composables/useAutoComplete'
export { validateFieldValue } from './composables/useFormValidation'
export type { FormRule as HeadlessFormRule } from './composables/useFormValidation'

// Composables — chart (headless chart logic)
export { useChart } from './composables/useChart'
export type {
  UseChartOptions,
  ChartSeries,
  ChartDataPoint,
  ChartMargin,
  TooltipState,
} from './composables/useChart'
export type { UseChartReturn } from './composables/useChart'

export { useBarChart } from './composables/useBarChart'
export type { UseBarChartOptions, BarRect } from './composables/useBarChart'
export type { UseBarChartReturn } from './composables/useBarChart'

export { useLineChart } from './composables/useLineChart'
export type { UseLineChartOptions, LineSeries, ChartPoint } from './composables/useLineChart'
export type { UseLineChartReturn } from './composables/useLineChart'

export { usePieChart } from './composables/usePieChart'
export type { UsePieChartOptions, PieArc } from './composables/usePieChart'
export type { UsePieChartReturn } from './composables/usePieChart'

export { useCandlestickChart } from './composables/useCandlestickChart'

// OffscreenCanvas chart renderer
export { createChartRenderer } from './composables/chartCanvasRenderer'
export type {
  ChartRenderer,
  ChartRendererOptions,
  BarSeries,
  CanvasLineSeries,
} from './composables/chartCanvasRenderer'
export type {
  UseCandlestickChartOptions,
  CandleRect,
  VolumeBar,
  MALine,
} from './composables/useCandlestickChart'
export type { UseCandlestickChartReturn } from './composables/useCandlestickChart'
export type { OhlcDataPoint } from './composables/useChart'

// Locales
export { useLocale, provideLocale, getLocaleMessages, LocaleKey } from './composables/useLocale'
export type { LocaleMessages, Locale } from './locales'
export { zhCN, enUS } from './locales'

// Utilities
export { generateId, debounce, isEmpty } from './utils'

// Directives
export { vMagnetic } from './directives/vMagnetic'

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
  NeumorphismPluginHooks,
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
  NeumorphismAlert,
  NeumorphismPopover,
  NeumorphismDropdown,
  NeumorphismEmpty,
  NeumorphismProgress,
  NeumorphismScrollbar,
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
  NeumorphismLogo,
  NeumorphismFieldLabel,
  NeumorphismFieldError,
  NeumorphismSlider,
  NeumorphismInputNumber,
  NeumorphismDrawer,
  NeumorphismMenu,
  NeumorphismNavMenu,
  NeumorphismSteps,
  NeumorphismVirtualList,
  NeumorphismDatePicker,
  NeumorphismList,
  NeumorphismUpload,
  NeumorphismAutoComplete,
  NeumorphismChartBar,
  NeumorphismChartLine,
  NeumorphismChartPie,
  NeumorphismChartCandlestick,
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
  const isNew = 'config' in raw || 'components' in raw || 'prefix' in raw || 'hooks' in raw

  const pluginConfig: NeumorphismGlobalConfig | undefined = isNew
    ? (raw.config as NeumorphismGlobalConfig | undefined)
    : (options as NeumorphismGlobalConfig | undefined)

  const overrides: ComponentOverrides = isNew ? ((raw.components ?? {}) as ComponentOverrides) : {}

  const prefix: string = isNew ? ((raw.prefix ?? '') as string) : ''

  const hooks = (isNew ? (raw.hooks as NeumorphismPluginOptions['hooks']) : undefined) ?? {}

  // Provide global config for all components to use as defaults
  if (pluginConfig) {
    app.provide(
      ConfigKey,
      computed(() => pluginConfig)
    )
    hooks.onConfigChange?.(pluginConfig)
  }

  // Register default components, applying overrides where they exist
  for (const [name, defaultComponent] of Object.entries(NAME_TO_COMPONENT)) {
    const component = overrides[name] ?? defaultComponent
    app.component(`${prefix}${name}`, component)
    hooks.onComponentRegister?.(name, component)
  }

  // Register any additional components not in the default set
  for (const [name, component] of Object.entries(overrides)) {
    if (!(name in NAME_TO_COMPONENT)) {
      app.component(`${prefix}${name}`, component)
      hooks.onComponentRegister?.(name, component)
    }
  }
}

// Default export (for app.use())
export default {
  install,
  version: __VERSION__,
}
