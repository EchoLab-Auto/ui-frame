---
id: comp-alert
title: 'NeumorphismAlert（警告横幅）'
x: 2885
y: 2040
group: 使用
---

# NeumorphismAlert

> 页面内警告横幅——四种语义类型 + 左侧色条 + 类型图标，可手动关闭或定时自动关闭，可见性状态机在 headless `useAlert` 中。源码：`src/components/NeumorphismAlert/`。

```vue
<NeumorphismAlert type="warning" title="注意" message="磁盘空间不足，请及时清理。" />
```

---

## 可配置项

### Props

| 名称         | 类型                                          | 默认值              | 说明                                                               |
| ------------ | --------------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `type`       | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`            | 语义类型（决定图标与左侧色条颜色），支持全局配置 `alert.type` 级联 |
| `title`      | `string`                                      | `''`                | 标题（加粗一行）                                                   |
| `message`    | `string`                                      | `''`                | 描述内容                                                           |
| `closable`   | `boolean`                                     | `true`              | 显示关闭按钮，支持 `alert.closable` 级联                           |
| `duration`   | `number`                                      | `0`                 | 自动关闭延迟（ms），`0` 需手动关闭，支持 `alert.duration` 级联     |
| `icon`       | `boolean`                                     | `true`              | 显示类型图标，支持 `alert.icon` 级联                               |
| `bordered`   | `boolean`                                     | `true`              | 显示左侧 3px 色条，支持 `alert.bordered` 级联                      |
| `size`       | `'small' \| 'medium' \| 'large'`              | `'medium'`          | 尺寸档位（内边距与字号三档），支持 `alert.size` 级联               |
| `closeLabel` | `string`                                      | locale `alertClose` | 关闭按钮的 `aria-label`                                            |

### Events / Slots

| 名称        | 说明                                                               |
| ----------- | ------------------------------------------------------------------ |
| `close`     | 关闭后触发（在 300ms 离场动画完成后才 emit，便于父级安全移除 DOM） |
| `icon` slot | 自定义图标，覆盖内置类型 SVG                                       |
| 默认 slot   | 完全自定义内容，覆盖 `title` + `message` 渲染                      |

---

## 用法

```vue
<!-- 自动关闭 -->
<NeumorphismAlert type="success" message="已保存" :duration="5000" />

<!-- 无图标无色条 + 自定义内容 -->
<NeumorphismAlert type="error" :icon="false" :bordered="false">
  <strong>提交失败：</strong>请检查网络后重试。
</NeumorphismAlert>

<!-- 监听关闭 -->
<NeumorphismAlert
  v-if="showTip"
  type="info"
  message="这是一条可关闭的提示"
  @close="showTip = false"
/>
```

全局预设：

```ts
app.use(NeumorphismUI, { alert: { closable: true, duration: 5000, size: 'medium' } })
```

---

## 交互动画详解

### 关闭流程（两阶段）

1. `close()` 先置 `leaving`，`nm-alert-fade` 离场过渡（0.25s accelerate，`translateY(-4px) scale(0.97)` 淡出）播放
2. 动画结束（300ms）后才 `emit('close')`，父级此时移除节点不会截断动画

`duration > 0` 时挂载即挂自动关闭定时器；若 `duration` 经 prop/全局配置由 `0` 变正且横幅仍可见，组件会补挂一个新的关闭定时（尽力而为的响应式路径）。

### 进出场与微交互

- 进入：0.35s spring，`translateY(-8px) scale(0.96)` → 归位
- 关闭按钮 hover 旋转 90° 并垫高背景，active 再缩到 0.85（0.25s spring）

### 无障碍

`role="alert"`；`type="error"` 时 `aria-live="assertive"`（立即打断播报），其余类型 `polite`。Reduced-motion 下全部过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
