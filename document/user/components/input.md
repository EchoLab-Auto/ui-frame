---
id: comp-input
title: 'NeumorphismInput'
x: 1709
y: 1199
group: 使用
---

# NeumorphismInput

> 单行文本输入框——凹陷槽容器 + 浮动标签 + 错误抖动，与 Textarea / Select / DatePicker 共享 `useFormField` 字段基建。源码：`src/components/NeumorphismInput/`。

```vue
<NeumorphismInput v-model="name" label="用户名" placeholder="请输入" clearable />
```

---

## 可配置项

### Props

| 名称                                 | 类型                             | 默认值     | 说明                                            |
| ------------------------------------ | -------------------------------- | ---------- | ----------------------------------------------- |
| `modelValue`                         | `string`                         | `''`       | v-model 绑定值                                  |
| `type`                               | `string`                         | `'text'`   | 原生 type（text / password / email……）          |
| `placeholder`                        | `string`                         | —          | 占位文本                                        |
| `label`                              | `string`                         | —          | 字段标签（经 FieldLabel 渲染，关联 input id）   |
| `floatingLabel`                      | `boolean`                        | `false`    | 浮动标签模式：label 从输入位上浮到字段顶边      |
| `error`                              | `string \| boolean`              | —          | 错误态：字符串为错误文案，`true` 仅显示错误样式 |
| `size`                               | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `input.size` 级联        |
| `disabled` / `readonly` / `required` | `boolean`                        | `false`    | 禁用 / 只读 / 必填（必填显示红色 \*）           |
| `maxlength` / `minlength`            | `number \| string`               | —          | 原生长度约束                                    |
| `autocomplete`                       | `string`                         | `'off'`    | 原生自动完成                                    |
| `inputmode`                          | 枚举                             | —          | 移动端虚拟键盘类型（numeric / tel / email……）   |
| `name` / `id`                        | `string`                         | —          | 原生表单属性；id 缺省自动生成并关联 label/error |

透传说明：`inheritAttrs: false`，除 `class` / `style` 外的 attrs 透传到原生 `<input>`。

### Events / Slots

| 名称                                            | 说明                                  |
| ----------------------------------------------- | ------------------------------------- |
| `update:modelValue(value)` / `input` / `change` | 输入过程与提交语义分离                |
| `focus` / `blur` / `keydown`                    | 原生事件透传                          |
| `enter(value)`                                  | 按 Enter 时携带当前值额外触发         |
| `prefix` / `suffix`                             | 输入槽前/后置内容（图标、单位、按钮） |

---

## 预设与常用组合

```vue
<!-- 带标签 + 必填 + 错误态 -->
<NeumorphismInput v-model="email" label="邮箱" required :error="emailError" />

<!-- 浮动标签（label 兼作 placeholder，聚焦/有值时上浮） -->
<NeumorphismInput v-model="name" label="用户名" floating-label />

<!-- 前后置内容 -->
<NeumorphismInput v-model="keyword">
  <template #prefix>🔍</template>
  <template #suffix><span>搜索</span></template>
</NeumorphismInput>

<!-- 密码 + Enter 提交 -->
<NeumorphismInput v-model="pwd" type="password" @enter="submit" />
```

全局预设：

```ts
app.use(NeumorphismUI, { input: { size: 'medium' } })
```

---

## 交互动画详解

### 字段状态（凹陷槽的五张面孔）

输入框容器是一个 `inset 4px 4px 8px` 的凹陷槽，各状态变化：

| 状态     | 表现                                                       | 过渡                               |
| -------- | ---------------------------------------------------------- | ---------------------------------- |
| 常态     | 凹陷槽 + `--nm-surface-color` 背景                         | 0.35s spring（阴影）/ 0.3s（位移） |
| hover    | 凹陷加深（inset 5px 10px）+ **上浮 1px**                   | 同上，弹簧带超调                   |
| focused  | 凹陷加深 + 3px 主色外环 + 上浮 1px                         | 0.3s spring                        |
| error    | 凹陷 + 2px 错误色外环；focused+error 时环加深为 3px 错误色 | —                                  |
| disabled | 透明度 0.6 + `not-allowed`                                 | —                                  |

### 浮动标签（floatingLabel）

- label 初始位于输入位（placeholder 角色），**有值或聚焦时**上浮到字段顶边内侧（top 6px、字号缩到 `--nm-font-xs`、颜色变主色）
- 上浮动画走 0.25s spring，top / left / font-size / color 四属性同步过渡
- error 态下浮动标签同步变错误色；必填星号跟随 label

### 错误抖动

`--error-shake` 类触发 `nm-input-shake`：±5px / ±3px 四段横向抖动，0.4s compress 曲线——校验失败时的物理反馈（复用全局 `nm-shake` 体系）。

### 无障碍

- `aria-invalid` + `aria-errormessage` / `aria-describedby` 指向 `${fieldId}-error` 错误元素（`role="alert"`）
- 未显式传 `id` 时自动生成稳定 id，label 的 `for` 与错误元素自动关联

### Reduced-motion

`prefers-reduced-motion` 时：全部过渡、浮动标签动画与错误抖动移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismTextarea](./textarea.md) / [NeumorphismSelect](./select.md) — 同基建字段组件
- [交互效果](../interaction.md) — 表单校验体系与字段状态约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
