# @echolab-auto/ui-frame

## 1.4.0

### Minor Changes

- 4ab0399: 新增 `NeumorphismArt` 试验性动态效果组件：内嵌 canvas 渲染程序化效果，首批内置 `pixel-field`（像素脉冲场）、`particles`（粒子连线星座）、`waves`（流动波浪）、`goo`（融合色团）、`ascii`（字符画，经 `src` 传入图片采样亮度映射字符栅格）五种效果；支持 `reactive` 指针交互、`speed`/`density`/`palette`/`seed` 参数化，颜色默认跟随主题 token；触屏与 `prefers-reduced-motion` 自动降级为静态帧。配套公开 headless `useArtRenderer` 渲染循环与全局配置 `art.*` 段。

  新增 `NeumorphismAsciiArt` 字符画正式组件（Art 试验场 `ascii` 效果的正式化）：经 `src` 传入图片渲染为 ASCII 字符画，保持原图宽高比适配（contain）、亮度直方图拉伸保证对比度，支持 `density` / `reactive` / `speed` 与覆盖层插槽；容器 `width` / `height` 可显式拉伸，`height` 留空时按图片宽高比自适应；`radius` 圆角档位（none/small/medium/large/xl）。

- 39d1a9d: NeumorphismCanvas 新增 `infinite` 无限画布模式：平移 / 缩放为无界虚拟状态（`transform: translate() scale()`），替代原生 overflow 滚动，内容可位于任意（含负）画布坐标。新增 `contentBounds` prop、`canvas.infinite` 全局级联、locale 键 `canvasResetView`，以及 expose 方法 `resetView()` / `panBy()` / `getView()` / `toCanvasCoords()`；infinite 模式下普通滚轮平移、触屏单指拖拽平移，复位按钮与 `0` 键动画回到全部内容视图。默认滚动模式行为不变。
- 4c49001: `NeumorphismCard` 的 `glass` 从布尔开关扩展为**三档玻璃拟态**（与 `NeumorphismButton` 的 `glass` / `glass-raised` 观感对齐）：

  | 档位      | 阴影                                               | 对应按钮变体             |
  | --------- | -------------------------------------------------- | ------------------------ |
  | `float`   | 环境投影（悬浮磨砂，不随 elevation）               | `variant="glass"`        |
  | `raised`  | 新拟态凸起双阴影，强度跟随 `\|elevation\|`         | `variant="glass-raised"` |
  | `pressed` | 新拟态凹陷内阴影，强度跟随 `\|elevation\|`（新增） | —                        |

  向后兼容：`glass: true` 等价 `glass="float"`，类名 `nm-card--glass` 保留，原有观感不变。

  设计要点：玻璃**只替换表面材质**（半透明底 + `backdrop-filter: blur() saturate(1.15)` + `inset 0 0 0 1px` 高光内描边），台阶高度模型仍由 `elevation` 决定，两者正交——`glass="raised" :elevation="3"` 用 12px/28px 双阴影，`elevation="0"` 按 1 级呈现避免"没有体积"，档位定方向、`|elevation|` 定强度。`hoverable` 下按档位分别抬升：`float` 上浮 4px、`raised` 上浮 2px 并加强一档阴影、`pressed` 不位移而是内阴影减弱一档（向表面浮起）。

  其余改进：`isolation: isolate` 让模糊只发生一次（避免嵌套 `backdrop-filter` 层层叠加、糊边且昂贵）；不支持 `backdrop-filter` 时经 `@supports` 退回 94% 不透明表面色保证可读；`glass` 默认值改为 `undefined` 以支持新增的全局配置 `card.glass` 级联；新增导出类型 `CardGlass`。

- 3604e6e: **卡片圆角改为像素值（`radius: number`）**：删除 `'small' | 'medium' | 'large' | 'xl'` 四档文案与换算，`NeumorphismCard` 的 `radius` 直接收数字，就是 `border-radius` 的 px 值。

  ```vue
  <!-- 旧 -->
  <NeumorphismCard radius="large" />
  <!-- 新 -->
  <NeumorphismCard :radius="24" />
  ```

  - 默认值仍是 24（即原来的 `large`，对应 `--nm-border-radius-lg`），所以**不传 `radius` 的卡片外观完全不变**
  - 迁移对照：`small` → `8`、`medium` → `16`、`large` → `24`、`xl` → `32`（就是四个 `--nm-border-radius-*` token 的值）
  - 全局配置同步改数字：`app.use(NeumorphismUI, { card: { radius: 16 } })`（原 `card: { radius: 'medium' }`）
  - 之所以不再做档位：档位只能近似表达设计稿上的具体数值，而设计稿给的是数字；且四档映射到 token、token 是 px，中间多一层反而要记「中档到底是 16 还是 20」
  - 组件把值写到根节点 `--nm-card-radius`，样式侧 `border-radius: var(--nm-card-radius, 24px)` 取用 —— 消费方既可用 prop / 全局配置，也能在样式表里整体覆盖；`squircle` / `clipPath` 读的仍是这个「生效圆角」，角形状与角大小互不干扰
  - 健壮性：负值夹到 0（CSS 不接受负圆角，原先整条声明会被丢弃），`NaN` / 非有限数退回默认 24

  > 破坏性：`radius` 的类型从字符串枚举变成 `number`。旧写法不会报错但会**落到默认 24px**（字符串转数字失败），请按上表改成数字；`radius="0"` 这类字符串同样失效，要写 `:radius="0"`。`NeumorphismAsciiArt` 的 `radius` 是另一套（含 `none`），本次未动。

  顺带修掉两个和「圆角可变」相关的旧问题：

  - **轮廓跟着半径走**：`radius` 变了会重新测量圆角（`watch` + `flush: 'post'`）。此前只有盒子尺寸变化才重测，改半径不触发 —— 档位时代难得踩到，换成滑块实时拖就是「拖了、轮廓不动」
  - **`radius: 0` 能真的变直角**：`measure()` 读到计算圆角为 0 时不再沿用「上一次的非零值」，而是退回组件自己持有的 `radius`。旧缓存是为了防「开启轮廓后 `border-radius` 被强制置 0 → 下次测量把半径算成 0」，现在用 prop 值兜底更准：`0` 是「真的要直角」，不会被历史值劫持

