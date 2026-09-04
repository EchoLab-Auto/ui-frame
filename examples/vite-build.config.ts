import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from '../package.json'

export default defineConfig({
  // Match the library build: src/index.ts references __VERSION__, which must
  // be defined or the default export crashes at module load.
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue()],
  root: __dirname,
  base: '/ui-frame/',
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
      // mermaid 是可选 peer dependency，示例构建时未安装，使用 noop stub
      mermaid: resolve(__dirname, './_mermaid-stub.ts'),
      // dompurify 是可选 peer dependency，示例构建时未安装，使用恒等 sanitize stub
      dompurify: resolve(__dirname, './_dompurify-stub.ts'),
    },
  },
  build: {
    outDir: '../dist-example',
    emptyOutDir: true,
  },
})
