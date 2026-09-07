---
id: comp-theme-toggle
title: 'NeumorphismThemeToggle（主题切换）'
x: 2101
y: 676
group: 使用
---

# NeumorphismThemeToggle

> 明暗主题三段切换器——凹陷胶囊轨道 + 凸起选中按钮，点击即写入全局 `useTheme` 主题系统（`<html data-theme>` 随之切换，全站 token 联动）。源码：`src/components/NeumorphismThemeToggle/`。

```vue
<NeumorphismThemeToggle v-model="theme" />
```

---

## 可配置项

### Props

| 名称          | 类型                             | 默认值     | 说明                                                                                       |
| ------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `modelValue`  | `'light' \| 'dark' \| 'auto'`    | `'auto'`   | 当前主题模式（v-model）                                                                    |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `themeToggle.size` 级联；`small` 时隐藏文字标签（按级联后的值判定） |
| `disableAuto` | `boolean`                        | `false`    | 隐藏 auto 选项，支持全局配置 `themeToggle.disableAuto` 级联                                |
| `disabled`    | `boolean`                        | `false`    | 整体禁用（透明度 0.5 + `not-allowed`）                                                     |

### Events / Slots

| 名称                       | 说明                            |
| -------------------------- | ------------------------------- |
| `update:modelValue(value)` | 选择后同步 v-model              |
| `change(value)`            | 与 `update:modelValue` 同时触发 |
| —                          | 无插槽                          |

---

## 用法

```vue
<!-- 仅明暗两档 -->
<NeumorphismThemeToggle v-model="theme" disable-auto />

<!-- 小尺寸：只显示图标，隐藏文字标签 -->
<NeumorphismThemeToggle v-model="theme" size="small" />
```

标签显隐按级联后的 size 判定——全局配置 `themeToggle.size: 'small'` 同样只显示图标。

全局预设：

```ts
app.use(NeumorphismUI, { themeToggle: { size: 'small', disableAuto: true } })
```

---

## 交互动画详解

### 全局主题联动

- 选中时调用 `useTheme().setTheme(value)` 直接写入全局主题，再 emit 出值——组件不是纯受控控件，本身就是主题切换的入口
- 外部修改 `modelValue`（如代码切换主题）时通过 immediate watch 回写全局主题系统，双向保持同步
- 无障碍：`role="radiogroup"` 容器 + 每枚按钮 `aria-pressed`；选项文案取自 locale（`themeToggleLight` / `themeToggleAuto` / `themeToggleDark`）

### 选中反馈

| 状态   | 表现                                                             |
| ------ | ---------------------------------------------------------------- |
| 常态   | 透明底 + 占位文字色图标                                          |
| hover  | 文字变次级色 + 淡底色 + 上浮 1px（0.35s spring）                 |
| active | 凸起强阴影 + 主色文字；激活瞬间 scale 0.92→1.03→1（0.4s bounce） |
| 按下   | scale 0.96（0.1s compress）                                      |

- 激活时按钮 `::after` 泛起一圈主色径向涟漪（scale 0→2，0.5s decelerate）
- 选中项图标附带 `rotate(15deg) scale(1.1)` 的俏皮姿态
- 内嵌 SVG 图标：太阳（light）/ 显示器+时钟（auto）/ 月亮（dark）

### Reduced-motion

`prefers-reduced-motion` 时：按钮过渡、激活弹跳、涟漪与图标旋转全部移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events 签名
