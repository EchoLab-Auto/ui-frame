---
'@echolab-auto/ui-frame': minor
---

**新增两种原生图：时序图与甘特图。** `MarkdownRenderer` 现在把 ` ```mermaid ` 代码块按图型分发给三张原生图（`flowchart` → `DocFlowCanvas`、`sequenceDiagram` → `DocSequenceChart`、`gantt` → `DocGanttChart`），仍然**不使用** Mermaid 官方渲染器——同一份文档里只允许一种皮肤。

- `parseMermaidSequence`：`participant`/`actor`（含 `as` 别名）、八种箭头、自消息、`Note left of/right of/over`、`activate`/`deactivate`（含 `->>+`/`->>-` 简写）、`autonumber`、`loop`/`alt`/`opt`/`par`/`critical`/`break` 与 `else`/`and` 分隔。
- `parseMermaidGantt`：`title`/`dateFormat`/`axisFormat`/`section`、`done`/`active`/`crit`/`milestone`、`after` 依赖、时长 `ms|s|m|h|d|w`、`excludes weekends` 与具体日期排除（按工作日推进，起始日计为第 1 个工作日）。
- `parseMermaidDiagram`：统一分发入口，返回 `{ type, diagram? }`；`diagram` 缺席即"保留源码"，`type` 让"改写法就有图"（`flowchart`/`sequence`/`gantt`）与"图型还没实现"（`other`）在 DOM 上可区分。
- 两个新组件是**图表**而不是画布：宽度跟随容器（`useContainerWidth` 测量，最小宽度兜底）、高度随内容，没有缩放控件与网格。甘特图的条长由毫秒比例直接换算，任何宽度下「谁和谁重叠」都可直接比较；另画 `after` 依赖折线、今日标线，并按跨度自动选择刻度单位。
- `@echolab-auto/ui-frame/doc` 导出上述解析器、两个组件与相关类型。