- 60f16fe: `NeumorphismCard` 支持**超椭圆圆角**（`squircle`，可选）+ 自定义轮廓（`clipPath`），并把超椭圆几何内核公开为 `@echolab-auto/ui-frame/utils` 的一组函数。

  **为什么需要**：CSS `border-radius` 只能画**圆弧**，而 iOS 设备屏幕角是超椭圆（连续曲率）。拿圆弧去贴超椭圆，无论半径取多少都会在 45° 附近错位 —— 实测最优半径仍有 2.3px 的间隙波动（肉眼读作「不平行」）。`corner-shape: superellipse()` 能直接画，但 Safari 至今不支持，所以统一走 `clip-path: path()`。

  **卡片的两个新 prop**

  | prop       | 类型                | 说明                                                                                                         |
  | ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
  | `squircle` | `boolean \| number` | `true` = 指数 2.5（iOS 屏角实测 2.42~2.54）；`number` = 自定义指数。默认 `false`（保持圆弧，**零行为变化**） |
  | `clipPath` | `string`            | 任意 `clip-path` 值，优先于 `squircle` 与 `border-radius`。用于「四角不对称」的场景                          |
  - 半径取卡片**当前生效的** `border-radius`（`radius` prop / 全局配置 / 消费方 CSS 覆盖之后的值），所以「角形状」与「角大小」互不干扰；
  - 轮廓生效时 `border-radius` 自动置 0 —— clip 与圆角是**取交集**关系，留着会把超椭圆又裁回圆角矩形；
  - 尺寸变化由 `ResizeObserver` 跟随重算（多行输入把卡片撑高等场景）；
  - 只在开启时才测量与观察，未用的卡片零开销。

  **几何内核**（`@echolab-auto/ui-frame/utils`）

  | 导出                                    | 用途                                                                                                          |
  | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
  | `squirclePoints` / `squircleClipPath`   | 等半径超椭圆闭合轮廓 / 其 `path()` 值                                                                         |
  | `superellipseCorner`                    | 单角超椭圆采样（逐角组装用）                                                                                  |
  | `sampleCornerOffset`                    | 设备屏角超椭圆**沿法线内缩**后的曲线 —— 「元件角与屏幕角等间隙平行」的正确形状（用同族超椭圆近似会偏 2.65px） |
  | `pointsToPathData` / `pointsToClipPath` | 点集 → path data / `path()`                                                                                   |
  | `squirclePower`                         | 指数 → 参数式幂次                                                                                             |

  `sampleCornerOffset` 配 `clipPath` prop 即可实现「下角贴设备屏角、上角自由」这类不对称轮廓（Panel 的会话输入区即此用法）。

- 41cceb3: `NeumorphismChartLine` 的 X 轴标签改为**按可用宽度自动抽稀**：`useLineChart` 新增 `xLabelStride`，按「每约 72px 一个标签」估算可容纳数量（`stride = ceil(点数 / 可容纳数)`），模板只渲染命中项且**位置仍按原始索引计算**，因此标签与数据点严格对齐、末位标签恒显示；`xAxisLabels` 数组本身不裁剪。

  此前 `show-axis` 对时间序列不可用：7 天 × 小时桶 = 168 个标签会完全重叠（消费方只能关掉坐标轴）。实测 793px 宽的图从 168 个标签降到 10 个，首尾为 `10-10 21:00` → `10-17 21:00`，互不重叠。点数不超过可容纳数时 stride 为 1，行为与原实现一致。

- 1034a23: `ChatComposer` 支持**玻璃拟态**与**多档聚焦（选中）特效**：

  - 新增 `glass?: GlassValue` —— 复用共享玻璃档位（与按钮 / 卡片同一套 `float` / `raised` / `pressed`，`true` ≡ `float`）。材质挂在**外壳**上，形成「浮起的玻璃托盘 › 凹陷输入槽」两层结构：外壳吃 `--nm-glass-bg` + `backdrop-filter` + 1px 高光内描边 + `isolation: isolate`（模糊只发生一次），内部 textarea 在玻璃模式下降为 55% 半透明底，让托盘材质透上来（不在 textarea 上再叠一层 backdrop-filter）。不支持 `backdrop-filter` 时 `@supports` 回退为 94% 不透明表面色；禁用态收敛为不透明表面并降透明度，避免"禁用却还在发光"。
  - 新增 `focusEffect?: 'ring' | 'glow' | 'inset' | 'none'`（默认 `'ring'`，**历史视觉零变化**）：
    - `ring`：外侧主色光环（沿用 textarea 自身的 `--focused`）
    - `glow`：**内辉光** —— 主色光从凹槽内部亮起。实现是**独立的 `mix-blend-mode: screen` 加法光层**（`::before`，`z-index: -1` 落在槽背景之上、文字之下），而不是彩色 `box-shadow`：
      - 原因：`box-shadow` 只能做 alpha 合成，**数学上无法提高亮度**。旧实现把主色以 34% 混进中性灰槽面，实测 R −11 / G +16 / B −86、净亮度 ΔL 仅 **+0.2/255** —— 观感是"染色"；再加一条 1px 高饱和内描边收边，一个设备像素内 B 通道跳 **70 级**，读作"霓虹灯管"。
      - 现在：`screen(a,b)=a+b−ab` 只增亮且**不可能溢出**（实测 0 个过曝像素）；双层半径（6px 近核 + 26px 远晕）无硬边（逐像素最大跳变 **1–2 级**），衰减单调到 0。
      - 光色分主题：亮色槽面接近白，可加亮余量只有 ~~12%，主色先与白混合才高于槽面亮度；暗色 headroom 大，直接用纯主色。四个场景（亮/暗 × 玻璃/非玻璃）实测 ΔL：边缘 +24~~+46、带内均值 +14~+27，文字像素**零变化**。
      - 玻璃模式下托盘自身也叠同一套 screen 光层（`::after`），**去掉了原来的 `0 0 0 1px` 外环**（同一个硬边错误的外侧版本）；玻璃档位阴影保持原样。
      - 不支持 `mix-blend-mode` 时（`@supports not`）退回外环指示聚焦，避免 screen 退化成普通叠加而变成污渍。
    - `inset`：纯新拟态语汇，只把凹陷加深到 `7px/14px`，不带彩色
    - `none`：不加装饰（保留输入框自身的基础凹陷加深，避免聚焦完全不可见造成 a11y 退化）
  - 聚焦态由外壳统一跟踪（`focusin` / `focusout`，壳内元素之间转移焦点不算失焦），壳上挂 `--focused` 后由样式分发到各档——因此「光标停在发送钮上」也算输入器正在被使用。
  - 玻璃档位的阴影放进 `--nm-composer-tier-shadow` 自定义属性，使聚焦辉光能在**保留档位物理**（凸起 / 凹陷 / 悬浮投影）的前提下叠加晕层——`box-shadow` 只能整条覆盖，直接写会造成 `pressed` 档聚焦时"弹出来"。

  新增导出类型 `ChatComposerFocusEffect`。example 输入器区块新增「玻璃托盘 + 聚焦特效」演示（玻璃档位 / 聚焦特效 / 预览背景三组可切换），并提供彩色台面以便观察磨砂半透明。

