import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
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
      '@echolab/ui-frame': resolve(__dirname, '../src/index.ts'),
      '@echolab/ui-frame/doc': resolve(__dirname, '../src/doc/index.ts'),
    },
  },
})
