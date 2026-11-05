import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'
import pkg from '../package.json'

/**
 * 静态托管（GitHub Pages 等）不会把未知路径回退到 index.html：
 * 直接访问 / 刷新 `/ui-frame/components` 这类深链会拿到站点 404。
 * 构建后把 index.html 复制为 404.html（Pages 对任意未知路径返回它，
 * 浏览器地址栏保持不变），vue-router 便能按 base 正常解析该路径。
 */
const spaFallback404 = (): Plugin => ({
  name: 'spa-fallback-404',
  apply: 'build',
  closeBundle() {
    const outDir = resolve(__dirname, '../dist-example')
    const index = resolve(outDir, 'index.html')
    if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
  },
})

export default defineConfig({
  // Match the library build: src/index.ts references __VERSION__, which must
  // be defined or the default export crashes at module load.
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue(), spaFallback404()],
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
      // dompurify 是可选 peer dependency，示例构建时未安装，使用恒等 sanitize stub
      dompurify: resolve(__dirname, '../src/__test-utils__/dompurify-stub.ts'),
    },
  },
  build: {
    outDir: '../dist-example',
    emptyOutDir: true,
  },
})
