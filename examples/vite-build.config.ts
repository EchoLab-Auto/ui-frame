import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
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
      '@echolab-auto/ui-frame/doc': resolve(__dirname, '../src/doc/index.ts'),
      // mermaid 是可选 peer dependency，示例构建时未安装，使用 noop stub
      mermaid: resolve(__dirname, './_mermaid-stub.ts'),
    },
  },
  build: {
    outDir: '../dist-example',
    emptyOutDir: true,
  },
})
