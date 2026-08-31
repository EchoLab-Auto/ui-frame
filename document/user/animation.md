---
id: animation
title: '动画效果'
x: 1709
y: 400
group: 使用
---

# 动画效果

> 本文档介绍 `@echolab-auto/ui-frame` 的动画体系：新拟态的「动画」不是位移与缩放，而是**材质高度的变化**——阴影层级是动画的主要载体。所有效果均在亮/暗双主题下可用，并遵循 `prefers-reduced-motion` 降级。

---

## 一、台阶高度模型（动画的物理基础）

组件的立体感来自统一的三层阴影叠加，随 `elevation`（-4 ~ 4）分级：

| 层级                | 作用                               | 实现                                                               |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| 环境遮挡（ambient） | 物体整体「挡住环境光」的柔和投影   | `--nm-shadow-ambient-*` 六级透明度（暗色主题下更强，以维持浮雕感） |
| 定向阴影（dark）    | 假设光源在左上，向右下投射的暗阴影 | `--nm-shadow-dark` 及其 `-strong` / `-deep` 变体                   |
| 边缘高光（light）   | 左上边缘被光源直接照亮的亮边       | `--nm-shadow-light`（负偏移 rim highlight）                        |

- **凸起**（`elevation > 0`）：三层外阴影，级数 1→4 对应定向阴影 4px/10px → 16px/36px
- **凹陷**（`elevation < 0`）：双层 `inset` 阴影，背景切换为 `--nm-surface-raised`
- **平齐**（`elevation = 0`）：无阴影，背景为 `--nm-bg-color`

相关 mixin（`src/styles/variables.scss`）：`nm-raised` / `nm-inset`（经典双层）、`nm-raised-3l` / `nm-inset-3l`（三层）、`nm-hover-lift`（hover 上浮 2px + 阴影加强）、`nm-active-press`（按下 1px + 凹陷）。

---

## 二、缓动曲线

全局七条物理缓动曲线（SCSS 变量，`src/styles/variables.scss`）：

| 曲线                  | 数值                                      | 气质               | 典型用途                                  |
| --------------------- | ----------------------------------------- | ------------------ | ----------------------------------------- |
| `$nm-ease-spring`     | `cubic-bezier(0.34, 1.56, 0.64, 1)`       | 弹簧 + 超调        | 按钮 hover、卡片、Modal/Drawer/Toast 入场 |
| `$nm-ease-compress`   | `cubic-bezier(0, 0, 0, 1)`                | 快速压缩、无超调   | active/pressed 按下态（更直接的触感）     |
| `$nm-ease-ambient`    | `cubic-bezier(0.4, 0, 0.2, 1)`            | 平滑环境过渡       | 颜色、阴影等背景性变化                    |
| `$nm-ease-bounce`     | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | 柔和回弹           | Steps 激活、Checkbox 勾选、Badge 弹出     |
| `$nm-ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)`              | 减速               | 元素进入                                  |
| `$nm-ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)`              | 加速               | 元素退出                                  |
| `$nm-ease-pull`       | `cubic-bezier(0.22, 1, 0.36, 1)`          | 快速抽出、柔和落位 | Select 连体下拉面板揭示                   |

组件级变体：Switch 与 Slider 使用超调更克制的 `cubic-bezier(0.34, 1.1, 0.64, 1)` 弹簧。

**方向性时长不对称**是全库统一规律：

- 入场 0.3–0.4s（spring / decelerate），退场 0.15–0.25s（accelerate）——进来从容，离开干脆
- 按下（active）一律切到 0.1–0.15s compress——即时触感，不等弹簧

全局时长 token：`--nm-transition-fast`（0.2s）、`--nm-transition-normal`（0.35s spring）、`--nm-transition-slow`（0.5s，主题切换专用）。

---

## 三、悬停动效：bulge 与 sink

`NeumorphismCard` 的 `hoverable` prop 接受 `true` / `'bulge'` / `'sink'`，悬停时临时平移台阶高度 ±2：

- **bulge（膨胀）**：凸起卡更凸（1→3、2→4，封顶 4）；凹陷卡向表面回退（-4→-2、-3→-1）；浅凹陷（-1/-2）回到平齐；平齐卡升为凸起 2 级
- **sink（下沉）**：镜像操作——凹陷更凹、凸起回退、平齐卡压为凹陷 2 级
- **永不跨越零点**：悬停只改变高度幅度，不反转凸/凹属性（物理上，卡片不会因为悬停而从凸变凹）
- **背景色同步**：跨越台阶级别时背景色在 `--nm-surface-color` / `--nm-bg-color` / `--nm-surface-raised` 间同步切换，保证阴影隐喻与表面材质一致
- bulge 附带 `scale(1.015)`，sink 附带 `scale(0.985)`；过渡 0.4s spring

