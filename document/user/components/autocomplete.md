---
id: comp-autocomplete
title: 'NeumorphismAutoComplete（输入联想）'
x: 2101
y: 1296
group: 使用
---

# NeumorphismAutoComplete

> 输入联想——在 NeumorphismInput 之上叠加联想下拉：本地过滤或异步搜索（防抖 + loading 态），headless 逻辑由 `useAutoComplete` 承载，下拉经共享浮层引擎 `useFloatingPosition` 定位并 teleport 到 body。源码：`src/components/NeumorphismAutoComplete/`。

```vue
<NeumorphismAutoComplete v-model="city" :options="cityOptions" placeholder="输入城市" clearable />
```

---

## 可配置项

### Props

| 名称          | 类型                                               | 默认值     | 说明                                                           |
| ------------- | -------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `modelValue`  | `string \| number`                                 | —          | 绑定值（v-model，选中项的 value）                              |
| `options`     | `AutoCompleteOption[]`                             | `[]`       | 本地选项数据（按 label 过滤）                                  |
| `placeholder` | `string`                                           | `''`       | 占位文本                                                       |
| `disabled`    | `boolean`                                          | `false`    | 禁用（透明度 0.6 + 屏蔽指针）                                  |
| `size`        | `'small' \| 'medium' \| 'large'`                   | `'medium'` | 尺寸档位，支持全局配置 `autoComplete.size` 级联                |
| `clearable`   | `boolean`                                          | `true`     | 有值时显示清空按钮，支持全局配置 `autoComplete.clearable` 级联 |
| `loading`     | `boolean`                                          | `false`    | 外部加载状态（异步搜索时传入，显示旋转指示）                   |
| `label`       | `string`                                           | —          | 输入框标签（透传给内部 Input）                                 |
| `debounce`    | `number`                                           | `300`      | 异步搜索防抖延迟（ms）                                         |
| `searchFn`    | `(query: string) => Promise<AutoCompleteOption[]>` | —          | 异步搜索函数（传入后替代本地过滤）                             |

```ts
interface AutoCompleteOption {
  label: string
  value: string | number
  disabled?: boolean
}
```

### Events / Slots

| 名称                       | 说明                                 |
| -------------------------- | ------------------------------------ |
| `update:modelValue(value)` | 选中 / 清空时同步 v-model            |
| `select(option)`           | 选中某个选项（携带完整 option 对象） |
| `search(query)`            | 输入内容变化（含清空为空串）         |
| `focus` / `blur`           | 原生焦点事件透传                     |
| —                          | 无插槽                               |

---

## 用法

```vue
<!-- 本地过滤 -->
<NeumorphismAutoComplete v-model="fruit" :options="fruitOptions" label="水果" />

<!-- 异步搜索 -->
<NeumorphismAutoComplete
  v-model="user"
  :search-fn="searchUsers"
  :loading="searching"
  :debounce="500"
  @select="onPick"
/>
```

全局预设：

```ts
app.use(NeumorphismUI, { autoComplete: { size: 'medium', clearable: true } })
```

---

## 交互动画详解

### 下拉行为

- 下拉 teleport 到 body，`position: fixed` 定位；底部空间不足时向上翻转（候选 `['bottom', 'top']`），高度随视口余量收缩（上限 240px）
- 打开动画：0.25s decelerate 淡入 + spring 位移（-8px → 0）并 scale 0.98→1；关闭 0.15s accelerate
- 输入有值时聚焦自动重开下拉；点击外部 / Escape 关闭；blur 延迟 150ms 关闭，让选项 click 先行
- 后缀区三件套：清空按钮（mousedown.prevent 避免抢焦点）→ loading 旋转器 → 下拉箭头（打开时旋转 180°）

### 选项与键盘

- 匹配片段经 `highlightMatch` 以 `<mark>` 包裹高亮（主色加粗）；label 先整体 HTML 转义再注入 `v-html`，无 XSS 面
- `↑` / `↓` 移动高亮项（自动 `scrollIntoView`），`Enter` 选中，`Escape` 关闭
- 高亮 / hover 项右移 3px + 浅凹陷；禁用项透明度 0.4
- 空结果显示「No matching results」，加载中显示「Searching…」
- 无障碍：输入框 `role="combobox"` + `aria-expanded` / `aria-haspopup="listbox"` / `aria-autocomplete="list"`，选项 `role="option"` + `aria-selected`

### Reduced-motion

`prefers-reduced-motion` 时：选项过渡、旋转器与下拉出入动画移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismInput](./input.md) — 承载输入槽与标签的底层组件
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名与 `useAutoComplete`
