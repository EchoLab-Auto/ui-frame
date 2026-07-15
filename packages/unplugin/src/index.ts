/**
 * unplugin-vue-components resolver for @echolab-auto/ui-frame.
 *
 * Enables auto-import of neumorphism components:
 *
 * ```ts
 * // vite.config.ts
 * import Components from 'unplugin-vue-components/vite'
 * import { NeumorphismUIResolver } from '@echolab-auto/ui-frame/unplugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     Components({ resolvers: [NeumorphismUIResolver()] }),
 *   ],
 * })
 * ```
 *
 * Then use any component without importing:
 * ```vue
 * <template>
 *   <NeumorphismButton variant="raised">Click</NeumorphismButton>
 *   <NeumorphismCard :elevation="2">Content</NeumorphismCard>
 * </template>
 * ```
 */

export interface NeumorphismUIResolverOptions {
  /** Component name prefix (default: 'Neumorphism') */
  prefix?: string
  /** Import style CSS automatically (default: true) */
  importStyle?: boolean
}

const ALL_COMPONENTS = [
  'NeumorphismAlert',
  'NeumorphismAutoComplete',
  'NeumorphismAvatar',
  'NeumorphismBadge',
  'NeumorphismBreadcrumb',
  'NeumorphismButton',
  'NeumorphismCanvas',
  'NeumorphismCard',
  'NeumorphismChartBar',
  'NeumorphismChartCandlestick',
  'NeumorphismChartLine',
  'NeumorphismChartPie',
  'NeumorphismCheckbox',
  'NeumorphismCollapse',
  'NeumorphismContainer',
  'NeumorphismDatePicker',
  'NeumorphismDivider',
  'NeumorphismDrawer',
  'NeumorphismDropdown',
  'NeumorphismEmpty',
  'NeumorphismFieldError',
  'NeumorphismFieldLabel',
  'NeumorphismForm',
  'NeumorphismFormItem',
  'NeumorphismInput',
  'NeumorphismInputNumber',
  'NeumorphismLayout',
  'NeumorphismList',
  'NeumorphismMenu',
  'NeumorphismModal',
  'NeumorphismNavMenu',
  'NeumorphismPagination',
  'NeumorphismPopover',
  'NeumorphismProgress',
  'NeumorphismRadio',
  'NeumorphismRadioGroup',
  'NeumorphismScrollbar',
  'NeumorphismSelect',
  'NeumorphismSkeleton',
  'NeumorphismSlider',
  'NeumorphismSteps',
  'NeumorphismSwitch',
  'NeumorphismTable',
  'NeumorphismTabs',
  'NeumorphismTag',
  'NeumorphismTextarea',
  'NeumorphismThemeToggle',
  'NeumorphismToastProvider',
  'NeumorphismTooltip',
  'NeumorphismTree',
  'NeumorphismTreeNode',
  'NeumorphismUpload',
  'NeumorphismVirtualList',
]

// Map component names to their subpath exports
function componentPath(name: string): string {
  // Multi-component directories
  if (name === 'NeumorphismRadio' || name === 'NeumorphismRadioGroup') return 'NeumorphismRadio'
  if (name === 'NeumorphismFieldLabel' || name === 'NeumorphismFieldError')
    return 'NeumorphismField'
  if (name === 'NeumorphismFormItem') return 'NeumorphismForm'
  if (name === 'NeumorphismRow' || name === 'NeumorphismCol') return 'NeumorphismGrid'
  if (name === 'NeumorphismTreeNode') return 'NeumorphismTree'
  return name
}

export function NeumorphismUIResolver(options: NeumorphismUIResolverOptions = {}): {
  type: 'component'
  resolve: (name: string) => { name: string; from: string } | undefined
} {
  const { prefix = 'Neumorphism', importStyle = true } = options

  return {
    type: 'component',
    resolve(name: string) {
      if (!name.startsWith(prefix)) return

      const componentName = name
      if (!ALL_COMPONENTS.includes(componentName)) return

      const dir = componentPath(componentName)

      if (importStyle) {
        // Return with side-effect import for CSS
        return {
          name: componentName,
          from: `@echolab-auto/ui-frame/components/${dir}/index`,
        }
      }

      return {
        name: componentName,
        from: `@echolab-auto/ui-frame`,
      }
    },
  }
}

export default NeumorphismUIResolver