```vue
<NeumorphismCard :elevation="2" hoverable="bulge">悬停时我更凸</NeumorphismCard>
```

两条通用规则：

1. **触屏门控**：所有位移类 hover 包在 `@media (hover: hover)` 内，触屏设备不触发悬停位移；触屏命中区域最小 44px
2. **阴影即动画载体**：hover/active 主要改变 box-shadow 层级而非位移，符合「材质高度变化」的隐喻

---

## 四、按钮六变体的交互物理

`NeumorphismButton` 的每个 variant 有独立的 hover/active 行为：

| variant        | 常态                             | hover                                          | active                              |
| -------------- | -------------------------------- | ---------------------------------------------- | ----------------------------------- |
| `raised`       | 三层凸面阴影                     | 上浮 2px，环境阴影升一级                       | 下压 1px + 凹陷 inset，过渡切 0.15s |
| `pressed`      | 常态即凹陷                       | 只加深 inset（3→4px），不做位移                | 进一步加深（5px）                   |
| `primary`      | 135° 主色渐变 + 发光阴影         | 渐变整体上移一档色阶，发光增强到 50%           | 压下                                |
| `glow`         | raised + 常驻 12px 主色辉光      | 辉光扩大到 24px                                | 压下                                |
| `glass`        | 磨砂玻璃 + `0 8px 24px` 浮动投影 | 上浮 3px，投影扩到 `0 14px 36px`，表面更不透明 | 压下 1px，投影收缩，表面更透        |
| `glass-raised` | 玻璃表面 + raised 三层凸面阴影   | 同 raised（上浮 2px，阴影升一级）              | 同 raised（inset 凹陷）             |

---

## 五、主题切换动画

- 主题切换不是瞬间换色：`nm-theme-transition` mixin 让 `background-color` / `box-shadow` / `color` / `border-color` 全部走 0.5s 缓动，颜色与阴影平滑过渡到新主题
- 机制：`useTheme` 在 `<html>` 上切换 `data-theme="dark"`，暗色 token 组整组覆盖，transition 作用在 CSS 变量的消费属性上，天然平滑
- **防闪烁**：`getAntiFlickerScript()` 返回内联 `<head>` 脚本，在 Vue 挂载前读取 localStorage 并同步系统偏好，提前设置 `data-theme`，避免首屏闪烁（FOUC）
- `NeumorphismThemeToggle` 自身带按压回弹（0.4s bounce）与涟漪（0.5s decelerate）动画

---

## 六、加载与占位动画

### Spinner

SVG 圆弧描边旋转（`stroke-dasharray: 42 14`，1s 线性循环）；Button loading、Select 远程加载、Upload 上传中复用同款自旋。

### Skeleton

`animation` prop 三选一：

- `pulse`（默认）：透明度 0.5↔1 呼吸，1.6s
- `wave`：双层 shimmer 扫光——快层 1.6s + 慢层 2.4s（延迟 0.3s、扫幅更宽），模拟自然光反射
- `none`：静态占位

### Progress（动画最丰富的组件）

`effect` prop 六种进行中效果：

| effect    | 效果                                         |
| --------- | -------------------------------------------- |
| `default` | 扫光带（shimmer，2.6s）                      |
| `pulse`   | 呼吸光晕 + 偶发掠光 + 彗头 bloom（多层叠加） |
| `flow`    | 流动渐变（4.6s）                             |
| `wave`    | 双向双层波（6.5s + 9.5s 反向）               |
| `stripes` | 斜条纹滚动（2.6s）                           |
| `sparkle` | 星光漂移 + 闪烁                              |

- 进度值变化：宽度 0.65s spring 过渡，标签数字用 rAF + easeOutCubic 做 650ms count-up（与 CSS 时长对齐）
- `indeterminate` 不定态：40% 宽度滑块往返（2.4s）
- 完成态：2s 完成辉光；依赖动画的装饰层在动画剥离时自动隐藏
- 细节：扫光带的可见性写在 keyframes 里，因此完成态 / reduced-motion 下光带自动消失，无需额外类名

### 其他

- `NeumorphismStatusDot`：`pulse` 呼吸脉冲（1.6s），connecting/busy 默认开启
- `NeumorphismBadge`：入场 pop（0.4s bounce）；dot 模式常驻脉冲
- `NeumorphismSpinner` / 全体加载动画均遵循 reduced-motion

---

## 七、浮层进出动画

统一规律：**入场 spring/decelerate 较长，退场 accelerate 较短**；方向性感知（从哪边来、回哪边去）。

