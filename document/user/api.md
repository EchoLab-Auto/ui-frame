---
id: api
title: 'API 参考'
x: 1317
y: 532
group: 使用
---

# API 文档

> 本文档面向使用 `@echolab-auto/ui-frame` 进行 UI 构建的开发者，完整列举所有可被外部使用的代码模块、类型定义和接口。

---

## 目录

- [安装与引入](#安装与引入)
- [子路径导出](#子路径导出)
- [Vue 组件](#vue-组件)
- [Doc 文档渲染](#doc-文档渲染)
- [Chat 聊天面板](#chat-聊天面板)
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

const app = createApp(App)
app.use(NeumorphismUI)
```

```ts
// 按需引入
import { NeumorphismButton, NeumorphismCard, useTheme } from '@echolab-auto/ui-frame'
```

> **样式**：使用打包器（Vite / webpack / esbuild）时，组件样式随 JS 自动注入，无需手动引入；CDN / UMD / 无打包器场景需手动引入 `import '@echolab-auto/ui-frame/dist/style.css'`。

---

## 子路径导出

除主入口外，本库还提供以下子路径导出，支持更细粒度的按需引入：

| 子路径                                 | 用途                    | 示例                                                                       |
| -------------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `@echolab-auto/ui-frame/composables/*` | 单独引入某个 composable | `import { useSelect } from '@echolab-auto/ui-frame/composables/useSelect'` |
| `@echolab-auto/ui-frame/extensions`    | 扩展系统                | `import { ComponentRegistry } from '@echolab-auto/ui-frame/extensions'`    |
| `@echolab-auto/ui-frame/utils`         | 工具函数                | `import { debounce } from '@echolab-auto/ui-frame/utils'`                  |
| `@echolab-auto/ui-frame/doc`           | 文档渲染模块            | `import { DocViewer } from '@echolab-auto/ui-frame/doc'`                   |
| `@echolab-auto/ui-frame/chat`          | 聊天面板模块            | `import { ChatMessageList } from '@echolab-auto/ui-frame/chat'`            |

> 使用子路径导出时样式同样自动注入；仅无打包器场景需手动引入 `import '@echolab-auto/ui-frame/dist/style.css'`

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

| Props    | Type                                                                        | Default     | Description  |
| -------- | --------------------------------------------------------------------------- | ----------- | ------------ |
| variant  | `'raised' \| 'pressed' \| 'primary' \| 'glow' \| 'glass' \| 'glass-raised'` | `'raised'`  | 阴影变体     |
| size     | `'small' \| 'medium' \| 'large'`                                            | `'medium'`  | 按钮尺寸     |
| shape    | `'rounded' \| 'pill' \| 'circle'`                                           | `'rounded'` | 按钮形状     |
| disabled | `boolean`                                                                   | `false`     | 是否禁用     |
| loading  | `boolean`                                                                   | `false`     | 是否加载中   |
| type     | `'button' \| 'submit' \| 'reset'`                                           | `'button'`  | 原生按钮类型 |

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

| Props           | Type                                       | Default     | Description                                                 |
| --------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------- |
| modelValue      | `string \| number \| (string \| number)[]` | `''`        | 绑定值（多选时为数组）                                      |
| options         | `SelectOption[]`                           | `[]`        | 选项列表                                                    |
| placeholder     | `string`                                   | —           | 占位符                                                      |
| disabled        | `boolean`                                  | `false`     | 是否禁用                                                    |
| size            | `'small' \| 'medium' \| 'large'`           | `'medium'`  | 尺寸                                                        |
| clearable       | `boolean`                                  | `false`     | 是否可清空                                                  |
| label           | `string`                                   | —           | 标签文字                                                    |
| error           | `string \| boolean`                        | —           | 错误信息或状态                                              |
| emptyText       | `string`                                   | —           | 空选项提示文字                                              |
| multiple        | `boolean`                                  | `false`     | 多选模式，已选值以标签展示                                  |
| filterable      | `boolean`                                  | `false`     | 可搜索，输入即过滤选项                                      |
| loading         | `boolean`                                  | `false`     | 加载状态（远程数据场景）                                    |
| loadingText     | `string`                                   | —           | 加载提示文字                                                |
| collapseTags    | `boolean`                                  | `false`     | 多选标签折叠，超出部分以 +N 计数                            |
| maxCollapseTags | `number`                                   | `1`         | 折叠前展示的标签数                                          |
| variant         | `'default' \| 'outlined'`                  | `'default'` | 视觉变体：default 新拟态凹陷 / outlined 描边扁平 + 连体下拉 |

```ts
interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string // 相同 group 的选项在下拉中归为一组展示
}
```

**Slots:** `option` (scope: `{ option, selected, index, select }`), `value` (scope: `{ option }`)

**Events:** `update:modelValue`, `change`, `focus`, `blur`, `visible-change`, `remove-tag`, `search`

**Exposed methods:** `focus()`, `blur()`

**行为说明：**

- 单选键盘交互与原生 `<select>` 一致：↑↓ 即时切换选中值；多选为 ↑↓ 移动高亮 + Enter 切换选中
- 下拉靠近视口底部时自动向上翻转展开，空间受限时自动收缩高度
- `filterable` 模式下触发器内嵌输入框，combobox ARIA 语义移至原生 input
- `default` 变体的下拉 teleport 到 `<body>`（浮层，不受祖先 `overflow` 裁剪）；`outlined` 变体为**单盒模型**：触发器���体本身就是容器，下拉选项渲染在盒内第二行，展开时盒体随高度过渡纵向延展（负 margin 同步补偿，布局零抖动），滚动时与页面天然同步、无接缝——因此 outlined 触发器不应放在 `overflow: hidden/auto` 的祖先容器内，否则盒体延展会被裁剪

---

#### NeumorphismSegmented

```ts
import { NeumorphismSegmented } from '@echolab-auto/ui-frame'
import type {
  NeumorphismSegmentedProps,
  SegmentedOption,
  SegmentedSize,
} from '@echolab-auto/ui-frame'
```

| Props      | Type                             | Default     | Description                    |
| ---------- | -------------------------------- | ----------- | ------------------------------ |
| modelValue | `string \| number`               | `undefined` | 选中值（v-model）              |
| options    | `SegmentedOption[]`              | —           | 可选项（label/value/disabled） |
| size       | `'small' \| 'medium' \| 'large'` | `'medium'`  | 尺寸                           |
| disabled   | `boolean`                        | `false`     | 整体禁用                       |
| ariaLabel  | `string`                         | locale 文案 | radiogroup 无障碍标签          |

**Events:** `update:modelValue`, `change`

**行为说明：** 单选语义（`role="radiogroup"` + `role="radio"`），roving tabindex；方向键 ←/→/↑/↓ 移动并即时选中（跳过禁用项），Home/End 跳首末可用项。凹陷轨道 + 凸起选中项符合物理隐喻。

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

| Props         | Type                                                                 | Default     | Description                          |
| ------------- | -------------------------------------------------------------------- | ----------- | ------------------------------------ |
| modelValue    | `number`                                                             | `0`         | 当前值                               |
| max           | `number`                                                             | `100`       | 最大值                               |
| variant       | `'primary' \| 'success' \| 'warning' \| 'error' \| 'default'`        | `'primary'` | 颜色变体                             |
| size          | `'small' \| 'medium' \| 'large'`                                     | `'medium'`  | 尺寸                                 |
| type          | `'line' \| 'circle'`                                                 | `'line'`    | 形态：线性进度条或 SVG 环形进度      |
| showLabel     | `boolean`                                                            | `false`     | 是否显示百分比（数字随进度平滑滚动） |
| indeterminate | `boolean`                                                            | `false`     | 不确定模式                           |
| effect        | `'default' \| 'pulse' \| 'flow' \| 'wave' \| 'stripes' \| 'sparkle'` | `'default'` | 进度条视觉动效                       |

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

#### NeumorphismChartBar / NeumorphismChartLine / NeumorphismChartPie / NeumorphismChartCandlestick

```ts
import {
  NeumorphismChartBar,
  NeumorphismChartLine,
  NeumorphismChartPie,
  NeumorphismChartCandlestick,
} from '@echolab-auto/ui-frame'
```

| 共同 Props  | Type      | Default | Description               |
| ----------- | --------- | ------- | ------------------------- |
| width       | `string`  | `100%`  | 图表宽度                  |
| height      | `string`  | `300px` | 图表高度                  |
| showTooltip | `boolean` | `true`  | 悬停提示（级联 chart 段） |
| showLegend  | `boolean` | `true`  | 图例（Pie 无此项）        |
| animate     | `boolean` | `true`  | 入场动画                  |

- **ChartBar**: `series: ChartSeries[]`、`orientation`、`stacked`、`barGap`
- **ChartLine**: `series: ChartSeries[]`、`curve('linear'|'smooth'|'step')`、`area`、`showPoints`、`lineWidth`、`pointSize`
- **ChartPie**: `data: ChartDataPoint[]`、`innerRadius`、`padAngle`、`startAngle`、`labelPosition`、`roundedCorners`、`colorPalette`
- **ChartCandlestick**: `data: OhlcDataPoint[]`、`showVolume`、`showMA`、`maPeriods`、`upColor`、`downColor`

**Events:** `bar-click` / `point-click` / `arc-click` / `candle-click`（对应图形点击）

**Slots:** `title`

---

#### NeumorphismLogo

```ts
import { NeumorphismLogo } from '@echolab-auto/ui-frame'
import type { NeumorphismLogoProps, LogoMode } from '@echolab-auto/ui-frame'
```

| Props    | Type                                         | Default    | Description                  |
| -------- | -------------------------------------------- | ---------- | ---------------------------- |
| mode     | `'pulse' \| 'liquid' \| 'wave' \| 'pointer'` | `'pulse'`  | 像素动效模式（级联 logo 段） |
| size     | `'small' \| 'medium' \| 'large'`             | `'medium'` | 尺寸                         |
| goo      | `boolean`                                    | `true`     | gooey 融合滤镜               |
| autoplay | `boolean`                                    | `true`     | 自动播放                     |
| floating | `boolean`                                    | `true`     | 浮动动画                     |

---

#### NeumorphismScrollbar

```ts
import { NeumorphismScrollbar } from '@echolab-auto/ui-frame'
import type { NeumorphismScrollbarProps, ScrollbarVariant } from '@echolab-auto/ui-frame'
```

| Props       | Type                                                    | Default      | Description                                     |
| ----------- | ------------------------------------------------------- | ------------ | ----------------------------------------------- |
| variant     | `'standard' \| 'primary' \| 'none' \| 'dots' \| 'glow'` | `'standard'` | 滚动条变体（dots/glow 为覆盖层）                |
| target      | `string`                                                | `''`         | 目标滚动容器 CSS 选择器（必填；空串禁用）       |
| dotColor    | `string`                                                | —            | 点阵基础色 `"r,g,b"`（缺省读 token）            |
| accentColor | `string`                                                | —            | 强调色 `"r,g,b"`（缺省读 `--nm-primary-color`） |
| sigma       | `number`                                                | `14`         | 点阵高斯半径                                    |

> 1.0.6 起 `target` 不再默认 `.nm-layout__content`，必须显式传入。

---

#### NeumorphismFieldLabel / NeumorphismFieldError

```ts
import { NeumorphismFieldLabel, NeumorphismFieldError } from '@echolab-auto/ui-frame'
```

**NeumorphismFieldLabel:** `label?: string`、`required?: boolean`、`forId?: string` —— 表单字段标签（required 时显示 `*`）。

**NeumorphismFieldError:** `id: string`、`message?: string` —— 错误提示（`role="alert"`，空消息不渲染）。

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

#### NeumorphismStatusDot

```ts
import { NeumorphismStatusDot } from '@echolab-auto/ui-frame'
import type {
  NeumorphismStatusDotProps,
  StatusDotStatus,
  StatusDotSize,
} from '@echolab-auto/ui-frame'
```

| Props  | Type                                              | Default              | Description                       |
| ------ | ------------------------------------------------- | -------------------- | --------------------------------- |
| status | `'online' \| 'offline' \| 'busy' \| 'connecting'` | `'online'`           | 状态（决定颜色与 locale 标签）    |
| size   | `'small' \| 'medium' \| 'large'`                  | `'medium'`           | 直径 8/10/12px                    |
| pulse  | `boolean`                                         | `true`               | 过渡态（busy/connecting）呼吸脉冲 |
| label  | `string`                                          | 按状态的 locale 文案 | 无障碍标签                        |

---

#### NeumorphismSpinner

```ts
import { NeumorphismSpinner } from '@echolab-auto/ui-frame'
import type { NeumorphismSpinnerProps, SpinnerSize } from '@echolab-auto/ui-frame'
```

| Props | Type                                       | Default     | Description  |
| ----- | ------------------------------------------ | ----------- | ------------ |
| size  | `'small' \| 'medium' \| 'large' \| number` | `'medium'`  | 档位或像素值 |
| label | `string`                                   | locale 文案 | 无障碍标签   |

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
| disableAuto | `boolean`                        | `false`    | 禁用自动模��选项 |
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

| Props          | Type                | Default   | Description                     |
| -------------- | ------------------- | --------- | ------------------------------- |
| modelValue     | `number`            | `1`       | 缩放比例                        |
| minZoom        | `number`            | `0.1`     | 最小缩放                        |
| maxZoom        | `number`            | `5`       | 最大缩放                        |
| zoomStep       | `number`            | `0.1`     | 缩放步长                        |
| showGrid       | `boolean`           | `true`    | 是否显示网格                    |
| gridSize       | `number`            | `20`      | 网格大小(px)                    |
| gridVariant    | `'dots' \| 'lines'` | `'dots'`  | 网格样式(点阵/线条)             |
| showControls   | `boolean`           | `true`    | 是否显示控制按钮                |
| showFit        | `boolean`           | `true`    | 是否显示"适应屏幕"按钮          |
| showFullscreen | `boolean`           | `true`    | 是否显示全屏按钮                |
| panOnDrag      | `boolean`           | `true`    | 鼠标拖拽平移(空格+拖拽始终可用) |
| wheelZoom      | `boolean`           | `true`    | Ctrl/⌘ + 滚轮缩放至光标         |
| width          | `string`            | `'100%'`  | 宽度                            |
| height         | `string`            | `'500px'` | 高度                            |

**Events:** `update:modelValue`, `zoom-change`

**Exposes:** `zoomIn()`, `zoomOut()`, `resetZoom()`, `fit()`, `toggleFullscreen()`

**键盘交互:** 视口聚焦后,方向键平移(Shift 加速),`+`/`-` 缩放,`0` 重置;按住空格可随时拖拽平移。

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

### Doc 元组件（纯 UI 原语）

#### DocCodeBlock

```ts
import { DocCodeBlock } from '@echolab-auto/ui-frame/doc'
import type { DocCodeBlockProps } from '@echolab-auto/ui-frame/doc'
```

代码块卡片：语言标签 + 行数 + 行号 + 一键复制（`useClipboard` 驱动），内置 `highlightCode` 正则高亮。MarkdownRenderer 的代码块即由它挂载渲染。

| Props           | Type      | Default  | Description                   |
| --------------- | --------- | -------- | ----------------------------- |
| code            | `string`  | —        | 源代码原文                    |
| lang            | `string`  | `'text'` | 语言标记（text/plain 不高亮） |
| showLineNumbers | `boolean` | `true`   | 是否显示行号                  |

#### DocTocNav

```ts
import { DocTocNav } from '@echolab-auto/ui-frame/doc'
import type { DocTocNavProps, TocNode } from '@echolab-auto/ui-frame/doc'
```

目录导航面板：层级折叠、激活高亮、激活项变化时自动展开祖先并滚动到可见位置（滞回防抖动）。可脱离 MarkdownRenderer 单独使用（`activeId` 由宿主持有，通常配合 `useScrollSpy`）。

| Props    | Type        | Default     | Description                           |
| -------- | ----------- | ----------- | ------------------------------------- |
| items    | `TocNode[]` | —           | 层级目录树（`useMarkdownToc` 的产物） |
| activeId | `string`    | `''`        | 当前激活标题 id                       |
| title    | `string`    | locale 文案 | 面板标题                              |
| framed   | `boolean`   | `true`      | false 时只渲染裸列表（嵌入自有容器）  |

**Events:** `select(id)`（宿主负责滚动）

**Exposes:** `scrollTocToActive()`

### useMarkdownToc

```ts
import { useMarkdownToc } from '@echolab-auto/ui-frame/doc'
import type { UseMarkdownTocReturn, TocItem, TocNode } from '@echolab-auto/ui-frame/doc'
```

从 markdown 内容提取 heading 列表并构建层级树。id 带实例级唯一前缀，同名标题自动去重加后缀。

```ts
interface UseMarkdownTocReturn {
  toc: ComputedRef<TocItem[]> // { level, text, id }
  tocTree: ComputedRef<TocNode[]> // 层级树（children）
  makeUniqueId: (text: string) => string
}
```

### useScrollSpy

```ts
import { useScrollSpy, getScrollBehavior } from '@echolab-auto/ui-frame/doc'
import type { UseScrollSpyOptions, UseScrollSpyReturn } from '@echolab-auto/ui-frame/doc'
```

scroll-spy：IntersectionObserver 跟踪内容区标题，输出激活 id；`scrollToHeading` 点击导航（平滑滚动 + 高亮锁定 800ms，避免动画中途闪烁）；`getScrollBehavior()` 遵循 prefers-reduced-motion。

```ts
interface UseScrollSpyOptions {
  content: Ref<HTMLElement | null> // 内容容器（heading 在其中）
  scrollContainer?: Ref<HTMLElement | string | undefined> // 默认向上找 .nm-layout__content
  headingSelector?: string // 默认 'h1, h2, h3'
  watchSource?: () => unknown // 内容版本信号（变化时重建观察器）
  onActiveChange?: (id: string) => void
}

interface UseScrollSpyReturn {
  activeHeading: Ref<string>
  scrollToHeading: (id: string) => void
  syncActiveHeading: () => void
}
```

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

## Chat 聊天面板

聊天 / Agent 面板领域组件，纯渲染层。分两层：**元组件**是纯 UI 原语（零领域类型、slot 驱动，可自由组装任意聊天式 UI）；**组合组件**由元组件拼成，直接消费 `ChatMessage` 数据。组件不持有业务状态、不发起网络请求。

> **依赖**：Agent 正文的 Markdown 渲染复用 doc 模块的 MarkdownRenderer，使用本模块需安装可选 peer 依赖 `marked` + `dompurify`。

```ts
// 组合组件（现成可用）
import { ChatMessageList, ChatComposer } from '@echolab-auto/ui-frame/chat'
import type { ChatMessage } from '@echolab-auto/ui-frame/chat'

// 元组件（自由组装）
import { ChatBubble, ChatTray, ChatFold } from '@echolab-auto/ui-frame/chat'
```

### 元组件

#### ChatBubble

消息气泡壳：对齐与色调正交组合，头部/正文全插槽。

| Props    | Type                                | Default     | Description                                            |
| -------- | ----------------------------------- | ----------- | ------------------------------------------------------ |
| align    | `'start' \| 'end' \| 'center'`      | `'start'`   | 水平对齐（end 居右、center 居中）                      |
| tone     | `'default' \| 'primary' \| 'plain'` | `'default'` | default 中性气泡 / primary 主色气泡 / plain 无气泡平铺 |
| copyText | `string`                            | `''`        | 传入则头部显示悬停浮现的复制按钮                       |

**Slots:** `head`（头部行）、default（正文）

**说明：** `primary + end` 压右下角、`default + start` 压左下角（非对称圆角暗示方向）；`plain + center` 出"细线夹文本"系统消息样式。

#### ChatTray

凹陷滚动托盘：吸底跟随 + 离开底部时的"回到底部"按钮。初始挂载瞬时吸底。

| Props           | Type            | Default     | Description                                  |
| --------------- | --------------- | ----------- | -------------------------------------------- |
| autoScroll      | `boolean`       | `true`      | 新内容到达时自动吸底（用户本就在底部才跟随） |
| scrollThreshold | `number`        | `120`       | 距底部多少 px 内视为贴底                     |
| watchSource     | `() => unknown` | `undefined` | 内容变化侦听源（如 `() => messages.length`） |
| jumpLabel       | `string`        | locale 文案 | 跳转按钮无障碍文本                           |

**Slots:** default（托盘内容）

**Exposes:** `isNearBottom`、`showJumpButton`、`scrollToBottom(behavior?)`、`recheck()`

#### ChatFold

折叠块原语：头部触发器 + 可折叠体。复制等独立交互元素放 `actions` 插槽（不嵌进按钮）。

| Props       | Type      | Default     | Description                              |
| ----------- | --------- | ----------- | ---------------------------------------- |
| open        | `boolean` | `undefined` | 受控展开态（配合 `update:open`）         |
| defaultOpen | `boolean` | `false`     | 非受控初始展开态                         |
| sunk        | `boolean` | `true`      | 凹陷详情井 / false 凸起卡片              |
| expandable  | `boolean` | `true`      | false 时头部为静态行（无箭头、无折叠体） |

**Events:** `update:open`, `toggle`

**Slots:** `head`（scope: `{ open }`，在触发按钮内）、`actions`（触发器外）、`subhead`（始终可见区）、default（折叠体）

#### ChatComposer

聊天输入器：Enter 发送 / Shift+Enter 换行 / **IME 组合中不发送**（中文输入法安全）。

| Props       | Type               | Default     | Description         |
| ----------- | ------------------ | ----------- | ------------------- |
| modelValue  | `string`           | `''`        | 输入内容（v-model） |
| disabled    | `boolean`          | `false`     | 禁用（如未连接）    |
| placeholder | `string`           | locale 文案 | 占位文本            |
| cancelable  | `boolean`          | `false`     | 显示"取消任务"按钮  |
| sendLabel   | `string`           | locale 文案 | 发送按钮文本        |
| cancelLabel | `string`           | locale 文案 | 取消按钮文本        |
| rows        | `number \| string` | `3`         | 初始行数            |
| autoResize  | `boolean`          | `true`      | 随内容自动增高      |
| maxlength   | `number \| string` | `undefined` | 最大输入长度        |

**Events:** `update:modelValue`, `send(content)`（trim 后的非空字符串）, `cancel`

**Slots:** `meta`（输入框上方元信息条）、`actions`（scope: `{ submit, canSubmit }`，整体替换默认发送按钮）

#### ChatCopyButton

悬停复制按钮（`useClipboard` 驱动），复制成功短暂变为 ✓。

| Props | Type     | Default | Description |
| ----- | -------- | ------- | ----------- |
| text  | `string` | —       | 待复制文本  |

### 组合组件

#### ChatMessageList

`ChatTray` + `ChatMessageItem` 的组合：消息流渲染与吸底滚动。

| Props           | Type                       | Default      | Description                                         |
| --------------- | -------------------------- | ------------ | --------------------------------------------------- |
| messages        | `ChatMessage[]`            | —            | 消息列表（按时间升序）                              |
| markdown        | `boolean`                  | `true`       | Agent 正文 Markdown 渲染（用户/系统消息始终纯文本） |
| autoScroll      | `boolean`                  | `true`       | 新内容到达时自动吸底                                |
| scrollThreshold | `number`                   | `120`        | 距底部多少 px 内视为贴底                            |
| emptyText       | `string`                   | locale 文案  | 空消息提示                                          |
| formatTime      | `(time: number) => string` | 本地化时分秒 | 自定义时间格式化（入参为秒级时间戳）                |

**Slots:** `message`（scope: `{ message }`，自定义单条渲染）、`empty`（空状态）

#### ChatMessageItem

单条消息：按 `role` 分发——`tool` → 工具调用块、`branch` → 分支合并块、`system` → 居中平铺，`user`/`agent` 渲染气泡（agent 居左中性、user 居右主色）。

| Props      | Type                       | Default      | Description              |
| ---------- | -------------------------- | ------------ | ------------------------ |
| message    | `ChatMessage`              | —            | 消息数据                 |
| markdown   | `boolean`                  | `true`       | Agent 正文 Markdown 渲染 |
| formatTime | `(time: number) => string` | 本地化时分秒 | 自定义时间格式化         |

#### ChatToolCallBlock

工具调用块（`ChatFold` 凹陷）：工具名 + 状态（running 带 spinner）+ 参数/输出折叠（默认收起，显示字符数）+ 输出复制。

| Props  | Type             | Default     | Description              |
| ------ | ---------------- | ----------- | ------------------------ |
| name   | `string`         | —           | 工具名                   |
| input  | `string`         | `''`        | 摘要化参数文本           |
| output | `string \| null` | `null`      | 工具输出                 |
| status | `ChatToolStatus` | `undefined` | running/succeeded/failed |
| time   | `string`         | `''`        | 已格式化时间             |

#### ChatReasoningBlock

推理折叠块（`ChatFold` 凹陷，默认展开）。

| Props       | Type       | Default | Description  |
| ----------- | ---------- | ------- | ------------ |
| parts       | `string[]` | —       | 推理分段     |
| time        | `string`   | `''`    | 已格式化时间 |
| defaultOpen | `boolean`  | `true`  | 初始是否展开 |

#### ChatBranchMergeBlock

分支合并块（`ChatFold` 凸起）：摘要（subhead 常显）+ "N 工具 · M 推理"统计，展开后嵌套展示分支内的工具调用 / 推理 / 内容记录。

| Props  | Type                | Default | Description    |
| ------ | ------------------- | ------- | -------------- |
| branch | `ChatBranchSummary` | —       | 分支合并块数据 |
| time   | `string`            | `''`    | 已格式化时间   |

### Chat 类型定义

```ts
type ChatRole = 'user' | 'agent' | 'system' | 'tool' | 'branch'
type ChatToolStatus = 'running' | 'succeeded' | 'failed'

interface ChatMessageSource {
  adapterName?: string
  platform?: string
  userId?: string
  userName?: string
  channel?: string
  groupName?: string | null
}

interface ChatToolCall {
  name: string
  input?: string
  output?: string | null
  status?: ChatToolStatus
}

interface ChatBranchEntry {
  kind: 'reasoning' | 'tool' | 'content' | 'notice'
  text: string
  time?: number
  toolName?: string
  input?: string
  output?: string
  status?: ChatToolStatus
}

interface ChatBranchSummary {
  branchId: string
  summary: string
  entries: ChatBranchEntry[]
}

interface ChatMessage {
  id: string | number
  role: ChatRole
  content: string
  time?: number // 秒级 Unix 时间戳
  source?: ChatMessageSource | null
  reasoning?: string[]
  tool?: ChatToolCall
  branch?: ChatBranchSummary
}
```

**全局配置段**：`chat?: { markdown?: boolean; autoScroll?: boolean; scrollThreshold?: number }`（级联优先级：显式 prop > 全局配置 > 默认值）。

---

## Headless Composables

Headless Composables 将业务逻辑与 UI 完全解耦，封装了键盘导航、ARIA、状态管理等行为，开发者只需关心 UI 渲染。

### useFloatingPosition

```ts
import { useFloatingPosition } from '@echolab-auto/ui-frame'
import type {
  FloatingPlacement,
  UseFloatingPositionOptions,
  UseFloatingPositionReturn,
} from '@echolab-auto/ui-frame'
```

共享浮层定位引擎：rAF 逐帧追踪（覆盖嵌套滚动容器/平滑滚动/缩放/布局变化，位置更新与页面绘制同帧）+ 边界翻转（滞后阈值防抖动）。

```ts
type FloatingPlacement = 'top' | 'bottom' | 'left' | 'right'

interface UseFloatingPositionOptions {
  trigger: Ref<HTMLElement | undefined> // 触发器元素
  open: Ref<boolean> // 浮层是否打开（追踪随之启停）
  placement: Ref<FloatingPlacement | 'auto'> // 期望方向；auto 按候选顺序选首个满足空间者
  offset?: Ref<number> // 与触发器间距 px（默认 0）
  floating?: Ref<HTMLElement | undefined> // 浮层元素（读取实际尺寸用于边界判断）
  candidates?: FloatingPlacement[] // auto 候选顺序（默认 bottom→top→right→left）
  flipHysteresis?: number // 翻转滞后 px（默认 48）
  minSpace?: number // 当前侧不足该值才考虑翻转（默认 120）
  estimateSize?: { width: number; height: number } // 浮层未挂载时的尺寸估计
  lockPlacement?: Ref<boolean> // 锁定展开期间方向：打开决策一次后冻结至关闭（适合单盒连体变体）
  onFrame?: () => void // 每帧回调（用于逐帧同步，如负 margin 补偿）
}

interface UseFloatingPositionReturn {
  actualPlacement: Ref<FloatingPlacement> // 边界翻转后的实际方向
  rect: Ref<FloatingRect | null> // 触发器视口 rect（逐帧更新）
  available: Ref<number> // 当前侧可用空间 px（打开/翻转/resize 时重估，滚动中冻结）
  refresh: () => void // 立即全量重算
  stop: () => void // 停止追踪（组件卸载自动调用）
}
```

---

### useScrollbar

```ts
import { useScrollbar } from '@echolab-auto/ui-frame'
import type { ScrollbarVariant, UseScrollbarOptions } from '@echolab-auto/ui-frame'
```

滚动条行为（CSS 类变体 / dots 点阵 / glow 辉光覆盖层）的 headless 封装。

```ts
interface UseScrollbarOptions {
  variant: Ref<'standard' | 'primary' | 'none' | 'dots' | 'glow'>
  target: Ref<string> // 目标滚动容器 CSS 选择器；空串为禁用 no-op
  dotColor: Ref<string> // "r,g,b"
  accentColor: Ref<string> // "r,g,b"
  sigma: Ref<number> // 点阵高斯半径
}

interface UseScrollbarReturn {
  overlayKind: ComputedRef<'dots' | 'glow' | null>
  scrollY: Ref<number>
  overlayH: Ref<number>
  overlayDocH: Ref<number>
  start: () => void // 挂载行为（组件 onMounted 调用）
  stop: () => void // 卸载全部行为与监听器（composable 内 onBeforeUnmount 自动调用）
}
```

> 自 1.0.6 起 `target` 不再默认 `.nm-layout__content`（解耦应用布局类名），使用时必须显式传入目标选择器。

---

### useChartInteraction

```ts
import { useChartInteraction } from '@echolab-auto/ui-frame'
import type { UseChartInteractionOptions, UseChartInteractionReturn } from '@echolab-auto/ui-frame'
```

图表悬停交互（十字线/最近数据点/结构化 tooltip 载荷），rAF 合帧的 mousemove 处理。`UseChartInteractionOptions` 见源码类型注释；返回 `{ crosshairX, nearestIndex, isHovering, tooltipData, tooltipStyle, containerRect, onBodyMouseMove, onBodyMouseLeave }`。

---

### useSelect

```ts
import { useSelect } from '@echolab-auto/ui-frame'
import type {
  UseSelectOptions,
  UseSelectReturn,
  SelectOption,
  SelectGroup,
} from '@echolab-auto/ui-frame'
```

```ts
interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string
}

interface UseSelectOptions {
  modelValue: Ref<string | number | (string | number)[] | undefined>
  options: ComputedRef<SelectOption[]> | Ref<SelectOption[]>
  disabled?: Ref<boolean>
  multiple?: Ref<boolean>
  filterText?: Ref<string>
}

interface UseSelectReturn {
  isOpen: Ref<boolean>
  selectedOption: ComputedRef<SelectOption | undefined>
  selectedOptions: ComputedRef<SelectOption[]>
  filteredOptions: ComputedRef<SelectOption[]>
  groupedOptions: ComputedRef<SelectGroup[]>
  activeValue: Ref<string | number | undefined>
  isSelected: (option: SelectOption) => boolean
  toggleOpen: () => void
  close: () => void
  selectOption: (option: SelectOption) => void
  removeValue: (value: string | number) => void
  clearValue: (value?: string | number | (string | number)[]) => void
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

### useProgress

```ts
import { useProgress } from '@echolab-auto/ui-frame'
import type { UseProgressOptions, UseProgressReturn, ProgressSize } from '@echolab-auto/ui-frame'
```

```ts
interface UseProgressOptions {
  modelValue: Ref<number>
  max: Ref<number>
  indeterminate: Ref<boolean>
  size: Ref<ProgressSize> // 'small' | 'medium' | 'large'
}

interface UseProgressReturn {
  percentage: ComputedRef<number> // 钳制在 [0, 100]，indeterminate 时恒为 0
  isComplete: ComputedRef<boolean>
  displayPercentage: ComputedRef<number> // 随 percentage 平滑滚动的展示值（rAF ease-out）
  isReducedMotion: Ref<boolean>
  circleSize: ComputedRef<number> // 环形 SVG viewBox 边长
  strokeWidth: ComputedRef<number>
  radius: ComputedRef<number>
  circumference: ComputedRef<number>
  dashOffset: ComputedRef<number> // 渲染 percentage 所需的 stroke-dashoffset
  stop: () => void // 取消进行中的标签动画（组件卸载时自动调用）
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
  modelValue: Ref<boolean> // v-model 可见性（必填）
  maskClosable?: Ref<boolean> // 点击遮罩是否关闭
  closable?: Ref<boolean> // 是否可关闭
  destroyOnClose?: Ref<boolean> // 关闭时是否销毁 DOM
}

interface UseModalReturn {
  visible: Ref<boolean> // 当前是否可见（用于过渡动画）
  rendered: Ref<boolean> // 是否应渲染 DOM
  close: () => void
  confirm: () => void
  handleKeydown: (event: KeyboardEvent, dialogEl: HTMLElement | undefined) => void
  focusDialog: (dialogEl: HTMLElement | undefined) => void
  overlayZIndex: ComputedRef<number> // 遮罩层 z-index（感知嵌套层级）
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

### useChart / useBarChart / useLineChart / usePieChart / useCandlestickChart

```ts
import {
  useChart,
  useBarChart,
  useLineChart,
  usePieChart,
  useCandlestickChart,
} from '@echolab-auto/ui-frame'
import type {
  ChartSeries,
  ChartDataPoint,
  ChartMargin,
  TooltipState,
  UseBarChartOptions,
  UseLineChartOptions,
  UsePieChartOptions,
  UseCandlestickChartOptions,
  OhlcDataPoint,
  PieArc,
  BarRect,
  ChartPoint,
  CandleRect,
  VolumeBar,
  MALine,
} from '@echolab-auto/ui-frame'
```

图表 headless 层：`useChart` 提供共享底座（containerSize 跟踪、plotSize、niceTicks、formatValue、调色板与主题跟随、tooltip 状态、级联解析），四个图形 composable 在其上产出几何数据。

```ts
interface UseChartOptions {
  containerRef: Ref<HTMLElement | null>
  series: Ref<ChartSeries[]> | ComputedRef<ChartSeries[]>
  margin?: ChartMargin // 默认 { top: 24, right: 24, bottom: 40, left: 48 }；饼图用对称 24
}

interface UseBarChartOptions extends UseChartOptions {
  orientation?: 'vertical' | 'horizontal'
  barGap?: number // 组间距比例（默认 0.2）
  stacked?: boolean
  yMin?: number
  yMax?: number
}

interface UseLineChartOptions extends UseChartOptions {
  curve?: 'linear' | 'smooth' | 'step'
  area?: boolean
  areaOpacity?: number
  showPoints?: boolean
  pointSize?: number
  lineWidth?: number
  yMin?: number
  yMax?: number
}

interface UsePieChartOptions {
  containerRef: Ref<HTMLElement | null>
  data: Ref<ChartDataPoint[]> | ComputedRef<ChartDataPoint[]>
  margin?: ChartMargin
  innerRadius?: number // 甜甜圈内半径（默认 0）
  outerRadius?: number // 默认 min(plotW, plotH)/2
  padAngle?: number
  startAngle?: number // 角度制
  labelPosition?: 'inside' | 'outside' | 'none'
  roundedCorners?: boolean
  colorPalette?: string[]
}

interface UseCandlestickChartOptions {
  containerRef: Ref<HTMLElement | null>
  data: Ref<OhlcDataPoint[]> | ComputedRef<OhlcDataPoint[]>
  margin?: ChartMargin
  showVolume?: boolean
  showMA?: boolean
  maPeriods?: number[] // 默认 [5, 10, 20]
  upColor?: string
  downColor?: string
  showGrid?: boolean
  showAxis?: boolean
}
```

各返回值：`useBarChart → { bars, xAxisLabels, yAxisTicks, gridLines, ... }`；`useLineChart → { lines, points, ... }`；`usePieChart → { arcs, total, ... }`；`useCandlestickChart → { candles, volumeBars, maLines, priceToY, ... }`；共享底座字段（`plotSize / resolvedMargin / palette / tooltip / reducedMotion / niceTicks / formatValue / resolveProp / config`）均随各 composable 一并返回。

---

### useZIndex

```ts
import { useZIndex, Z_LAYERS, Z_STRIDE } from '@echolab-auto/ui-frame'
```

全局 z-index 分层系统。`Z_LAYERS = { dropdown: 100, tooltip: 200, popover: 300, overlay: 400, toast: 500 }`，`Z_STRIDE = 1000`（嵌套步长）。

```ts
const { getZIndex, registerOverlay, overlayCount } = useZIndex()
// getZIndex(layer) —— 浮层元素自动叠加 overlayCount × Z_STRIDE，保证渲染在遮罩之上
// registerOverlay() —— Modal/Drawer 打开时注册，返回注销函数（关闭时调用）
```

---

### useFocusStack

```ts
import { useFocusStack } from '@echolab-auto/ui-frame'
```

嵌套弹层（Modal/Drawer）的焦点栈：开栈时保存先前焦点元素，关栈按 LIFO 恢复。`{ push(el), pop(): HTMLElement | null, depth(): number, destroy(): void }`。useModal/useDrawer 内部已接入。

---

### useSwipe

```ts
import { useSwipe } from '@echolab-auto/ui-frame'
import type { SwipeDirection, UseSwipeOptions, UseSwipeReturn } from '@echolab-auto/ui-frame'
```

触���滑动手势识别（方向/阈值/取消），返回 `{ direction, deltaX, deltaY, isSwiping }`；`UseSwipeOptions = { threshold?: number; onSwipeStart?: () => void; onSwipe?: (dir) => void; onSwipeEnd?: (dir) => void }`。

---

### useReducedMotion

```ts
import { useReducedMotion, prefersReducedMotion } from '@echolab-auto/ui-frame'
```

`useReducedMotion()` 返回 `{ isReducedMotion: Ref<boolean> }`（跟随 `prefers-reduced-motion` 媒体查询变化）；`prefersReducedMotion()` 为一次性非响应式读取。组件动画降级统一走此开关。

---

### useClipboard

```ts
import { useClipboard } from '@echolab-auto/ui-frame'
import type { UseClipboardOptions, UseClipboardReturn } from '@echolab-auto/ui-frame'
```

剪贴板复制与"已复制"状态自动复位。`copy(text)` 成功返回 `true`（无权限/非安全上下文返回 `false`）；`copied` 在 `resetDelay`（默认 1200ms）后自动复位。

```ts
interface UseClipboardOptions {
  resetDelay?: number
}
interface UseClipboardReturn {
  copied: Ref<boolean>
  copy: (text: string) => Promise<boolean>
}
```

---

### useChatScroll

```ts
import { useChatScroll } from '@echolab-auto/ui-frame'
import type { UseChatScrollOptions, UseChatScrollReturn } from '@echolab-auto/ui-frame'
```

聊天吸底滚动：用户位于底部（`threshold` px 内，默认 120）时新内容自动跟随，向上翻阅不打断；`showJumpButton` 驱动"回到底部"按钮。`watchSource` 传入内容侦听源（如消息条数、最后一条的流式输出），变化时下一帧重新评估。

```ts
interface UseChatScrollOptions {
  container: Ref<HTMLElement | null>
  threshold?: number | Ref<number>
  autoScroll?: boolean | Ref<boolean>
  watchSource?: WatchSource | WatchSource[]
}
interface UseChatScrollReturn {
  isNearBottom: Ref<boolean>
  showJumpButton: ComputedRef<boolean>
  handleScroll: () => void
  scrollToBottom: (behavior?: ScrollBehavior) => void
  recheck: () => void
}
```

---

### useChatInput

```ts
import { useChatInput, isImeComposing } from '@echolab-auto/ui-frame'
import type { UseChatInputOptions, UseChatInputReturn } from '@echolab-auto/ui-frame'
```

聊天输入提交逻辑：Enter 提交 / Shift+Enter 换行 / IME 组合中不提交（`isComposing` / `Process` 键 / `keyCode 229` 三重判定）；提交内容为 trim 后的非空字符串，提交后自动清空。

```ts
interface UseChatInputOptions {
  modelValue: Ref<string>
  disabled?: Ref<boolean>
  onSubmit: (content: string) => void
}
interface UseChatInputReturn {
  handleKeydown: (event: KeyboardEvent) => void
  submit: () => void
  canSubmit: ComputedRef<boolean>
}
```

---

### useSegmented

```ts
import { useSegmented } from '@echolab-auto/ui-frame'
import type { UseSegmentedOptions, UseSegmentedReturn } from '@echolab-auto/ui-frame'
```

分段选择器单选逻辑：roving tabindex + 方向键/Home/End 导航（跳过禁用项，移动即选中）。

```ts
interface UseSegmentedOptions {
  modelValue: Ref<string | number | undefined>
  options: Ref<SegmentedOption[]>
  disabled?: Ref<boolean>
  onChange?: (value: string | number) => void
}
interface UseSegmentedReturn {
  isActive: (option: SegmentedOption) => boolean
  isItemDisabled: (option: SegmentedOption) => boolean
  select: (option: SegmentedOption) => void
  focusIndex: Ref<number>
  tabindexFor: (index: number) => 0 | -1
  handleKeydown: (event: KeyboardEvent) => void
}
```

---

## 指令

### vMagnetic

```ts
import { vMagnetic } from '@echolab-auto/ui-frame'
```

磁吸指令：元素随指针靠近产生位移吸附（物理隐喻：弱引力）。用法：`v-magnetic` 或 `v-magnetic="{ strength?: number; radius?: number }"`。

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
  prefix: 'checkbox' | 'radio'
  isChecked: boolean
  isDisabled: boolean
  size: 'small' | 'medium' | 'large'
  extraClasses?: Record<string, boolean> // 额外类名（如 indeterminate）
}

// 参数为返回配置对象的工厂函数（composable 内部 computed 化）
function useCheckable(options: () => UseCheckableOptions): {
  inputId: string // 组件生命周期内稳定的 input id
  classList: ComputedRef<(string | Record<string, boolean>)[]>
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
  id?: string // 不传则自动生成稳定 id
  size: 'small' | 'medium' | 'large'
  disabled: boolean
  error?: string | boolean
  prefix: 'input' | 'textarea' | 'select' | 'datepicker'
}

// 参数为返回配置对象的工厂函数
function useFormField(config: () => FormFieldConfig): {
  isFocused: Ref<boolean>
  fieldId: string
  errorMessage: ComputedRef<string> // error 为字符串时取其值，否则 ''
  hasError: ComputedRef<boolean>
  baseClassList: (baseClass: string) => ComputedRef<(string | Record<string, boolean>)[]>
  handleFocus: (event: FocusEvent, emit: (e: 'focus', ev: FocusEvent) => void) => void
  handleBlur: (event: FocusEvent, emit: (e: 'blur', ev: FocusEvent) => void) => void
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
  select?: {
    size?: SelectSize
    clearable?: boolean
    multiple?: boolean
    filterable?: boolean
    collapseTags?: boolean
    variant?: 'default' | 'outlined'
  }
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
  progress?: {
    size?: ProgressSize
    variant?: ProgressVariant
    showLabel?: boolean
    effect?: ProgressEffect
  }
  skeleton?: { animation?: SkeletonAnimation }
  table?: { size?: TableSize; striped?: boolean }
  divider?: { direction?: DividerDirection }
  collapse?: { size?: CollapseSize; accordion?: boolean }
  container?: { mode?: 'fixed' | 'fluid' }
  row?: { gutter?: number | [number, number] }
  layout?: { siderWidth?: number; collapsible?: boolean }
  themeToggle?: { size?: ThemeToggleSize }
  tree?: { showSearch?: boolean; multiple?: boolean }
  canvas?: { showGrid?: boolean; gridSize?: number; gridVariant?: 'dots' | 'lines' }
  popover?: {
    position?: PopoverPosition
    trigger?: PopoverTrigger
    offset?: number
    width?: 'auto' | 'trigger' | number
    showArrow?: boolean
  }
  dropdown?: { position?: PopoverPosition; trigger?: PopoverTrigger; offset?: number }
  alert?: {
    type?: AlertType
    closable?: boolean
    duration?: number
    icon?: boolean
    bordered?: boolean
    size?: AlertSize
  }
  empty?: { size?: EmptySize }
  autoComplete?: { size?: AutoCompleteSize; clearable?: boolean }
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
import { useLocale, provideLocale, zhCN, enUS } from '@echolab-auto/ui-frame'
import type { LocaleMessages, Locale } from '@echolab-auto/ui-frame'
```

| API           | 签名                                               | 说明                                 |
| ------------- | -------------------------------------------------- | ------------------------------------ |
| provideLocale | `(messages: LocaleMessages) => void`               | 向子树提供语言包（可部分覆盖内置键） |
| useLocale     | `() => { locale: ComputedRef<LocaleMessages>, t }` | 读取当前语言包与翻译函数             |
| zhCN          | `LocaleMessages`                                   | 简体中文语言包                       |
| enUS          | `LocaleMessages`                                   | 英文语言包                           |

```ts
function useLocale(): {
  locale: ComputedRef<LocaleMessages>
  t: (key: keyof LocaleMessages, params?: Record<string, string | number>) => string
}
```

> `t()` 支持 `{key}` 插值：`t('paginationTotal', { total: 100 })` → `'共 100 条'`。

---

## 主题 Token

所有视觉参数以 CSS 自定义属性暴露（`--nm-*`)，亮/暗双主题定义于 `src/styles/tokens.scss`（亮）与 `[data-theme='dark']`（暗）。运行时可通过覆写变量自定义主题：

| 类别   | 代表变量                                                                               | 说明                               |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------- |
| 颜色   | `--nm-bg-color`、`--nm-surface-color`、`--nm-primary-color`、`--nm-color-error`        | 背景/表面/主色/语义色              |
| 文字   | `--nm-text-primary`、`--nm-text-secondary`、`--nm-text-placeholder`                    | 三级文字色                         |
| 阴影   | `--nm-shadow-dark`、`--nm-shadow-light`、`--nm-shadow-ambient-lg`、`--nm-shadow-error` | 新拟态明暗阴影与环境光             |
| 圆角   | `--nm-border-radius-sm/md/lg/full`                                                     | 8 / 16 / 24 / 9999 px              |
| 间距   | `--nm-spacing-xs` ~ `--nm-spacing-xl`                                                  | 4 / 8 / 12 / 16 / 24 px            |
| 过渡   | `--nm-transition-fast`、`--nm-transition-slow`                                         | 交互/主题切换时长                  |
| 层级   | `--nm-z-dropdown/tooltip/popover/overlay/toast`                                        | 浮层基准层级                       |
| 组件段 | `--nm-select-*`、`--nm-progress-*`、`--nm-chart-*` 等                                  | 组件级 token（Outlined/动效/图表） |

覆写示例：

```css
:root {
  --nm-primary-color: #7c6cff;
}
```

---

## SCSS 资源

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
