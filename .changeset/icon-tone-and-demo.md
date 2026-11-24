---
'@echolab-auto/ui-frame': minor
---

`NeumorphismIcon` 补齐「语义色调」与无障碍别名，并新增图标演示页——让产品侧的图标封装（`PanelIcon` 一类）可以直接换成库组件，而不是各自再包一层。

**新增 `tone` prop（七档）**：`inherit`（默认，`currentColor`）/ `accent` / `muted` / `success` / `warning` / `error` / `info`。值全部取主题令牌，深色主题自动跟随。色调类名带 `tone-` 前缀（`nm-icon--tone-warning`），与 `warning` / `info` 这类型语义名的钩子不冲突。产品专属语义（如「推理中」「子代理」）不进库：用 `inherit` + `style="color: …"` 传自己的令牌。

**新增令牌 `--nm-accent-text`**：`--nm-primary-color`（亮 lime）是填充色，作为前景在浅底上对比度只有约 1.4:1。新增的可读强调色浅色主题取 `#546200`（约 6:1）、深色主题直接复用 `--nm-primary-color`。产品侧此前各自 hack 的可读 lime 现在有库级出口。

**新增 `ariaLabel` prop**：`label` 的等价别名（`ariaLabel` 优先）。产品侧历史写法是 `ariaLabel`，保留它让 `<PanelIcon name size tone ariaLabel>` 这类调用点不必改名即可切换到底层组件；装饰性图标的 `aria-hidden` 行为不变。

**新增演示页 `IconDemo`**：图标墙覆盖注册表全部 79 个语义（搜索过滤、点格切换预览）+ 尺寸七档 / 线宽六档 / 色调七档 / `spin`·`pulse` 动效 + 实时代码片段。此前 examples 里没有任何图标展示页，消费方只能读注册表源码。

**文档**：`components/icon.md` 补 `tone` / `ariaLabel` API 与语义色调令牌表；`design-philosophy.md` §8 与 `components.md` 组件条目同步；`components.md` 的文档图补上 `comp-icon` 连线（此前 `icon.md` 是孤立文档）。
