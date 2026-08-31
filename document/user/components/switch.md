---
id: comp-switch
title: 'NeumorphismSwitch'
x: 1709
y: 1076
group: 使用
---

# NeumorphismSwitch

> 开关切换——全库「物理感最强」的组件：凹陷轨道 + 弹簧滑块 + 按压时的 squash & stretch 形变。源码：`src/components/NeumorphismSwitch/`。

```vue
<NeumorphismSwitch v-model="enabled" active-text="开" inactive-text="关" />
```

---

## 可配置项

### Props

| 名称            | 类型                             | 默认值     | 说明                                                            |
| --------------- | -------------------------------- | ---------- | --------------------------------------------------------------- |
| `modelValue`    | `boolean`                        | `false`    | v-model 绑定开关状态                                            |
| `disabled`      | `boolean`                        | `false`    | 禁用：透明度 0.5、`not-allowed` 光标                            |
| `activeText`    | `string`                         | —          | 开启侧文本标签（显示在轨道右侧）                                |
| `inactiveText`  | `string`                         | —          | 关闭侧文本标签（显示在轨道左侧）                                |
| `activeColor`   | `string`                         | —          | 开启态自定义颜色（CSS 颜色值，写入 `--nm-switch-active-color`） |
| `inactiveColor` | `string`                         | —          | 关闭态自定义颜色（写入 `--nm-switch-inactive-color`）           |
| `size`          | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `switch.size` 级联                       |

### 尺寸档位的实际数值

| size   | 轨道宽 × 高 | 滑块直径 | 滑块位移 |
| ------ | ----------- | -------- | -------- |
| small  | 44 × 24px   | 18px     | 18px     |
| medium | 56 × 30px   | 24px     | 24px     |
| large  | 72 × 38px   | 32px     | 32px     |

### Events / Slots

| 名称                                         | 说明                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `update:modelValue(value)` / `change(value)` | 状态切换时同时触发                                                    |
| `thumb`                                      | 自定义滑块内容，作用域参数 `{ checked: boolean }`；默认是一个变色圆点 |

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
```

全局预设：

```ts
app.use(NeumorphismUI, { switch: { size: 'medium' } })
```

---

## 交互动画详解

开关由「凹陷轨道 + 凸起滑块」两个物理面组成，三者（轨道 / 滑块 / 文本）的动画协同：

### 轨道（track）

- 常态：凹陷槽（`inset 3px 3px 6px` 双层阴影），背景 `--nm-surface-color`
- 开启：凹陷**加深**（inset 4px + strong 变体阴影），背景切 `--nm-surface-raised`，轨道内浮现主色径向辉光（`::before`，8% 透明度，椭圆渐变位于滑块一侧）
- 颜色覆层（`::after`）：`inactiveColor` / `activeColor` 以 25% 透明度铺在轨道上，随状态 0.45s 平滑换色
- 轨道所有颜色/阴影过渡走 0.45s ambient 曲线

### 滑块（thumb）

- 位移：0.5s **克制弹簧**（`cubic-bezier(0.34, 1.1, 0.64, 1)`——超调量比全局 spring 小，避免滑块撞墙感）
- **Squash & stretch**：按下轨道时滑块压扁 18%（`scaleX(1.18) scaleY(0.91)`，0.12s ease-out），松开弹回——模拟橡胶质感；键盘操作用户经隐藏 input 的 `:active` 状态触发同样的压缩反馈
- 开启后：渐变方向翻转（视觉重心跟随位置）+ 主色外发光（`0 0 14px` 22% + `0 0 4px` 35% 双层辉光）
- 内置圆点：变色（placeholder 灰 → 主色）并 `scale(1.15)` 放大

### 文本标签

`activeText` / `inactiveText` 中**未生效的一侧**自动变为次要色，切换时 0.4s 渐变。

### 焦点与无障碍

- 视觉焦点环画在轨道上（2px 主色外环 + 保留凹陷阴影），真实焦点落在隐藏的 `<input role="switch">` 上
- `aria-checked` 同步状态；双文本都缺失时用 locale 的 `switchToggle` 兜底 `aria-label`，保证屏幕阅读器一定有名称

### Reduced-motion

`prefers-reduced-motion` 时轨道、滑块、圆点、文本的全部过渡移除，状态瞬时切换。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线的通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
