import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from '../package.json'

export default defineConfig({
  // src/index.ts references the __VERSION__ identifier, which the library
  // build injects via `define`. The example imports src/index.ts directly,
  // so it must define the same constant — otherwise the default export
  // evaluates an undefined global at module load and the app fails to mount.
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue()],
  root: __dirname,
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@echolab-auto/ui-frame': resolve(__dirname, '../src/index.ts'),
      '@echolab-auto/ui-frame/doc': resolve(__dirname, '../src/composites/doc/index.ts'),
      // mermaid is an optional peer dependency — stub it in dev
      mermaid: resolve(__dirname, '_mermaid-stub.ts'),
      // dompurify is an optional peer dependency — stub it in dev
      dompurify: resolve(__dirname, '_dompurify-stub.ts'),
    },
  },
})