- 22da069: **几何量一律用 px 数字**：把「一个档位只量一个几何量」的 prop 全部改成数字（px），字符串档位降级为 `@deprecated` 别名（按固定映射保留，不破坏既有代码）。

  | 组件                   | prop     | 旧档位 → 新数字                                               | 数字的含义                           |
  | ---------------------- | -------- | ------------------------------------------------------------- | ------------------------------------ |
  | `NeumorphismAsciiArt`  | `radius` | `none`/`small`/`medium`/`large`/`xl` → `0`/`8`/`16`/`24`/`32` | 圆角半径                             |
  | `NeumorphismStatusDot` | `size`   | `small`/`medium`/`large` → `8`/`10`/`12`                      | 圆点直径                             |
  | `NeumorphismModal`     | `size`   | `small`/`medium`/`large` → `400`/`560`/`720`                  | 最大宽度                             |
  | `NeumorphismLogo`      | `size`   | `small`/`medium`/`large` → `120`/`220`/`360`                  | 宽度（`width` 优先）                 |
  | `NeumorphismSpinner`   | `size`   | `small`/`medium`/`large` → `14`/`20`/`28`                     | 直径（原本就收数字，现改为数字优先） |
  - 默认值保持不变（AsciiArt 24 / StatusDot 10 / Modal 560 / Logo 220 / Spinner 20），不传参的渲染与之前逐像素一致
  - 三档 class（`nm-status-dot--large`、`nm-modal--small` 等）随之删除：几何量走内联 px（StatusDot 宽高、Modal `max-width`、AsciiArt `border-radius`）或 CSS 变量（Spinner `--nm-spinner-size`），`Logo` 的字符串档位仍走原 class
  - 数字通道统一加容错：`Number.isFinite` 校验 + 下限夹取（StatusDot ≥4px、Spinner ≥8px、Modal ≥240px、AsciiArt 与 Card 的圆角 ≥0），避免「配置算错 → 元素消失 / 声明失效」
  - 全局配置同步接受数字：`statusDot.size` / `modal.size` / `logo.size` / `spinner.size`

  **哪些没改**：`Button` / `Input` / `Tag` / `Table` 等 `size` 仍是 `'small' | 'medium' | 'large'`。它们的档位**同时**决定字号、内距与控件高度（多个几何量打包成的尺度），单给一个数字要么丢信息、要么得让调用方自己维持多维平衡。判据与理由写进 `document/develop/design-philosophy.md` §七「几何量用数字，尺度用档位」。

- 4c49001: **玻璃拟态档位统一**：按钮与卡片共用同一套档位名 `float` / `raised` / `pressed`（`src/utils/glass.ts` 的 `GlassVariant`），不再各造别名。

  按钮侧**玻璃是 `variant` 的一档，不是独立 prop**：

  - `variant` 现为 `'raised' | 'pressed' | 'primary' | 'glow' | 'glass' | 'glass-raised' | 'glass-pressed'`，新增第三档 `glass-pressed`（磨砂玻璃 + 凹陷内阴影），此前按钮只有悬浮 / 凸起两档
  - 之所以不做成独立 prop：阴影方向只有一条轴（凸 / 凹），玻璃三档同时决定「材质 + 凸凹」，拆成两个 prop 会允许 `variant="pressed"` + 凸起玻璃这类自相矛盾的组合；而且玻璃表面会覆盖 `primary` 的底色，所谓「与 variant 正交」并不成立——「彩色玻璃」只能靠改 `--nm-glass-bg` 得到
  - 三档对应关系：`glass` → 档位 `float`、`glass-raised` → `raised`、`glass-pressed` → `pressed`，均由 `glassClassNames()` 生成 `nm-button--glass` + `nm-button--glass-<档位>` 两个类
  - 全局配置改为 `button.variant: 'glass'`（原 `button.glass` 已移除）；顺带把 `button.variant` 的类型从 `'raised' | 'pressed'` 放开到全部七档，此前无法全局默认 `primary` / `glow`

  > 迁移：按钮上的 `glass` 属性已不存在，`glass="float"` → `variant="glass"`、`glass="raised"` → `variant="glass-raised"`、`glass="pressed"` → `variant="glass-pressed"`。`variant="glass"` / `"glass-raised"` 的写法完全不变。`NeumorphismCard` 与 `ChatComposer` 仍保留 `glass` prop——它们的凸凹由 `elevation` / 无竞争轴承载，玻璃对它们确实是独立的材质维度。

  样式与可用性改进（两组件共用）：

  - 类名拆成「表面 + 档位」两层（`.x--glass` 只放材质、`.x--glass-<档位>` 放阴影），档位阴影用双类选择器（特异性 0,2,0）压过基础变体规则，**不再依赖样式表书写顺序**
  - 1px 亮边由 `border` 改为 `inset 0 0 0 1px` 内描边：贴合圆角、不占布局（顺带消除玻璃按钮/卡片比同类少 2px 内容区的差异）
  - `isolation: isolate` 让 `backdrop-filter` 只在本层发生一次，避免嵌套

