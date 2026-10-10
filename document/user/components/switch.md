---
id: comp-switch
title: 'NeumorphismSwitch（开关）'
x: 1709
y: 1076
group: 使用
---

# NeumorphismSwitch

> 开关切换——全库「物理感最强」的组件：凹陷轨道 + 弹簧滑块 + 按压时的 squash & stretch 形变。通过 `variant` 切换两种形态：`default`（轨道滑块）与 `power`（电力开关，器件质感）。源码：`src/components/NeumorphismSwitch/`。

```vue
<NeumorphismSwitch v-model="enabled" active-text="开" inactive-text="关" />

<!-- 电力开关（power 变体） -->
<NeumorphismSwitch v-model="power" variant="power" />
```

---

## 可配置项

### Props

| 名称            | 类型                   | 默认值      | 说明                                                                                                                                                                                                                                                         |
| --------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modelValue`    | `boolean`              | `false`     | v-model 绑定开关状态                                                                                                                                                                                                                                         |
| `disabled`      | `boolean`              | `false`     | 禁用：透明度 0.5、`not-allowed` 光标                                                                                                                                                                                                                         |
| `variant`       | `'default' \| 'power'` | `'default'` | 视觉变体：`power` 为电力开关（金属器件、整径扳动）                                                                                                                                                                                                           |
| `activeText`    | `string`               | —           | 通电侧文本标签（power 变体为可选刻印，不传则不渲染）                                                                                                                                                                                                         |
| `inactiveText`  | `string`               | —           | 断电侧文本标签（power 变体为可选刻印，不传则不渲染）                                                                                                                                                                                                         |
| `activeColor`   | `string`               | —           | 开启态自定义颜色（default 写入 `--nm-switch-active-color`；power 为通电面颜色）                                                                                                                                                                              |
| `inactiveColor` | `string`               | —           | 关闭态自定义颜色（power 变体为内腔底色）                                                                                                                                                                                                                     |
| `size`          | `number`（推荐）       | `30` / `91` | **尺寸 = px 高度（连续）**：default 变体驱动轨道高度（默认 30px）；power 变体驱动器件整机等比缩放、默认 91px；支持全局配置 `switch.size` 级联，8px 下限保护。旧字符串档位 `'small' \| 'medium' \| 'large'` 已弃用（兼容映射 24 / 30 / 36px），新代码请传数字 |

### 尺寸（px 高度）

`size` 为连续数字（px 高度）；旧枚举档位已弃用（仅为兼容保留，见下）：

- **default 变体**：数字 = 轨道高度。轨道宽、滑块直径、行程按比例联动（宽 = 高 × 56/30，滑块 = 高 × 0.8，行程 = 轨宽 − 滑块 − 2 × 4px）。
- **power 变体**：数字 = 器件高度，折算为设计单位 `u = 高度 / 91`，整机等比缩放（宽 = 高 × 171/91 ≈ 1.879）。
- **紧凑降噪（刻印）**：power 变体高度 **< 36px** 时刻印字号不足 ~5px（不可辨读），已传入的刻印文本**自动隐藏**；圆钮拉丝纹理**不隐藏**——低于 **34px** 后纹理缩放冻结在 34px 对应的图案周期（约 1.49px），不再随尺寸缩小加深亚像素摩尔纹，纹理在所有尺寸下始终保留。
- **弃用兼容（1.3.2 迁移）**：字符串档位仍可用但已弃用——`'small'` / `'medium'` / `'large'` 分别映射为 **24 / 30 / 36px** 高度（与 1.3.2 轨道高一致）；全局配置 `switch.size` 的字符串值同样兼容。新代码一律传数字。连续几何对小/大档为近似复刻（如 small 轨宽 44.8px，1.3.2 为 44px），视觉差异可忽略。

```vue
<NeumorphismSwitch v-model="a" :size="36" />
<!-- 轨道高 36px -->
<NeumorphismSwitch v-model="b" variant="power" :size="44" />
<!-- 器件高 44px -->
<NeumorphismSwitch v-model="c" variant="power" :size="24" />
<!-- 器件高 24px，刻印隐藏、纹理冻结保留 -->
```

### Events / Slots

| 名称                                         | 说明                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `update:modelValue(value)` / `change(value)` | 状态切换时同时触发                                                                       |
| `thumb`                                      | 自定义滑块内容（仅 default 变体），作用域参数 `{ checked: boolean }`；默认是一个变色圆点 |

---

## 预设与常用组合

```vue
<!-- 基础开关 -->
<NeumorphismSwitch v-model="enabled" />

<!-- 带双语文本标签（未选中侧文字变淡） -->
<NeumorphismSwitch v-model="enabled" active-text="已开启" inactive-text="已关闭" />

<!-- 自定义颜色：开启绿色、关闭灰色 -->
<NeumorphismSwitch v-model="enabled" active-color="#27ae60" inactive-color="#95a5a6" />

<!-- 自定义滑块内容 -->
<NeumorphismSwitch v-model="enabled">
  <template #thumb="{ checked }">{{ checked ? '✓' : '✕' }}</template>
</NeumorphismSwitch>

<!-- power 变体：基础用法 -->
<NeumorphismSwitch v-model="power" variant="power" />

<!-- power 变体：大号（器件高 114px）+ 自定义通电色 -->
<NeumorphismSwitch v-model="power" variant="power" :size="114" active-color="#27ae60" />

<!-- power 变体：本地化刻印 -->
<NeumorphismSwitch v-model="power" variant="power" active-text="通电" inactive-text="断电" />

