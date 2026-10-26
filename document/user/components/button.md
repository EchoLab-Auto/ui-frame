---
id: comp-button
title: 'NeumorphismButton（按钮）'
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

| 名称        | 类型                                                                                           | 默认值      | 说明                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `variant`   | `'raised' \| 'pressed' \| 'primary' \| 'glow' \| 'glass' \| 'glass-raised' \| 'glass-pressed'` | `'raised'`  | 视觉预设变体，见下文[预设变体](#预设变体)；玻璃是其中三档   |
| `size`      | `'small' \| 'medium' \| 'large'`                                                               | `'medium'`  | 尺寸档位（数值见下表）                                      |
| `shape`     | `'rounded' \| 'pill' \| 'circle'`                                                              | `'rounded'` | 圆角形状；`circle` 为正方形图标按钮（宽 = 高 = 最小高度）   |
| `disabled`  | `boolean`                                                                                      | `false`     | 禁用：透明度 0.6、`not-allowed` 光标、屏蔽全部 hover/active |
| `loading`   | `boolean`                                                                                      | `false`     | 加载态：显示 spinner 并**隐含禁用**点击                     |
| `pressed`   | `boolean`                                                                                      | `undefined` | 切换态，映射 `aria-pressed`（不传则不带该属性）             |
| `type`      | `'button' \| 'submit' \| 'reset'`                                                              | `'button'`  | 原生 type；表单内提交用 `type="submit"`                     |
| `form`      | `string`                                                                                       | —           | 原生 form 属性（关联表单 id）                               |
| `ariaLabel` | `string`                                                                                       | —           | 无障碍标签（纯图标按钮必传）                                |

`variant` / `size` / `shape` 均支持**全局配置级联**——显式 prop > `app.use(NeumorphismUI, { button: {...} })` > 内置默认值。

> 玻璃是 `variant` 的一个取值，**不是独立 prop**：阴影方向只有一条轴（凸 / 凹），玻璃三档同时决定了「材质 + 凸凹」，拆成两个 prop 会允许 `variant="pressed"` + 凸起玻璃这类自相矛盾的组合；而且玻璃表面会覆盖 `primary` 的底色，所谓「正交」并不成立。

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

七种视觉预设，各自有独立的 hover / active 物理：

| variant          | 视觉                                           | 典型场景                         |
| ---------------- | ---------------------------------------------- | -------------------------------- |
| `raised`（默认） | 三层凸面阴影（环境遮挡 + 定向暗影 + 边缘高光） | 常规操作按钮                     |
| `pressed`        | 常态即凹陷 inset                               | 「已按下」语义、开关式操作       |
| `primary`        | 135° 主色渐变填充 + 发光阴影                   | 表单主提交、关键行动点           |
| `glow`           | raised + 常驻主色辉光（12px）                  | 强调吸引注意的操作               |
| `glass`          | 悬浮磨砂玻璃（档位 `float`）                   | 彩色/图片背景上的浮层操作        |
| `glass-raised`   | 凸面磨砂玻璃（档位 `raised`）                  | 需要凸起立体感又要通透材质的场景 |
| `glass-pressed`  | 凹陷磨砂玻璃（档位 `pressed`）                 | 凹槽里的玻璃、输入区周边的操作   |

```vue
<NeumorphismButton variant="raised">Raised</NeumorphismButton>
<NeumorphismButton variant="pressed">Pressed</NeumorphismButton>
<NeumorphismButton variant="primary">Primary</NeumorphismButton>
<NeumorphismButton variant="glow">Glow</NeumorphismButton>

<!-- 玻璃需置于彩色/图片背景上，磨砂半透明才可见；档位名与卡片同一套 -->
<NeumorphismButton variant="glass">Float</NeumorphismButton>
<NeumorphismButton variant="glass-raised">Raised</NeumorphismButton>
<NeumorphismButton variant="glass-pressed">Pressed</NeumorphismButton>

<!-- 彩色玻璃：玻璃表面会覆盖底色，所以调 --nm-glass-bg 而不是叠 variant="primary" -->
<NeumorphismButton variant="glass-raised" style="--nm-glass-bg: rgb(90 141 239 / 42%)">
  Primary Glass
</NeumorphismButton>
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

### 玻璃拟态（glass，三档）

玻璃是 `variant` 的三档取值（`glass` / `glass-raised` / `glass-pressed`），**只替换表面材质并接管阴影方向**。材质统一为：`--nm-glass-bg` 半透明底 + `backdrop-filter: blur(--nm-glass-blur) saturate(1.15)` + `inset 0 0 0 1px` 高光内描边（内描边贴合圆角、不占布局），并加 `isolation: isolate` 让模糊只发生一次。

| 档位      | 阴影物理                                        | 状态表现                                                                                        |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `float`   | 大偏移浮动投影 `0 8px 24px`（离开表面的玻璃板） | hover **上浮 3px** + 投影扩到 `0 14px 36px` + 表面 65%→75%；active 下压 1px、投影收缩、表面 55% |
| `raised`  | 新拟态三凸面阴影（与 `raised` 同物理）          | hover 上浮 2px + 阴影加强一档 + 表面 75%；active 凹陷 inset + 表面 55%                          |
| `pressed` | 新拟态凹陷 inset（与 `pressed` 同物理）         | hover 内阴影加深；active 更深（5px/10px）                                                       |

变体与档位的对应关系：

- `variant="glass"` → 档位 `float`、`variant="glass-raised"` → `raised`、`variant="glass-pressed"` → `pressed`，三者都由 `glassClassNames()` 生成 `nm-button--glass` + `nm-button--glass-<档位>` 两个类
- 类名里的「基础变体」固定为 `nm-button--raised`：玻璃只负责材质与阴影两个类，基础档取哪个都不影响观感，固定下来是为了让类名序列可预测
- 全局默认用 `button.variant: 'glass'`（不再有 `button.glass`）
- 档位阴影用双类选择器（`.nm-button--glass.nm-button--glass-raised`，特异性 0,2,0）压过 `.nm-button--raised` 等基础变体，不依赖样式表顺序
- 玻璃按钮的 `:focus-visible` 改用 `outline` 焦点环（2px 主色 + 2px 偏移）——档位阴影覆盖了 `box-shadow`，用 outline 保证键盘焦点始终可见
- 不支持 `backdrop-filter` 时退回 94% 不透明表面色，文字保持可读

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

## example 中的展示 + 配置

`examples/pages/demos/ButtonDemo.vue` 的按钮区是**预览 + 调参**工作台（与其他演示同款结构）：

- **左侧实时预览台**：单个按钮承载全部参数；台面可在「平面 / 彩色」间切换——玻璃档位只有在彩色背景上才看得出半透明与模糊
- **右侧参数表单**：内容文本、`variant`（含玻璃三档）、`size`、`shape`、高度（28–64px）、`loading` / `disabled` 状态，外加「恢复默认 / 套用玻璃」两个动作
- **实时代码片段**：面板底部按当前配置生成对应的 `<NeumorphismButton>` 片段（只列出非默认属性），可直接照抄
- **变体一览**：7 格网格（4 个基础变体 + 3 个玻璃变体）各自渲染真实按钮，**点击即载入到上方预览**，当前配置对应的那一格高亮

高度滑块会写到**当前尺寸档位**对应的 token 上（`--nm-button-*-sm/md/lg`）——否则切到 `small` / `large` 时滑块会静默失效。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与阴影模型的通用机制
- [交互效果](../interaction.md) — 焦点管理与全局状态视觉约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