- 4c49001: 新增 `NeumorphismGraphView` 实验性节点图组件（Obsidian 风格的力导向图）：自绘 canvas 渲染节点与连线，内置**无第三方依赖**的退火式力学布局（`ForceLayout`，d3-force 同款 alpha 衰减——约 300 帧内铺开并静止，静止后停止帧循环）；支持拖拽节点（临时钉住、松手交还）、拖背景平移、滚轮/双指以指针为锚点缩放、双击节点居中、悬停高亮一度邻居并淡化其余、标签按缩放级别渐显（`auto`/`always`/`hover` 三档），以及键盘操作（方向键切换、Enter 选中、`+/-` 缩放、`0` 适应视图）。

  对外暴露：`nodes`/`links`/`height`/`nodeRadius`/`linkDistance`/`repulsion`/`forceSettings`/`showLabels`/`showControls`/`showLegend`/`highlightNeighbors`/`draggable`/`pannable`/`zoomable`/`autoFit`/`preservePositions`/`ariaLabel`；事件 `node-click`/`node-hover`/`node-dblclick`/`background-click`/`zoom-change`/`layout-start`/`layout-settled`；方法 `fit`/`zoomIn`/`zoomOut`/`resetLayout`/`reheat`/`focusNode`/`getZoom`/`getAlpha`/`getForceSettings`；全局配置 `graph.*` 段与 locale 键 `graphLabel`/`graphZoomIn`/`graphZoomOut`/`graphZoomFit`/`graphRelayout`。

  `forceSettings` 统一承载力学高级旋钮（`spring`/`gravity`/`velocityDecay`/`alphaDecay`/`alphaMin`/`alphaTarget`/`maxSpeed`/`maxRepulsionForce`），优先级为「显式 `linkDistance`/`repulsion` > `forceSettings` > 内置默认」；`getAlpha()` 暴露退火系数（1 → 0，归零即静止）便于外部呈现动力学进度。`ForceLayout.alpha` 改为只读，外部只能通过 `wake`/`reheat`/`setData` 影响温度。

  配色跟随主题 token（按 `group` 分组取色，`data-theme` 切换经 `MutationObserver` 重绘），未给坐标的节点按索引做黄金角螺旋播种（同数据同布局），数据增删按 `id` 复用旧坐标。`ForceLayout`、`DEFAULT_FORCE_SETTINGS` 与几何工具（`fitTransform`/`zoomAt`/`screenToWorld`/`worldToScreen`/`seedPosition`/`boundsOf`/`clampScale`/`distance`/`GOLDEN_ANGLE`）随组件子路径导出，可做自定义渲染。example 组件展示页「扩展」分组新增「节点图 GraphView」演示（29 节点 / 44 连线知识库示例），带覆盖**全部关键参数**的调参面板：`nodeRadius`/`linkDistance`/`repulsion`/`height`、7 个力学旋钮（`spring`/`gravity`/`velocityDecay`/`maxSpeed`/`alphaDecay`/`alphaMin`/`maxRepulsionForce`）、9 个开关类 props（标签策略/图例/控件/高亮邻居/拖拽/平移/缩放/autoFit/preservePositions），以及适应视图 / 重新布局 / 重新唤醒 / ±节点（演示增量数据）/ 恢复默认，并实时显示 `alpha` 读数。

- 4b0d14d: 新增 `NeumorphismIcon` 图标组件与 `icons` 子路径，并在图标体系上做了三处规范修复（Design Philosophy §8）。

  **图标注册表（新增 `@echolab-auto/ui-frame/icons` 子路径）**：`ICON_REGISTRY` 集中定义 79 个语义图标（导航 / 状态 / 文件 / 操作 / 数据 / 消息与智能 / 画布 / 文档与编辑八组），24 基准 viewBox、线框单色；同时导出 `ICON_NAMES`、`ICON_SIZE_PX`、`ICON_SIZE_ALLOWED`、`ICON_STROKE_ALLOWED`、`defaultStrokeWidth()`。子路径独立打包（`dist/icons/index.js`），只装图标表、不拖整包。此前库内 **31 个组件各自内联 75 个 `<svg>`**，同一几何反复重写（`close` 9 处、`chevron-down` 5 处、`chevron-right` 3 处、`check` 2 处、spinner 弧 2 处）——规范只能被"检查"不能被"复用"，也是消费方被迫自建图标体系的根因。

  **`NeumorphismIcon` 组件**：`name` / `size`（七档 `xs`12 `sm`14 `md`16 `lg`18 `xl`20 `2xl`24 `3xl`32，或数字直传）/ `strokeWidth`（可选覆盖）/ `spin` / `pulse` / `label`。线宽按显示尺寸自动取档（≤12 → `2.5` 微图标补偿；≥24 → `1.5` 大图标轻描；其余 `2`）；`spin` / `pulse` 两个布尔动效（`transform-box: view-box` 锁定旋转中心，`prefers-reduced-motion` 下停用）；`label` 有值时 `role="img"` + `aria-label`，留空则 `aria-hidden`。

  **`NeumorphismThemeToggle` 两处修复**：① 三态图标统一为线框——此前 `light` 是「实心圆 + 线框射线」、`auto` 纯线框、`dark` 纯实心块，切换主题时"实心↔线框"跳变；现三态均走 `NeumorphismIcon`（`sun` / `monitor` / `moon`）。② 激活态去掉 `scale(1.1)`：该缩放让 14px 图标实测渲染 **18.86px**（+35%），脱离 §8 枚举档且比相邻按钮明显更大更粗；现仅保留 `rotate(15deg)`。图标档位随 `size`：`small` → 14、`medium`/`large` → 18。

  **`NeumorphismCheckbox` 图标尺寸改枚举档**：勾选图标此前用 `width: 65%` 随 box 缩放，实测 **11.7 / 15.6 / 19.5px**（small/medium/large），三档全部落在枚举档之外。现显式取 `--nm-icon-size-xs` / `-sm` / `-md`（12 / 14 / 16），视觉占比 67% / 58% / 53%，观感与旧版一致但尺寸可枚举、可被校验。

  **防回归**：新增 `npm run check:icons`（`scripts/check-icons.mjs`）——校验注册表 path 语法、组件内 `<svg>` 尺寸与 `stroke-width` 是否在枚举档、图标容器的百分比尺寸、以及模板里用 emoji/符号充当控件图标。与 `check:registry` / `check:styles` 同级。

- e243d21: 新增 `NeumorphismPixelFont` 像素字体组件：内嵌 **termsyn 6x11** 位图字体（stlarch 作，基于 Terminus 与 Tamsyn 的 GPL-2 位图字体；由 PCF 位图重建为像素轮廓 woff2，字形与原始位图逐像素一致（字母 `I` 的步进按片头样张收紧为 4px、粗体 5px，两侧字距与其余字母一致），含 400 / 700 双字重），按 `11px × scale` 整数倍缩放渲染文本、保持像素网格锐利。支持 `text`（`\n` 多行、空白按字符栅格保留）、`scale`（自动取整、下限 1）、`cursor`（闪烁块光标，`prefers-reduced-motion` 下停闪常亮）、`align`、`ariaLabel`；字号公式与光标尺寸经 CSS 变量下传，字距 / 行高 / 字重合成为像素保真固定值。`@font-face` 随组件样式注册（字族名 `'Termsyn 6x11'`），业务代码可直接复用该字族渲染任意文本。
- 1d91126: `/chat` 模块收敛为纯原子层：移除组装件 `ChatBubble` 与 `ChatTray`（及其全部
  CSS 与配套测试），模块只保留真正单一职责的原子 `ChatComposer` /
  `ChatFold` / `ChatCopyButton`。

  这两个组装件把「角色→样式映射 + 行为 + 语义」烘进壳里（ChatBubble 的
  align×tone 对齐/色调矩阵 + 头部槽 + 悬停复制；ChatTray 的托盘视觉 + 吸底
  行为 + 跳转钮 + a11y 壳），属产品语义——已按宿主职责解散：

  - **气泡壳样式 / 角色映射** → 宿主 CSS（`examples/pages/ChatPage.vue` 2026-10-13
    起即"原子组装参考实现"）；复制按钮 → `ChatCopyButton`（本模块保留）；
  - **吸底滚动** → headless composable `useChatScroll`（本库保留）；跳转钮 →
    宿主用基础组件（`NeumorphismButton`）+ `showJumpButton` 信号自组；
  - **托盘视觉（凹陷井 / 跳转钮阴影）** → 宿主 CSS 消费 `--nm-chat-*` token
    （本库保留）。

  数据契约 `ChatMessage` 等类型、`chatJumpToBottom` 等 locale 键继续保留。
  迁移参考：`EchoAgentPanel` 与 `examples/pages/ChatPage.vue`（均以原子自组）。

