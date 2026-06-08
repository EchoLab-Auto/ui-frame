# API 文档

> 本文档面向使用 `@echolab/ui-frame` 进行 UI 构建的开发者，完整列举所有可被外部使用的代码模块、类型定义和接口。

---

## 目录

- [安装与引入](#安装与引入)
- [Vue 组件](#vue-组件)
- [Headless Composables](#headless-composables)
- [组合式函数](#组合式函数)
- [类型导出](#类型导出)
- [工具函数](#工具函数)
- [扩展系统](#扩展系统)
- [配置系统](#配置系统)
- [注入键](#注入键)
- [国际化](#国际化)
- [SCSS 资源](#scss-资源)

---

## 安装与引入

```bash
npm install @echolab/ui-frame
```

```ts
// 全量引入
import { createApp } from 'vue'
import NeumorphismUI from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'

const app = createApp(App)
app.use(NeumorphismUI)
```

```ts
// 按需引入
import { NeumorphismButton, NeumorphismCard, useTheme } from '@echolab/ui-frame'
import '@echolab/ui-frame/dist/style.css'
```

---

## Vue 组件

### 基础输入

#### NeumorphismButton

```ts
import { NeumorphismButton } from '@echolab/ui-frame'
import type {
  NeumorphismButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from '@echolab/ui-frame'
```

| Props    | Type                              | Default     | Description  |
| -------- | --------------------------------- | ----------- | ------------ |
| variant  | `'raised' \| 'flat' \| 'pressed'` | `'raised'`  | 阴影变体     |
| size     | `'small' \| 'medium' \| 'large'`  | `'medium'`  | 按钮尺寸     |
| shape    | `'rounded' \| 'pill' \| 'circle'` | `'rounded'` | 按钮形状     |
| disabled | `boolean`                         | `false`     | 是否禁用     |
| loading  | `boolean`                         | `false`     | 是否加载中   |
| type     | `'button' \| 'submit' \| 'reset'` | `'button'`  | 原生按钮类型 |

**Events:** `click`

---

#### NeumorphismSwitch

```ts
import { NeumorphismSwitch } from '@echolab/ui-frame'
import type { NeumorphismSwitchProps } from '@echolab/ui-frame'
```

| Props        | Type                             | Default    | Description  |
| ------------ | -------------------------------- | ---------- | ------------ |
| modelValue   | `boolean`                        | `false`    | 绑定值       |
| disabled     | `boolean`                        | `false`    | 是否禁用     |
| activeText   | `string`                         | —          | 开启状态文本 |
| inactiveText | `string`                         | —          | 关闭状态文本 |
| size         | `'small' \| 'medium' \| 'large'` | `'medium'` | 开关尺寸     |

**Events:** `update:modelValue`, `change`

---

#### NeumorphismCheckbox

```ts
import { NeumorphismCheckbox } from '@echolab/ui-frame'
import type { NeumorphismCheckboxProps } from '@echolab/ui-frame'
```

| Props         | Type                             | Default    | Description |
| ------------- | -------------------------------- | ---------- | ----------- |
| modelValue    | `boolean`                        | `false`    | 绑定值      |
| disabled      | `boolean`                        | `false`    | 是否禁用    |
| size          | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸        |
| label         | `string`                         | —          | 标签文字    |
| indeterminate | `boolean`                        | `false`    | 半选状态    |

**Events:** `update:modelValue`, `change`

---

#### NeumorphismRadio

```ts
import { NeumorphismRadio, NeumorphismRadioGroup } from '@echolab/ui-frame'
import type { NeumorphismRadioProps, NeumorphismRadioGroupProps } from '@echolab/ui-frame'
```

**NeumorphismRadio:**

| Props    | Type                             | Default    | Description |
| -------- | -------------------------------- | ---------- | ----------- |
| value    | `unknown`                        | —          | 选项值      |
| label    | `string`                         | —          | 标签文字    |
| disabled | `boolean`                        | `false`    | 是否禁用    |
| size     | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸        |

**NeumorphismRadioGroup:**

| Props      | Type                             | Default        | Description    |
| ---------- | -------------------------------- | -------------- | -------------- |
| modelValue | `unknown`                        | —              | 绑定值         |
| direction  | `'horizontal' \| 'vertical'`     | `'horizontal'` | 排列方向       |
| disabled   | `boolean`                        | `false`        | 是否禁用整组   |
| size       | `'small' \| 'medium' \| 'large'` | `'medium'`     | 组内单选框尺寸 |

**Events:** `update:modelValue`, `change`

---

#### NeumorphismInput

```ts
import { NeumorphismInput } from '@echolab/ui-frame'
import type { NeumorphismInputProps, InputSize } from '@echolab/ui-frame'
```

| Props       | Type                             | Default    | Description    |
| ----------- | -------------------------------- | ---------- | -------------- |
| modelValue  | `string`                         | `''`       | 绑定值         |
| type        | `string`                         | `'text'`   | 输入类型       |
| placeholder | `string`                         | —          | 占位符         |
| disabled    | `boolean`                        | `false`    | 是否禁用       |
| readonly    | `boolean`                        | `false`    | 是否只读       |
| required    | `boolean`                        | `false`    | 是否必填       |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 输入框尺寸     |
| label       | `string`                         | —          | 标签文字       |
| error       | `string \| boolean`              | —          | 错误信息或状态 |

**Slots:** `prefix`, `suffix`

**Events:** `update:modelValue`, `focus`, `blur`, `input`, `change`, `keydown`, `enter`

---

#### NeumorphismTextarea

```ts
import { NeumorphismTextarea } from '@echolab/ui-frame'
import type { NeumorphismTextareaProps } from '@echolab/ui-frame'
```

| Props       | Type                             | Default    | Description      |
| ----------- | -------------------------------- | ---------- | ---------------- |
| modelValue  | `string`                         | `''`       | 绑定值           |
| placeholder | `string`                         | —          | 占位符           |
| disabled    | `boolean`                        | `false`    | 是否禁用         |
| readonly    | `boolean`                        | `false`    | 是否只读         |
| required    | `boolean`                        | `false`    | 是否必填         |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸             |
| label       | `string`                         | —          | 标签文字         |
| error       | `string \| boolean`              | —          | 错误信息或状态   |
| rows        | `number`                         | `4`        | 行数             |
| maxlength   | `number`                         | —          | 最大长度         |
| showCount   | `boolean`                        | `false`    | 是否显示字数统计 |
| autoResize  | `boolean`                        | `false`    | 是否自动调整高度 |

**Events:** `update:modelValue`, `focus`, `blur`, `input`, `change`, `keydown`, `enter`

---

#### NeumorphismSelect

```ts
import { NeumorphismSelect } from '@echolab/ui-frame'
import type { NeumorphismSelectProps, NeumorphismSelectOption } from '@echolab/ui-frame'
```

| Props       | Type                             | Default    | Description    |
| ----------- | -------------------------------- | ---------- | -------------- |
| modelValue  | `string \| number`               | `''`       | 绑定值         |
| options     | `SelectOption[]`                 | `[]`       | 选项列表       |
| placeholder | `string`                         | —          | 占位符         |
| disabled    | `boolean`                        | `false`    | 是否禁用       |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸           |
| clearable   | `boolean`                        | `false`    | 是否可清空     |
| label       | `string`                         | —          | 标签文字       |
| error       | `string \| boolean`              | —          | 错误信息或状态 |
| emptyText   | `string`                         | —          | 空选项提示文字 |

```ts
interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}
```

**Slots:** `option` (scope: `{ option, selected }`)

**Events:** `update:modelValue`, `change`, `focus`, `blur`

---

### 表单

#### NeumorphismForm / NeumorphismFormItem

```ts
import { NeumorphismForm, NeumorphismFormItem } from '@echolab/ui-frame'
import type { NeumorphismFormProps, NeumorphismFormItemProps, FormRule } from '@echolab/ui-frame'
```

**NeumorphismForm:**

| Props     | Type                         | Default      | Description  |
| --------- | ---------------------------- | ------------ | ------------ |
| model     | `Record<string, unknown>`    | `{}`         | 表单数据     |
| rules     | `Record<string, FormRule[]>` | `{}`         | 字段验证规则 |
| direction | `'vertical' \| 'horizontal'` | `'vertical'` | 排列方向     |

**NeumorphismFormItem:**

| Props    | Type                | Default | Description  |
| -------- | ------------------- | ------- | ------------ |
| label    | `string`            | —       | 标签文字     |
| name     | `string`            | —       | 字段名       |
| required | `boolean`           | `false` | 是否必填     |
| rules    | `FormRule[]`        | —       | 字段验证规则 |
| error    | `string \| boolean` | —       | 错误信息     |

```ts
interface FormRule {
  required?: boolean
  message?: string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: unknown) => boolean
}
```

**Events:** `submit`, `validate`

---

### 数据展示

#### NeumorphismCard

```ts
import { NeumorphismCard } from '@echolab/ui-frame'
import type { NeumorphismCardProps, CardVariant, CardDepth } from '@echolab/ui-frame'
```

| Props     | Type                                     | Default   | Description                        |
| --------- | ---------------------------------------- | --------- | ---------------------------------- |
| elevation | `number`                                 | `2`       | 台阶高度：正=凸起，负=凹陷，0=平齐 |
| hoverable | `boolean \| 'bulge' \| 'sink'`           | `false`   | 悬停动效模式                       |
| radius    | `'small' \| 'medium' \| 'large' \| 'xl'` | `'large'` | 圆角大小                           |
| noPadding | `boolean`                                | `false`   | 是否移除内边距                     |

**Slots:** `header`, default, `footer`

**台阶高度对照表：**

| elevation | 效果     | 阴影强度  |
| --------- | -------- | --------- |
| 4         | 强凸起   | 16px/36px |
| 3         | 中强凸起 | 12px/28px |
| 2         | 默认凸起 | 8px/20px  |
| 1         | 轻微凸起 | 4px/10px  |
| 0         | 平齐     | 无        |
| -1        | 轻微凹陷 | 4px/10px  |
| -2        | 默认凹陷 | 8px/20px  |
| -3        | 中强凹陷 | 12px/28px |
| -4        | 强凹陷   | 16px/36px |

---

#### NeumorphismAvatar

```ts
import { NeumorphismAvatar } from '@echolab/ui-frame'
import type { NeumorphismAvatarProps, AvatarSize } from '@echolab/ui-frame'
```

| Props    | Type                             | Default    | Description |
| -------- | -------------------------------- | ---------- | ----------- |
| src      | `string`                         | —          | 图片地址    |
| alt      | `string`                         | —          | 替代文本    |
| initials | `string`                         | —          | 首字母回退  |
| size     | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸        |
| shape    | `'circle' \| 'rounded'`          | `'circle'` | 形状        |

**Events:** `error`

---

#### NeumorphismBadge

```ts
import { NeumorphismBadge } from '@echolab/ui-frame'
import type { NeumorphismBadgeProps } from '@echolab/ui-frame'
```

| Props    | Type               | Default | Description         |
| -------- | ------------------ | ------- | ------------------- |
| value    | `string \| number` | —       | 徽标值              |
| max      | `number`           | `99`    | 最大值（超出显示+） |
| dot      | `boolean`          | `false` | 圆点模式            |
| showZero | `boolean`          | `false` | 值为0时是否显示     |

---

#### NeumorphismTag

```ts
import { NeumorphismTag } from '@echolab/ui-frame'
import type { NeumorphismTagProps, TagVariant } from '@echolab/ui-frame'
```

| Props    | Type                                                                    | Default     | Description |
| -------- | ----------------------------------------------------------------------- | ----------- | ----------- |
| variant  | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 颜色变体    |
| size     | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | 尺寸        |
| closable | `boolean`                                                               | `false`     | 是否可关闭  |
| disabled | `boolean`                                                               | `false`     | 是否禁用    |
| rounded  | `boolean`                                                               | `false`     | 是否圆角    |

**Events:** `close`, `click`

---

#### NeumorphismProgress

```ts
import { NeumorphismProgress } from '@echolab/ui-frame'
import type { NeumorphismProgressProps, ProgressVariant } from '@echolab/ui-frame'
```

| Props         | Type                                                          | Default     | Description    |
| ------------- | ------------------------------------------------------------- | ----------- | -------------- |
| modelValue    | `number`                                                      | `0`         | 当前值         |
| max           | `number`                                                      | `100`       | 最大值         |
| variant       | `'primary' \| 'success' \| 'warning' \| 'error' \| 'default'` | `'primary'` | 颜色变体       |
| size          | `'small' \| 'medium' \| 'large'`                              | `'medium'`  | 尺寸           |
| showLabel     | `boolean`                                                     | `false`     | 是否显示百分比 |
| indeterminate | `boolean`                                                     | `false`     | 不确定模式     |
| striped       | `boolean`                                                     | `false`     | 条纹动画       |

---

#### NeumorphismSkeleton

```ts
import { NeumorphismSkeleton } from '@echolab/ui-frame'
import type { NeumorphismSkeletonProps } from '@echolab/ui-frame'
```

| Props     | Type                           | Default   | Description |
| --------- | ------------------------------ | --------- | ----------- |
| variant   | `'text' \| 'rect' \| 'circle'` | `'text'`  | 形状变体    |
| width     | `string \| number`             | —         | 宽度        |
| height    | `string \| number`             | —         | 高度        |
| animation | `'pulse' \| 'wave' \| 'none'`  | `'pulse'` | 动画类型    |
| count     | `number`                       | `1`       | 重复数量    |

---

#### NeumorphismTable

```ts
import { NeumorphismTable } from '@echolab/ui-frame'
import type { NeumorphismTableProps } from '@echolab/ui-frame'
```

| Props        | Type                             | Default      | Description    |
| ------------ | -------------------------------- | ------------ | -------------- |
| data         | `Record<string, unknown>[]`      | `[]`         | 数据列表       |
| columns      | `TableColumn[]`                  | `[]`         | 列定义         |
| rowKey       | `string`                         | `'key'`      | 行唯一标识字段 |
| selectable   | `boolean`                        | `false`      | 是否可选择行   |
| selectedKeys | `string[]`                       | `[]`         | 选中行的 keys  |
| loading      | `boolean`                        | `false`      | 加载状态       |
| emptyText    | `string`                         | `'暂无数据'` | 空数据提示     |
| size         | `'small' \| 'medium' \| 'large'` | `'medium'`   | 尺寸           |
| striped      | `boolean`                        | `false`      | 斑马纹         |
| hoverable    | `boolean`                        | `true`       | 悬停高亮       |
| showHeader   | `boolean`                        | `true`       | 是否显示表头   |

```ts
interface TableColumn {
  key: string
  title: string
  width?: string | number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}
```

**Events:** `update:selectedKeys`, `select`, `selectAll`, `sort`

---

#### NeumorphismDivider

```ts
import { NeumorphismDivider } from '@echolab/ui-frame'
import type { NeumorphismDividerProps, DividerDirection, DividerAlign } from '@echolab/ui-frame'
```

| Props     | Type                            | Default        | Description |
| --------- | ------------------------------- | -------------- | ----------- |
| direction | `'horizontal' \| 'vertical'`    | `'horizontal'` | 方向        |
| align     | `'left' \| 'center' \| 'right'` | `'center'`     | 文字对齐    |
| dashed    | `boolean`                       | `false`        | 虚线        |
| inset     | `boolean`                       | `false`        | 缩进模式    |

**Slots:** default（分割线中间的文字）

---

### 导航

#### NeumorphismTabs

```ts
import { NeumorphismTabs } from '@echolab/ui-frame'
import type { NeumorphismTabsProps, TabItem } from '@echolab/ui-frame'
```

| Props      | Type                                     | Default    | Description    |
| ---------- | ---------------------------------------- | ---------- | -------------- |
| modelValue | `string`                                 | `''`       | 当前激活 key   |
| tabs       | `TabItem[]`                              | `[]`       | 标签页数据     |
| position   | `'top' \| 'left' \| 'bottom' \| 'right'` | `'top'`    | 标签位置       |
| size       | `'small' \| 'medium' \| 'large'`         | `'medium'` | 尺寸           |
| navLabel   | `string`                                 | —          | 导航 ARIA 标签 |

```ts
interface TabItem {
  key: string
  label: string
  disabled?: boolean
}
```

**Events:** `update:modelValue`, `change`, `tabClick`

---

#### NeumorphismBreadcrumb

```ts
import { NeumorphismBreadcrumb } from '@echolab/ui-frame'
import type { NeumorphismBreadcrumbProps, BreadcrumbItem } from '@echolab/ui-frame'
```

| Props     | Type                             | Default    | Description |
| --------- | -------------------------------- | ---------- | ----------- |
| items     | `BreadcrumbItem[]`               | `[]`       | 面包屑项    |
| separator | `string`                         | `'/'`      | 分隔符      |
| size      | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸        |

```ts
interface BreadcrumbItem {
  label: string
  to?: string
  disabled?: boolean
}
```

**Events:** `itemClick`

---

#### NeumorphismPagination

```ts
import { NeumorphismPagination } from '@echolab/ui-frame'
import type { NeumorphismPaginationProps } from '@echolab/ui-frame'
```

| Props           | Type                             | Default    | Description    |
| --------------- | -------------------------------- | ---------- | -------------- |
| modelValue      | `number`                         | `1`        | 当前页码       |
| total           | `number`                         | `0`        | 总记录数       |
| pageSize        | `number`                         | `10`       | 每页条数       |
| size            | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸           |
| showTotal       | `boolean`                        | `false`    | 是否显示总数   |
| showJumper      | `boolean`                        | `false`    | 是否显示跳转   |
| maxVisiblePages | `number`                         | `7`        | 最大可见页码数 |
| disabled        | `boolean`                        | `false`    | 是否禁用       |

**Slots:** `page-item` (scope: `{ page, active }`)

**Events:** `update:modelValue`, `change`

---

### 反馈

#### NeumorphismModal

```ts
import { NeumorphismModal } from '@echolab/ui-frame'
import type { NeumorphismModalProps } from '@echolab/ui-frame'
```

| Props          | Type                             | Default    | Description    |
| -------------- | -------------------------------- | ---------- | -------------- |
| modelValue     | `boolean`                        | `false`    | 是否显示       |
| title          | `string`                         | —          | 标题           |
| size           | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸           |
| closable       | `boolean`                        | `true`     | 是否可关闭     |
| maskClosable   | `boolean`                        | `true`     | 点击遮罩关闭   |
| showClose      | `boolean`                        | `true`     | 显示关闭按钮   |
| destroyOnClose | `boolean`                        | `false`    | 关闭时销毁内容 |
| footer         | `boolean`                        | `true`     | 显示底部按钮   |
| closeLabel     | `string`                         | —          | 关闭按钮文字   |
| cancelLabel    | `string`                         | —          | 取消按钮文字   |
| confirmLabel   | `string`                         | —          | 确认按钮文字   |

**Slots:** `header`, default, `footer`

**Events:** `update:modelValue`, `open`, `close`, `confirm`, `cancel`

---

#### NeumorphismToastProvider

```ts
import { NeumorphismToastProvider } from '@echolab/ui-frame'
import type {
  NeumorphismToastProviderProps,
  ToastOptions,
  ToastType,
  ToastPosition,
  ToastItem,
} from '@echolab/ui-frame'
```

| Props      | Type            | Default       | Description    |
| ---------- | --------------- | ------------- | -------------- |
| position   | `ToastPosition` | `'top-right'` | 显示位置       |
| maxCount   | `number`        | `5`           | 最大同时显示数 |
| closeLabel | `string`        | —             | 关闭按钮标签   |

```ts
type ToastType = 'info' | 'success' | 'warning' | 'error'
type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
  leaving?: boolean
}
```

**Methods (ref):**

| Method      | Signature                      | Description  |
| ----------- | ------------------------------ | ------------ |
| addToast    | `(opts: ToastOptions) => void` | 添加一条消息 |
| removeToast | `(id: string) => void`         | 移除指定消息 |
| clearAll    | `() => void`                   | 清除所有消息 |

**Slots:** `toast-item` (scope: `{ toast, remove }`)

---

#### NeumorphismTooltip

```ts
import { NeumorphismTooltip } from '@echolab/ui-frame'
import type { NeumorphismTooltipProps, TooltipPosition, TooltipTrigger } from '@echolab/ui-frame'
```

| Props    | Type              | Default   | Description  |
| -------- | ----------------- | --------- | ------------ |
| content  | `string`          | —         | 提示内容     |
| position | `TooltipPosition` | `'top'`   | 显示位置     |
| trigger  | `TooltipTrigger`  | `'hover'` | 触发方式     |
| disabled | `boolean`         | `false`   | 是否禁用     |
| offset   | `number`          | `8`       | 偏移距离(px) |
| delay    | `number`          | `150`     | 显示延迟(ms) |

```ts
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipTrigger = 'hover' | 'click' | 'focus'
```

**Slots:** default, `content`

---

#### NeumorphismCollapse

```ts
import { NeumorphismCollapse } from '@echolab/ui-frame'
import type { NeumorphismCollapseProps, CollapseItem } from '@echolab/ui-frame'
```

| Props      | Type                             | Default    | Description |
| ---------- | -------------------------------- | ---------- | ----------- |
| modelValue | `string[]`                       | `[]`       | 展开的 keys |
| items      | `CollapseItem[]`                 | `[]`       | 面板项      |
| accordion  | `boolean`                        | `false`    | 手风琴模式  |
| size       | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸        |

```ts
interface CollapseItem {
  key: string
  title: string
  disabled?: boolean
}
```

**Slots:** `[key]`（key 为 item.key）

**Events:** `update:modelValue`, `change`

---

### 布局

#### NeumorphismContainer

```ts
import { NeumorphismContainer } from '@echolab/ui-frame'
import type { NeumorphismContainerProps } from '@echolab/ui-frame'
```

| Props     | Type                 | Default   | Description                                  |
| --------- | -------------------- | --------- | -------------------------------------------- |
| mode      | `'fixed' \| 'fluid'` | `'fixed'` | fixed 模式下根据断点限制最大宽度，fluid 全宽 |
| noPadding | `boolean`            | `false`   | 是否移除内边距                               |
| tag       | `string`             | `'div'`   | 自定义渲染标签                               |

---

#### NeumorphismRow / NeumorphismCol

```ts
import { NeumorphismRow, NeumorphismCol } from '@echolab/ui-frame'
import type {
  NeumorphismRowProps,
  RowAlign,
  RowJustify,
  NeumorphismColProps,
  ColSpan,
  ColOffset,
} from '@echolab/ui-frame'
```

**NeumorphismRow:**

| Props   | Type                         | Default     | Description                     |
| ------- | ---------------------------- | ----------- | ------------------------------- |
| gutter  | `number \| [number, number]` | `0`         | 列间距（px），支持 [水平, 垂直] |
| justify | `RowJustify`                 | `'start'`   | 水平排列方式                    |
| align   | `RowAlign`                   | `'stretch'` | 垂直对齐方式                    |
| wrap    | `boolean`                    | `true`      | 是否换行                        |

**NeumorphismCol:**

| Props  | Type     | Default | Description          |
| ------ | -------- | ------- | -------------------- |
| span   | `number` | `24`    | 栅格占位格数（1-24） |
| offset | `number` | —       | 左侧偏移格数         |
| xs     | `number` | —       | `<576px` 断点下占位  |
| sm     | `number` | —       | `≥576px` 断点下占位  |
| md     | `number` | —       | `≥768px` 断点下占位  |
| lg     | `number` | —       | `≥992px` 断点下占位  |
| xl     | `number` | —       | `≥1200px` 断点下占位 |
| xxl    | `number` | —       | `≥1400px` 断点下占位 |

---

#### NeumorphismLayout

```ts
import { NeumorphismLayout } from '@echolab/ui-frame'
import type { NeumorphismLayoutProps } from '@echolab/ui-frame'
```

| Props              | Type      | Default | Description              |
| ------------------ | --------- | ------- | ------------------------ |
| showHeader         | `boolean` | `true`  | 是否显示顶部导航         |
| showSider          | `boolean` | `false` | 是否显示侧边栏           |
| showFooter         | `boolean` | `false` | 是否显示底部             |
| siderWidth         | `number`  | `240`   | 侧边栏宽度（px）         |
| collapsible        | `boolean` | `false` | 侧边栏是否可折叠         |
| defaultCollapsed   | `boolean` | `false` | 侧边栏默认是否折叠       |
| collapsedWidth     | `number`  | `64`    | 折叠后的宽度（px）       |
| mobileAutoCollapse | `boolean` | `true`  | 移动端是否自动折叠侧边栏 |

**Slots:** `header-left`, `header-center`, `header-right`, `sider` (prop: `{ collapsed }`), default, `footer`

---

### 扩展

#### NeumorphismThemeToggle

```ts
import { NeumorphismThemeToggle } from '@echolab/ui-frame'
import type { NeumorphismThemeToggleProps } from '@echolab/ui-frame'
```

| Props       | Type                             | Default    | Description      |
| ----------- | -------------------------------- | ---------- | ---------------- |
| modelValue  | `'light' \| 'dark' \| 'auto'`    | `'auto'`   | 当前主题模式     |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸             |
| disableAuto | `boolean`                        | `false`    | 禁用自动模式选项 |
| disabled    | `boolean`                        | `false`    | 是否禁用         |

**Events:** `update:modelValue`, `change`

---

#### NeumorphismTree / NeumorphismTreeNode

```ts
import { NeumorphismTree, NeumorphismTreeNode } from '@echolab/ui-frame'
import type {
  NeumorphismTreeProps,
  NeumorphismTreeNodeProps,
  TreeNodeData,
} from '@echolab/ui-frame'
```

| Props             | Type             | Default | Description    |
| ----------------- | ---------------- | ------- | -------------- |
| data              | `TreeNodeData[]` | `[]`    | 树形数据       |
| selectedKeys      | `string[]`       | `[]`    | 选中节点 keys  |
| expandedKeys      | `string[]`       | `[]`    | 展开节点 keys  |
| showSearch        | `boolean`        | `false` | 是否显示搜索框 |
| searchPlaceholder | `string`         | —       | 搜索占位符     |
| multiple          | `boolean`        | `false` | 是否多选       |

```ts
interface TreeNodeData {
  key: string
  label: string
  children?: TreeNodeData[]
  disabled?: boolean
}
```

**Events:** `update:selectedKeys`, `update:expandedKeys`, `node-click`, `node-select`

---

#### NeumorphismCanvas

```ts
import { NeumorphismCanvas } from '@echolab/ui-frame'
import type { NeumorphismCanvasProps } from '@echolab/ui-frame'
```

| Props        | Type      | Default   | Description      |
| ------------ | --------- | --------- | ---------------- |
| modelValue   | `number`  | `1`       | 缩放比例         |
| minZoom      | `number`  | `0.1`     | 最小缩放         |
| maxZoom      | `number`  | `5`       | 最大缩放         |
| zoomStep     | `number`  | `0.1`     | 缩放步长         |
| showGrid     | `boolean` | `true`    | 是否显示网格     |
| gridSize     | `number`  | `20`      | 网格大小(px)     |
| showControls | `boolean` | `true`    | 是否显示控制按钮 |
| width        | `string`  | `'100%'`  | 宽度             |
| height       | `string`  | `'500px'` | 高度             |

**Events:** `update:modelValue`, `zoom-change`

---

### 主题

#### ThemeProvider

```ts
import { ThemeProvider } from '@echolab/ui-frame'
import type { ThemeProviderProps } from '@echolab/ui-frame'
```

| Props        | Type                          | Default                 | Description         |
| ------------ | ----------------------------- | ----------------------- | ------------------- |
| defaultTheme | `'light' \| 'dark' \| 'auto'` | `'auto'`                | 默认主题            |
| storageKey   | `string`                      | `'nm-theme-preference'` | localStorage 存储键 |
| followSystem | `boolean`                     | `true`                  | 是否跟随系统偏好    |

**Slot props:** `{ isDark, toggleTheme, setTheme, theme, currentTheme }`

---

## Headless Composables

Headless Composables 将业务逻辑与 UI 完全解耦，封装了键盘导航、ARIA、状态管理等行为，开发者只需关心 UI 渲染。

### useSelect

```ts
import { useSelect } from '@echolab/ui-frame'
import type { UseSelectOptions, UseSelectReturn, SelectOption } from '@echolab/ui-frame'
```

```ts
interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface UseSelectOptions {
  modelValue: Ref<string | number>
  options: ComputedRef<SelectOption[]> | Ref<SelectOption[]>
  disabled?: Ref<boolean>
}

interface UseSelectReturn {
  isOpen: Ref<boolean>
  selectedOption: ComputedRef<SelectOption | undefined>
  toggleOpen: () => void
  selectOption: (option: SelectOption) => void
  handleKeydown: (e: KeyboardEvent) => void
  handleBlur: (relatedTarget: EventTarget | null, currentTarget: HTMLElement) => void
}
```

---

### useTabs

```ts
import { useTabs } from '@echolab/ui-frame'
import type { UseTabsOptions, UseTabsReturn } from '@echolab/ui-frame'
```

```ts
interface UseTabsOptions {
  modelValue: Ref<string>
  tabs: Ref<TabItem[]> | ComputedRef<TabItem[]>
}

interface UseTabsReturn {
  activeKey: ComputedRef<string>
  activate: (key: string) => void
  handleKeydown: (e: KeyboardEvent) => void
}
```

---

### usePagination

```ts
import { usePagination } from '@echolab/ui-frame'
import type { UsePaginationOptions, UsePaginationReturn } from '@echolab/ui-frame'
```

```ts
interface UsePaginationOptions {
  modelValue: Ref<number>
  total: ComputedRef<number> | Ref<number>
  pageSize: ComputedRef<number> | Ref<number>
}

interface UsePaginationReturn {
  totalPages: ComputedRef<number>
  currentPage: ComputedRef<number>
  visiblePages: ComputedRef<(number | string)[]>
  changePage: (page: number) => void
  prevPage: () => void
  nextPage: () => void
  isPrevDisabled: ComputedRef<boolean>
  isNextDisabled: ComputedRef<boolean>
}
```

---

### useTree

```ts
import { useTree } from '@echolab/ui-frame'
import type { UseTreeOptions, UseTreeReturn } from '@echolab/ui-frame'
```

```ts
interface UseTreeOptions {
  data: Ref<TreeNodeData[]> | ComputedRef<TreeNodeData[]>
  expandedKeys: Ref<string[]>
  selectedKeys: Ref<string[]>
  multiple?: boolean
}

interface UseTreeReturn {
  localExpandedKeys: Ref<string[]>
  localSelectedKeys: Ref<string[]>
  searchText: Ref<string>
  filteredData: ComputedRef<TreeNodeData[]>
  toggleExpand: (key: string) => void
  toggleSelect: (key: string) => void
  isExpanded: (key: string) => boolean
  isSelected: (key: string) => boolean
}
```

---

### useTable

```ts
import { useTable } from '@echolab/ui-frame'
import type {
  UseTableOptions,
  UseTableReturn,
  TableColumn,
  SortDirection,
  SortState,
} from '@echolab/ui-frame'
```

```ts
type SortDirection = 'asc' | 'desc' | null
type SelectionMode = 'single' | 'multiple' | 'none'

interface SortState {
  key: string
  direction: SortDirection
}

interface UseTableOptions {
  data: Ref<Record<string, unknown>[]> | ComputedRef<Record<string, unknown>[]>
  columns: Ref<TableColumn[]> | ComputedRef<TableColumn[]>
  sortable?: boolean
  selectable?: SelectionMode
}

interface UseTableReturn {
  sortedData: ComputedRef<Record<string, unknown>[]>
  sortState: Ref<SortState>
  handleSort: (key: string) => void
  selectedKeys: Ref<string[]>
  toggleSelect: (key: string) => void
  selectAll: () => void
  isSelected: (key: string) => boolean
}
```

---

### useCollapse

```ts
import { useCollapse } from '@echolab/ui-frame'
import type { UseCollapseOptions, UseCollapseReturn } from '@echolab/ui-frame'
```

```ts
interface UseCollapseOptions {
  modelValue: Ref<string[]>
  items: Ref<CollapseItem[]> | ComputedRef<CollapseItem[]>
  accordion?: boolean
}

interface UseCollapseReturn {
  toggle: (key: string) => void
  isActive: (key: string) => boolean
}
```

---

### useModal

```ts
import { useModal } from '@echolab/ui-frame'
import type { UseModalOptions, UseModalReturn } from '@echolab/ui-frame'
```

```ts
interface UseModalOptions {
  maskClosable?: boolean
  closable?: boolean
}

interface UseModalReturn {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
  handleKeydown: (e: KeyboardEvent) => void
  handleMaskClick: (e: MouseEvent) => void
}
```

---

### useToast

```ts
import { useToast } from '@echolab/ui-frame'
import type { UseToastOptions, UseToastReturn, ToastOptions, ToastItem } from '@echolab/ui-frame'
```

```ts
interface UseToastOptions {
  maxCount?: number
}

interface UseToastReturn {
  toasts: Ref<ToastItem[]>
  addToast: (opts: ToastOptions) => void
  removeToast: (id: string) => void
}
```

---

### useTooltip

```ts
import { useTooltip } from '@echolab/ui-frame'
import type { UseTooltipOptions, UseTooltipReturn } from '@echolab/ui-frame'
```

```ts
interface UseTooltipOptions {
  disabled?: ComputedRef<boolean>
  delay?: number
  trigger?: ComputedRef<'hover' | 'click' | 'focus'>
}

interface UseTooltipReturn {
  isVisible: Ref<boolean>
  show: () => void
  hide: () => void
  toggle: () => void
  handleKeydown: (e: KeyboardEvent) => void
}
```

---

## 组合式函数

### useTheme

```ts
import { useTheme } from '@echolab/ui-frame'
import type { Theme, ThemeOptions, ThemeContext } from '@echolab/ui-frame'
```

```ts
type Theme = 'light' | 'dark' | 'auto'

function useTheme(): ThemeContext

interface ThemeContext {
  isDark: Ref<boolean>
  theme: Ref<Theme>
  currentTheme: Ref<'light' | 'dark'>
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}
```

**相关函数：**

| 函数         | 签名                                       | 说明                     |
| ------------ | ------------------------------------------ | ------------------------ |
| provideTheme | `(options?: ThemeOptions) => ThemeContext` | 在父组件中提供主题上下文 |
| createTheme  | `(options?: ThemeOptions) => ThemeContext` | 创建独立的主题上下文     |

---

### useTouchDevice

```ts
import { useTouchDevice } from '@echolab/ui-frame'
```

```ts
function useTouchDevice(): {
  isTouch: Ref<boolean>
  isMobile: Ref<boolean>
}
```

---

### useCheckable

```ts
import { useCheckable } from '@echolab/ui-frame'
import type { UseCheckableOptions } from '@echolab/ui-frame'
```

```ts
interface UseCheckableOptions {
  modelValue: Ref<boolean | unknown[]>
  value?: unknown
  indeterminate?: Ref<boolean>
}

function useCheckable(opts: UseCheckableOptions): {
  isChecked: ComputedRef<boolean>
  isIndeterminate: ComputedRef<boolean>
  toggle: () => void
}
```

---

### useFormField

```ts
import { useFormField } from '@echolab/ui-frame'
import type { FormFieldConfig, FieldSize } from '@echolab/ui-frame'
```

```ts
interface FormFieldConfig {
  name: string
  hasError?: boolean
  hasLabel?: boolean
  hasDescription?: boolean
}

function useFormField(config: FormFieldConfig): {
  fieldId: string
  labelId: string
  errorId: string
  describedBy: string
}
```

---

### validateFieldValue

```ts
import { validateFieldValue } from '@echolab/ui-frame'
import type { FormRule } from '@echolab/ui-frame'
```

```ts
function validateFieldValue(value: unknown, rules: FormRule[]): string | undefined
```

---

## 类型导出

### 组件 Props 类型

| 类型名                          | 来源组件      |
| ------------------------------- | ------------- |
| `NeumorphismButtonProps`        | Button        |
| `ButtonVariant`                 | Button        |
| `ButtonSize`                    | Button        |
| `ButtonShape`                   | Button        |
| `NeumorphismSwitchProps`        | Switch        |
| `NeumorphismCardProps`          | Card          |
| `CardVariant`                   | Card          |
| `CardDepth`                     | Card          |
| `NeumorphismInputProps`         | Input         |
| `InputSize`                     | Input         |
| `NeumorphismCheckboxProps`      | Checkbox      |
| `NeumorphismRadioProps`         | Radio         |
| `NeumorphismRadioGroupProps`    | RadioGroup    |
| `NeumorphismSelectProps`        | Select        |
| `NeumorphismSelectOption`       | Select        |
| `NeumorphismTextareaProps`      | Textarea      |
| `NeumorphismFormProps`          | Form          |
| `NeumorphismFormItemProps`      | FormItem      |
| `FormRule`                      | Form          |
| `NeumorphismModalProps`         | Modal         |
| `NeumorphismToastProviderProps` | ToastProvider |
| `NeumorphismTooltipProps`       | Tooltip       |
| `NeumorphismTabsProps`          | Tabs          |
| `NeumorphismBreadcrumbProps`    | Breadcrumb    |
| `NeumorphismPaginationProps`    | Pagination    |
| `NeumorphismAvatarProps`        | Avatar        |
| `NeumorphismBadgeProps`         | Badge         |
| `NeumorphismTagProps`           | Tag           |
| `NeumorphismProgressProps`      | Progress      |
| `NeumorphismSkeletonProps`      | Skeleton      |
| `NeumorphismTableProps`         | Table         |
| `NeumorphismDividerProps`       | Divider       |
| `NeumorphismCollapseProps`      | Collapse      |
| `NeumorphismContainerProps`     | Container     |
| `NeumorphismRowProps`           | Row           |
| `NeumorphismColProps`           | Col           |
| `NeumorphismLayoutProps`        | Layout        |
| `NeumorphismThemeToggleProps`   | ThemeToggle   |
| `NeumorphismTreeProps`          | Tree          |
| `NeumorphismTreeNodeProps`      | TreeNode      |
| `NeumorphismCanvasProps`        | Canvas        |

### 通用类型

| 类型名                     | 说明                          |
| -------------------------- | ----------------------------- |
| `Theme`                    | `'light' \| 'dark' \| 'auto'` |
| `ThemeOptions`             | 主题配置选项                  |
| `ThemeContext`             | 主题上下文                    |
| `NeumorphismGlobalConfig`  | 全局配置对象                  |
| `NeumorphismPluginOptions` | 插件选项（新版）              |
| `ComponentOverrides`       | 组件覆盖映射                  |
| `NeumorphismSetupContext`  | 组件构建上下文                |

---

## 工具函数

```ts
import { generateId, debounce, isEmpty } from '@echolab/ui-frame'
```

| 函数       | 签名                                                                  | 说明                                                    |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| generateId | `(prefix?: string) => string`                                         | 生成唯一 ID，默认前缀 `'nm'`                            |
| debounce   | `<T extends (...args: unknown[]) => void>(fn: T, delay: number) => T` | 防抖函数                                                |
| isEmpty    | `(value: unknown) => boolean`                                         | 判断是否为空值（null/undefined/空字符串/空数组/空对象） |

---

## 扩展系统

### ComponentRegistry

```ts
import { ComponentRegistry } from '@echolab/ui-frame'
```

组件注册表，用于管理自定义组件覆盖。

```ts
class ComponentRegistry {
  register(name: string, component: Component): void
  get(name: string): Component | undefined
  has(name: string): boolean
}
```

### useNeumorphismSetup

```ts
import { useNeumorphismSetup } from '@echolab/ui-frame'
import type { NeumorphismSetupContext } from '@echolab/ui-frame'
```

```ts
function useNeumorphismSetup(): NeumorphismSetupContext

interface NeumorphismSetupContext {
  // 提供统一的组件构建上下文
}
```

### 插件选项

```ts
import type { NeumorphismPluginOptions, ComponentOverrides } from '@echolab/ui-frame'
```

```ts
interface NeumorphismPluginOptions {
  config?: NeumorphismGlobalConfig // 全局配置
  components?: ComponentOverrides // 组件覆盖
  prefix?: string // 组件前缀
}

interface ComponentOverrides {
  [key: string]: Component
}
```

**使用示例：**

```ts
app.use(NeumorphismUI, {
  config: {
    button: { size: 'large' },
  },
  components: {
    NeumorphismButton: MyCustomButton,
  },
  prefix: 'Nm',
  // 注册后组件名为 NmNeumorphismButton
})
```

---

## 配置系统

### useConfig

```ts
import { useConfig, ConfigKey } from '@echolab/ui-frame'
import type { NeumorphismGlobalConfig } from '@echolab/ui-frame'
```

```ts
function useConfig(): ComputedRef<NeumorphismGlobalConfig>
```

在组件内部使用，获取全局配置作为 props 的默认值来源。遵循 **三级级联** 规则：`显式 prop > 全局配置 > 硬编码默认值`。

### NeumorphismGlobalConfig

```ts
interface NeumorphismGlobalConfig {
  button?: { size?: ButtonSize; variant?: ButtonVariant; shape?: ButtonShape }
  switch?: { size?: SwitchSize }
  card?: { elevation?: number; hoverable?: boolean | 'bulge' | 'sink' }
  input?: { size?: InputSize }
  checkbox?: { size?: CheckboxSize }
  radio?: { size?: RadioSize }
  select?: { size?: SelectSize; clearable?: boolean }
  textarea?: { size?: TextareaSize }
  form?: { direction?: 'vertical' | 'horizontal' }
  formItem?: { required?: boolean }
  modal?: { size?: ModalSize; maskClosable?: boolean }
  toast?: { position?: ToastPosition; maxCount?: number }
  tooltip?: { position?: TooltipPosition; trigger?: TooltipTrigger }
  tabs?: { position?: TabPosition; size?: TabSize }
  breadcrumb?: { size?: BreadcrumbSize }
  pagination?: { size?: PaginationSize; showTotal?: boolean }
  avatar?: { size?: AvatarSize; shape?: AvatarShape }
  badge?: { max?: number }
  tag?: { size?: TagSize; variant?: TagVariant }
  progress?: { size?: ProgressSize; variant?: ProgressVariant }
  skeleton?: { animation?: SkeletonAnimation }
  table?: { size?: TableSize; striped?: boolean }
  divider?: { direction?: DividerDirection }
  collapse?: { size?: CollapseSize; accordion?: boolean }
  container?: { mode?: 'fixed' | 'fluid' }
  row?: { gutter?: number | [number, number] }
  layout?: { siderWidth?: number; collapsible?: boolean }
  themeToggle?: { size?: ThemeToggleSize }
  tree?: { showSearch?: boolean; multiple?: boolean }
  canvas?: { showGrid?: boolean; gridSize?: number }
}
```

---

## 注入键

```ts
import { RadioGroupKey, FormKey, RowGutterKey } from '@echolab/ui-frame'
import type { RadioGroupContext, FormContext, RowGutterContext } from '@echolab/ui-frame'
```

用于构建自定义组件时参与本库的协议通信。

| 注入键          | 类型                              | 用途           |
| --------------- | --------------------------------- | -------------- |
| `RadioGroupKey` | `InjectionKey<RadioGroupContext>` | 参与单选框分组 |
| `FormKey`       | `InjectionKey<FormContext>`       | 参与表单验证   |
| `RowGutterKey`  | `InjectionKey<RowGutterContext>`  | 参与栅格间距   |

```ts
interface RadioGroupContext {
  modelValue: Ref<unknown>
  disabled: Ref<boolean>
  size: Ref<string>
  register: (radio: { value: unknown; checked: ComputedRef<boolean> }) => void
}

interface FormContext {
  model: Record<string, unknown>
  rules: Record<string, FormRule[]>
  errors: Record<string, string>
  validateField: (name: string) => boolean
  clearErrors: () => void
}

interface RowGutterContext {
  gutter: Ref<number | [number, number]>
}
```

---

## 国际化

```ts
import {
  useLocale,
  provideLocale,
  getLocaleMessages,
  LocaleKey,
  zhCN,
  enUS,
} from '@echolab/ui-frame'
import type { LocaleMessages, Locale } from '@echolab/ui-frame'
```

| API               | 签名                                 | 说明               |
| ----------------- | ------------------------------------ | ------------------ |
| provideLocale     | `(locale: string) => void`           | 在根组件中提供语言 |
| useLocale         | `() => { t, locale, setLocale }`     | 在子组件中使用     |
| getLocaleMessages | `(locale: string) => LocaleMessages` | 获取指定语言的消息 |
| zhCN              | `LocaleMessages`                     | 中文语言包         |
| enUS              | `LocaleMessages`                     | 英文语言包         |

```ts
type Locale = 'zh-CN' | 'en-US'

type LocaleMessages = Record<string, string>

function useLocale(): {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Ref<Locale>
  setLocale: (locale: Locale) => void
}
```

---

## SCSS 资源

本库提供以下 SCSS 资源供自定义组件使用：

```scss
@use '@echolab/ui-frame/src/styles/variables.scss' as *;
@use '@echolab/ui-frame/src/styles/mixins.scss' as *;
```

### 变量

完整的 CSS 自定义属性列表，参见 [主题系统](#主题系统) 部分。

### Mixins

| Mixin               | 参数                           | 说明                         |
| ------------------- | ------------------------------ | ---------------------------- |
| `nm-screen-sm`      | —                              | `@media (min-width: 576px)`  |
| `nm-screen-md`      | —                              | `@media (min-width: 768px)`  |
| `nm-screen-lg`      | —                              | `@media (min-width: 992px)`  |
| `nm-screen-xl`      | —                              | `@media (min-width: 1200px)` |
| `nm-screen-xxl`     | —                              | `@media (min-width: 1400px)` |
| `nm-touch-device`   | —                              | 触屏设备专属                 |
| `nm-mouse-device`   | —                              | 鼠标设备专属                 |
| `nm-reduced-motion` | —                              | 用户偏好减少动画             |
| `nm-elevation`      | `$level: number`               | 生成新拟态阴影               |
| `nm-surface`        | `$type: 'raised' \| 'pressed'` | 生成新拟态表面               |
| `nm-transition`     | `$name: string`                | 生成统一过渡效果             |
