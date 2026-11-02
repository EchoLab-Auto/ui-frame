---
'@echolab-auto/ui-frame': minor
---

**Mermaid 只剩一套皮肤：原生画布。** 移除官方 SVG 渲染器（连带 `mermaid` 可选 peer 依赖，宿主无需再安装），`flowchart` / `graph` 走 `DocFlowCanvas`；其余图型（`sequenceDiagram` / `gantt` / `classDiagram` …）与超出原生能力的写法（`direction` / `click` 等）一律**保留源码**，标 `data-mermaid-state="error"` + `data-mermaid-graph="flowchart|other"`。此前同一份文档里新拟态卡片与官方浅蓝方块并排，读者会以为它们来自两个产品。删除导出 `renderMermaidDiagrams`，新增 `setMermaidState`、`MERMAID_GRAPH_ATTR`、`isMermaidFlowchart`。

**新增 `==>` 加重边**：`flow-parser` 与 `mermaid-flow` 均识别 Mermaid 粗箭头，`ProDocFlowEdge.thick` 透传到 `FlowLayoutEdge`，画布用 `.nm-flow__edge--thick` 加粗描边（箭头随 `markerUnits=strokeWidth` 一起放大），拓扑与布局不变。
