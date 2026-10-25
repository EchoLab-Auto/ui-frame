---
id: comp-card
title: 'NeumorphismCard（卡片）'
x: 2101
y: 1916
group: 使用
---

# NeumorphismCard

> 内容容器——以统一的「台阶高度模型」（elevation -4~4）表达凸出 / 凹陷 / 平齐三种空间关系，支持悬停膨起或下沉（hoverable）与三档毛玻璃变体（glass：`float` / `raised` / `pressed`）。内边距经子选择器精确施加，卡片套卡片不会泄漏。源码：`src/components/NeumorphismCard/`。

```vue
<NeumorphismCard :elevation="2" hoverable>
  <template #header>标题</template>
  卡片内容
</NeumorphismCard>
```

---

## 可配置项

### Props

| 名称        | 类型                                             | 默认值    | 说明                                                                                       |
| ----------- | ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------ |
| `elevation` | `number`                                         | `2`       | 台阶高度：正=凸起、负=凹陷、0=平齐，绝对值 1~4 控制阴影强度                                |
| `hoverable` | `boolean \| 'bulge' \| 'sink'`                   | `false`   | 悬停动效：`true`/`'bulge'` 向外膨起，`'sink'` 向内下沉，支持全局配置 `card.hoverable` 级联 |
| `radius`    | `'small' \| 'medium' \| 'large' \| 'xl'`         | `'large'` | 圆角档位，支持 `card.radius` 级联                                                          |
| `noPadding` | `boolean`                                        | `false`   | 移除 header / body / footer 的内边距                                                       |
| `glass`     | `boolean \| 'float' \| 'raised' \| 'pressed'`    | `false`   | 毛玻璃变体档位，支持全局配置 `card.glass` 级联；`true` 等价 `'float'`                      |
| `variant`   | `'raised' \| 'pressed'`                          | —         | 已废弃，请用 `elevation` 正负号代替                                                        |
| `depth`     | `'shallow' \| 'medium' \| 'deep' \| 'very-deep'` | —         | 已废弃，请用 `elevation` 绝对值（1~4）代替                                                 |

兼容映射：未传 `elevation` 时按 `variant + depth` 折算——`depth` 映射强度（shallow=1 / medium=2 / deep=3 / very-deep=4），`variant: 'pressed'` 取负。

### Events / Slots

| 名称      | 说明                       |
| --------- | -------------------------- |
| `header`  | 头部区（凸出态带细分隔线） |
| 默认 slot | 正文区                     |
| `footer`  | 底部区（凸出态带细分隔线） |

组件无自定义事件。

---

## 台阶高度模型

把背景表面看作台阶底部（0），卡片坐落的高度即 `elevation`：

| elevation | 效果     | 阴影（暗偏移/模糊） | 背景                  |
| --------- | -------- | ------------------- | --------------------- |
| 4         | 强凸起   | 16px / 36px         | `--nm-surface-color`  |
| 3         | 中强凸起 | 12px / 28px         | 同上                  |
| 2         | 默认凸起 | 8px / 20px          | 同上                  |
| 1         | 轻微凸起 | 4px / 10px          | 同上                  |
| 0         | 平齐     | 无阴影              | `--nm-bg-color`       |
| -1        | 轻微凹陷 | inset 4px / 10px    | `--nm-surface-raised` |
| -2        | 默认凹陷 | inset 8px / 20px    | 同上                  |
| -3        | 中强凹陷 | inset 12px / 28px   | 同上                  |
| -4        | 强凹陷   | inset 16px / 36px   | 同上                  |

每档阴影由三层构成：ambient 环境遮蔽 + 方向性暗阴影 + 对侧边缘高光（凹陷档换用 `--nm-shadow-dark-deep` / `--nm-shadow-light-deep`）。

---

## 交互动画详解

### 悬停位移（hoverable）

hover 临时把台阶高度 ±2，且**永不跨越符号边界**（凸起不会悬停成凹陷）：