- 1bc419f: `/chat` 模块收敛为纯元组件：移除组合组件 `ChatMessageList` / `ChatMessageItem` / `ChatToolCallBlock` / `ChatReasoningBlock` / `ChatBranchMergeBlock` 与 `componentCategories` 导出。聊天场景的组合（消息行、工具/推理/分支块）属产品侧语义，由宿主用保留的机制原语（`ChatBubble` / `ChatTray` / `ChatFold` / `ChatComposer` / `ChatCopyButton`）自行组装；模块保留 `types.ts` 的 `ChatMessage` 数据契约。迁移参考：EchoAgentPanel 以 `ChatBubble` + doc 模块 `MarkdownRenderer` 自组消息行（2026-09-30）。
- 0037b69: **尺寸全面数字化：`size` 收数字（px），三档字符串降级为兼容别名**

  所有几何量 prop 现在都接受数字，语义统一为「该组件的**主几何量** px」；字符串档位（`'small' | 'medium' | 'large'`）保留可用但标 `@deprecated`，等价于三个锚点数字。

  ```vue
  <!-- 旧（仍可用，但已弃用） -->
  <NeumorphismButton size="small" />
  <!-- 新 -->
  <NeumorphismButton :size="32" />
  <!-- 锚点之间也行（以前做不到） -->
  <NeumorphismButton :size="38" />
  ```

  | 主几何量 | 组件                                                                                                                                                                       | 数字含义          |
  | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
  | 最小高度 | Button / Input / Textarea / Select / AutoComplete / DatePicker / InputNumber（共 `--nm-field-*`）/ Segmented / Upload                                                      | 控件最小高度      |
  | 字号     | Tag / Alert / Breadcrumb / List / Tabs / Collapse / Menu / NavMenu                                                                                                         | 正文字号          |
  | 密度     | Table（单元格上下内距）/ Pagination（页码按钮高）                                                                                                                          | 行密度 / 按钮尺寸 |
  | 独立几何 | Avatar（直径）/ Empty（插图边长）/ Steps（序号圆直径）/ Checkbox（勾选框边长）/ Radio（圆点直径）/ Slider（轨道粗细）/ Progress（线形条厚度）/ ThemeToggle（内层上下内距） | 见左              |

  **其余几何量按三锚点分段线性插值**（`src/utils/controlScale.ts`）：

  - **主几何量原样采信**：`:size="28"` 就是 28px，不会被锚点夹成 32px
  - 落在锚点 → 与该档**逐像素一致**：`:size="32"` 与 `size="small"` 渲染相同（有测试守着）
  - 落在两锚之间 → 派生量线性过渡：`:size="38"` → 38px 高、13.5px 字号、10px / 20px 内距
  - 派生量超出两端 → 取端点值，不外推（`:size="80"` 高度照传 80px，字号停在 16px）
  - 0 / 负数 / NaN → 回落 medium 锚点（负内距、0 尺寸会让控件消失，不该由调用方 debug）

  为什么不用「相对 medium 的倍率」：三档锚点并不等比（按钮高 32/44/56 = 1 : 1.375 : 1.75，字号 13/14/16 = 1 : 1.077 : 1.231），按倍率缩放会让同一几何量出现两套结果。

  实现约定：

  - 锚点表集中 `src/utils/controlScales.ts`，与 `styles/tokens.scss` 的组件 token 一一对应，`controlScale.test.ts` 解析 token 源文件逐个核对（防漂移）
  - 组件 CSS 只新增一条 `.x--sized` 规则把 `--nm-x-sz-*` 接到实际声明，**三档 class 一行未改**，数字路径与档位路径互不覆盖
  - 全局配置同样接受数字：`app.use(NeumorphismUI, { button: { size: 40 } })`

  > 破坏性：`size` 的 TS 类型从字符串枚举变成 `number | 枚举`。既有 `size="small"` 写法不受影响（别名仍在），但**语义上已弃用**，建议迁移到数字。`document/develop/design-philosophy.md` §七 已改写为「数字是一等公民」，废弃了此前「三档负责跨组件对齐」的说法。

- dfb794c: `NeumorphismSwitch` 新增 `variant="power"` 电力开关变体：器件质感的「整径扳动」开关——金属外圈 + 凹陷内腔 + 带拉丝纹理的圆形旋钮。通电时橙色面自左擦入、旋钮整径滑到右端（半透明叠于通电面）、指示点与指示条换位、刻印文本（可选传入）闪烁后定格为通电色（`0.55s` 延迟 `0.35s`，断电回闪 `0.6s` 延迟 `0.1s`，曲线 `cubic-bezier(0.46, 0.03, 0.52, 0.96)`）。几何按 171u × 91u 设计稿逐帧还原，全部尺寸随设计单位 `u` 缩放（`u = 器件高 / 91`）；`size` 为数字（px 高度），连续无级——power 变体驱动器件高（默认 91px）、default 变体驱动轨道高（默认 30px），8px 下限保护，支持全局配置 `switch.size`（数字）/ `switch.variant` 级联；旧字符串档位（`'small' | 'medium' | 'large'`）保留为**已弃用兼容别名**（映射 24 / 30 / 36px，与 1.3.2 轨道高一致），既有用法无中断，新代码请传数字。圆钮拉丝纹理在器件高低于 34px 后冻结缩放——纹理始终保留、图案周期恒定于 34px 对应值（约 1.49px），不再随尺寸缩小加深亚像素摩尔纹；刻印文本为可选传入（未传不渲染，高度 < 36px 时自动隐藏）；颜色全部走 `--nm-switch-power-*` token（亮/暗两套，通电面为器件光源两主题保持常亮）；`activeColor` 可覆盖通电色，`inactiveColor` 可覆盖内腔底色。无障碍：复用 `role="switch"` + `aria-checked`、locale `switchToggle` 兜底名称、键盘空格切换、外圈键盘焦点环、`prefers-reduced-motion` 降级（状态瞬时呈现）；点击任意部位均可切换。逐帧对齐视频参考：同规格下采样对比整体平均通道差 < 8/255（残差为拉丝纹理相位与亚像素边缘）。

  配套：示例站点在「开关 Switch」演示卡内新增 power 变体演示；组件总览 / API / Agent 指南随变体说明同步（组件总数保持 62 个）。