<!-- power 变体：禁用 -->
<NeumorphismSwitch variant="power" :model-value="true" disabled />
```

全局预设：

```ts
app.use(NeumorphismUI, { switch: { size: 36, variant: 'power' } })
```

---

## 交互动画详解

### default 变体

开关由「凹陷轨道 + 凸起滑块」两个物理面组成，三者（轨道 / 滑块 / 文本）的动画协同：

#### 轨道（track）

- 常态：凹陷槽（`inset 3px 3px 6px` 双层阴影），背景 `--nm-surface-color`
- 开启：凹陷**加深**（inset 4px + strong 变体阴影），背景切 `--nm-surface-raised`，轨道内浮现主色径向辉光（`::before`，8% 透明度，椭圆渐变位于滑块一侧）
- 颜色覆层（`::after`）：`inactiveColor` / `activeColor` 以 25% 透明度铺在轨道上，随状态 0.45s 平滑换色
- 轨道所有颜色/阴影过渡走 0.45s ambient 曲线

#### 滑块（thumb）

- 位移：0.5s **克制弹簧**（`cubic-bezier(0.34, 1.1, 0.64, 1)`——超调量比全局 spring 小，避免滑块撞墙感）
- **Squash & stretch**：按下轨道时滑块压扁 18%（`scaleX(1.18) scaleY(0.91)`，0.12s ease-out），松开弹回——模拟橡胶质感；键盘操作用户经隐藏 input 的 `:active` 状态触发同样的压缩反馈
- 开启后：渐变方向翻转（视觉重心跟随位置）+ 主色外发光（`0 0 14px` 22% + `0 0 4px` 35% 双层辉光）
- 内置圆点：变色（placeholder 灰 → 主色）并 `scale(1.15)` 放大

#### 文本标签

`activeText` / `inactiveText` 中**未生效的一侧**自动变为次要色，切换时 0.4s 渐变。

### power 变体（电力开关）

一次「扳动」由四个部件协同完成（时长 0.35s，`cubic-bezier(0.46, 0.03, 0.52, 0.96)`——器件运动的惯性手感）：

#### 旋钮（knob）

- 行程：整径位移（`translateX(100%)`，正好一个自身直径），从腔体左端滑到右端
- 表面纹理：内圈小圆上的 4u 锥形平铺纹（拉丝质感），随器件尺寸等比呈现；器件高 **< 34px** 后**冻结缩放**（图案周期恒定在 34px 对应值，纹理不再随尺寸缩小、始终保留）
- 悬停（仅指针设备）：投影扩散，模拟轻微「抬起」；按下：压缩 3%，松开回弹

#### 通电面（energized face）

- 自左擦入：`translateX(-100%) → 0`，与旋钮同曲线同时长；断电时原路退出
- 颜色默认 `#f3800d`（器件自带光源，两主题保持常亮），可用 `activeColor` 覆盖

#### 指示点 / 指示条

- 断电：指示点（冲压圆环）驻留腔体右侧；通电：右移 85u 滑出腔体（被裁剪）
- 通电：指示条从腔体左端外滑入（`-85u → 0`），与通电侧同向呼应

#### 刻印（可选，通过 activeText / inactiveText 传入）

- 不传文本时器件纯净无文字（无任何默认刻印）；传入后随行内联显示在器件两侧
- 通电：`activeText`（通电侧）保持灰色至 0.35s，随后闪烁两次定格为 `--nm-switch-power-label-on`（默认 `#d56750`，含 3u 光晕）
- 断电：通电侧刻印以 0.1s 延迟闪回灰色；断电侧刻印全程静置
- 挂载时静置不闪烁：仅在用户切换后播放（避免初始即通电的实例「假闪烁」）

### 焦点与无障碍

- 视觉焦点环：default 变体画在轨道上（2px 主色外环 + 保留凹陷阴影），power 变体画在金属外圈外侧；真实焦点都落在隐藏的 `<input role="switch">` 上
- `aria-checked` 同步状态；双文本都缺失时用 locale 的 `switchToggle` 兜底 `aria-label`，保证屏幕阅读器一定有名称
- 键盘空格切换（原生 checkbox 语义）；power 变体点击任意部位（含器件两侧）都可切换

### Reduced-motion

`prefers-reduced-motion` 时轨道、滑块、圆点、文本的全部过渡移除，状态瞬时切换；power 变体的位移（通电面 / 旋钮 / 指示点 / 指示条）与刻印闪烁同样降级。

---

## 主题变量

default 变体颜色走全局新拟态 token，可用 `--nm-switch-active-color` / `--nm-switch-inactive-color` 覆盖。

power 变体颜色全部来自 `--nm-switch-power-*` token（亮/暗两套），可直接覆盖：

```css
.nm-switch--power {
  --nm-switch-power-energized: #27ae60; /* 通电色 */
}
```

> 设计单位 `u` 不再由 token 提供——它由 `size`（px 高度）折算：`u = 高度 / 91`。
> 需要缩放器件时直接调整 `size` 数字即可。

| token                                         | 作用                    |
| --------------------------------------------- | ----------------------- |
| `--nm-switch-power-rind-{light,dark}`         | 金属外圈渐变两端        |
| `--nm-switch-power-well` / `-shade`           | 内腔底色 / 内腔阴影基色 |
| `--nm-switch-power-knob-{light,dark}`         | 旋钮渐变两端            |
| `--nm-switch-power-knob-tex-{light,mid,dark}` | 旋钮表面拉丝纹理三色    |
| `--nm-switch-power-energized`                 | 通电面颜色（器件光源）  |
| `--nm-switch-power-dot-{highlight,shadow}`    | 指示点浮雕高光 / 暗部   |
| `--nm-switch-power-bar-{highlight,shadow}`    | 指示条渐变两端          |
| `--nm-switch-power-label` / `-label-on`       | 刻印常态色 / 通电定格色 |

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线的通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
