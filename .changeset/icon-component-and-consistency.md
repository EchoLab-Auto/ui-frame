---
'@echolab-auto/ui-frame': minor
---

新增 `NeumorphismIcon` 图标组件与 `icons` 子路径，并在图标体系上做了三处规范修复（Design Philosophy §8）。

**图标注册表（新增 `@echolab-auto/ui-frame/icons` 子路径）**：`ICON_REGISTRY` 集中定义 79 个语义图标（导航 / 状态 / 文件 / 操作 / 数据 / 消息与智能 / 画布 / 文档与编辑八组），24 基准 viewBox、线框单色；同时导出 `ICON_NAMES`、`ICON_SIZE_PX`、`ICON_SIZE_ALLOWED`、`ICON_STROKE_ALLOWED`、`defaultStrokeWidth()`。子路径独立打包（`dist/icons/index.js`），只装图标表、不拖整包。此前库内 **31 个组件各自内联 75 个 `<svg>`**，同一几何反复重写（`close` 9 处、`chevron-down` 5 处、`chevron-right` 3 处、`check` 2 处、spinner 弧 2 处）——规范只能被"检查"不能被"复用"，也是消费方被迫自建图标体系的根因。

**`NeumorphismIcon` 组件**：`name` / `size`（七档 `xs`12 `sm`14 `md`16 `lg`18 `xl`20 `2xl`24 `3xl`32，或数字直传）/ `strokeWidth`（可选覆盖）/ `spin` / `pulse` / `label`。线宽按显示尺寸自动取档（≤12 → `2.5` 微图标补偿；≥24 → `1.5` 大图标轻描；其余 `2`）；`spin` / `pulse` 两个布尔动效（`transform-box: view-box` 锁定旋转中心，`prefers-reduced-motion` 下停用）；`label` 有值时 `role="img"` + `aria-label`，留空则 `aria-hidden`。

**`NeumorphismThemeToggle` 两处修复**：① 三态图标统一为线框——此前 `light` 是「实心圆 + 线框射线」、`auto` 纯线框、`dark` 纯实心块，切换主题时"实心↔线框"跳变；现三态均走 `NeumorphismIcon`（`sun` / `monitor` / `moon`）。② 激活态去掉 `scale(1.1)`：该缩放让 14px 图标实测渲染 **18.86px**（+35%），脱离 §8 枚举档且比相邻按钮明显更大更粗；现仅保留 `rotate(15deg)`。图标档位随 `size`：`small` → 14、`medium`/`large` → 18。

**`NeumorphismCheckbox` 图标尺寸改枚举档**：勾选图标此前用 `width: 65%` 随 box 缩放，实测 **11.7 / 15.6 / 19.5px**（small/medium/large），三档全部落在枚举档之外。现显式取 `--nm-icon-size-xs` / `-sm` / `-md`（12 / 14 / 16），视觉占比 67% / 58% / 53%，观感与旧版一致但尺寸可枚举、可被校验。

**防回归**：新增 `npm run check:icons`（`scripts/check-icons.mjs`）——校验注册表 path 语法、组件内 `<svg>` 尺寸与 `stroke-width` 是否在枚举档、图标容器的百分比尺寸、以及模板里用 emoji/符号充当控件图标。与 `check:registry` / `check:styles` 同级。
