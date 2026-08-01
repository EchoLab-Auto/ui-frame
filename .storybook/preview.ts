import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import NeumorphismUI from '../src/index'
import '../src/styles/index.scss'

// Auto-install all components for every story
setup(app => {
  app.use(NeumorphismUI)
  return app
})

const preview: Preview = {
  globalTypes: {
    theme: {
      name: '主题',
      description: '亮/暗主题切换（data-theme 驱动 Token 系统）',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: '亮色', icon: 'sun' },
          { value: 'dark', title: '暗色', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme ?? 'light'
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.style.background = theme === 'dark' ? '#1c1c1c' : '#e0e0e0'
      }
      return { template: '<story />' }
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'neumorphism-light',
      values: [
        { name: 'neumorphism-light', value: '#e0e0e0' },
        { name: 'neumorphism-dark', value: '#1c1c1c' },
      ],
    },
    a11y: {
      config: {},
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
      },
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
  },
}

export default preview
