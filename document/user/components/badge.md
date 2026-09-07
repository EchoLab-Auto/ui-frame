---
id: comp-badge
title: 'NeumorphismBadge（角标）'
x: 2493
y: 1172
group: 使用
---

# NeumorphismBadge

> 角标——宿主元素右上角的微型浮起徽章：数字封顶（`99+`）、红点模式、入场弹跳动画，常用于头像 / 图标 / 菜单项的未读计数。源码：`src/components/NeumorphismBadge/`。

```vue
<NeumorphismBadge :value="5">
  <NeumorphismButton>消息</NeumorphismButton>
</NeumorphismBadge>
```

---

## 可配置项

### Props

| 名称       | 类型               | 默认值  | 说明                                                         |
| ---------- | ------------------ | ------- | ------------------------------------------------------------ |
| `value`    | `string \| number` | —       | 徽标值；数字按规则封顶/隐藏，非数字字符串原样展示            |
| `max`      | `number`           | `99`    | 数字封顶值，超出显示 `{max}+`；支持全局配置 `badge.max` 级联 |
| `dot`      | `boolean`          | `false` | 红点模式：不显示数字，只显示呼吸圆点；支持 `badge.dot` 级联  |
| `color`    | `string`           | —       | 自定义徽标背景色（内联 `backgroundColor`，默认错误色 token） |
| `showZero` | `boolean`          | `false` | 值为 0 时仍显示 `0`；支持 `badge.showZero` 级联              |

### Events / Slots

| 名称      | 说明                                       |
| --------- | ------------------------------------------ |
| 默认 slot | 宿主内容（按钮、头像、图标等任意单个元素） |

---

## 显示规则

徽标的显隐与文案由 `value` / `dot` / `showZero` / `max` 共同决定：

| 条件                              | 表现                        |
| --------------------------------- | --------------------------- |
| `dot` 且 `value` 非空             | 显示 8px 呼吸红点           |
| `dot` 且 `value` 为 `null` / `''` | 隐藏                        |
| 数字 `> max`                      | 显示 `{max}+`（默认 `99+`） |
| 数字 `<= 0` 且未开 `showZero`     | 隐藏                        |
| 非数字字符串（如 `'new'`）        | 原样展示                    |

```vue
<!-- 封顶计数 -->
<NeumorphismBadge :value="128"><NeumorphismAvatar /></NeumorphismBadge>

<!-- 红点模式（在线/未读提示） -->
<NeumorphismBadge
  dot
  :value="1"
><NeumorphismButton shape="circle">🔔</NeumorphismButton></NeumorphismBadge>

<!-- 自定义颜色 + 显示 0 -->
<NeumorphismBadge :value="0" show-zero color="#8e44ad"><span>购物车</span></NeumorphismBadge>
```

全局预设：

```ts
app.use(NeumorphismUI, { badge: { max: 999 } })
```

---

## 交互动画详解

### 布局与造型

- 徽标为 `sup` 元素，绝对定位于宿主右上角（top/right 各 -4px），`pointer-events: none` 不遮挡宿主交互
- 数字徽标最小宽 20px、高 20px、圆角全圆，错误色底 + 浮雕阴影（暗角 + 环境高光）；红点模式缩为 8px 正圆
- 数字本体 `aria-hidden`，真实语义在徽标的 `aria-label` 上：数字模式读 locale `badgeUnread`（「未读 {count}」），红点模式读 `badgeOnline`（「在线」）

### 入场与呼吸

| 动画             | 触发         | 表现                                                   |
| ---------------- | ------------ | ------------------------------------------------------ |
| `nm-badge-pop`   | 徽标挂载     | scale 0 → 1.2 → 1 的超调弹跳，0.4s bounce 缓动         |
| `nm-badge-pulse` | 红点模式常驻 | 2s 循环：scale 1 → 1.3、opacity 1 → 0.8 → 1 的呼吸脉冲 |

### Reduced-motion

`prefers-reduced-motion` 时移除入场弹跳与红点脉冲，徽标静态呈现。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名
