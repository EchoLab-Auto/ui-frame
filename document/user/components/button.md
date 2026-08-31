---
id: comp-button
title: 'NeumorphismButton'
x: 1709
y: 943
group: 使用
---

# NeumorphismButton

> 新拟态按钮——库中最基础的交互元素，也是「材质高度」隐喻的基准实现：hover 抬升、active 压下、loading 不塌陷布局。源码：`src/components/NeumorphismButton/`。

```vue
<NeumorphismButton variant="raised" size="medium">点击我</NeumorphismButton>
```

---

## 可配置项

### Props

| 名称        | 类型                                                                        | 默认值      | 说明                                                        |
| ----------- | --------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `variant`   | `'raised' \| 'pressed' \| 'primary' \| 'glow' \| 'glass' \| 'glass-raised'` | `'raised'`  | 视觉预设变体，见下文[预设变体](#预设变体)                   |
| `size`      | `'small' \| 'medium' \| 'large'`                                            | `'medium'`  | 尺寸档位（数值见下表）                                      |
| `shape`     | `'rounded' \| 'pill' \| 'circle'`                                           | `'rounded'` | 圆角形状；`circle` 为正方形图标按钮（宽 = 高 = 最小高度）   |
| `disabled`  | `boolean`                                                                   | `false`     | 禁用：透明度 0.6、`not-allowed` 光标、屏蔽全部 hover/active |
| `loading`   | `boolean`                                                                   | `false`     | 加载态：显示 spinner 并**隐含禁用**点击                     |
| `pressed`   | `boolean`                                                                   | `undefined` | 切换态，映射 `aria-pressed`（不传则不带该属性）             |
| `type`      | `'button' \| 'submit' \| 'reset'`                                           | `'button'`  | 原生 type；表单内提交用 `type="submit"`                     |
| `form`      | `string`                                                                    | —           | 原生 form 属性（关联表单 id）                               |
| `ariaLabel` | `string`                                                                    | —           | 无障碍标签（纯图标按钮必传）                                |

`variant` / `size` / `shape` 均支持**全局配置级联**——显式 prop > `app.use(NeumorphismUI, { button: {...} })` > 内置默认值。

### 尺寸档位的实际数值（token）

| size   | padding     | 字号 | 最小高度                   |
| ------ | ----------- | ---- | -------------------------- |
| small  | 8px / 16px  | 13px | 32px                       |
| medium | 12px / 24px | 14px | 44px（满足触屏最小命中区） |
| large  | 16px / 32px | 16px | 56px                       |

### Events / Slots

| 名称                       | 说明                                                 |
| -------------------------- | ---------------------------------------------------- |
| `click(event: MouseEvent)` | 点击；disabled / loading 时不触发                    |
| 默认 slot                  | 按钮内容；loading 时自动透明占位（见下文「加载态」） |

---

## 预设变体

六种视觉预设，各自有独立的 hover / active 物理：

| variant          | 视觉                                                  | 典型场景                         |
| ---------------- | ----------------------------------------------------- | -------------------------------- |
| `raised`（默认） | 三层凸面阴影（环境遮挡 + 定向暗影 + 边缘高光）        | 常规操作按钮                     |
| `pressed`        | 常态即凹陷 inset                                      | 「已按下」语义、开关式操作       |
| `primary`        | 135° 主色渐变填充 + 发光阴影                          | 表单主提交、关键行动点           |
| `glow`           | raised + 常驻主色辉光（12px）                         | 强调吸引注意的操作               |
| `glass`          | 悬浮磨砂玻璃：半透明 + backdrop-blur + 大偏移浮动阴影 | 彩色/图片背景上的浮层操作        |
| `glass-raised`   | 凸面磨砂玻璃：新拟态三层凸面阴影 + 玻璃材质表面       | 需要凸起立体感又要通透材质的场景 |

```vue
<NeumorphismButton variant="raised">Raised</NeumorphismButton>
<NeumorphismButton variant="pressed">Pressed</NeumorphismButton>
<NeumorphismButton variant="primary">Primary</NeumorphismButton>
<NeumorphismButton variant="glow">Glow</NeumorphismButton>

<!-- 玻璃变体需置于彩色/图片背景上，磨砂半透明才可见 -->
<NeumorphismButton variant="glass">Glass</NeumorphismButton>
<NeumorphismButton variant="glass-raised">GlassRaised</NeumorphismButton>
```

常用组合预设：

```vue
<!-- 圆形图标按钮 -->
<NeumorphismButton shape="circle" aria-label="确认">✓</NeumorphismButton>

<!-- 胶囊按钮 -->
<NeumorphismButton shape="pill" variant="primary">立即开始</NeumorphismButton>

<!-- 异步提交：loading 自动禁用并显示 spinner -->
<NeumorphismButton type="submit" variant="primary" :loading="submitting">提交</NeumorphismButton>

<!-- 切换态按钮（如「置顶」），pressed 映射 aria-pressed -->
<NeumorphismButton :pressed="pinned" @click="pinned = !pinned">置顶</NeumorphismButton>
```

全局预设（让全站按钮统一默认变体与尺寸）：

```ts
app.use(NeumorphismUI, {
  button: { variant: 'raised', size: 'medium', shape: 'rounded' },
})
```

---

## 交互动画详解

### Raised（默认）

| 状态   | 表现                                                                                                 | 过渡                                                |
| ------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 常态   | `0 1px 2px ambient` + `4px 4px 8px dark` + `-2px -2px 6px light`                                     | 0.35s spring（`cubic-bezier(0.34, 1.56, 0.64, 1)`） |
| hover  | **上浮 2px**（`translateY(-2px)`），环境阴影升一级（ambient-md → xl），定向阴影加强到 `6px 6px 14px` | 同上，弹簧带超调                                    |
| active | **下压 1px**（`translateY(1px)`），阴影翻转为凹陷 inset（`3px 3px 6px` 双层）                        | 切换为 0.15s ease——更快更硬，即时触感               |

### Pressed

常态即凹陷，**不做位移**——hover 只加深 inset（3→4px），active 进一步加深（5px）。物理含义：已经在井里的按钮只能按得更深。

### Primary

渐变填充（`primary-400 → 500 → 600`，135°）+ 主色发光阴影（35% 浓度）；hover 时**渐变整体上移一档色阶**（300→400→500，视觉更亮）+ 发光增强到 50% + 上浮 2px；active 凹陷。

### Glow

raised 的全部行为 + 常驻 `0 0 12px` 主色辉光（30% 浓度），hover 辉光扩大到 `0 0 24px`、浓度 50%。

### Glass（悬浮磨砂玻璃）

表面为半透明磨砂玻璃（`--nm-glass-bg` 65% 透明表面色 + 20px backdrop-blur + 微亮描边），阴影是**大偏移的浮动投影**（`0 8px 24px` 环境阴影）而非新拟态双边阴影——物理含义是「离开表面的悬浮玻璃板」：

| 状态   | 表现                                                                                    | 过渡         |
| ------ | --------------------------------------------------------------------------------------- | ------------ |
| 常态   | 磨砂表面 + `0 8px 24px` 浮动投影                                                        | 0.35s spring |
| hover  | **上浮 3px**（全按钮最大抬升），投影扩大到 `0 14px 36px`，表面不透明度提高（65% → 75%） | 同上         |
| active | 下压 1px，投影收缩到 `0 2px 8px`（越按越贴近表面），表面更透（55%）                     | 0.15s ease   |

### Glass-raised（凸面磨砂玻璃）

与 raised **完全相同的凸面物理**（三层阴影、hover 上浮 2px、active 凹陷 inset），但表面替换为磨砂玻璃材质 + 18% 亮边描边；hover/active 时表面透明度同样随高度变化（75% / 55%）。

### 加载态

- spinner 是绝对定位的 SVG 圆弧（`stroke-dasharray: 31.42`，1s 线性自旋），叠加在按钮中心
- 内容经 `opacity: 0` 隐藏但**保留占位**——切换 loading 不会改变按钮宽高，布局不塌陷
- `loading` 隐含禁用点击，同时设置 `aria-busy="true"`

### 焦点与禁用

- `:focus-visible` 显示 2px 主色光环 + 保留新拟态双层阴影；仅键盘聚焦出现，鼠标点击不出现
- disabled：透明度 0.6 + `not-allowed` 光标；所有 hover/active 选择器都经 `:not(.nm-button--disabled)` 屏蔽
- `pressed` prop 映射 `aria-pressed`，供屏幕阅读器播报切换态

### 通用规则

- hover 位移类效果包在 `@media (hover: hover)` 内，触屏不触发悬停位移
- 主题切换时背景色 / 阴影 / 文字色走 0.5s 平滑过渡（`nm-theme-transition`）
- `prefers-reduced-motion: reduce` 时全部 transition / animation 移除（组件级 media query 块）

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与阴影模型的通用机制
- [交互效果](../interaction.md) — 焦点管理与全局状态视觉约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