### Patch Changes

- d418648: 修复 NeumorphismCard 内边距级联泄漏：padding 规则由后代选择器改为子选择器，外层普通卡片不再向内层卡片（含 `no-padding` 卡片）泄漏 24px 内边距。DocTocNav 目录框新增默认内边距 24px（`--nm-spacing-lg`），原先 example 页恰好由该泄漏提供，现由组件自身保证，视觉不变。
- b4b69eb: 修复图表组件全局配置级联失效：`useLineChart` / `usePieChart` / `useBarChart` 在解构 options 时直接给默认值（如 `curve = 'smooth'`），导致 `chart.line.*` / `chart.pie.*` / `chart.bar.*` 配置段永远轮不到；现改为「显式 prop/options > 全局配置 > 内置兜底」三级解析。`useCandlestickChart` 的 `showVolume` / `showMA` 接入 `chart.candlestick.*` 级联，`maPeriods` 不再被组件 `withDefaults` 的 `[5, 10, 20]` 截断。`chart.colorPalette` 接入 Pie 调色板级联（显式 `colorPalette` > 全局配置 > 主题 token）。NeumorphismChartBar 新增 `orientation` / `stacked` / `barGap` props 以打通显式层。未传 prop 且无全局配置时渲染结果与之前完全一致。
- b4b69eb: 修复三项组件缺陷：

  1. **NeumorphismInputNumber size 级联读错配置段**：全局配置类型新增独立 `inputNumber?: { size }` 段，组件由误读 `config.input?.size` 改为读 `config.inputNumber?.size`，级联优先级保持「显式 prop > 全局配置 > 内置兜底」，与 Input 的 `input` 段互不影响。
  2. **NeumorphismThemeToggle 标签隐藏未走级联值**：文字标签显隐由原始 prop `size !== 'small'` 改为级联后的 `resolvedSize !== 'small'`，全局配置 `themeToggle.size: 'small'` 现在同样只显示图标。
  3. **NeumorphismDivider 的 inset 死 prop**：组件内置 `.nm-divider--inset` 样式——水平分割线左右各让出 `--nm-spacing-lg`（宽度改回 auto 避免溢出），垂直分割线上下各让出 `--nm-spacing-lg`。

- b4b69eb: 修复三处表单/导航组件的声明与渲染脱节：

  - **NeumorphismDatePicker**：`name` prop 此前声明后未使用，现渲染 hidden input 携带格式化日期串参与原生表单提交（无值提交空串）。
  - **NeumorphismPagination**：`totalLabel` 此前声明后未使用，现作为总数文案模板的覆盖项生效（支持 `{total}` 占位符），未传入时仍走 locale `paginationTotal`，行为向后兼容；跳页器硬编码的「跳至 / 页」提取为 locale 键 `paginationJumper`（zh-CN `跳至 {input} 页` / en-US `Go to {input}`），组件按 `{input}` 占位符拆分为输入框前后两段。
  - **NeumorphismTabs**：`TabItem.icon` 此前仅保留在类型上，现在 tab 按钮 label 前渲染（emoji/文本字符，`nm-tabs__tab-icon`，`aria-hidden`）。

- 6967716: iOS Safari（iPhone / iPad）适配加固 —— 修复真机上「输入框圆角/对齐跟设计对不上」「浮层被刘海压住」「宽表列点不到」三类问题：

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

## Unreleased

### Patch Changes

- 浮层统一 teleport 到 body：NeumorphismTooltip 内容改为 teleport + `position: fixed`（沿用 `useFloatingPosition` rAF 追踪、方位类与 `aria-describedby` 关联不变），不再被祖先 `overflow: hidden` 裁剪；NeumorphismMenu 水平模式一级子菜单同样 teleport 到 body 并固定定位跟随触发项（rAF 逐帧追踪，二级子菜单留在浮层内维持原模型，hover/键盘交互不变）。
- NeumorphismDropdown 的下拉经 NeumorphismPopover 的 teleport 浮层（fixed + 边界翻转 + 点击外部关闭）渲染，补回归测试；NeumorphismNavMenu 水平下拉同样经 Popover teleport（补测试锁定），垂直子菜单维持内联。
- 暗色主题补语义色：`--nm-color-success / error / warning / info` 在 `[data-theme='dark']` / `.nm-theme-dark` 下改为提亮值 `#3fb950 / #f85149 / #d29922 / #58a6ff`（暗底对比度 ≥ 5:1），修正暗色下语义色不换的问题。
- NeumorphismTextarea 移除 hover / focused 的 1px `translateY` 抬升，仅保留凹陷阴影与外环过渡——容器 `transform` 会让大段文本拖选每帧走「变换文本层」慢路径（下游实测卡顿）。
- 文档：interaction.md 浮层章节更新为「全部浮层 teleport 到 body」并新增宿主 z-index `0–99` 保留约定；tooltip.md 同步 teleport/定位策略描述。

## 1.3.2-dev.4

### Patch Changes

- NeumorphismCard 布局透传契约补充与固化：`class`/`style`/`attrs` 透传根节点、内部结构（`.nm-card__body` 等）为稳定锚点——父级容器可经自定义类为卡片施加 flex 高度分配、网格等任意布局；卡片自身不内置布局模式（防回流守卫）。运行时行为相对 dev.3 无变化，补契约测试。

## 1.3.2-dev.3

### Minor Changes

