---
id: comp-status-dot
title: 'NeumorphismStatusDot（状态点）'
x: 2493
y: 1916
group: 使用
---

# NeumorphismStatusDot

> 状态点——凹陷微型圆点，4 种在线状态配色；busy / connecting 等过渡态默认带呼吸扩散脉冲，常用于用户头像角标、连接状态指示。源码：`src/components/NeumorphismStatusDot/`。

```vue
<NeumorphismStatusDot status="online" />
```

---

## 可配置项

### Props

| 名称     | 类型                                              | 默认值               | 说明                                                                   |
| -------- | ------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `status` | `'online' \| 'offline' \| 'busy' \| 'connecting'` | `'online'`           | 状态（决定颜色与默认 aria 标签），支持全局配置 `statusDot.status` 级联 |
| `size`   | `'small' \| 'medium' \| 'large'`                  | `'medium'`           | 直径 8 / 10 / 12px，支持 `statusDot.size` 级联                         |
| `pulse`  | `boolean`                                         | `true`               | 过渡态（busy / connecting）呼吸脉冲开关，支持 `statusDot.pulse` 级联   |
| `label`  | `string`                                          | 按状态的 locale 文案 | 自定义无障碍标签                                                       |

### Events / Slots

无事件与插槽；根元素 `role="status"` + `aria-label`（缺省按 status 取 locale：在线 / 离线 / 忙碌 / 连接中）。

---

## 状态语义

| status       | 底色 token           | 脉冲（pulse 开启时） | 场景           |
| ------------ | -------------------- | -------------------- | -------------- |
| `online`     | `--nm-color-success` | 无（静止事实）       | 在线、可用     |
| `offline`    | `--nm-neutral-300`   | 无                   | 离线、停用     |
| `busy`       | `--nm-color-warning` | 有                   | 忙碌、请勿打扰 |
| `connecting` | `--nm-color-info`    | 有                   | 连接中、同步中 |

```vue
<!-- 头像角标 -->
<NeumorphismBadge dot :value="1">
  <NeumorphismAvatar src="/me.png" />
</NeumorphismBadge>
<NeumorphismStatusDot status="busy" size="large" />

<!-- 连接中 + 自定义标签 -->
<NeumorphismStatusDot status="connecting" label="正在重连 WebSocket" />

<!-- 关闭脉冲（密集列表场景） -->
<NeumorphismStatusDot status="busy" :pulse="false" />
```

全局预设：

```ts
app.use(NeumorphismUI, { statusDot: { size: 'small', pulse: false } })
```

---

## 脉冲动画详解

- 脉冲只对「过渡态」有意义：`busy` / `connecting` 才会播，`online` / `offline` 是静止事实；`pulse: false` 可整体关闭
- `nm-status-dot-pulse`（1.6s decelerate）：box-shadow 外环从 `0 0 0 0`（45% 状态色）扩散到 `0 0 0 4px`（完全透明），形成一圈圈向外消散的涟漪
- 圆点本体始终带 `inset 1px` 凹陷阴影，与全局新拟态质感一致

### Reduced-motion

`prefers-reduced-motion` 时脉冲移除，状态仅以颜色静态区分——此时建议配合文字或 `label` 保证色弱/动态敏感用户也能识别状态。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props 签名
