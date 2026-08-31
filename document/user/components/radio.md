---
id: comp-radio
title: 'NeumorphismRadio'
x: 1709
y: 676
group: 使用
---

# NeumorphismRadio / NeumorphismRadioGroup

> 单选按钮与单选组——凹陷圆槽 + 主色圆点弹入，Group 通过类型化 Provide/Inject 协议托管子项状态。源码：`src/components/NeumorphismRadio/`。

```vue
<NeumorphismRadioGroup v-model="plan">
  <NeumorphismRadio value="free" label="免费版" />
  <NeumorphismRadio value="pro" label="专业版" />
</NeumorphismRadioGroup>
```

---

## 可配置项

### NeumorphismRadio Props

| 名称          | 类型                             | 默认值     | 说明                                                                     |
| ------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `value`       | `unknown`                        | **必填**   | 选中时对外暴露的值                                                       |
| `modelValue`  | `unknown`                        | —          | 独立使用（不在 Group 内）时的 v-model；选中条件为 `modelValue === value` |
| `disabled`    | `boolean`                        | `false`    | 禁用单个选项（Group 的 disabled 会级联到全部子项）                       |
| `label`       | `string`                         | —          | 标签文本（也可用默认插槽）                                               |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位；Group 的 size 优先于单个 Radio 的设置                          |
| `name` / `id` | `string`                         | —          | 原生表单属性；Group 的 name 优先                                         |

### NeumorphismRadioGroup Props

| 名称         | 类型                             | 默认值         | 说明                                |
| ------------ | -------------------------------- | -------------- | ----------------------------------- |
| `modelValue` | `unknown`                        | —              | v-model 绑定当前选中项的 `value`    |
| `direction`  | `'horizontal' \| 'vertical'`     | `'horizontal'` | 排列方向，同步 `aria-orientation`   |
| `disabled`   | `boolean`                        | `false`        | 整组禁用                            |
| `size`       | `'small' \| 'medium' \| 'large'` | `'medium'`     | 整组尺寸（覆盖子项）                |
| `name`       | `string`                         | 自动生成       | 原生 name；缺省时自动生成组内唯一值 |

两者均支持全局配置级联（`radio.size`、`radioGroup.size` / `radioGroup.direction`）。

### 尺寸档位的实际数值

圆圈（circle）：small 18px、medium 24px、large 30px；圆点（dot）：small 8px、medium 12px、large 16px。

### Events / Slots

| 名称                                         | 说明                                             |
| -------------------------------------------- | ------------------------------------------------ |
| `update:modelValue(value)` / `change(value)` | Radio 与 Group 均有；Group 内选中时由 Group 触发 |
| 默认 slot（Radio）                           | 自定义标签内容，优先于 `label`                   |
| 默认 slot（Group）                           | 放置若干 `NeumorphismRadio`                      |

---

## 预设与常用组合

```vue
<!-- 垂直排列的整组 -->
<NeumorphismRadioGroup v-model="plan" direction="vertical" size="large">
  <NeumorphismRadio value="free" label="免费版" />
  <NeumorphismRadio value="pro" label="专业版" />
  <NeumorphismRadio value="enterprise" label="企业版" disabled />
</NeumorphismRadioGroup>

<!-- 脱离 Group 独立使用 -->
<NeumorphismRadio v-model="single" value="yes" label="是" />
```

自建子项接入 Group 协议（公开注入键）：

```ts
import { RadioGroupKey } from '@echolab-auto/ui-frame'

const group = inject(RadioGroupKey) // { modelValue, name, disabled, size, setValue }
```

全局预设：

```ts
app.use(NeumorphismUI, { radioGroup: { direction: 'vertical', size: 'medium' } })
```

---

## 交互动画详解

与 Checkbox 共享 `_checkable.scss` 混基建（凹陷基底、焦点环、尺寸档位），特有行为：

### 选中瞬间（checked）

1. **圆点弹入**：主色圆点 `scale(0) → 1`，0.4s bounce 回弹；圆点自带 `nm-raised(1px, 2px)` 微凸阴影——从凹陷槽中「浮出」的立体感
2. **涟漪爆发**：圆槽内主色径向渐变 `scale(0) → 2.5`、透明度 0.5 → 0，0.45s decelerate
3. **辉光描边**：圆槽出现 `0 0 0 2px` 主色 15% 透明外环，标示选中归属

### 悬停与按压

- hover：凹陷槽加深（inset 2px → 3px），圆点 `brightness(1.1)` 提亮
- active：圆槽 `scale(0.94)` 快速压缩（0.1s compress 曲线）

### 键盘与无障碍

- Group 容器 `role="radiogroup"` + `aria-orientation`；子项是共享同一 `name` 的原生 `<input type="radio">`，**方向键切换选中由浏览器原生行为保证**（同 name 单选组语义）
- 焦点环画在圆圈上（3px 主色外环 + 保留凹陷阴影）
- Group 未传 `name` 时自动生成唯一值，多个单选组互不串扰

### Reduced-motion

`prefers-reduced-motion` 时：圆点直接显示（无弹入）、涟漪移除、按压形变移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismCheckbox](./checkbox.md) — 同基建的复选框
- [交互效果](../interaction.md) — Provide/Inject 协议与全局状态约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
