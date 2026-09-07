---
id: comp-slider
title: 'NeumorphismSlider（滑块）'
x: 2101
y: 1172
group: 使用
---

# NeumorphismSlider

> 滑块——凹陷轨道 + 凸起拇指的拖拽取值控件，headless 逻辑由 `useSlider` 承载；拖拽经 pointer capture + rAF 合帧，拖动再快填充也不拖尾。源码：`src/components/NeumorphismSlider/`。

```vue
<NeumorphismSlider v-model="volume" :min="0" :max="100" show-stops />
```

---

## 可配置项

### Props

| 名称          | 类型                             | 默认值      | 说明                                                                     |
| ------------- | -------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `modelValue`  | `number`                         | `0`         | 绑定值（v-model）                                                        |
| `min` / `max` | `number`                         | `0` / `100` | 取值范围                                                                 |
| `step`        | `number`                         | `1`         | 步长（坐标换算与键盘步进共用）                                           |
| `disabled`    | `boolean`                        | `false`     | 禁用（透明度 0.5，拇指移出 Tab 序）                                      |
| `showTooltip` | `boolean`                        | `true`      | 拖拽时显示当前值气泡，支持全局配置 `slider.showTooltip` 级联             |
| `showStops`   | `boolean`                        | `false`     | 轨道显示步长刻度点，支持全局配置 `slider.showStops` 级联                 |
| `vertical`    | `boolean`                        | `false`     | 垂直方向（高 200px，刻度与填充自下而上）                                 |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 轨道 6 / 8 / 10px + 拇指 16 / 22 / 28px，支持全局配置 `slider.size` 级联 |

### Events / Slots

| 名称                       | 说明                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| `update:modelValue(value)` | 拖拽过程中连续触发（实时反馈请监听它）                                        |
| `change(value)`            | 每次交互提交一次（拖拽释放 / 键盘调整），对齐原生 `<input type="range">` 语义 |
| —                          | 无插槽                                                                        |

---

## 用法

```vue
<!-- 带刻度 + 垂直 -->
<NeumorphismSlider v-model="level" :step="10" show-stops vertical />

<!-- 精确提交语义：拖动中实时预览，松手才入库 -->
<NeumorphismSlider v-model="opacity" @change="save" />
```

全局预设：

```ts
app.use(NeumorphismUI, { slider: { size: 'medium', showTooltip: true, showStops: false } })
```

---

## 交互动画详解

### 拖拽管线（防卡顿设计）

- `pointerdown` 即 setPointerCapture，拖出轨道也不丢手势；轨道矩形在拖拽开始时缓存，滚动 / resize 时刷新（避免每帧强制同步重排）
- `pointermove` 只记录最新坐标，rAF 回调每帧至多应用一次值更新——120Hz+ 指针与屏幕刷新对齐
- 释放时同步应用最终坐标再 emit 一次 `change`，终值精确

### 键盘

| 按键                  | 行为                                  |
| --------------------- | ------------------------------------- |
| `→` / `↑`             | +step（方向无关，逻辑上总是「增大」） |
| `←` / `↓`             | −step                                 |
| `Home` / `End`        | 跳到 min / max                        |
| `PageUp` / `PageDown` | 跳 10 个 step（或范围的 10%，取大者） |

### 视觉反馈

- 拇指：44px 隐形触控热区（伪元素外扩）；hover scale 1.08，拖拽中 scale 1.12 + 主色光晕，cursor grab → grabbing
- 填充轨：主色渐变，键盘 / 程序修改时 0.3s 平滑滑动；**拖拽中关闭过渡**，填充与拇指零延迟跟随
- 刻度点：小于等于当前值的点变为 `--nm-text-on-primary` 并放大 1.2 倍
- 焦点：thumb 获焦时绘 2px 主色环 + 凹陷阴影 + 外发光
- 无障碍：`role="slider"` + `aria-valuemin/max/now/text/orientation`；tooltip 对读屏隐藏

### Reduced-motion

`prefers-reduced-motion` 时：全部过渡、tooltip 出入动画与拇指缩放移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名与 `useSlider`
