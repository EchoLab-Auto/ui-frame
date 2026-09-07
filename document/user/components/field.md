---
id: comp-field
title: 'NeumorphismFieldLabel / FieldError（字段标签与错误）'
x: 2101
y: 1792
group: 使用
---

# NeumorphismFieldLabel / NeumorphismFieldError

> 表单字段的两枚「积木」——FieldLabel 渲染关联控件 id 的标签（必填时附红色 `*`），FieldError 以 `role="alert"` 输出错误文案（空消息不渲染）。Input / Textarea / Select 等字段组件内部即由它们拼装，也可单独用于自定义字段。源码：`src/components/NeumorphismField/`。

```vue
<NeumorphismFieldLabel label="用户名" required for-id="username" />
<NeumorphismFieldError id="username-error" message="请输入用户名" />
```

---

## 可配置项

### NeumorphismFieldLabel Props

| 名称       | 类型      | 默认值  | 说明                                     |
| ---------- | --------- | ------- | ---------------------------------------- |
| `label`    | `string`  | —       | 标签文字；为空（含未传）时整个标签不渲染 |
| `required` | `boolean` | `false` | 必填标记，标签后追加红色 `*`             |
| `forId`    | `string`  | —       | 关联控件的 id（映射到原生 `for` 属性）   |

### NeumorphismFieldError Props

| 名称      | 类型     | 默认值 | 说明                                                            |
| --------- | -------- | ------ | --------------------------------------------------------------- |
| `id`      | `string` | —      | 元素 id，供控件的 `aria-errormessage` / `aria-describedby` 指向 |
| `message` | `string` | —      | 错误文案；为空（含未传）时不渲染                                |

### Events / Slots

两组件均无事件与插槽——纯展示型原子组件。

---

## 用法

自定义字段的标准拼法（label 关联输入、错误可被读屏器播报）：

```vue
<template>
  <div class="my-field">
    <NeumorphismFieldLabel label="邮箱" required :for-id="fieldId" />
    <input
      :id="fieldId"
      v-model="email"
      :aria-invalid="!!error"
      :aria-errormessage="error ? `${fieldId}-error` : undefined"
    />
    <NeumorphismFieldError :id="`${fieldId}-error`" :message="error" />
  </div>
</template>
```

样式约定：标签 `--nm-font-base` / 500 字重 / `--nm-text-primary`；错误 `--nm-font-sm` / `--nm-color-error` / 顶部 `--nm-spacing-xs` 间距；必填星号继承 `--nm-color-error`。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismForm](./form.md) — 表单容器与校验体系
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名
