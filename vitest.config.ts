import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // mermaid 是可选 peer dependency，测试环境未安装，使用 noop stub
      mermaid: resolve(__dirname, 'examples/_mermaid-stub.ts'),
      // dompurify 同为可选 peer dependency，测试环境用恒等 sanitize stub
      dompurify: resolve(__dirname, 'examples/_dompurify-stub.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'examples/',
        '**/*.test.ts',
        '**/index.ts',
        'docs/',
        'dist/',
        '**/*.d.ts',
      ],
      thresholds: {
        // 门禁已接线（CI 跑 test:coverage）。阈值设为当前实际值以防退化，
        // 按季度爬坡至目标值 80/70/80/80（当前实际: 70.79/59.52/71.84/72.88）
        statements: 70,
        branches: 59,
        functions: 71,
        lines: 72,
      },
    },
  },
})
