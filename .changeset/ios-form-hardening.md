---
'@echolab-auto/ui-frame': patch
---

iOS Safari（iPhone / iPad）适配加固 —— 修复真机上「输入框圆角/对齐跟设计对不上」「浮层被刘海压住」「宽表列点不到」三类问题：

**表单控件与聚焦缩放**

- 原生 `input` / `textarea` / `select` 的 `appearance` / `border-radius` 重置此前只在 `.nm-root` 子树生效；Teleport 到 body 的浮层（Modal/Drawer 遮罩、Toast、Tooltip、Popover、Select/AutoComplete 下拉、Menu 子菜单）整棵逃出子树，iOS 会重新套用系统内阴影与系统圆角。现统一由 `:is()` 作用域清单覆盖浮层根**与组件根**（宿主可能把库组件放进自绘浮层），并补齐 `min-width: 0`（flex 行内原生控件按 `size` 撑破输入区）、`touch-action: manipulation`、`::placeholder { opacity: 1 }`（WebKit 默认不透明度让占位文字偏淡）。
- 新增令牌 `--nm-form-font-ios-min`（16px）。iOS 对字号 < 16px 的表单控件会放大整页，缩放后圆角/内边距/对齐全部错位——这是「iOS 上输入框圆角不对」最常见的根因。在 `@supports (-webkit-touch-callout: none)` + `pointer: coarse` 下把文本类控件字号钉在此值（`!important` 压过组件尺寸档；checkbox/radio/range/file/color/hidden 除外），桌面与非触屏环境不受影响。
- `NeumorphismInput` / `NeumorphismTextarea` 容器改 `overflow: clip`（旧浏览器 `hidden` 兜底）并加 `cursor: text`——`clip` 不创建滚动容器，iOS 聚焦子控件时容器不再被 `scrollIntoView` 顶出 1px（圆角处露接缝）；`cursor: text` 让容器按压反馈在 iOS 上可触发。

**安全区（`env(safe-area-inset-*)`）**

库内此前 0 处消费安全区，宿主开 `viewport-fit=cover` 后浮层内容会压进刘海 / Home 指示条：

- Toast：按方位给容器加 `padding-{top,bottom,left,right}: calc(令牌 + env(safe-area-inset-*))`（只按方位加，避免四边都内缩把居中档挤偏）。
- Drawer：四个方位变体分别用 `padding-{left,right,top,bottom}: env(...)`，背景与阴影仍铺满边缘，只有内容内缩。
- Modal：遮罩层加四边安全区 padding，居中容器整体避开刘海与 Home 区。

**滚动与视口**

- Modal：`max-height` 补 `85dvh`（iOS 地址栏收放时 `vh` 取大概率值，弹窗底边会被 URL 栏遮住）；`.nm-modal__body` 加 `overscroll-behavior: contain` + `-webkit-overflow-scrolling: touch`，滚到底不再把滚动链传给背景页。
- Table：`.nm-table__wrapper` 由 `overflow: hidden` 改为横向滚动容器（`overflow-x: auto` + `overscroll-behavior-x: contain`）——此前超宽列被直接裁掉且手指滑不出来，是**永久不可达**而非「暂时看不到」。

**同心圆角（几何关系用 calc 表达）**

内层圆角此前一律取 `--nm-border-radius-sm`(8px)，与外框 + 内边距不成比例（iOS 的连续圆角会把这种偏差放大成明显棱角）：

- `NeumorphismSegmented` 内项：`calc(--nm-border-radius-md - --nm-spacing-2xs)` = 14px
- `NeumorphismSelect` / `NeumorphismAutoComplete` 选项、`NeumorphismMenu` 菜单项：`calc(--nm-border-radius-md - --nm-spacing-xs)` = 12px

**触屏交互**

- `NeumorphismSelect` 触发器补 `:active` 凹陷反馈（触屏没有 hover，此前按下毫无响应）。
- `text-size-adjust` 从 `.nm-root` 扩到全部浮层根（iOS 横屏 text autosizing 会让浮层字号与宿主不一致）。
- `touch-action: manipulation` 从 `a/button/[role=button]` 扩到 `tab/option/menuitem/switch/checkbox/radio` 与组件级触发器（`.nm-select` / `.nm-tree-node` / `.nm-datepicker__trigger` / `.nm-menu__item` / `.nm-segmented__item`），消除 iOS 约 300ms 的双击缩放判定窗口。

**渲染一致性**

- `NeumorphismModal` / `NeumorphismDrawer` / `NeumorphismTable` / `MarkdownRenderer` 的 `backdrop-filter` 补 `-webkit-` 前缀（iOS 15/16 仍需前缀，此前同一套库里「卡片玻璃有模糊、弹窗遮罩没模糊」）。

**工程**

- `scripts/check-styles.mjs` 新增 `stripEnv()`：`env(safe-area-inset-*, 0px)` 的 `0px` 是浏览器兜底值而非间距档位，不再误报（同一行其余间距照常检查）。
- base.css 的作用域规则改用 `:is()` 一次展开，避免「作用域 × 目标」笛卡尔积把产物撑大（naive 展开 49KB → 实际 35.5KB，仍小于改动前的 38.5KB）。

**已知未处理**：Modal 的 body 滚动锁仍依赖 `body { overflow: hidden }`，iOS Safari 对触摸滚动不生效（遮罩下页面仍可拖动）。根治需改为 `position: fixed` 锁滚，但该写法会把 body 变成 fixed 后代的包含块、在页面已滚动时让所有 `position: fixed` 浮层偏移——对宿主风险大于收益，暂不引入。
