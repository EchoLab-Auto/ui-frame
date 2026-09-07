---
'@echolab-auto/ui-frame': patch
---

修复三处表单/导航组件的声明与渲染脱节：

- **NeumorphismDatePicker**：`name` prop 此前声明后未使用，现渲染 hidden input 携带格式化日期串参与原生表单提交（无值提交空串）。
- **NeumorphismPagination**：`totalLabel` 此前声明后未使用，现作为总数文案模板的覆盖项生效（支持 `{total}` 占位符），未传入时仍走 locale `paginationTotal`，行为向后兼容；跳页器硬编码的「跳至 / 页」提取为 locale 键 `paginationJumper`（zh-CN `跳至 {input} 页` / en-US `Go to {input}`），组件按 `{input}` 占位符拆分为输入框前后两段。
- **NeumorphismTabs**：`TabItem.icon` 此前仅保留在类型上，现在 tab 按钮 label 前渲染（emoji/文本字符，`nm-tabs__tab-icon`，`aria-hidden`）。
