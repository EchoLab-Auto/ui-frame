---
id: comp-checkbox
title: 'NeumorphismCheckbox'
x: 1709
y: 809
group: 使用
---

# NeumorphismCheckbox

> 复选框——凹陷方槽 + 主色填充 + 勾选涟漪爆发，支持半选（indeterminate）三态。源码：`src/components/NeumorphismCheckbox/`。

```vue
<NeumorphismCheckbox v-model="agreed" label="我已阅读并同意协议" />
```

---

## 可配置项

### Props

| 名称            | 类型                             | 默认值     | 说明                                               |
| --------------- | -------------------------------- | ---------- | -------------------------------------------------- |
| `modelValue`    | `boolean`                        | `false`    | v-model 绑定勾选状态                               |
| `disabled`      | `boolean`                        | `false`    | 禁用：透明度 0.5、阻止勾选                         |
| `label`         | `string`                         | —          | 标签文本（也可用默认插槽）                         |
| `size`          | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `checkbox.size` 级联        |
| `indeterminate` | `boolean`                        | `false`    | 半选态（同步到原生 input 的 `indeterminate` 属性） |
| `name` / `id`   | `string`                         | —          | 原生表单属性                                       |

透传说明：`inheritAttrs: false`，除 `class` / `style` 外的其余 attrs（如 `required`、`data-*`）全部透传到原生 `<input type="checkbox">`。

### 尺寸档位的实际数值

方盒（box）：small 18px、medium 24px、large 30px 见方；内置图标为盒子的 65%。

### Events / Slots

| 名称                                         | 说明                                    |
| -------------------------------------------- | --------------------------------------- |
| `update:modelValue(value)` / `change(value)` | 状态切换时同时触发（disabled 时不触发） |
| 默认 slot                                    | 自定义标签内容，优先于 `label` prop     |

---

## 预设与常用组合

```vue
<!-- 基础复选框 -->
<NeumorphismCheckbox v-model="agreed" label="同意条款" />

<!-- 半选态：全选场景（子项部分选中时） -->
<NeumorphismCheckbox v-model="allChecked" :indeterminate="someChecked" label="全选" />

<!-- 禁用态 -->
<NeumorphismCheckbox v-model="locked" disabled label="暂不可选" />
```

全局预设：

```ts
app.use(NeumorphismUI, { checkbox: { size: 'medium' } })
```

---

## 交互动画详解

复选框与 Radio 共享 `_checkable.scss` 混基建（凹陷基底、焦点环、尺寸档位），以下是其特有行为：

### 勾选瞬间（checked）

1. **盒体填充**：背景从 `--nm-surface-color` 切换为主色，阴影从外凸（inset 2px 凹陷槽）转为带内高光的主色块
2. **对勾弹入**：SVG 对勾 `scale(0) → 1`，0.35s bounce 回弹曲线（`cubic-bezier(0.175, 0.885, 0.32, 1.275)`）
3. **涟漪爆发**：盒内径向渐变从中心 `scale(0) → 2`、透明度 0.6 → 0，0.4s decelerate——模拟勾选时的「冲击波」

### 半选态（indeterminate）

- 图标从对勾变为横杠（`-`），盒体同样填充主色并播放涟漪
- `indeterminate` prop 实时同步到原生 input 的同名属性，屏幕阅读器可正确播报三态

### 悬停与按压

- hover：凹陷槽加深（inset 2px → 3px），不产生位移
- active：整个方盒 `scale(0.92)` 快速压缩（0.1s compress 曲线），松开回弹

### 焦点与无障碍

焦点环画在方盒上（3px 主色外环 + 保留凹陷阴影），真实焦点在隐藏的原生 input 上；label 的 `for` 与生成的 input id 关联，点击标签即可切换。

### Reduced-motion

`prefers-reduced-motion` 时：对勾直接显示（无弹入）、涟漪移除、按压形变移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [NeumorphismRadio](./radio.md) — 同基建的单选按钮
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