- NeumorphismCanvas 新增 `infinite` 无限画布模式（支持 `canvas.infinite` 全局级联）：平移 / 缩放改为无界虚拟状态 `(panX, panY, zoom)`，经 `transform: translate() scale()` 应用，替代原生 overflow 滚动——画布四向无边界，内容可位于任意（含负）画布坐标。配套：`contentBounds` prop（`fit()`/`resetView()` 的包围盒依据，缺省测量 slot 子元素）；普通滚轮 / 触控板双指平移、触屏单指拖拽平移（pointer events）；网格挂视口随平移无限延伸；复位按钮与 `0` 键在 infinite 模式下为「复位视图」（动画回到全部内容适配居中，新增 locale 键 `canvasResetView`）。新增 expose：`resetView()`、`panBy(dx, dy)`、`getView()`、`toCanvasCoords(cx, cy)`。默认滚动模式行为与对外 API 完全不变。

## 1.3.2-dev.2

### Patch Changes

- 七处组件 bug 修复：InputNumber 独立 `inputNumber` 配置段（不再错读 input 段）；ThemeToggle 文字标签隐藏改走级联值；Divider `inset` 实现内缩样式；DatePicker `name` 经 hidden input 透传；Pagination `totalLabel` 支持 `{total}` 占位覆盖、跳页器文案提取为 locale 键 `paginationJumper`；Tabs 渲染 `TabItem.icon`；图表修复级联死代码（`chart.line/pie/bar` 与 K 线 `showVolume`/`showMA`/`maPeriods` 恢复生效，ChartBar 补齐 `orientation`/`stacked`/`barGap` props，`chart.colorPalette` 接入 Pie）。

## 1.3.2-dev.1

### Patch Changes

- 修复 NeumorphismCard 内边距级联泄漏：padding 规则由后代选择器改为子选择器，外层普通卡片不再向内层卡片（含 `no-padding` 卡片）泄漏 24px 内边距。DocTocNav 目录框新增默认内边距 24px（`--nm-spacing-lg`），原先 example 页恰好由该泄漏提供，现由组件自身保证，视觉不变。

## 1.3.2-dev.0

### Patch Changes

- 修复测试工具在 vitest 4.1.11 下的声明发射失败（TS2742）：观察器 mock 工厂函数显式标注可移植的 `Mock` 返回类型。无运行时与对外 API 变更。

## 1.3.2

### Patch Changes

- 开发依赖范围内更新（eslint / eslint-plugin-vue 10.10、prettier 3.9.6、vitest 4.1.11、@vue/test-utils 2.5、sass 1.104、marked 18.0.11、@commitlint 21.2.2 等）；源码与文档格式化对齐 prettier 3.9 联合类型新规则。无运行时与对外 API 变更。

## 1.3.1

### Patch Changes

- 组件按「基础组件 / 组合组件」两类分层落地：doc、chat 模块迁入 `src/composites/`，`src/components/` 仅保留基础组件；各 barrel 导出增加 `@category` 标记，组合组件模块新增 `componentCategories` 分类元数据导出。对外 API（含 `@echolab-auto/ui-frame/doc`、`/chat` 子路径）无变化。

  文档：新增 Doc 文档组件详解（含侧边栏文档树渲染规则与排版逻辑）；组件总览重构为基础/组合两段式分类并补充定义；API 参考补全 DocFlowCanvas、MarkdownRenderer `flowEditable`/`flowNodeMove`、MarkdownEditor `autoSave` 与 useDocLayout 搜索/hash 同步等缺漏。

## 1.3.0

### Minor Changes

- Button 变体收敛与扩展：移除 `flat`（与 `raised` 物理同构、仅高度低一档，原 `variant="flat"` 请改用默认 `raised`）；新增 `glass`（悬浮磨砂玻璃）与 `glass-raised`（凸面磨砂玻璃）变体，复用 `--nm-glass-*` token，亮/暗主题与 reduced-motion 全覆盖。DocViewer 视图切换激活态改用 `pressed` 表达「已按下」语义。

### Patch Changes

- 修复 doc 模块 mermaid 渲染：改用 `data-mermaid` 属性中的解码图源逐图调用 `mermaid.render`，不再把展示用的 `<pre><code>` 包装标签喂给解析器；单图失败保留原文回退，不影响其他图。

## 1.2.0

### Minor Changes

- 4f48c32: feat(canvas): NeumorphismCanvas 交互与视觉全面升级
  - 新增拖拽平移(鼠标拖拽、空格+拖拽;触屏走原生滚动),`panOnDrag` 可关闭
  - 新增 Ctrl/⌘+滚轮缩放至光标位置,按钮缩放锚定视口中心,`wheelZoom` 可关闭
  - 修复缩放后滚动范围不随缩放级别更新的缺陷(新增 sizer 测量层 + ResizeObserver)
  - 新增适应屏幕(fit)、全屏切换按钮,`showFit` / `showFullscreen` 可分别隐藏
  - 新增键盘导航:视口聚焦后方向键平移(Shift 加速)、`+`/`-` 缩放、`0` 重置
  - 新增 `gridVariant`(dots/lines)网格变体,纳入全局配置 `canvas.gridVariant`
  - 网格点颜色改用专用 token `--nm-canvas-grid-color`,双主题下更柔和
  - 控制条重构为底部居中浮动 pill;顶部工具栏仅在传入 `toolbar` 插槽时渲染
  - 缩放改为混合受控:无 v-model 时组件内部自维护,有 v-model 时行为不变
  - 新增 `defineExpose`:`zoomIn` / `zoomOut` / `resetZoom` / `fit` / `toggleFullscreen`
  - 新增 locale 键:canvasZoomFit、canvasFullscreen、canvasExitFullscreen、canvasLabel

