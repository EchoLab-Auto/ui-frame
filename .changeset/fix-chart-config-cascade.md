---
'@echolab-auto/ui-frame': patch
---

修复图表组件全局配置级联失效：`useLineChart` / `usePieChart` / `useBarChart` 在解构 options 时直接给默认值（如 `curve = 'smooth'`），导致 `chart.line.*` / `chart.pie.*` / `chart.bar.*` 配置段永远轮不到；现改为「显式 prop/options > 全局配置 > 内置兜底」三级解析。`useCandlestickChart` 的 `showVolume` / `showMA` 接入 `chart.candlestick.*` 级联，`maPeriods` 不再被组件 `withDefaults` 的 `[5, 10, 20]` 截断。`chart.colorPalette` 接入 Pie 调色板级联（显式 `colorPalette` > 全局配置 > 主题 token）。NeumorphismChartBar 新增 `orientation` / `stacked` / `barGap` props 以打通显式层。未传 prop 且无全局配置时渲染结果与之前完全一致。
