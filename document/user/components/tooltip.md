---
id: comp-tooltip
title: 'NeumorphismTooltip（文字提示）'
x: 3277
y: 676
group: 使用
---

# NeumorphismTooltip

> 文字提示——包裹触发器的轻量气泡：内容本体在 wrapper 内联绝对定位（天然随触发器移动，不被 teleport 割裂），共享 `useFloatingPosition` 引擎只做方向决策（边界翻转）。显示/隐藏状态机在 headless `useTooltip` 中。源码：`src/components/NeumorphismTooltip/`。

```vue
<NeumorphismTooltip content="复制到剪贴板">
  <NeumorphismButton>复制</NeumorphismButton>
</NeumorphismTooltip>
```

---

## 可配置项

### Props

| 名称       | 类型                                     | 默认值    | 说明                                                                       |
| ---------- | ---------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `content`  | `string`                                 | —         | 提示文本（也可用 `content` slot 自定义）                                   |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`   | 期望方向（边界不足时自动翻转到对侧），支持全局配置 `tooltip.position` 级联 |
| `trigger`  | `'hover' \| 'click' \| 'focus'`          | `'hover'` | 触发方式，支持 `tooltip.trigger` 级联                                      |
| `disabled` | `boolean`                                | `false`   | 禁用后不再响应任何触发                                                     |
| `offset`   | `number`                                 | `8`       | 与触发器的间距（px），支持 `tooltip.offset` 级联                           |
| `delay`    | `number`                                 | `150`     | 显示延迟（ms），支持 `tooltip.delay` 级联                                  |

### Events / Slots

| 名称           | 说明                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| 默认 slot      | 触发器内容，作用域参数 `{ contentId }`——把它绑到触发元素的 `aria-describedby` 完成无障碍关联 |
| `content` slot | 自定义提示内容，覆盖 `content` 文本                                                          |

---

## 用法

```vue
<!-- click 触发 + 自定义内容 -->
<NeumorphismTooltip trigger="click" position="bottom">
  <NeumorphismButton>点我</NeumorphismButton>
  <template #content><strong>富文本</strong>提示</template>
</NeumorphismTooltip>

<!-- 手动完成 ARIA 关联 -->
<NeumorphismTooltip v-slot="{ contentId }" content="删除该项">
  <button :aria-describedby="contentId">删除</button>
</NeumorphismTooltip>
```

全局预设：

```ts
app.use(NeumorphismUI, { tooltip: { position: 'top', delay: 200 } })
```

---

## 交互动画详解

### 定位策略（与 Popover 的关键差异）

- 提示本体**不 teleport**：作为 wrapper 的绝对定位子节点随触发器在文档流里原子移动，滚动（含嵌套滚动容器）天然同步
- 共享 `useFloatingPosition` 引擎只返回 `actualPlacement`——rAF 逐帧检测边界，当前侧空间不足（< 120px）且对侧宽裕 48px 以上才翻转方向，CSS 类 `nm-tooltip--{top|bottom|left|right}` 随之切换
- 因为不 teleport，浮层可能被祖先 `overflow: hidden` 裁剪；需要穿越裁剪的富交互面板请用 Popover

### 触发与隐藏

- `hover`：进触发器或提示本体经 `delay` 延迟显示，移出即隐藏（提示本体可悬停不消失）
- `click`：点击触发器切换显隐；`focus`：`focusin` 显示 / `focusout` 隐藏
- 任何模式下 `Esc` 立即隐藏

### 进出场

0.2s 淡入 + 朝触发器方向 4px 回弹位移（top 从下方 4px 浮入，bottom 反之，左右同理），0.15s 淡出。Reduced-motion 下全部过渡与动画移除。

### 层级与无障碍

提示层 z-index 取全局 `useZIndex` 的 `tooltip` 层（基础 200），Modal / Drawer 打开时自动 +1000/层，保证浮在遮罩之上。气泡 `role="tooltip"`，内容 id 自动生成供触发器 `aria-describedby` 关联。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名与 `useTooltip` / `useFloatingPosition` 复用
