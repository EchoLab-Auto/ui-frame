/// <reference types="vite/client" />

// 演示站点用到的静态资源。库构建不包含 examples/，所以这份声明只服务于
// 「想给示例站点补一次类型检查」的场景（临时 tsconfig 把 examples/ 纳入 include 时）。
declare module '*.jpeg' {
  const src: string
  export default src
}
