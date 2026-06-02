import type { App } from 'vue'

import NeumorphismButton from './components/NeumorphismButton'
import NeumorphismSwitch from './components/NeumorphismSwitch'
import NeumorphismCard from './components/NeumorphismCard'
import NeumorphismInput from './components/NeumorphismInput'
import ThemeProvider from './components/ThemeProvider'

import './styles/index.scss'

// Individual component exports
export {
  NeumorphismButton,
  NeumorphismSwitch,
  NeumorphismCard,
  NeumorphismInput,
  ThemeProvider,
}

// Type exports
export type {
  NeumorphismButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from './components/NeumorphismButton'

export type { NeumorphismSwitchProps } from './components/NeumorphismSwitch'

export type {
  NeumorphismCardProps,
  CardVariant,
  CardDepth,
} from './components/NeumorphismCard'

export type { NeumorphismInputProps, InputSize } from './components/NeumorphismInput'

export type { ThemeProviderProps } from './components/ThemeProvider'

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
