---
id: comp-select
title: 'NeumorphismSelect'
x: 1709
y: 1448
group: 使用
---

# NeumorphismSelect

> 下拉选择器——单选/多选/可搜索/分组，双视觉变体（凹陷触发器 + teleport 浮层 / 描边连体下拉），行为状态机在公开导出的 headless `useSelect` 中。源码：`src/components/NeumorphismSelect/`。

```vue
<NeumorphismSelect v-model="framework" :options="options" filterable clearable />
```

---

## 可配置项

### Props

| 名称                                                                 | 类型                                       | 默认值           | 说明                                                                |
| -------------------------------------------------------------------- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------- |
| `modelValue`                                                         | `string \| number \| (string \| number)[]` | `''`             | 单选为标量，多选为数组                                              |
| `options`                                                            | `SelectOption[]`                           | `[]`             | 选项（`{ label, value, disabled?, group? }`，`group` 同名归组展示） |
| `multiple`                                                           | `boolean`                                  | `false`          | 多选模式                                                            |
| `filterable`                                                         | `boolean`                                  | `false`          | 可搜索：触发器内嵌输入框，输入即过滤                                |
| `clearable`                                                          | `boolean`                                  | `false`          | 显示清空按钮                                                        |
| `collapseTags`                                                       | `boolean`                                  | `false`          | 多选标签折叠，超出显示 +N                                           |
| `maxCollapseTags`                                                    | `number`                                   | `1`              | 折叠前展示的标签数                                                  |
| `variant`                                                            | `'default' \| 'outlined'`                  | `'default'`      | 视觉变体：凹陷触发器 / 描边连体下拉                                 |
| `loading` / `loadingText`                                            | `boolean` / `string`                       | `false` / locale | 远程数据加载态                                                      |
| `placeholder` / `emptyText` / `clearLabel` / `listLabel`             | `string`                                   | locale           | 文案，缺省走 locale                                                 |
| `label` / `required` / `error` / `size` / `disabled` / `name` / `id` | —                                          | —                | 字段通用项；`size` 支持全局配置级联                                 |

`multiple` / `filterable` / `collapseTags` / `variant` / `size` 均支持三级级联：显式 prop > 全局配置 `select.*` > 默认关闭/默认值。

### Events / Slots / Expose

| 名称                           | 说明                                          |
| ------------------------------ | --------------------------------------------- |
| `update:modelValue` / `change` | 值变化                                        |
| `visible-change(open)`         | 下拉展开/收起（远程加载场景用它拉数据）       |
| `remove-tag(value)`            | 多选移除单个标签                              |
| `search(query)`                | filterable 输入过滤文本                       |
| `focus` / `blur`               | 原生焦点事件                                  |
| `value` slot                   | 自定义单选选中值显示，作用域参数 `{ option }` |
| `focus()` / `blur()`           | `defineExpose` 的编程式焦点方法               |

---

## 预设与常用组合

```vue
<!-- 单选 + 可搜索 + 可清空 -->
<NeumorphismSelect v-model="framework" :options="options" filterable clearable />

<!-- 多选 + 标签折叠 -->
<NeumorphismSelect
  v-model="tags"
  :options="options"
  multiple
  collapse-tags
  :max-collapse-tags="2"
/>

<!-- 分组选项：options 带 group 字段即自动归组 -->
<!-- [{ label: 'Vue 3', value: 'vue', group: '框架' }, ...] -->

<!-- 远程加载：展开时拉数据 -->
<NeumorphismSelect v-model="user" :options="users" :loading="loading" @visible-change="onOpen" />

<!-- 描边连体下拉（outlined） -->
<NeumorphismSelect v-model="city" :options="cities" variant="outlined" />
```

全局预设：

```ts
app.use(NeumorphismUI, {
  select: { size: 'medium', clearable: true, variant: 'default' },
})
```

---

## 交互动画详解

### 键盘导航（单选与多选两套语义）

- **单选对齐原生 `<select>`**：方向键**即时切换选中值**（无需展开即可上下换值），Enter/Space 开合下拉
- **多选引入高亮项**（`activeValue`）：方向键只移动高亮，Enter/Space 切换该项选中；打开时优先高亮最后一个选中项
- 通用：`Home` / `End` 跳首尾、`Esc` 关闭、**Typeahead 字母搜索**（500ms 缓冲，先前缀后包含匹配）
- filterable 模式下可打印字符交给内嵌输入框原生处理，不触发 typeahead；键盘导航改变的项自动 `scrollIntoView` 保持可见

### 下拉的展开/收起

- **default 变体**：teleport 到 body 的浮层（不受祖先 overflow 裁剪），`useFloatingPosition` rAF 逐帧定位，bottom↔top 翻转滞后防抖动，最大高度随可用空间收缩
- **outlined 连体变体**：下拉是盒内第二行，`max-height` 0.34s pull 曲线「抽出式」揭示；盒体在文档流长高时**逐帧施加负 margin 补偿**，布局零抖动；向上翻转时盒体 column-reverse + 投影镜像；展开期间方向锁定（`lockPlacement`）防中途瞬跳
- **两相状态**：`visualOpen`（等 leave 动画结束才解除 open 视觉）+ `settledOpen`（等 enter 动画结束才放开内部滚动，防滚动条闪烁）
- 选中圆点 `pop` 弹入（0.35s bounce）；箭头随开合旋转；触发器在面板抽出/抽回时同步发光与熄灭，时序严格对称

### 关闭路径（全覆盖）

点击外部（document capture 阶段 pointerdown 兜底，兼容 `@mousedown.prevent` 的标签区/选项区）、Esc、焦点外移（teleport 浮层内的焦点转移不误判）、清空按钮、单选选中即关。

### 多选标签

标签区 `@mousedown.prevent` 保持焦点不离开触发器，点标签的 ✕ 不会误关下拉；`collapseTags` 折叠为 `+N` 计数标签。

### 无障碍

- 触发器 `role="combobox"` + `aria-expanded` / `aria-haspopup="listbox"` / `aria-activedescendant`；filterable 时 combobox 语义移到原生 `<input>` 上（ARIA 1.2 模式）
- 下拉 `role="listbox"`，多选带 `aria-multiselectable`；选项 `role="option"` + `aria-selected` / `aria-disabled`
- 字段错误态与 Input 同一套 `aria-invalid` / `aria-errormessage` 约定

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [交互效果](../interaction.md) — 浮层定位引擎与层级管理
- [NeumorphismInput](./input.md) — 字段状态与错误态约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useSelect` 复用
