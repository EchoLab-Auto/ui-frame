---
id: comp-textarea
title: 'NeumorphismTextarea'
x: 1029
y: 809
group: 使用
---

# NeumorphismTextarea

> 多行文本输入——与 Input 共享字段基建（凹陷槽、焦点环、错误态），额外提供自动高度与字数统计。源码：`src/components/NeumorphismTextarea/`。

```vue
<NeumorphismTextarea
  v-model="bio"
  label="个人简介"
  :rows="4"
  auto-resize
  show-count
  :maxlength="200"
/>
```

---

## 可配置项

### Props

| 名称                                 | 类型                             | 默认值     | 说明                                          |
| ------------------------------------ | -------------------------------- | ---------- | --------------------------------------------- |
| `modelValue`                         | `string`                         | `''`       | v-model 绑定值                                |
| `placeholder`                        | `string`                         | —          | 占位文本                                      |
| `label`                              | `string`                         | —          | 字段标签                                      |
| `error`                              | `string \| boolean`              | —          | 错误态（字符串为错误文案）                    |
| `rows`                               | `number \| string`               | `4`        | 初始行数                                      |
| `autoResize`                         | `boolean`                        | `false`    | 高度随内容自动增长（见下文机制）              |
| `showCount`                          | `boolean`                        | `false`    | 显示字数统计（配合 `maxlength` 显示 `n/max`） |
| `maxlength` / `minlength`            | `number \| string`               | —          | 原生长度约束                                  |
| `size`                               | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `textarea.size` 级联   |
| `disabled` / `readonly` / `required` | `boolean`                        | `false`    | 禁用 / 只读 / 必填                            |
| `inputmode`                          | `'none' \| 'text' \| 'search'`   | —          | 移动端虚拟键盘类型                            |
| `name` / `id`                        | `string`                         | —          | 原生表单属性；id 缺省自动生成                 |

透传说明：`inheritAttrs: false`，除 `class` / `style` 外的 attrs 透传到原生 `<textarea>`。

### Events / Slots

| 名称                                            | 说明                                     |
| ----------------------------------------------- | ---------------------------------------- |
| `update:modelValue(value)` / `input` / `change` | 输入过程与提交语义分离                   |
| `focus` / `blur` / `keydown`                    | 原生事件透传                             |
| `enter(value)`                                  | Enter 触发（**Shift+Enter 换行不触发**） |

---

## 预设与常用组合

```vue
<!-- 自动高度：随内容增长，无内部滚动条 -->
<NeumorphismTextarea v-model="content" auto-resize />

<!-- 字数限制 + 统计 -->
<NeumorphismTextarea v-model="comment" :maxlength="140" show-count />

<!-- 表单字段：标签 + 必填 + 错误态 -->
<NeumorphismTextarea v-model="reason" label="申请理由" required :error="reasonError" :rows="3" />
```

全局预设：

```ts
app.use(NeumorphismUI, { textarea: { size: 'medium' } })
```

---

## 交互动画详解

### 自动高度的实现机制

`autoResize` 开启后，每次输入与外部赋值都执行 `height = 'auto' → height = scrollHeight` 两步重设——先塌缩再量出真实内容高度，因此**缩短文本时高度也会跟着回落**。初次挂载即校准一次；字段不出现内部滚动条，页面滚动不被截获。

### 字段状态与焦点

与 [NeumorphismInput](./input.md) 完全同构：凹陷槽常态 / hover 加深 / focused 3px 主色外环 / error 错误色外环 / disabled 降透明，过渡走 spring 曲线（详见 Input 文档的[字段状态表](./input.md#字段状态凹陷槽的五张面孔)）。

### Enter 语义

`enter` 事件仅在**单独按 Enter** 时触发；`Shift+Enter` 是换行，不会误触发——多行输入里 Enter 的「提交」语义由使用方决定是否绑定。

### 字数统计

`showCount` 在字段右下角显示当前字数；配合 `maxlength` 时显示 `当前/上限` 形式。

### 无障碍与 reduced-motion

`aria-invalid` / `aria-errormessage` 关联错误元素（`role="alert"`），与 Input 同一套约定；`prefers-reduced-motion` 时过渡与抖动移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismInput](./input.md) — 单行输入与字段状态详解
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
