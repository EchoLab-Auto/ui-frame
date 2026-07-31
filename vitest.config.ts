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
        // 门禁已接线（CI 跑 test:coverage）。阈值跟随补齐进度上调以防退化，
        // 目标 80/70/80/80（当前实际: 73.96/63.5/73.35/75.91）
        statements: 73,
        branches: 63,
        functions: 73,
        lines: 75,
      },
    },
  },
})
