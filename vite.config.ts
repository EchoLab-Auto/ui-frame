import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { resolve } from 'path'
import { readdirSync, existsSync } from 'fs'

// ---- 自动扫描组件目录 ----
const componentDirs = readdirSync(resolve(__dirname, 'src/components'), { withFileTypes: true })
  .filter(
    d => d.isDirectory() && existsSync(resolve(__dirname, `src/components/${d.name}/index.ts`))
  )
  .map(d => d.name)

// ---- 自动扫描 composable 文件（排除测试文件）----
const composableFiles = readdirSync(resolve(__dirname, 'src/composables'))
  .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .map(f => f.replace('.ts', ''))

// ---- 构建入口映射 ----
const entries: Record<string, string> = {
  // 现有入口
  'ui-frame': resolve(__dirname, 'src/index.ts'),
  'extensions/index': resolve(__dirname, 'src/extensions/index.ts'),
  'utils/index': resolve(__dirname, 'src/utils/index.ts'),
  'doc/index': resolve(__dirname, 'src/doc/index.ts'),
  // 样式独立入口
  tokens: resolve(__dirname, 'src/styles/tokens.ts'),
  base: resolve(__dirname, 'src/styles/base.ts'),
}

// 组件级入口
for (const dir of componentDirs) {
  entries[`components/${dir}/index`] = resolve(__dirname, `src/components/${dir}/index.ts`)
}

// Composable 级入口
for (const file of composableFiles) {
  entries[`composables/${file}`] = resolve(__dirname, `src/composables/${file}.ts`)
}

export default defineConfig({
  plugins: [
    vue(),
    libInjectCss(),
    dts({
      insertTypesEntry: true,
      cleanVueFileName: true,
    }),
  ],
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
      entry: entries,
      name: 'NeumorphismUI',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['vue', 'marked'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          marked: 'marked',
        },
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') return 'style.css'
          if (assetInfo.name === 'tokens.css') return 'tokens.css'
          if (assetInfo.name === 'base.css') return 'base.css'
          return assetInfo.name as string
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
})
