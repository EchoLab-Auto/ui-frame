# API 文档

> 本文档面向使用 `@echolab-auto/ui-frame` 进行 UI 构建的开发者，完整列举所有可被外部使用的代码模块、类型定义和接口。

---

## 目录

- [安装与引入](#安装与引入)
- [子路径导出](#子路径导出)
- [Vue 组件](#vue-组件)
- [Doc 文档渲染](#doc-文档渲染)
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
npm install @echolab-auto/ui-frame
```

```ts
// 全量引入
import { createApp } from 'vue'
import NeumorphismUI from '@echolab-auto/ui-frame'
import '@echolab-auto/ui-frame/dist/style.css'

const app = createApp(App)
app.use(NeumorphismUI)
```

```ts
// 按需引入
import { NeumorphismButton, NeumorphismCard, useTheme } from '@echolab-auto/ui-frame'
import '@echolab-auto/ui-frame/dist/style.css'
```

---

## 子路径导出

除主入口外，本库还提供以下子路径导出，支持更细粒度的按需引入：

| 子路径                                 | 用途                    | 示例                                                                       |
| -------------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `@echolab-auto/ui-frame/composables/*` | 单独引入某个 composable | `import { useSelect } from '@echolab-auto/ui-frame/composables/useSelect'` |
| `@echolab-auto/ui-frame/extensions`    | 扩展系统                | `import { ComponentRegistry } from '@echolab-auto/ui-frame/extensions'`    |
| `@echolab-auto/ui-frame/utils`         | 工具函数                | `import { debounce } from '@echolab-auto/ui-frame/utils'`                  |
| `@echolab-auto/ui-frame/doc`           | 文档渲染模块            | `import { DocViewer } from '@echolab-auto/ui-frame/doc'`                   |

> 使用子路径导出时仍需引入样式文件：`import '@echolab-auto/ui-frame/dist/style.css'`

---

## Vue 组件

### 基础输入

#### NeumorphismButton

```ts
import { NeumorphismButton } from '@echolab-auto/ui-frame'
import type {
  NeumorphismButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from '@echolab-auto/ui-frame'
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
import { NeumorphismSwitch } from '@echolab-auto/ui-frame'
import type { NeumorphismSwitchProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismCheckbox } from '@echolab-auto/ui-frame'
import type { NeumorphismCheckboxProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismRadio, NeumorphismRadioGroup } from '@echolab-auto/ui-frame'
import type { NeumorphismRadioProps, NeumorphismRadioGroupProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismInput } from '@echolab-auto/ui-frame'
import type { NeumorphismInputProps, InputSize } from '@echolab-auto/ui-frame'
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
import { NeumorphismTextarea } from '@echolab-auto/ui-frame'
import type { NeumorphismTextareaProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismSelect } from '@echolab-auto/ui-frame'
import type { NeumorphismSelectProps, NeumorphismSelectOption } from '@echolab-auto/ui-frame'
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
import { NeumorphismForm, NeumorphismFormItem } from '@echolab-auto/ui-frame'
import type {
  NeumorphismFormProps,
  NeumorphismFormItemProps,
  FormRule,
} from '@echolab-auto/ui-frame'
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

#### NeumorphismSlider

```ts
import { NeumorphismSlider } from '@echolab-auto/ui-frame'
import type { NeumorphismSliderProps, SliderSize } from '@echolab-auto/ui-frame'
```

| Props       | Type                             | Default    | Description          |
| ----------- | -------------------------------- | ---------- | -------------------- |
| modelValue  | `number`                         | `0`        | 绑定值               |
| min         | `number`                         | `0`        | 最小值               |
| max         | `number`                         | `100`      | 最大值               |
| step        | `number`                         | `1`        | 步长                 |
| disabled    | `boolean`                        | `false`    | 是否禁用             |
| showTooltip | `boolean`                        | `true`     | 拖拽时显示当前值提示 |
| showStops   | `boolean`                        | `false`    | 显示刻度标记         |
| vertical    | `boolean`                        | `false`    | 垂直方向             |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 滑块尺寸             |

**Events:** `update:modelValue`, `change`

---

#### NeumorphismInputNumber

```ts
import { NeumorphismInputNumber } from '@echolab-auto/ui-frame'
import type { NeumorphismInputNumberProps, NumberInputSize } from '@echolab-auto/ui-frame'
```

| Props       | Type                             | Default     | Description  |
| ----------- | -------------------------------- | ----------- | ------------ |
| modelValue  | `number`                         | `undefined` | 绑定值       |
| min         | `number`                         | `undefined` | 最小值       |
| max         | `number`                         | `undefined` | 最大值       |
| step        | `number`                         | `1`         | 步长         |
| precision   | `number`                         | `undefined` | 小数精度     |
| disabled    | `boolean`                        | `false`     | 是否禁用     |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 尺寸         |
| placeholder | `string`                         | `''`        | 占位符       |
| controls    | `boolean`                        | `true`      | 显示增减按钮 |
| label       | `string`                         | —           | 标签文字     |

**Events:** `update:modelValue`, `change`, `focus`, `blur`

---

#### NeumorphismAutoComplete

```ts
import { NeumorphismAutoComplete } from '@echolab-auto/ui-frame'
import type {
  NeumorphismAutoCompleteProps,
  NeumorphismAutoCompleteOption,
} from '@echolab-auto/ui-frame'
```

| Props       | Type                                               | Default     | Description          |
| ----------- | -------------------------------------------------- | ----------- | -------------------- |
| modelValue  | `string \| number`                                 | `undefined` | 绑定值               |
| options     | `AutoCompleteOption[]`                             | `[]`        | 本地选项数据         |
| placeholder | `string`                                           | `''`        | 占位符               |
| disabled    | `boolean`                                          | `false`     | 是否禁用             |
| size        | `'small' \| 'medium' \| 'large'`                   | `'medium'`  | 尺寸                 |
| clearable   | `boolean`                                          | `true`      | 是否可清空           |
| loading     | `boolean`                                          | `false`     | 外部加载状态         |
| label       | `string`                                           | —           | 标签文字             |
| debounce    | `number`                                           | `300`       | 异步搜索防抖延迟(ms) |
| searchFn    | `(query: string) => Promise<AutoCompleteOption[]>` | —           | 异步搜索函数         |

```ts
interface AutoCompleteOption {
  label: string
  value: string | number
  disabled?: boolean
}
```

**Events:** `update:modelValue`, `select`, `search`, `focus`, `blur`

---

#### NeumorphismDatePicker

```ts
import { NeumorphismDatePicker } from '@echolab-auto/ui-frame'
import type { NeumorphismDatePickerProps } from '@echolab-auto/ui-frame'
```

| Props          | Type                             | Default        | Description        |
| -------------- | -------------------------------- | -------------- | ------------------ |
| modelValue     | `Date \| null`                   | `null`         | 绑定值             |
| placeholder    | `string`                         | `''`           | 占位符             |
| format         | `string`                         | `'yyyy-MM-dd'` | 显示格式           |
| disabled       | `boolean`                        | `false`        | 是否禁用           |
| clearable      | `boolean`                        | `true`         | 是否可清空         |
| size           | `'small' \| 'medium' \| 'large'` | `'medium'`     | 尺寸               |
| minDate        | `Date`                           | —              | 最小可选日期       |
| maxDate        | `Date`                           | —              | 最大可选日期       |
| firstDayOfWeek | `number`                         | `0`            | 每周起始日(0=周日) |
| label          | `string`                         | —              | 标签文字           |
| required       | `boolean`                        | `false`        | 是否必填           |
| error          | `string \| boolean`              | —              | 错误信息或状态     |
| name           | `string`                         | —              | 表单字段名         |
| id             | `string`                         | —              | 自定义 ID          |

**Events:** `update:modelValue`, `change`, `focus`, `blur`

---

#### NeumorphismUpload

```ts
import { NeumorphismUpload } from '@echolab-auto/ui-frame'
import type { NeumorphismUploadProps, UploadFile, UploadStatus } from '@echolab-auto/ui-frame'
```

| Props          | Type                                    | Default    | Description                 |
| -------------- | --------------------------------------- | ---------- | --------------------------- |
| modelValue     | `UploadFile[]`                          | `[]`       | 绑定文件列表                |
| accept         | `string`                                | —          | 接受的文件类型(MIME/扩展名) |
| maxSize        | `number`                                | —          | 最大文件大小(字节)          |
| maxCount       | `number`                                | —          | 最大文件数量                |
| multiple       | `boolean`                               | `false`    | 允许多选                    |
| disabled       | `boolean`                               | `false`    | 是否禁用                    |
| drag           | `boolean`                               | `true`     | 启用拖拽上传区域            |
| listType       | `'text' \| 'picture' \| 'picture-card'` | `'text'`   | 文件列表展示样式            |
| showUploadList | `boolean`                               | `true`     | 是否显示文件列表            |
| size           | `'small' \| 'medium' \| 'large'`        | `'medium'` | 尺寸                        |
| autoUpload     | `boolean`                               | `false`    | 选择文件后自动上传          |
| triggerText    | `string`                                | —          | 上传触发按钮文本            |
| dropText       | `string`                                | —          | 拖拽提示文本                |
| removeLabel    | `string`                                | —          | 移除按钮 aria-label         |
| previewLabel   | `string`                                | —          | 预览按钮 aria-label         |

```ts
interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  url?: string
  error?: string
  raw?: File
}
```

**Slots:** `trigger` (scope: `{ dragOver, disabled }`)

**Events:** `update:modelValue`, `change`, `preview`, `remove`, `exceed`

---

### 数据展示

#### NeumorphismCard

```ts
import { NeumorphismCard } from '@echolab-auto/ui-frame'
import type { NeumorphismCardProps, CardVariant, CardDepth } from '@echolab-auto/ui-frame'
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
import { NeumorphismAvatar } from '@echolab-auto/ui-frame'
import type { NeumorphismAvatarProps, AvatarSize } from '@echolab-auto/ui-frame'
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
import { NeumorphismBadge } from '@echolab-auto/ui-frame'
import type { NeumorphismBadgeProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismTag } from '@echolab-auto/ui-frame'
import type { NeumorphismTagProps, TagVariant } from '@echolab-auto/ui-frame'
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
import { NeumorphismProgress } from '@echolab-auto/ui-frame'
import type { NeumorphismProgressProps, ProgressVariant } from '@echolab-auto/ui-frame'
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
import { NeumorphismSkeleton } from '@echolab-auto/ui-frame'
import type { NeumorphismSkeletonProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismTable } from '@echolab-auto/ui-frame'
import type { NeumorphismTableProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismDivider } from '@echolab-auto/ui-frame'
import type {
  NeumorphismDividerProps,
  DividerDirection,
  DividerAlign,
} from '@echolab-auto/ui-frame'
```

| Props     | Type                            | Default        | Description |
| --------- | ------------------------------- | -------------- | ----------- |
| direction | `'horizontal' \| 'vertical'`    | `'horizontal'` | 方向        |
| align     | `'left' \| 'center' \| 'right'` | `'center'`     | 文字对齐    |
| dashed    | `boolean`                       | `false`        | 虚线        |
| inset     | `boolean`                       | `false`        | 缩进模式    |

**Slots:** default（分割线中间的文字）

---

#### NeumorphismList

```ts
import { NeumorphismList } from '@echolab-auto/ui-frame'
import type { NeumorphismListProps } from '@echolab-auto/ui-frame'
```

| Props     | Type                             | Default    | Description      |
| --------- | -------------------------------- | ---------- | ---------------- |
| items     | `any[]`                          | `[]`       | 数据源列表       |
| bordered  | `boolean`                        | `true`     | 是否显示边框     |
| split     | `boolean`                        | `true`     | 是否显示分割线   |
| size      | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸             |
| hoverable | `boolean`                        | `true`     | 是否启用悬停效果 |
| loading   | `boolean`                        | `false`    | 是否加载中       |

**Slots:** default (scope: `{ item, index }`), `header`, `footer`, `loading`, `empty`

**Events:** `item-click`

---

#### NeumorphismVirtualList

```ts
import { NeumorphismVirtualList } from '@echolab-auto/ui-frame'
import type { NeumorphismVirtualListProps } from '@echolab-auto/ui-frame'
```

| Props      | Type     | Default | Description          |
| ---------- | -------- | ------- | -------------------- |
| items      | `any[]`  | `[]`    | 数据源列表           |
| itemHeight | `number` | `40`    | 每项固定高度(px)     |
| overscan   | `number` | `5`     | 视口外额外渲染的项数 |
| keyField   | `string` | `'id'`  | 用作 `:key` 的字段名 |

**Slots:** default (scope: `{ item, index }`), `empty`

**Exposed methods:** `scrollTo(index, align?)`

---

### 反馈

#### NeumorphismPopover

```ts
import { NeumorphismPopover } from '@echolab-auto/ui-frame'
import type {
  NeumorphismPopoverProps,
  PopoverPosition,
  PopoverTrigger,
} from '@echolab-auto/ui-frame'
```

| Props     | Type                                               | Default   | Description                       |
| --------- | -------------------------------------------------- | --------- | --------------------------------- |
| position  | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'auto'`  | 弹出位置（auto 自动边界检测）     |
| trigger   | `'click' \| 'hover' \| 'focus' \| 'manual'`        | `'click'` | 触发方式                          |
| disabled  | `boolean`                                          | `false`   | 是否禁用                          |
| offset    | `number`                                           | `8`       | 与触发元素的偏移距离(px)          |
| width     | `'auto' \| 'trigger' \| number`                    | `'auto'`  | 弹出内容宽度                      |
| content   | `string`                                           | —         | 文本内容（不使用 content 插槽时） |
| showArrow | `boolean`                                          | `true`    | 是否显示指向箭头                  |

**Slots:** default（触发元素）, `content`（弹出内容）

**Events:** `visible-change`

**Exposed methods:** `show`, `hide`, `toggle`, `isOpen`

---

#### NeumorphismDropdown

```ts
import { NeumorphismDropdown } from '@echolab-auto/ui-frame'
import type { NeumorphismDropdownProps, DropdownItem } from '@echolab-auto/ui-frame'
```

| Props    | Type                                               | Default    | Description  |
| -------- | -------------------------------------------------- | ---------- | ------------ |
| items    | `DropdownItem[]`                                   | `[]`       | 下拉菜单项   |
| position | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'bottom'` | 弹出位置     |
| trigger  | `'click' \| 'hover' \| 'focus' \| 'manual'`        | `'click'`  | 触发方式     |
| disabled | `boolean`                                          | `false`    | 是否禁用     |
| offset   | `number`                                           | `4`        | 偏移距离(px) |

```ts
interface DropdownItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divided?: boolean
  danger?: boolean
}
```

**Slots:** default（触发元素）, `items`（自定义菜单内容）

**Events:** `select`, `visible-change`

---

#### NeumorphismAlert

```ts
import { NeumorphismAlert } from '@echolab-auto/ui-frame'
import type { NeumorphismAlertProps, AlertType } from '@echolab-auto/ui-frame'
```

| Props      | Type                                          | Default    | Description                    |
| ---------- | --------------------------------------------- | ---------- | ------------------------------ |
| type       | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`   | 提示类型                       |
| title      | `string`                                      | `''`       | 标题                           |
| message    | `string`                                      | `''`       | 描述内容                       |
| closable   | `boolean`                                     | `true`     | 是否可关闭                     |
| duration   | `number`                                      | `0`        | 自动关闭延迟(ms)，0 需手动关闭 |
| icon       | `boolean`                                     | `true`     | 是否显示类型图标               |
| bordered   | `boolean`                                     | `true`     | 是否显示左侧色条               |
| size       | `'small' \| 'medium' \| 'large'`              | `'medium'` | 尺寸                           |
| closeLabel | `string`                                      | `''`       | 关闭按钮 aria-label            |

**Slots:** `icon`, default（覆盖 title + message）

**Events:** `close`

---

#### NeumorphismEmpty

```ts
import { NeumorphismEmpty } from '@echolab-auto/ui-frame'
import type { NeumorphismEmptyProps, EmptySize } from '@echolab-auto/ui-frame'
```

| Props       | Type                             | Default    | Description  |
| ----------- | -------------------------------- | ---------- | ------------ |
| image       | `string`                         | —          | 自定义占位图 |
| description | `string`                         | —          | 描述文字     |
| size        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸         |

**Slots:** `image`, default（底部操作区）

---

### 导航

#### NeumorphismTabs

```ts
import { NeumorphismTabs } from '@echolab-auto/ui-frame'
import type { NeumorphismTabsProps, TabItem } from '@echolab-auto/ui-frame'
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
import { NeumorphismBreadcrumb } from '@echolab-auto/ui-frame'
import type { NeumorphismBreadcrumbProps, BreadcrumbItem } from '@echolab-auto/ui-frame'
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
import { NeumorphismPagination } from '@echolab-auto/ui-frame'
import type { NeumorphismPaginationProps } from '@echolab-auto/ui-frame'
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

#### NeumorphismMenu

```ts
import { NeumorphismMenu } from '@echolab-auto/ui-frame'
import type { NeumorphismMenuProps, MenuItem } from '@echolab-auto/ui-frame'
```

| Props           | Type                             | Default      | Description                  |
| --------------- | -------------------------------- | ------------ | ---------------------------- |
| items           | `MenuItem[]`                     | `[]`         | 菜单项（支持子菜单）         |
| mode            | `'vertical' \| 'horizontal'`     | `'vertical'` | 布局方向                     |
| defaultActive   | `string`                         | —            | 默认激活项 key               |
| defaultExpanded | `string[]`                       | `[]`         | 默认展开的子菜单 keys        |
| collapsed       | `boolean`                        | `false`      | 折叠模式（仅显示图标）       |
| selectable      | `boolean`                        | `true`       | 是否可选中（跟踪 activeKey） |
| theme           | `'light' \| 'dark'`              | —            | 主题覆盖（默认跟随全局主题） |
| size            | `'small' \| 'medium' \| 'large'` | `'medium'`   | 尺寸                         |

```ts
interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[]
  divided?: boolean
}
```

**Events:** `select`, `item-click`

---

#### NeumorphismNavMenu

```ts
import { NeumorphismNavMenu } from '@echolab-auto/ui-frame'
import type { NeumorphismNavMenuProps, MenuItem } from '@echolab-auto/ui-frame'
```

| Props         | Type                             | Default        | Description                  |
| ------------- | -------------------------------- | -------------- | ---------------------------- |
| items         | `MenuItem[]`                     | `[]`           | 导航菜单项（支持下拉子菜单） |
| defaultActive | `string`                         | —              | 默认激活项 key               |
| mode          | `'horizontal' \| 'vertical'`     | `'horizontal'` | 布局方向                     |
| showIndicator | `boolean`                        | `true`         | 是否显示激活指示条           |
| theme         | `'light' \| 'dark'`              | —              | 主题覆盖                     |
| size          | `'small' \| 'medium' \| 'large'` | `'medium'`     | 尺寸                         |

**Events:** `select`, `item-click`

---

#### NeumorphismDrawer

```ts
import { NeumorphismDrawer } from '@echolab-auto/ui-frame'
import type { NeumorphismDrawerProps, DrawerPosition } from '@echolab-auto/ui-frame'
```

| Props          | Type                                     | Default   | Description                   |
| -------------- | ---------------------------------------- | --------- | ----------------------------- |
| modelValue     | `boolean`                                | `false`   | 是否显示                      |
| position       | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 抽屉方向                      |
| title          | `string`                                 | —         | 标题                          |
| width          | `number \| string`                       | —         | 宽度/高度（根据方向自动适配） |
| maskClosable   | `boolean`                                | `true`    | 点击遮罩关闭                  |
| closable       | `boolean`                                | `true`    | 是否可关闭                    |
| showClose      | `boolean`                                | `true`    | 显示关闭按钮                  |
| destroyOnClose | `boolean`                                | `false`   | 关闭时销毁内容                |

**Slots:** `header`, default, `footer`

**Events:** `update:modelValue`, `open`, `close`

---

#### NeumorphismSteps

```ts
import { NeumorphismSteps } from '@echolab-auto/ui-frame'
import type { NeumorphismStepsProps, StepItem, StepStatus } from '@echolab-auto/ui-frame'
```

| Props     | Type                             | Default        | Description           |
| --------- | -------------------------------- | -------------- | --------------------- |
| steps     | `StepItem[]`                     | `[]`           | 步骤项列表            |
| current   | `number`                         | `0`            | 当前步骤索引(0-based) |
| direction | `'horizontal' \| 'vertical'`     | `'horizontal'` | 布局方向              |
| size      | `'small' \| 'medium' \| 'large'` | `'medium'`     | 尺寸                  |
| center    | `boolean`                        | `false`        | 标题和描述是否居中    |

```ts
interface StepItem {
  key: string
  title: string
  description?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
}
```

**Slots:** `empty`

**Events:** `update:current`, `change`, `stepClick`

---

### 反馈

#### NeumorphismModal

```ts
import { NeumorphismModal } from '@echolab-auto/ui-frame'
import type { NeumorphismModalProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismToastProvider } from '@echolab-auto/ui-frame'
import type {
  NeumorphismToastProviderProps,
  ToastOptions,
  ToastType,
  ToastPosition,
  ToastItem,
} from '@echolab-auto/ui-frame'
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
import { NeumorphismTooltip } from '@echolab-auto/ui-frame'
import type {
  NeumorphismTooltipProps,
  TooltipPosition,
  TooltipTrigger,
} from '@echolab-auto/ui-frame'
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
import { NeumorphismCollapse } from '@echolab-auto/ui-frame'
import type { NeumorphismCollapseProps, CollapseItem } from '@echolab-auto/ui-frame'
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
import { NeumorphismContainer } from '@echolab-auto/ui-frame'
import type { NeumorphismContainerProps } from '@echolab-auto/ui-frame'
```

| Props     | Type                 | Default   | Description                                  |
| --------- | -------------------- | --------- | -------------------------------------------- |
| mode      | `'fixed' \| 'fluid'` | `'fixed'` | fixed 模式下根据断点限制最大宽度，fluid 全宽 |
| noPadding | `boolean`            | `false`   | 是否移除内边距                               |
| tag       | `string`             | `'div'`   | 自定义渲染标签                               |

---

#### NeumorphismRow / NeumorphismCol

```ts
import { NeumorphismRow, NeumorphismCol } from '@echolab-auto/ui-frame'
import type {
  NeumorphismRowProps,
  RowAlign,
  RowJustify,
  NeumorphismColProps,
  ColSpan,
  ColOffset,
} from '@echolab-auto/ui-frame'
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
import { NeumorphismLayout } from '@echolab-auto/ui-frame'
import type { NeumorphismLayoutProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismThemeToggle } from '@echolab-auto/ui-frame'
import type { NeumorphismThemeToggleProps } from '@echolab-auto/ui-frame'
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
import { NeumorphismTree, NeumorphismTreeNode } from '@echolab-auto/ui-frame'
import type {
  NeumorphismTreeProps,
  NeumorphismTreeNodeProps,
  TreeNodeData,
} from '@echolab-auto/ui-frame'
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
import { NeumorphismCanvas } from '@echolab-auto/ui-frame'
import type { NeumorphismCanvasProps } from '@echolab-auto/ui-frame'
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
import { ThemeProvider } from '@echolab-auto/ui-frame'
import type { ThemeProviderProps } from '@echolab-auto/ui-frame'
```

| Props        | Type                          | Default                 | Description         |
| ------------ | ----------------------------- | ----------------------- | ------------------- |
| defaultTheme | `'light' \| 'dark' \| 'auto'` | `'auto'`                | 默认主题            |
| storageKey   | `string`                      | `'nm-theme-preference'` | localStorage 存储键 |
| followSystem | `boolean`                     | `true`                  | 是否跟随系统偏好    |

**Slot props:** `{ isDark, toggleTheme, setTheme, theme, currentTheme }`

---

## Doc 文档渲染

文档渲染模块提供 Markdown 渲染、文档查看器和编辑器组件，适用于构建文档站点或知识库。

### DocViewer

```ts
import { DocViewer } from '@echolab-auto/ui-frame/doc'
import type { DocViewerProps } from '@echolab-auto/ui-frame/doc'
```

文档查看器组件，提供侧边栏树形导航 + Markdown 内容渲染的完整文档浏览体验。

| Props       | Type         | Default | Description          |
| ----------- | ------------ | ------- | -------------------- |
| root        | `ProDocNode` | —       | 文档树根节点（必需） |
| initialPath | `string`     | —       | 初始选中的文档路径   |
| className   | `string`     | `''`    | 自定义样式类名       |

**Events:** `docLink`

---

### DocEditor

```ts
import { DocEditor } from '@echolab-auto/ui-frame/doc'
import type { DocEditorProps } from '@echolab-auto/ui-frame/doc'
```

文档编辑器组件，在 DocViewer 基础上增加 Markdown 编辑能力，支持编辑/预览/分栏三种模式。

| Props       | Type         | Default | Description          |
| ----------- | ------------ | ------- | -------------------- |
| root        | `ProDocNode` | —       | 文档树根节点（必需） |
| initialPath | `string`     | —       | 初始选中的文档路径   |
| className   | `string`     | `''`    | 自定义样式类名       |

**Events:** `save`, `docLink`

---

### MarkdownRenderer

```ts
import { MarkdownRenderer } from '@echolab-auto/ui-frame/doc'
import type { MarkdownRendererProps } from '@echolab-auto/ui-frame/doc'
```

Markdown 渲染组件，支持目录（TOC）、代码高亮、内部链接跳转。

| Props           | Type                    | Default | Description                                      |
| --------------- | ----------------------- | ------- | ------------------------------------------------ |
| content         | `string`                | —       | Markdown 内容（必需）                            |
| className       | `string`                | `''`    | 自定义样式类名                                   |
| showToc         | `boolean`               | `true`  | 是否显示目录                                     |
| scrollContainer | `HTMLElement \| string` | —       | 滚动容器（不传则自动查找 `.nm-layout__content`） |

**Events:** `docLink`

---

### MarkdownEditor

```ts
import { MarkdownEditor } from '@echolab-auto/ui-frame/doc'
import type { MarkdownEditorProps } from '@echolab-auto/ui-frame/doc'
```

Markdown 编辑器组件，提供编辑/预览/分栏三种模式，支持分栏同步滚动。

| Props     | Type     | Default | Description           |
| --------- | -------- | ------- | --------------------- |
| value     | `string` | —       | Markdown 内容（必需） |
| className | `string` | `''`    | 自定义样式类名        |

**Events:** `change`, `docLink`

---

### Doc 类型定义

```ts
import type { ProDocNode, DocTree, ProDocOptions, DocTreeNode } from '@echolab-auto/ui-frame/doc'
```

```ts
interface ProDocNode {
  id: string
  title: string
  path: string
  content: string
  body: string
  meta: Record<string, unknown>
  children: ProDocNode[]
  order: number
}

interface DocTree {
  root: ProDocNode
  nodeMap: Map<string, ProDocNode>
  findByPath(path: string): ProDocNode | undefined
  findById(id: string): ProDocNode | undefined
}

interface ProDocOptions {
  docsRoot?: string
  indexPath?: string
}

interface DocTreeNode {
  key: string
  label: string
  icon: string
  children: DocTreeNode[]
}
```

---

### Doc 工具函数

```ts
import {
  parseFrontmatter,
  pathToId,
  extractTitle,
  createNode,
  buildDocTree,
  createDocTree,
  flattenDocTree,
  getAncestors,
  getNodeIcon,
  nodeToTreeData,
} from '@echolab-auto/ui-frame/doc'
```

| 函数               | 签名                                            | 说明                         |
| ------------------ | ----------------------------------------------- | ---------------------------- |
| `parseFrontmatter` | `(content: string) => { meta, body }`           | 解析 Markdown 的 frontmatter |
| `pathToId`         | `(path: string) => string`                      | 将路径转换为唯一 ID          |
| `extractTitle`     | `(content: string) => string`                   | 从 Markdown 中提取标题       |
| `createNode`       | `(path: string, content: string) => ProDocNode` | 创建单个文档节点             |
| `buildDocTree`     | `(nodes: ProDocNode[]) => DocTree`              | 构建文档树                   |
| `createDocTree`    | `(root: ProDocNode) => DocTree`                 | 从根节点创建文档树           |
| `flattenDocTree`   | `(tree: DocTree) => ProDocNode[]`               | 扁平化文档树                 |
| `getAncestors`     | `(tree: DocTree, path: string) => ProDocNode[]` | 获取指定路径的所有祖先节点   |
| `getNodeIcon`      | `(node: ProDocNode) => string`                  | 根据路径推断节点图标         |
| `nodeToTreeData`   | `(node: ProDocNode) => DocTreeNode`             | 将节点转换为树形数据         |

---

### useDocLayout

```ts
import { useDocLayout } from '@echolab-auto/ui-frame/doc'
import type { UseDocLayoutOptions, UseDocLayoutReturn } from '@echolab-auto/ui-frame/doc'
```

DocViewer / DocEditor 共享的布局逻辑 composable，管理树节点选择、主题切换、节点查找等。

```ts
interface UseDocLayoutOptions {
  root: ProDocNode
  initialPath?: string
}

interface UseDocLayoutReturn {
  selectedPath: Ref<string>
  selectedKeys: Ref<string[]>
  expandedKeys: Ref<string[]>
  treeData: ComputedRef<TreeNodeData[]>
  selectedNode: ComputedRef<ProDocNode | undefined>
  displayNode: ComputedRef<ProDocNode | undefined>
  docTree: ComputedRef<DocTree>
  themeModel: WritableComputedRef<Theme>
  handleTreeSelect: (key: string) => void
  handleDocLink: (emit: (e: 'docLink', path: string) => void, path: string) => void
}
```

---

## Headless Composables

Headless Composables 将业务逻辑与 UI 完全解耦，封装了键盘导航、ARIA、状态管理等行为，开发者只需关心 UI 渲染。

### useSelect

```ts
import { useSelect } from '@echolab-auto/ui-frame'
import type { UseSelectOptions, UseSelectReturn, SelectOption } from '@echolab-auto/ui-frame'
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
import { useTabs } from '@echolab-auto/ui-frame'
import type { UseTabsOptions, UseTabsReturn } from '@echolab-auto/ui-frame'
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
import { usePagination } from '@echolab-auto/ui-frame'
import type { UsePaginationOptions, UsePaginationReturn } from '@echolab-auto/ui-frame'
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
import { useTree } from '@echolab-auto/ui-frame'
import type { UseTreeOptions, UseTreeReturn } from '@echolab-auto/ui-frame'
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
import { useTable } from '@echolab-auto/ui-frame'
import type {
  UseTableOptions,
  UseTableReturn,
  TableColumn,
  SortDirection,
  SortState,
} from '@echolab-auto/ui-frame'
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
import { useCollapse } from '@echolab-auto/ui-frame'
import type { UseCollapseOptions, UseCollapseReturn } from '@echolab-auto/ui-frame'
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
import { useModal } from '@echolab-auto/ui-frame'
import type { UseModalOptions, UseModalReturn } from '@echolab-auto/ui-frame'
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
import { useToast } from '@echolab-auto/ui-frame'
import type {
  UseToastOptions,
  UseToastReturn,
  ToastOptions,
  ToastItem,
} from '@echolab-auto/ui-frame'
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
import { useTooltip } from '@echolab-auto/ui-frame'
import type { UseTooltipOptions, UseTooltipReturn } from '@echolab-auto/ui-frame'
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

### usePopover

```ts
import { usePopover } from '@echolab-auto/ui-frame'
import type {
  UsePopoverOptions,
  UsePopoverReturn,
  PopoverPosition,
  PopoverTrigger,
} from '@echolab-auto/ui-frame'
```

```ts
interface UsePopoverOptions {
  position?: Ref<PopoverPosition>
  trigger?: Ref<PopoverTrigger>
  disabled?: Ref<boolean>
  offset?: Ref<number> | number
  delay?: number
}

interface UsePopoverReturn {
  isOpen: Ref<boolean>
  show: () => void
  hide: () => void
  toggle: () => void
  handleKeydown: (event: KeyboardEvent) => void
  handleClickOutside: (event: MouseEvent) => void
}
```

---

### useAlert

```ts
import { useAlert } from '@echolab-auto/ui-frame'
import type { UseAlertOptions, UseAlertReturn, AlertType } from '@echolab-auto/ui-frame'
```

```ts
interface UseAlertOptions {
  duration?: number
}

interface UseAlertReturn {
  isVisible: Ref<boolean>
  close: () => void
  leaving: Ref<boolean>
}
```

---

### useSlider

```ts
import { useSlider, coordinateToValue } from '@echolab-auto/ui-frame'
import type { UseSliderOptions, UseSliderReturn } from '@echolab-auto/ui-frame'
```

```ts
interface UseSliderOptions {
  modelValue: Ref<number>
  min: number
  max: number
  step: number
  disabled?: Ref<boolean>
  vertical?: Ref<boolean>
}

interface UseSliderReturn {
  sliderValue: ComputedRef<number>
  percentage: ComputedRef<number>
  setValue: (value: number) => void
  handleKeydown: (event: KeyboardEvent) => void
  isDragging: Ref<boolean>
}
```

---

### useNumberInput

```ts
import { useNumberInput, formatNumber, parseNumber } from '@echolab-auto/ui-frame'
import type { UseNumberInputOptions, UseNumberInputReturn } from '@echolab-auto/ui-frame'
```

```ts
interface UseNumberInputOptions {
  modelValue: Ref<number | undefined>
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: Ref<boolean>
}

interface UseNumberInputReturn {
  displayValue: ComputedRef<string>
  increment: () => void
  decrement: () => void
  setValue: (value: number) => void
  handleKeydown: (event: KeyboardEvent) => void
  handleInput: (event: Event) => void
  handleBlur: () => void
}
```

---

### useDrawer

```ts
import { useDrawer } from '@echolab-auto/ui-frame'
import type { UseDrawerOptions, UseDrawerReturn, DrawerPosition } from '@echolab-auto/ui-frame'
```

```ts
interface UseDrawerOptions {
  modelValue: Ref<boolean>
  maskClosable?: Ref<boolean>
  closable?: Ref<boolean>
  destroyOnClose?: Ref<boolean>
}

interface UseDrawerReturn {
  isOpen: Ref<boolean>
  rendered: Ref<boolean>
  open: () => void
  close: () => void
  handleKeydown: (event: KeyboardEvent, drawerEl: HTMLElement | undefined) => void
  handleMaskClick: () => void
  focusDrawer: (drawerEl: HTMLElement | undefined) => void
}
```

---

### useMenu

```ts
import { useMenu } from '@echolab-auto/ui-frame'
import type { UseMenuOptions, UseMenuReturn, MenuItem } from '@echolab-auto/ui-frame'
```

```ts
interface UseMenuOptions {
  items: Ref<MenuItem[]> | ComputedRef<MenuItem[]>
  mode?: Ref<'vertical' | 'horizontal'>
  activeKey?: Ref<string | null>
  expandedKeys?: Ref<string[]>
  onSelect?: (item: MenuItem) => void
  disabled?: Ref<boolean>
}

interface UseMenuReturn {
  activeKey: Ref<string | null>
  expandedKeys: Ref<string[]>
  allKeys: ComputedRef<string[]>
  handleKeydown: (event: KeyboardEvent) => void
  handleItemClick: (item: MenuItem) => void
  handleItemEnter: (item: MenuItem) => void
  handleItemLeave: (item: MenuItem) => void
  isExpanded: (key: string) => boolean
  isActive: (key: string) => boolean
  expand: (key: string) => void
  collapse: (key: string) => void
  toggleExpand: (key: string) => void
}
```

---

### useSteps

```ts
import { useSteps } from '@echolab-auto/ui-frame'
import type { UseStepsOptions, UseStepsReturn, StepItem, StepStatus } from '@echolab-auto/ui-frame'
```

```ts
interface UseStepsOptions {
  steps: Ref<StepItem[]> | ComputedRef<StepItem[]>
  current: Ref<number>
}

interface UseStepsReturn {
  currentStep: ComputedRef<StepItem | undefined>
  setCurrent: (index: number) => void
  next: (beforeNext?: () => boolean | Promise<boolean>) => Promise<void>
  prev: () => void
  setStepStatus: (key: string, status: StepStatus) => void
}
```

---

### useVirtualList

```ts
import { useVirtualList } from '@echolab-auto/ui-frame'
import type { UseVirtualListOptions, UseVirtualListReturn } from '@echolab-auto/ui-frame'
```

```ts
interface UseVirtualListOptions {
  items: Ref<any[]>
  itemHeight: Ref<number | ((index: number) => number)> | number | ((index: number) => number)
  overscan?: Ref<number> | number
}

interface UseVirtualListReturn {
  containerRef: Ref<HTMLElement | null>
  visibleItems: ComputedRef<any[]>
  totalHeight: Ref<number>
  offsetY: Ref<number>
  startIndex: Ref<number>
  endIndex: Ref<number>
  scrollTo: (index: number, align?: 'top' | 'center') => void
  handleScroll: () => void
}
```

---

### useDatePicker

```ts
import { useDatePicker } from '@echolab-auto/ui-frame'
import type { UseDatePickerOptions, UseDatePickerReturn, DayCell } from '@echolab-auto/ui-frame'
```

```ts
interface UseDatePickerOptions {
  modelValue: Ref<Date | null>
  minDate?: Ref<Date | undefined> | Date
  maxDate?: Ref<Date | undefined> | Date
  format?: Ref<string | undefined> | string
  firstDayOfWeek?: Ref<number | undefined> | number
}

interface UseDatePickerReturn {
  currentYear: Ref<number>
  currentMonth: Ref<number>
  calendarDays: ComputedRef<DayCell[]>
  weekdays: ComputedRef<string[]>
  selectedDate: ComputedRef<Date | null>
  selectDate: (date: Date) => void
  prevMonth: () => void
  nextMonth: () => void
  prevYear: () => void
  nextYear: () => void
  isSelected: (date: Date) => boolean
  isToday: (date: Date) => boolean
  isInRange: (date: Date) => boolean
  isDisabled: (date: Date) => boolean
  formatDate: (date: Date | null) => string
  goToToday: () => void
}
```

---

### useUpload

```ts
import { useUpload } from '@echolab-auto/ui-frame'
import type {
  UseUploadOptions,
  UseUploadReturn,
  UploadFile,
  UploadStatus,
} from '@echolab-auto/ui-frame'
```

```ts
interface UseUploadOptions {
  accept?: Ref<string | undefined> | ComputedRef<string | undefined>
  maxSize?: Ref<number | undefined> | ComputedRef<number | undefined>
  maxCount?: Ref<number | undefined> | ComputedRef<number | undefined>
  multiple?: Ref<boolean> | ComputedRef<boolean>
  autoUpload?: Ref<boolean> | ComputedRef<boolean>
  onExceed?: (excessCount: number) => void
  onSizeExceed?: (file: File) => void
  onTypeError?: (file: File) => void
  uploadFn?: (file: UploadFile) => Promise<void>
}

interface UseUploadReturn {
  files: Ref<UploadFile[]>
  dragOver: Ref<boolean>
  addFiles: (fileList: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  upload: () => Promise<void>
  fileInputRef: Ref<HTMLInputElement | null>
  handleDrag: (event: DragEvent) => void
  handleDragLeave: (event: DragEvent) => void
  handleDrop: (event: DragEvent) => void
  handleFileInput: (event: Event) => void
}
```

---

### useAutoComplete

```ts
import { useAutoComplete } from '@echolab-auto/ui-frame'
import type {
  UseAutoCompleteOptions,
  UseAutoCompleteReturn,
  AutoCompleteOption,
} from '@echolab-auto/ui-frame'
```

```ts
interface UseAutoCompleteOptions {
  modelValue: Ref<string | number | undefined>
  options?: Ref<AutoCompleteOption[]>
  searchFn?: (query: string) => Promise<AutoCompleteOption[]>
  loading?: Ref<boolean>
  debounceMs?: number
}

interface UseAutoCompleteReturn {
  inputValue: Ref<string>
  isOpen: Ref<boolean>
  filteredOptions: ComputedRef<AutoCompleteOption[]>
  activeIndex: Ref<number>
  highlightMatch: (label: string) => string
  selectOption: (option: AutoCompleteOption) => void
  handleKeydown: (event: KeyboardEvent) => void
  handleInput: (value: string) => void
  open: () => void
  close: () => void
  cleanupTimers: () => void
}
```

---

## 组合式函数

### useTheme

```ts
import { useTheme } from '@echolab-auto/ui-frame'
import type { Theme, ThemeOptions, ThemeContext } from '@echolab-auto/ui-frame'
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
import { useTouchDevice } from '@echolab-auto/ui-frame'
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
import { useCheckable } from '@echolab-auto/ui-frame'
import type { UseCheckableOptions } from '@echolab-auto/ui-frame'
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
import { useFormField } from '@echolab-auto/ui-frame'
import type { FormFieldConfig, FieldSize } from '@echolab-auto/ui-frame'
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
import { validateFieldValue } from '@echolab-auto/ui-frame'
import type { FormRule } from '@echolab-auto/ui-frame'
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
| `NeumorphismPopoverProps`       | Popover       |
| `NeumorphismDropdownProps`      | Dropdown      |
| `NeumorphismAlertProps`         | Alert         |
| `NeumorphismEmptyProps`         | Empty         |
| `NeumorphismSliderProps`        | Slider        |
| `NeumorphismInputNumberProps`   | InputNumber   |
| `NeumorphismDrawerProps`        | Drawer        |
| `NeumorphismMenuProps`          | Menu          |
| `NeumorphismNavMenuProps`       | NavMenu       |
| `NeumorphismStepsProps`         | Steps         |
| `NeumorphismVirtualListProps`   | VirtualList   |
| `NeumorphismDatePickerProps`    | DatePicker    |
| `NeumorphismUploadProps`        | Upload        |
| `NeumorphismListProps`          | List          |
| `NeumorphismAutoCompleteProps`  | AutoComplete  |

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
| `ExtendedConfig`           | 扩展配置类型                  |
| `ProDocNode`               | 文档节点                      |
| `DocTree`                  | 文档树结构                    |
| `ProDocOptions`            | 文档配置选项                  |
| `DocTreeNode`              | 树节点数据结构                |
| `DocViewerProps`           | DocViewer 组件属性            |
| `DocEditorProps`           | DocEditor 组件属性            |
| `MarkdownRendererProps`    | MarkdownRenderer 组件属性     |
| `MarkdownEditorProps`      | MarkdownEditor 组件属性       |
| `UseDocLayoutOptions`      | useDocLayout 选项             |
| `UseDocLayoutReturn`       | useDocLayout 返回值           |

---

## 工具函数

```ts
import { generateId, debounce, isEmpty } from '@echolab-auto/ui-frame'
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
import { ComponentRegistry } from '@echolab-auto/ui-frame'
```

组件注册表，用于管理自定义组件覆盖。

```ts
class ComponentRegistry {
  register(name: string, component: Component): void
  get(name: string): Component | undefined
  has(name: string): boolean
}
```

**使用示例：**

```ts
import { ComponentRegistry } from '@echolab-auto/ui-frame'

const registry = new ComponentRegistry()

// 注册自定义按钮
registry.register('NeumorphismButton', MyCustomButton)

// 检查是否已注册
if (registry.has('NeumorphismButton')) {
  const btn = registry.get('NeumorphismButton')
}
```

### useNeumorphismSetup

```ts
import { useNeumorphismSetup } from '@echolab-auto/ui-frame'
import type { NeumorphismSetupContext } from '@echolab-auto/ui-frame'
```

```ts
function useNeumorphismSetup(): NeumorphismSetupContext

interface NeumorphismSetupContext {
  // 提供统一的组件构建上下文
}
```

### 插件选项

```ts
import type {
  NeumorphismPluginOptions,
  ComponentOverrides,
  ExtendedConfig,
} from '@echolab-auto/ui-frame'
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

interface ExtendedConfig {
  [key: string]: unknown
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
import { useConfig, ConfigKey } from '@echolab-auto/ui-frame'
import type { NeumorphismGlobalConfig } from '@echolab-auto/ui-frame'
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
  popover?: { position?: PopoverPosition; trigger?: PopoverTrigger }
  dropdown?: { position?: PopoverPosition; trigger?: PopoverTrigger }
  alert?: {
    type?: AlertType
    closable?: boolean
    icon?: boolean
    bordered?: boolean
    size?: AlertSize
  }
  empty?: { size?: EmptySize }
  slider?: { size?: SliderSize; showTooltip?: boolean; showStops?: boolean }
  inputNumber?: { size?: NumberInputSize }
  drawer?: { position?: DrawerPosition; maskClosable?: boolean; closable?: boolean }
  menu?: { mode?: 'vertical' | 'horizontal'; size?: MenuSize; selectable?: boolean }
  navMenu?: { mode?: 'horizontal' | 'vertical'; size?: NavMenuSize; showIndicator?: boolean }
  steps?: { direction?: 'horizontal' | 'vertical'; size?: StepsSize; center?: boolean }
  virtualList?: { itemHeight?: number; overscan?: number }
  datePicker?: { size?: DatePickerSize; format?: string; clearable?: boolean }
  upload?: {
    size?: UploadSize
    drag?: boolean
    showUploadList?: boolean
    listType?: 'text' | 'picture' | 'picture-card'
    autoUpload?: boolean
  }
  list?: { size?: ListSize; bordered?: boolean; split?: boolean; hoverable?: boolean }
  autoComplete?: { size?: AutoCompleteSize; clearable?: boolean }
}
```

---

## 注入键

```ts
import { RadioGroupKey, FormKey, RowGutterKey } from '@echolab-auto/ui-frame'
import type { RadioGroupContext, FormContext, RowGutterContext } from '@echolab-auto/ui-frame'
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
} from '@echolab-auto/ui-frame'
import type { LocaleMessages, Locale } from '@echolab-auto/ui-frame'
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
@use '@echolab-auto/ui-frame/src/styles/variables.scss' as *;
@use '@echolab-auto/ui-frame/src/styles/mixins.scss' as *;
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
