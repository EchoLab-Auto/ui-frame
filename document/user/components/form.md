---
id: comp-form
title: 'NeumorphismForm（表单）'
x: 2101
y: 1668
group: 使用
---

# NeumorphismForm

> 表单容器与字段行——`NeumorphismForm` 通过 provide/inject 向 `NeumorphismFormItem` 分发 model / rules / 错误表与校验函数，提交前自动全量校验；字段在首次 blur 后才参与增量校验（未触碰不打扰）。源码：`src/components/NeumorphismForm/`。

```vue
<NeumorphismForm :model="model" :rules="rules" @submit="onSubmit">
  <NeumorphismFormItem label="名称" name="name" required>
    <NeumorphismInput v-model="model.name" />
  </NeumorphismFormItem>
  <NeumorphismButton type="submit">提交</NeumorphismButton>
</NeumorphismForm>
```

---

## 可配置项

### NeumorphismForm Props

| 名称         | 类型                             | 默认值       | 说明                                                                |
| ------------ | -------------------------------- | ------------ | ------------------------------------------------------------------- |
| `model`      | `Record<string, unknown>`        | `{}`         | 表单数据对象，校验时按 `name` 取值                                  |
| `rules`      | `Record<string, FormRule[]>`     | `{}`         | 按字段名组织的校验规则                                              |
| `labelWidth` | `string`                         | —            | FormItem 标签宽度，支持全局配置 `form.labelWidth` 级联              |
| `size`       | `'small' \| 'medium' \| 'large'` | —            | 字段尺寸，下发给子字段，支持 `form.size` 级联                       |
| `direction`  | `'horizontal' \| 'vertical'`     | `'vertical'` | 排列方向（horizontal 为 flex 横向换行），支持 `form.direction` 级联 |

### NeumorphismFormItem Props

| 名称       | 类型         | 默认值  | 说明                                                        |
| ---------- | ------------ | ------- | ----------------------------------------------------------- |
| `label`    | `string`     | —       | 标签文字（label 的 `for` 自动关联字段 id）                  |
| `name`     | `string`     | —       | 字段名：提供后自动向父 Form 注册/注销校验器并读取 Form 错误 |
| `required` | `boolean`    | `false` | 必填标记（标签后红色 `*`）                                  |
| `rules`    | `FormRule[]` | `[]`    | 字段级规则（与 Form 的 `rules[name]` 都会执行）             |
| `error`    | `string`     | —       | 外部强制错误文案，优先级高于 Form 错误与本地错误            |

### Events / Slots

| 名称               | 说明                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| `submit(model)`    | 原生 submit 被拦截并 `preventDefault`，全量校验通过后携带 model 副本触发 |
| `validate(valid)`  | 每次全量校验后触发，报告整体是否通过                                     |
| Form 默认 slot     | 绑定 `{ errors, validateAll, clearErrors }`                              |
| FormItem 默认 slot | 绑定 `{ error, validate, fieldId }`，供字段组件接入错误态与校验          |

### Expose

| 组件                | 暴露成员                                                  |
| ------------------- | --------------------------------------------------------- |
| NeumorphismForm     | `validateAll()` / `validateField(name)` / `clearErrors()` |
| NeumorphismFormItem | `validate(value)` / `clearError()` / `fieldId`            |

### FormRule

```ts
interface FormRule {
  required?: boolean
  message?: string // 自定义错误文案，缺省用内置中文提示
  pattern?: RegExp
  minLength?: number
  maxLength?: number
  min?: number // 数值下限
  max?: number // 数值上限
  validator?: (value: unknown) => boolean | string
}
```

校验由 `validateFieldValue` 逐条执行：required 对 `null / undefined / ''` 生效；空值跳过后续类型检查；`validator` 返回 `false` 或字符串均判失败。

---

## 用法

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

const model = reactive({ name: '', email: '' })
const rules = {
  name: [{ required: true, message: '请输入名称', minLength: 2 }],
  email: [{ required: true }, { pattern: /^\S+@\S+$/, message: '邮箱格式不正确' }],
}
const formRef = ref()

async function onSubmit(m: Record<string, unknown>) {
  // 校验已通过，m 为 model 的浅拷贝
}
</script>

<template>
  <NeumorphismForm
    ref="formRef"
    :model="model"
    :rules="rules"
    direction="vertical"
    @submit="onSubmit"
  >
    <NeumorphismFormItem label="名称" name="name" required>
      <NeumorphismInput v-model="model.name" />
    </NeumorphismFormItem>
    <NeumorphismFormItem label="邮箱" name="email" required>
      <NeumorphismInput v-model="model.email" />
    </NeumorphismFormItem>
  </NeumorphismForm>
</template>
```

手动触发与清理：

```vue
<!-- 通过 ref 主动校验 / 清错 -->
<NeumorphismButton @click="formRef.validateAll()">校验</NeumorphismButton>
<NeumorphismButton @click="formRef.clearErrors()">清除错误</NeumorphismButton>
```

全局预设：

```ts
app.use(NeumorphismUI, { form: { direction: 'vertical', labelWidth: '96px', size: 'medium' } })
```

---

## 工作机制

### 错误三级优先级

FormItem 展示错误的顺序：`props.error`（外部强制）> Form 注入的 `errors[name]` > 字段本地 `localError`。任一级非空即为错误态，`role="alert"` 输出。

### 双通道校验

`validateField(name)` 先跑 Form `rules[name]`（写入 Form 错误表），再跑 FormItem 注册的本地校验器；两者皆无的字段会被清理陈旧错误。`name` 运行时变化会自动注销旧名、注册新名。

### 增量校验节奏

字段首次 blur 后才进入 `touchedFields`——未触碰的字段不会在输入中途报错，提交时的 `validateAll` 则一视同仁全量检查。

### 响应式下发

Form 通过 getter 形式的 provide 下发 `model` / `rules` / `labelWidth` / `size`：父组件整体替换 prop 对象时，子字段始终读到最新值，而非 setup 时的快照。

### Reduced-motion

`prefers-reduced-motion` 时移除全部过渡与动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismInput](./input.md) / [NeumorphismField](./field.md) — 字段组件与标签/错误基建
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 FormRule