| 常态    | bulge 后        | sink 后         |
| ------- | --------------- | --------------- |
| 1 / 2   | 3 / 4（更凸）   | 平齐（回表面）  |
| 3 / 4   | 4（封顶）       | 1 / 2（更平）   |
| 0       | 2（升起）       | -2（压入）      |
| -1 / -2 | 平齐（回表面）  | -3 / -4（更凹） |
| -3 / -4 | -1 / -2（更平） | -4（封底）      |

配合 `transform`：bulge 放大 1.015、sink 缩小 0.985，过渡 0.4s spring（`cubic-bezier(0.34, 1.56, 0.64, 1)`）带轻微超调。触屏设备（无 hover）不产生悬停位移。

### 毛玻璃（glass）

玻璃**只替换表面材质**：`--nm-glass-bg` 半透明底 + `backdrop-filter: blur(--nm-glass-blur) saturate(1.15)` + `inset 0 0 0 1px` 高光描边（内描边贴合圆角、不占布局）。台阶高度模型仍由 `elevation` 决定，两者正交。

| 档位      | 阴影                                       | 对应按钮变体              |
| --------- | ------------------------------------------ | ------------------------- |
| `float`   | 环境投影（浮层感），不随 elevation         | `variant="glass"`         |
| `raised`  | 新拟态凸起双阴影，强度跟随 `\|elevation\|` | `variant="glass-raised"`  |
| `pressed` | 新拟态凹陷内阴影，强度跟随 `\|elevation\|` | —（卡片独有的"玻璃凹槽"） |

细节：

- **`elevation` 仍是强度来源**：`glass="raised" :elevation="3"` 用 12px/28px 的双阴影；`elevation="0"` 时按 1 级呈现，避免玻璃"没有体积"；档位决定阴影**方向**，`|elevation|` 决定**强度**（`glass="raised" :elevation="-2"` 仍是凸起 2 级）
- **hover 抬升**（需同时 `hoverable`）：`float` 抬升 4px、`raised` 抬升 2px 并把双阴影加强一档，`pressed` 不位移而是让内阴影减弱一档（向表面浮起）；过渡曲线与按钮玻璃一致
- **`isolation: isolate`**：让模糊只在本层发生一次，避免嵌套内容的 `backdrop-filter` 层层叠加（既昂贵又会糊边）
- **降级**：浏览器不支持 `backdrop-filter` 时退回 94% 不透明的 `--nm-surface-color`，保证内容可读
- 需置于有色背景 / 图片之上才能看到半透明与模糊效果；纯色平面上视觉等同于普通卡片

### Reduced-motion

`prefers-reduced-motion` 时移除全部过渡与动画。

---

## 用法

```vue
<!-- 凹陷卡片：嵌在页面里的「槽」 -->
<NeumorphismCard :elevation="-2">嵌入内容</NeumorphismCard>

<!-- 悬停下沉 + 圆角加大 -->
<NeumorphismCard :elevation="2" hoverable="sink" radius="xl">……</NeumorphismCard>

<!-- 满出血图片卡：去掉内边距 -->
<NeumorphismCard :elevation="3" no-padding>
  <img src="cover.png" alt="" />
</NeumorphismCard>

<!-- 毛玻璃浮层（旧布尔写法，等价 glass="float"） -->
<NeumorphismCard glass>半透明内容</NeumorphismCard>

<!-- 磨砂玻璃上的凸起卡片：强度跟随 elevation，hover 再抬一档 -->
<NeumorphismCard glass="raised" :elevation="3" hoverable>……</NeumorphismCard>

<!-- 磨砂玻璃凹槽 -->
<NeumorphismCard glass="pressed" :elevation="-2">……</NeumorphismCard>
```

全局预设：

```ts
app.use(NeumorphismUI, { card: { radius: 'medium', hoverable: 'bulge' } })
```

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名与台阶高度对照
