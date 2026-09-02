---
'@echolab-auto/ui-frame': minor
---

新增 `NeumorphismArt` 试验性动态效果组件：内嵌 canvas 渲染程序化效果，首批内置 `pixel-field`（像素脉冲场）、`particles`（粒子连线星座）、`waves`（流动波浪）、`goo`（融合色团）、`ascii`（字符画，经 `src` 传入图片采样亮度映射字符栅格）五种效果；支持 `reactive` 指针交互、`speed`/`density`/`palette`/`seed` 参数化，颜色默认跟随主题 token；触屏与 `prefers-reduced-motion` 自动降级为静态帧。配套公开 headless `useArtRenderer` 渲染循环与全局配置 `art.*` 段。

新增 `NeumorphismAsciiArt` 字符画正式组件（Art 试验场 `ascii` 效果的正式化）：经 `src` 传入图片渲染为 ASCII 字符画，保持原图宽高比适配（contain）、亮度直方图拉伸保证对比度，支持 `density` / `reactive` / `speed` 与覆盖层插槽；容器 `width` / `height` 可显式拉伸，`height` 留空时按图片宽高比自适应；`radius` 圆角档位（none/small/medium/large/xl）。