| 组件       | 入场                                                                   | 退场                                    |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Modal 遮罩 | 0.35s decelerate（opacity + backdrop-filter）                          | 0.2s accelerate                         |
| Modal 面板 | 0.4s spring，从 `scale(0.88) translateY(12px)`                         | 0.2s，向 `scale(0.92) translateY(-4px)` |
| Drawer     | 0.35s spring，方向感知 `translateX/Y(±100%)`                           | 0.2s accelerate；拖拽中禁用 transition  |
| Toast      | 0.35s spring，按容器位置从侧/上方滑入并 `scale(0.95)`；图标 pop 带旋转 | 0.2s accelerate                         |
| Alert      | 0.35s spring（`translateY(-8px) scale(0.96)`）                         | 0.25s；close 事件在动画完成后才 emit    |
| Tooltip    | 0.2s，方向感知 4px 偏移                                                | 0.15s                                   |
| Popover    | 0.25s spring，方向感知 6px 偏移                                        | 0.15s                                   |
| Collapse   | `grid-template-rows` 行高动画 0.3s spring + 内容淡入 + 箭头旋转        | 同入场                                  |

---

## 八、表单微交互

- **Switch**：轨道变色 0.45s ambient；滑块用克制弹簧（1.1 超调）
- **Checkbox**：勾选涟漪 0.4s decelerate + 对勾 0.35s bounce 弹入
- **Select**：连体下拉 `max-height` 0.34s pull 曲线「抽出式」揭示；选中圆点 pop
- **Tabs**：激活项 0.4s bounce；指示器 0.4s spring 滑动；面板 0.35s 淡入
- **Steps**：进入进行态 scale 0.9→1.08→1 回弹；错误态 `nm-shake` 四段抖动（±6px/±3px）；完成对勾旋转缩放入场
- **表单校验错误**：Field 错误提示复用同款 `nm-shake` 抖动
- **Upload**：文件项入场 `translateY(-8px) scale(0.96)` 弹入；退场左滑；列表重排走 FLIP move 过渡；进度条 0.3s ambient

---

## 九、图表动画

四个图表组件共享 `animate?: boolean` prop（默认 true，可被全局配置 `chart.animate` 覆盖），入场动画均为 SVG + CSS keyframes，`fill-mode: both`，多系列/多数据点按索引级联延迟：

| 图表             | 入场动画                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| ChartLine        | 描线（stroke-dashoffset 2000→0，0.8s ambient）；面积淡入；数据点按 60ms 级联 pop（spring） |
| ChartBar         | 柱体 `scaleY(0)→1` 生长（0.5s spring）                                                     |
| ChartPie         | 扇区 `scale(0)→1` 展开（0.5s spring）；hover/focus 扇区放大 1.03 + 投影加强                |
| ChartCandlestick | 蜡烛体 scaleY 生长（0.4s）；量柱生长；MA 均线描线（0.6s）                                  |

ChartLine 的悬停数据点带双层 drop-shadow 浮雕放大；十字线跟随点 0.08s ease-out。色板为 6 色色盲安全调色板。

---

## 十、特殊动画

### `v-magnetic` 指令

磁性悬停：指针靠近时元素被「吸附」偏移（默认强度 6px + 3deg 倾斜，rAF 节流），跟随时 0.1s ease-out，离开 0.5s spring 弹回。触屏（`pointer: coarse`）与 reduced-motion 自动禁用。

```vue
<NeumorphismButton v-magnetic>吸附我</NeumorphismButton>
```

### 动态像素 Logo

`NeumorphismLogo` 由 `usePixelLogoAnimation` 用 rAF 驱动程序化 SVG 动画：入场逐块飞入（easeOutBack，径向距离 + 随机延迟）；pulse 模式沿链路传播脉冲波；pointer 模式跟随指针。

### Canvas 缩放

`NeumorphismCanvas` 按钮缩放走 0.3s spring 平滑过渡（带锚点保持视口点不动）；滚轮缩放即时无过渡；点阵网格背景尺寸随缩放 0.3s 过渡。

---

## 十一、Reduced-motion 三层防线

所有动画对 `prefers-reduced-motion: reduce` 用户降级：

1. **全局兜底**（base.scss）：强制 `animation-duration: 0.01ms`、`transition-duration: 0.01ms`、关闭平滑滚动
2. **组件级精准降级**：每个带动画的组件有独立 media query 块，针对性移除 transition/animation；Progress 完成辉光、图表装饰层等一并隐藏
3. **JS 侧响应**：`useReducedMotion()` composable 响应式跟踪媒体查询——Progress 跳过 count-up 直接赋值、图表 `shouldAnimate` 关闭入场动画、`v-magnetic` 不挂载、Logo 跳过脉冲

在你的组件中遵循同一约定：

```ts
import { useReducedMotion } from '@echolab-auto/ui-frame'

const reducedMotion = useReducedMotion() // Ref<boolean>，卸载自动清理监听
```

---

## 深入

- [交互效果](./interaction.md) — 键盘、焦点、弹出层与反馈交互
- [组件总览](./components.md) — 各组件的动效 props 一览
- [API 参考](./api.md) — `animate` / `hoverable` / `effect` 等 props 的完整签名
