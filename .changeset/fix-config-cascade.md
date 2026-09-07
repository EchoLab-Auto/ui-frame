---
'@echolab-auto/ui-frame': patch
---

修复三项组件缺陷：

1. **NeumorphismInputNumber size 级联读错配置段**：全局配置类型新增独立 `inputNumber?: { size }` 段，组件由误读 `config.input?.size` 改为读 `config.inputNumber?.size`，级联优先级保持「显式 prop > 全局配置 > 内置兜底」，与 Input 的 `input` 段互不影响。
2. **NeumorphismThemeToggle 标签隐藏未走级联值**：文字标签显隐由原始 prop `size !== 'small'` 改为级联后的 `resolvedSize !== 'small'`，全局配置 `themeToggle.size: 'small'` 现在同样只显示图标。
3. **NeumorphismDivider 的 inset 死 prop**：组件内置 `.nm-divider--inset` 样式——水平分割线左右各让出 `--nm-spacing-lg`（宽度改回 auto 避免溢出），垂直分割线上下各让出 `--nm-spacing-lg`。
