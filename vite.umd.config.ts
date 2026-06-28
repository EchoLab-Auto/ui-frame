import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NeumorphismUI',
      formats: ['umd'],
      fileName: () => 'ui-frame.umd.cjs',
    },
    rollupOptions: {
      external: ['vue', 'marked', 'mermaid'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          marked: 'marked',
        },
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') {
            return 'style.css'
          }
          return assetInfo.name as string
        },
      },
    },
    cssCodeSplit: false,
    emptyOutDir: false,
  },
})
