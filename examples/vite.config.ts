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
  server: {
    // Vite ≥5.4.12 默认只放行 `localhost` 与 IP 形式的 Host 头（防 DNS rebinding）。
    // 用自定义域名 / 主机名访问开发服务器时会被 403，需要显式加白名单。
    // 默认空数组 = 保持 Vite 默认行为；按需开启，例如：
    //   VITE_ALLOWED_HOSTS="ui-frame.local,.local,dev.example.com" npm run example
    // 前导点表示放行该域名的所有子域。
    allowedHosts:
      process.env.VITE_ALLOWED_HOSTS?.split(',')
        .map(h => h.trim())
        .filter(Boolean) ?? [],
  },
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
      mermaid: resolve(__dirname, '../src/__test-utils__/mermaid-stub.ts'),
      // dompurify is an optional peer dependency — stub it in dev
      dompurify: resolve(__dirname, '../src/__test-utils__/dompurify-stub.ts'),
    },
  },
})
