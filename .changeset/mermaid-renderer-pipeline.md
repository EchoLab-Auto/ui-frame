---
'@echolab-auto/ui-frame': patch
---

将 Mermaid 图表完整收拢进 MarkdownRenderer：flowchart/graph 复用 DocFlowCanvas 与 NeumorphismCanvas 的主题、布局及交互，其他图型由官方渲染器兜底；统一延迟加载与 strict 初始化，使用 `<pre><code>` 保存可回退源码，逐图渲染并隔离语法错误，防止异步结果写回已卸载占位；补充通用图表样式、竞态与真实解析器测试。
