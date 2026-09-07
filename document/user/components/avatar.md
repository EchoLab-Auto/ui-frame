---
id: comp-avatar
title: 'NeumorphismAvatar（头像）'
x: 2493
y: 1048
group: 使用
---

# NeumorphismAvatar

> 头像——凸出小圆块（raised 2px 5px），图片加载失败自动回退到 initials / alt 首字母 / `?` 三级占位；图片淡入缩放进场，hover 放大、按压回缩。源码：`src/components/NeumorphismAvatar/`。

```vue
<NeumorphismAvatar src="/me.png" alt="张三" size="large" />
```

---

## 可配置项

### Props

| 名称       | 类型                             | 默认值     | 说明                                                                      |
| ---------- | -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `src`      | `string`                         | —          | 图片地址；加载失败自动切回退内容并触发 `error`                            |
| `alt`      | `string`                         | —          | 图片替代文本；无 initials 时取其首字母作回退                              |
| `initials` | `string`                         | —          | 首字母回退（取前 2 位转大写，优先于 alt）                                 |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位（`--nm-avatar-size-*`），支持全局配置 `avatar.size` 级联         |
| `shape`    | `'circle' \| 'rounded'`          | `'circle'` | 圆形 / 圆角矩形，支持 `avatar.shape` 级联                                 |
| `icon`     | `string`                         | —          | 提供时（或传了 fallback 插槽）走图标分支，配合 `#fallback` 自定义回退内容 |

### Events / Slots

| 名称       | 说明                                                 |
| ---------- | ---------------------------------------------------- |
| `error`    | 图片加载失败时触发（同时切换到回退渲染）             |
| `fallback` | 自定义回退内容；缺省显示 initials / alt 首字母 / `?` |

---

## 用法

```vue
<!-- 无图片：首字母回退 -->
<NeumorphismAvatar initials="ev" />

<!-- 圆角矩形 + 大图 -->
<NeumorphismAvatar src="/team/a.png" alt="Alice" shape="rounded" size="large" />

<!-- 自定义回退（图标、徽章等） -->
<NeumorphismAvatar icon>
  <template #fallback>👤</template>
</NeumorphismAvatar>

<!-- 失败兜底 -->
<NeumorphismAvatar src="/maybe-404.png" initials="?" @error="onAvatarError" />
```

全局预设：

```ts
app.use(NeumorphismUI, { avatar: { size: 'medium', shape: 'circle' } })
```

---

## 交互动画详解

### 渲染优先级

`src` 且未失败 → `<img>`；否则 `icon` / `fallback` 插槽分支 → 图标位回退；否则纯文字回退（initials 前 2 位 → alt 首字母 → `?`）。`src` 变化时重置失败标记，允许换地址后重试。

### 动效

| 时机     | 表现                                  | 曲线          |
| -------- | ------------------------------------- | ------------- |
| 图片进场 | 0→1 透明度 + 1.05→1 缩放的淡入        | 0.4s ambient  |
| hover    | 整体 scale 1.06 + 阴影加深为 4px/10px | 0.35s spring  |
| active   | scale 0.96                            | 0.1s compress |

### 无障碍与 reduced-motion

容器 `role="img"`，aria-label 依次取 `alt` → `initials` → 语言包 `badgeAvatar`。`prefers-reduced-motion` 时移除过渡与淡入动画（图片直接显示）。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
