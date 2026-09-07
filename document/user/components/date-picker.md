---
id: comp-date-picker
title: 'NeumorphismDatePicker（日期选择器）'
x: 2101
y: 1420
group: 使用
---

# NeumorphismDatePicker

> 日期选择器——凹陷触发器 + Popover 日历面板（年 / 月导航 + 周视图网格 + 今天按钮），headless 逻辑由 `useDatePicker` 承载，与 Input / Select 共享 `useFormField` 字段基建（label / error / 尺寸）。源码：`src/components/NeumorphismDatePicker/`。

```vue
<NeumorphismDatePicker v-model="date" label="日期" clearable />
```

---

## 可配置项

### Props

| 名称                  | 类型                             | 默认值         | 说明                                                                                                                                   |
| --------------------- | -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`          | `Date \| null`                   | `null`         | 绑定值（v-model）                                                                                                                      |
| `placeholder`         | `string`                         | `''`           | 占位文本，支持全局配置 `datePicker.placeholder` 级联（再兜底 locale）                                                                  |
| `format`              | `string`                         | `'yyyy-MM-dd'` | 显示格式，支持全局配置 `datePicker.format` 级联                                                                                        |
| `disabled`            | `boolean`                        | `false`        | 禁用（透明度 0.6 + `not-allowed`）                                                                                                     |
| `clearable`           | `boolean`                        | `true`         | 有值时显示清空按钮，支持全局配置 `datePicker.clearable` 级联                                                                           |
| `size`                | `'small' \| 'medium' \| 'large'` | `'medium'`     | 尺寸档位，支持全局配置 `datePicker.size` 级联                                                                                          |
| `minDate` / `maxDate` | `Date`                           | —              | 可选日期区间（越界日期格禁用）                                                                                                         |
| `firstDayOfWeek`      | `number`                         | `0`            | 每周起始日（0=周日），支持全局配置 `datePicker.firstDayOfWeek` 级联                                                                    |
| `label`               | `string`                         | —              | 字段标签（经 FieldLabel 渲染，关联触发器 id）                                                                                          |
| `required`            | `boolean`                        | `false`        | 必填（label 旁显示红色 \*）                                                                                                            |
| `error`               | `string \| boolean`              | —              | 错误态：字符串为错误文案，`true` 仅显示错误样式                                                                                        |
| `name` / `id`         | `string`                         | —              | 表单属性；传入 `name` 时渲染 hidden input 携带格式化日期串参与表单提交（无值提交空串）；id 缺省自动生成并关联 label / error / 日历网格 |

### Events / Slots

| 名称                       | 说明                            |
| -------------------------- | ------------------------------- |
| `update:modelValue(value)` | 选中 / 清空时同步 v-model       |
| `change(value)`            | 与 `update:modelValue` 同时触发 |
| `focus` / `blur`           | 触发器原生焦点事件              |
| —                          | 无插槽                          |

---

## 用法

```vue
<!-- 限定可选区间 -->
<NeumorphismDatePicker v-model="date" :min-date="today" :max-date="deadline" />

<!-- 周一开始 + 必填校验态 -->
<NeumorphismDatePicker
  v-model="startDate"
  label="开始日期"
  :first-day-of-week="1"
  required
  :error="startError"
/>
```

全局预设：

```ts
app.use(NeumorphismUI, {
  datePicker: { size: 'medium', format: 'yyyy-MM-dd', firstDayOfWeek: 1, clearable: true },
})
```

---

## 交互动画详解

### 面板结构

- 日历面板由 NeumorphismPopover 承载（宽度跟随触发器、无箭头、click 触发），选中日期或点击「今天」后自动关闭并把焦点交还触发器
- 头部：上一年 / 上一月 / 标题 / 下一月 / 下一年五段导航；底部：「今天」按钮（选中今天并跳转视图）
- 月份名、星期、按钮 aria-label 均取自 locale（`datePickerMonth1–12`、`datePickerToday` 等）
- 外部修改 modelValue 时日历视图自动跳到选中日期所在年月

### 日期格状态

| 状态   | 表现                                         |
| ------ | -------------------------------------------- |
| 常态   | 无底色                                       |
| hover  | 浅凹陷（inset 1px）                          |
| 今天   | 主色文字 + 2px 主色描边环                    |
| 选中   | 主色底 + 反色文字 + 凹陷强阴影 + 主色外发光  |
| 非本月 | 禁用色文字，不参与 hover                     |
| 禁用   | 越界日期（minDate/maxDate 之外），透明度 0.5 |

### 键盘（WAI-ARIA grid 模式）

- 触发器：`Enter` / `Space` / `↓` 打开面板并把焦点移入当前日期格
- 网格内：`←` `→` 逐日、`↑` `↓` 逐周、`Home` / `End` 行首行尾、`Enter` / `Space` 选中、`Escape` 关闭并交还焦点
- 触发器 `role="combobox"`（`aria-expanded` / `aria-controls` 指向网格），日期格 `role="gridcell"` + `aria-selected` + 今天 `aria-current="date"`

### Reduced-motion

`prefers-reduced-motion` 时：日期格与导航按钮的过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismInput](./input.md) — 同 `useFormField` 基建的字段组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名与 `useDatePicker`