- 769a647: feat(chat): 新增 chat 聊天面板领域模块与状态反馈组件
  - 新增子路径模块 `@echolab-auto/ui-frame/chat`，分两层架构：
    - **元组件（纯 UI 原语，零领域类型、插槽驱动）**：`ChatBubble`（对齐/色调/悬停复制）、`ChatTray`（凹陷托盘 + 吸底跟随 + 回到底部）、`ChatFold`（折叠块：受控/非受控、凹陷/凸起、head/actions/subhead 插槽）、`ChatComposer`（Enter 发送 / Shift+Enter 换行 / IME 组合安全）、`ChatCopyButton`
    - **组合组件（ChatMessage 数据驱动，由元组件拼成）**：`ChatMessageList`、`ChatMessageItem`（用户居右主色 / Agent 居左 Markdown / 系统居中细线 / 工具 / 分支合并五种形态）、`ChatToolCallBlock`、`ChatReasoningBlock`、`ChatBranchMergeBlock`
  - 新增通用组件：`NeumorphismStatusDot`（online/offline/busy/connecting，过渡态呼吸脉冲）、`NeumorphismSpinner`（档位或像素尺寸）、`NeumorphismSegmented`（radiogroup 语义 + roving tabindex 键盘导航）
  - 新增 headless composables：`useClipboard`（复制 + 状态自动复位）、`useChatScroll`（吸底跟随）、`useChatInput`（IME 安全提交）、`useSegmented`
  - 新增全局配置段：`chat`（markdown/autoScroll/scrollThreshold）、`statusDot`、`spinner`、`segmented`
  - 新增 locale 键（zh-CN / en-US）：statusDot\*、spinnerLoading、segmentedLabel、chat\*
  - 新增设计 token：`--nm-chat-user-bg` / `--nm-chat-agent-bg` / `--nm-chat-system-color` / `--nm-chat-sunk-bg` / `--nm-chat-tray-bg`（亮暗双主题，凹陷色深于所在表面，符合物理隐喻）
  - 示例站点新增「聊天组件」页（会话窗口 + 元组件自定义组装演示）；组件总览新增 StatusDot / Spinner / Segmented 演示

  doc 模块同步完成元组件拆分：
  - 新增元组件 `DocCodeBlock`（语法高亮 + 行号 + useClipboard 复制）与 `DocTocNav`（层级折叠 + 激活高亮 + 祖先自动展开，framed 可关）
  - 新增 headless composables：`useMarkdownToc`（heading 提取 + 层级树 + 实例级唯一 id）、`useScrollSpy`（IntersectionObserver 滚动侦测 + 点击导航锁定）
  - 新增 `highlightCode` 共享高亮模块：修复正则高亮的两个既有缺陷——插入的 span 标记被后续词法轮次破坏（如注释 span 的 class 被 keyword 命中），以及字符串中的 `#`/`//` 被注释正则吞并导致引号实体配对破坏（两遍式占位符保护 + 字符串优先于注释）
  - `MarkdownRenderer` 重构为薄组合：渲染管线 + mermaid + 流程画布/代码块挂载（占位 → 子树，登记制卸载），TOC/scroll-spy/代码块全部委托元组件与 composable，DOM 结构与行为零回归（既有 94 个集成测试全过）
  - 组件总览新增「文档元组件」分节；locale 新增 `markdownCodeCopy` 键

  fix: 评审发现的十一项缺陷全部修复
  - highlightCode：注释正则按语言族分发（SQL 风格 `--` 不再吞并 JS 自减 `i--` 与 CSS 自定义属性）
  - MarkdownRenderer 挂载管线保活：v-html 全量替换时同源子树根节点整体迁移认领（流式更新不再重建，复制反馈/滚动位置保留），无人认领才卸载
  - renderer.listitem 修复行内解析：改用 tokens 块级解析（列表项内加粗/行内代码/链接/任务列表生效）
  - DocFlowCanvas 拖拽管线：预览不再触发 fit（消除每帧重排与 scale 过期发散）；pointercancel 丢弃拖拽；箭头 marker id 实例唯一（多画布共存不失引用）；suppressClick 松手兜底清除（不再吞点击）；onBeforeUnmount 清理 window 监听与挂起 rAF
  - flow-layout：通道边安全间隙按整列/整行内容带计算（修复宽兄弟节点穿边）；BT/RL 回边与跨层边从流向端边出线（镜像语义修正）
  - writeFlowNodePosition：CRLF 归一化比较（Windows 文档拖拽写回不再静默失败）；新增 blockIndex 按序定位（重复块场景），flowNodeMove 载荷携带 blockIndex
  - useScrollSpy：header ResizeObserver 高度未变时跳过重建（消除初始通知自旋）
  - useChatScroll：跟随判定改用增长前贴底态（长流式回复不再脱随）+ 程序化滚动防闪烁
  - useSegmented：roving tabindex 初始落点/点击同步/焦点移动/收缩钳制四项 a11y 修复
  - DocTocNav：collapsedGroups 支持受控共享（桌面侧栏与移动端抽屉状态一致）

## 1.1.1

### Minor Changes

- ProDoc 画布文档：新增 `prodoc-flow` 流程图语法（方向/四形状/边标签/链式/文档链接/容错），`flow-parser`/`flow-layout`（零依赖分层 DAG 布局）/`flow-graph` 纯逻辑层，`DocFlowCanvas` 只读流程画布组件；MarkdownRenderer 集成 `prodoc-flow` 交互画布（修复首挂载后处理不触发、DOMPurify mXSS 规则剥除含 `-->` 的 data-\* 属性两个存量缺陷）；DocViewer 新增「文档/画布」视图切换——显式流程优先、子文档自动层级地图、点击钻取从抽象到具体
- Slider 拖动丝滑优化：轨道填充拖动即时跟随（消除 300ms 橡皮筋滞后）、拖动开始缓存轨道几何消除逐帧强制同步布局、pointermove 经 rAF 合并对齐刷新率、`change` 事件对齐原生提交语义（松手/键盘一次）、小数 step 浮点噪声与粗 step 越界修复

### Patch Changes

- Select outlined 逐帧检查四缺陷修复：定位引擎新增 `lockPlacement`（修复展开中途方向翻转闪烁）、下拉 padding 细条残留改伪元素占位、多选 4px 接缝（盒级 row-gap 历史残留）、tags 区 `@mousedown.prevent` 导致焦点未就位时外部点击不关闭（document 捕获 pointerdown 兜底，default 变体同病）
- InputNumber 逐帧检查四缺陷修复：焦点外环被 body overflow 裁剪只剩残影（移至 body 层整圈）、到达 min/max 按钮无禁用态、未设 min 时点击 +/- 产出 NaN 并永久卡死（步进原点与空值基值修复，对齐原生 stepUp/stepDown）、长按不连续步进（400ms 后 80ms 间隔重复）

## 1.1.0

### Minor Changes

- e0d6066: 修复级联配置全库失效（withDefaults 遮蔽 + 五个死配置段），全局配置真正生效；Select 新增 outlined 单盒变体与多选/可搜索/分组能力；统一浮层定位引擎 useFloatingPosition（修复嵌套滚动脱节）；级联配置段补全（alert/menu/popover 等七段）；无障碍门槛修复（DatePicker 键盘可达、Menu 焦点圈、Switch/Slider 可访问名称）；CSS 硬编码全面 Token 化；构建修复 sideEffects 样式契约失效；新增 useScrollbar/useChartInteraction/useProgress/useFloatingPosition 公共 composable；测试补齐（图表数学/零测试组件/axe-core 自动化回归）并接通覆盖率门禁；Changesets 发布流水线与全量载荷体积预算。

### Patch Changes

- 20f602c: 初始化项目工具链配置，包括 package.json 增强导出、changeset 脚本和其他开发体验优化。
