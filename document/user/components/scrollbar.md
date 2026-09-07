---
id: comp-scrollbar
title: 'NeumorphismScrollbar（滚动条）'
x: 3277
y: 1296
group: 使用
---

# NeumorphismScrollbar

> 无渲染的滚动条增强器——组件自身不输出任何 DOM，挂载后由 headless `useScrollbar` 接管目标容器：CSS 类变体直接换肤原生滚动条，dots / glow 覆盖层变体则隐藏原生滚动条并绘制纯 CSS 渐变的进度指示。源码：`src/components/NeumorphismScrollbar/`。

```vue
<NeumorphismScrollbar variant="dots" target=".nm-layout__content" />
```

---

## 可配置项

### Props

| 名称          | 类型                                                    | 默认值       | 说明                                                                          |
| ------------- | ------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `variant`     | `'standard' \| 'primary' \| 'none' \| 'dots' \| 'glow'` | `'standard'` | 滚动条变体：`standard/primary/none` 为 CSS 类变体；`dots/glow` 为覆盖层变体   |
| `target`      | `string`                                                | `''`         | 目标滚动容器的 CSS 选择器（**必填**；空串为安全 no-op，不再默认耦合布局类名） |
| `dotColor`    | `string`                                                | —            | 点阵基础色（`"r,g,b"`；缺省读取 `--nm-text-placeholder` token）               |
| `accentColor` | `string`                                                | —            | 强调色（`"r,g,b"`；缺省读取 `--nm-primary-color` token）                      |
| `sigma`       | `number`                                                | `14`         | 点阵高斯半径，控制强调色沿游标位置的衰减范围                                  |

### Events / Slots

| 名称 | 说明                                  |
| ---- | ------------------------------------- |
| —    | 无事件、无插槽、无 expose；纯行为组件 |

---

## 预设变体

| variant    | 机制                                                                                                          | 适用场景        |
| ---------- | ------------------------------------------------------------------------------------------------------------- | --------------- |
| `standard` | 向目标元素加 `nm-scrollbar--standard` 类，token 化的细滚动条                                                  | 常规滚动区      |
| `primary`  | `nm-scrollbar--primary` 类，滑块使用主色                                                                      | 强调导航/侧栏   |
| `none`     | `nm-scrollbar--none` 类，隐藏原生滚动条保留滚动                                                               | 极简界面        |
| `dots`     | 覆盖层：隐藏原生滚动条，右缘绘制 5 列点阵，滚动进度映射为游标，点按高斯权重从 `dotColor` 混色到 `accentColor` | 沉浸式长文阅读  |
| `glow`     | 覆盖层：右缘 26×72 辉光块（径向渐变光晕 + 3px 亮核），随滚动进度纵向滑动                                      | 仪表盘 / 展示页 |

```vue
<!-- 跟随主题 token 的点阵（默认配色） -->
<NeumorphismScrollbar variant="dots" target=".doc-body" />

<!-- 自定义配色的辉光 -->
<NeumorphismScrollbar variant="glow" target=".panel" accent-color="255,107,107" />

<!-- 多个滚动区可各挂一个实例 -->
<NeumorphismScrollbar variant="primary" target=".sidebar" />
```

---

## 交互动画详解

### 覆盖层管线（dots / glow）

- 向 `<head>` 注入按选择器命名的隐藏样式（`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`），卸载时移除
- 在目标容器首位插入零高度 sticky 包裹层，覆盖层 `pointer-events: none`，不干扰内容交互
- **dots**：滚动时以「滚动进度 → 游标 y → 每行点的高斯权重」重算多层 `radial-gradient` 背景，`sigma` 越大强调色晕染越宽
- **glow**：滚动进度直接映射为辉光块的 `translateY`，尺寸变化时重新定位
- 颜色解析：`#rgb` / `#rrggbb` / `rgb(r,g,b)` 统一归一为 `"r,g,b"`；未传色值时读 CSS 变量，主题切换自然跟随
- `variant` / `target` 变化时自动 stop + start 重建；组件卸载时清理全部监听器与注入样式

### Reduced-motion

覆盖层变体不含过渡动画，仅随滚动同步位置；组件层不引入额外动画。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名与 `useScrollbar` 返回值
