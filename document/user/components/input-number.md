---
id: comp-input-number
title: 'NeumorphismInputNumber（数字输入）'
x: 2101
y: 1048
group: 使用
---

# NeumorphismInputNumber

> 数字输入框——凹陷输入槽 + 两侧凸起增减按钮的连体结构，headless 逻辑由 `useNumberInput` 承载（边界钳制、步进精度、解析与格式化），并带长按连续步进。源码：`src/components/NeumorphismInputNumber/`。

```vue
<NeumorphismInputNumber v-model="count" :min="0" :max="10" label="数量" />
```

---

## 可配置项

### Props

| 名称          | 类型                             | 默认值     | 说明                                                         |
| ------------- | -------------------------------- | ---------- | ------------------------------------------------------------ |
| `modelValue`  | `number`                         | —          | 绑定值（v-model），`undefined` 表示空                        |
| `min` / `max` | `number`                         | —          | 最小 / 最大值（缺省 ±Infinity）                              |
| `step`        | `number`                         | `1`        | 步进量；未设 `precision` 时由 step 推断小数位数              |
| `precision`   | `number`                         | —          | 小数精度（显式传入优先于 step 推断）                         |
| `disabled`    | `boolean`                        | `false`    | 禁用整组（输入槽与按钮统一透明度 0.6）                       |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `inputNumber.size` 级联（独立配置段） |
| `placeholder` | `string`                         | `''`       | 占位文本                                                     |
| `controls`    | `boolean`                        | `true`     | 是否显示增减按钮                                             |
| `label`       | `string`                         | —          | 字段标签（经 FieldLabel 渲染）                               |

透传说明：`inheritAttrs: false`，attrs 落在组件根节点上。

### Events / Slots

| 名称                                  | 说明                                       |
| ------------------------------------- | ------------------------------------------ |
| `update:modelValue(value)` / `change` | 值提交时同时触发（步进、键盘、失焦格式化） |
| `focus` / `blur`                      | 原生焦点事件透传                           |
| —                                     | 无插槽                                     |

---

## 用法

```vue
<!-- 金额：两位小数 + 无按钮 -->
<NeumorphismInputNumber v-model="price" :step="0.01" :precision="2" :controls="false" />

<!-- 数量：限定区间 -->
<NeumorphismInputNumber v-model="qty" :min="1" :max="99" />
```

全局预设（独立的 `inputNumber` 配置段，与 Input 的 `input` 段互不影响）：

```ts
app.use(NeumorphismUI, { inputNumber: { size: 'medium' } })
```

---

## 交互动画详解

### 值的生命周期

- 输入过程只更新内部文本缓冲（`inputmode="decimal"`），不打断自由键入；**失焦时**解析、按 precision 格式化并提交（`toFixed` 输出）
- 解析失败（空串、孤立 `-` / `+`、非数字）提交 `undefined`；提交值始终被 clamp 到 `[min, max]`
- 键盘 `↑` / `↓` 步进（系统级长按重复由浏览器负责）

### 增减按钮

- **边界禁用**：值到达 min/max 时对应按钮呈禁用态（空值视为双侧可操作）——affordance 与实际行为一致
- **长按连续步进**：pointerdown 立即步进一次，400ms 后每 80ms 步进；抬起 / 取消 / 移出即停（对齐原生 spinner 手感）
- 按钮 `tabindex="-1"`，不干扰 Tab 序；hover 上浮 1px 变主色，active 下压 1px 转凹陷
- 整组连体：按钮为凸起、输入槽为凹陷，中间焦点外环（3px 主色）绘在最外层 body 上避免被 `overflow: hidden` 裁切

### Reduced-motion

`prefers-reduced-motion` 时：全部过渡与按钮位移动效移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismInput](./input.md) — 同尺寸体系的文本输入框
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名与 `useNumberInput`
