---
'@echolab-auto/ui-frame': minor
---

**几何量一律用 px 数字**：把「一个档位只量一个几何量」的 prop 全部改成数字（px），字符串档位降级为 `@deprecated` 别名（按固定映射保留，不破坏既有代码）。

| 组件 | prop | 旧档位 → 新数字 | 数字的含义 |
| --- | --- | --- | --- |
| `NeumorphismAsciiArt` | `radius` | `none`/`small`/`medium`/`large`/`xl` → `0`/`8`/`16`/`24`/`32` | 圆角半径 |
| `NeumorphismStatusDot` | `size` | `small`/`medium`/`large` → `8`/`10`/`12` | 圆点直径 |
| `NeumorphismModal` | `size` | `small`/`medium`/`large` → `400`/`560`/`720` | 最大宽度 |
| `NeumorphismLogo` | `size` | `small`/`medium`/`large` → `120`/`220`/`360` | 宽度（`width` 优先） |
| `NeumorphismSpinner` | `size` | `small`/`medium`/`large` → `14`/`20`/`28` | 直径（原本就收数字，现改为数字优先） |

- 默认值保持不变（AsciiArt 24 / StatusDot 10 / Modal 560 / Logo 220 / Spinner 20），不传参的渲染与之前逐像素一致
- 三档 class（`nm-status-dot--large`、`nm-modal--small` 等）随之删除：几何量走内联 px（StatusDot 宽高、Modal `max-width`、AsciiArt `border-radius`）或 CSS 变量（Spinner `--nm-spinner-size`），`Logo` 的字符串档位仍走原 class
- 数字通道统一加容错：`Number.isFinite` 校验 + 下限夹取（StatusDot ≥4px、Spinner ≥8px、Modal ≥240px、AsciiArt 与 Card 的圆角 ≥0），避免「配置算错 → 元素消失 / 声明失效」
- 全局配置同步接受数字：`statusDot.size` / `modal.size` / `logo.size` / `spinner.size`

**哪些没改**：`Button` / `Input` / `Tag` / `Table` 等 `size` 仍是 `'small' | 'medium' | 'large'`。它们的档位**同时**决定字号、内距与控件高度（多个几何量打包成的尺度），单给一个数字要么丢信息、要么得让调用方自己维持多维平衡。判据与理由写进 `document/develop/design-philosophy.md` §七「几何量用数字，尺度用档位」。
