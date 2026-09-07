---
id: comp-tag
title: 'NeumorphismTag（标签）'
x: 2493
y: 1296
group: 使用
---

# NeumorphismTag

> 标签——微型浮起徽章：6 种语义色变体 + 可关闭按钮（hover 旋转 90°），用于状态标记、分类与可多选的筛选条件。源码：`src/components/NeumorphismTag/`。

```vue
<NeumorphismTag variant="success" closable @close="remove">已完成</NeumorphismTag>
```

---

## 可配置项

### Props

| 名称         | 类型                                                                    | 默认值      | 说明                                                         |
| ------------ | ----------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `variant`    | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 颜色变体，支持全局配置 `tag.variant` 级联                    |
| `size`       | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | 尺寸档位（高 22 / 28 / 34px），支持 `tag.size` 级联          |
| `closable`   | `boolean`                                                               | `false`     | 显示关闭按钮（内嵌 12px SVG 叉号）                           |
| `disabled`   | `boolean`                                                               | `false`     | 禁用：透明度 0.5 + `not-allowed`，且关闭按钮不再触发 `close` |
| `rounded`    | `boolean`                                                               | `false`     | 全圆角（pill）造型，支持 `tag.rounded` 级联                  |
| `closeLabel` | `string`                                                                | `''`        | 关闭按钮的 `aria-label`；缺省取 locale `tagClose`            |

### Events / Slots

| 名称           | 说明                                                     |
| -------------- | -------------------------------------------------------- |
| `close(event)` | 点击关闭按钮（内部 `stopPropagation`，不冒泡到 `click`） |
| `click(event)` | 点击标签本体（禁用态仍会在根元素上触发，需自行判断）     |
| 默认 slot      | 标签文字（`.nm-tag__text` 包裹）                         |

---

## 预设变体

`default` 为浮雕中性底（surface 色 + 文字色），其余 5 种为实色底 + 反白文字，通过 `--tag-color` 注入对应语义 token：

| variant   | 底色 token           | 场景          |
| --------- | -------------------- | ------------- |
| `default` | `--nm-surface-color` | 中性分类      |
| `primary` | `--nm-primary-color` | 主推 / 当前项 |
| `success` | `--nm-color-success` | 成功、已完成  |
| `warning` | `--nm-color-warning` | 警告、待处理  |
| `error`   | `--nm-color-error`   | 失败、高危    |
| `info`    | `--nm-color-info`    | 信息提示      |

```vue
<NeumorphismTag variant="warning" size="small">待审核</NeumorphismTag>
<NeumorphismTag variant="primary" rounded>精选</NeumorphismTag>

<!-- 可关闭的标签组 -->
<NeumorphismTag
  v-for="t in tags"
  :key="t"
  closable
  @close="tags = tags.filter(x => x !== t)"
>{{ t }}</NeumorphismTag>
```

全局预设：

```ts
app.use(NeumorphismUI, { tag: { variant: 'primary', size: 'small', rounded: true } })
```

---

## 交互动画详解

### 状态变化

| 状态     | 表现                                                      | 过渡                           |
| -------- | --------------------------------------------------------- | ------------------------------ |
| 常态     | `nm-raised(1px, 3px)` 微浮雕                              | 0.3s spring（阴影/位移/底色）  |
| hover    | 上浮 1px + 阴影加深；实色变体额外 `brightness(1.05)` 提亮 | 同上（仅 `hover: hover` 设备） |
| active   | 回落原位                                                  | 0.1s compress                  |
| disabled | 透明度 0.5，无 hover/active 反馈                          | —                              |

### 关闭按钮

- hover 时旋转 90° 并加深颜色（0.25s spring），active 再缩放到 0.85
- 实色变体下按钮为 70% 反白色，hover 恢复全亮
- 按钮自带 `aria-label`（`closeLabel` 或 locale），`type="button"` 不会误提交表单

### 无障碍

根元素 `role="status"`，屏幕阅读器将标签内容作为状态播报；`user-select: none` + `white-space: nowrap` 保证标签不折行。

### Reduced-motion

`prefers-reduced-motion` 时移除全部过渡（含关闭按钮旋转）。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
