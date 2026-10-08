---
id: comp-tooltip
title: 'NeumorphismTooltip（文字提示）'
x: 3277
y: 676
group: 使用
---

# NeumorphismTooltip

> 文字提示——包裹触发器的轻量气泡：内容本体 **teleport 到 body** 并以 `position: fixed` 跟随触发器（`useFloatingPosition` rAF 逐帧追踪 + 边界翻转，不受祖先 `overflow` 裁剪）。显示/隐藏状态机在 headless `useTooltip` 中。源码：`src/components/NeumorphismTooltip/`。

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

### 定位策略（与 Popover 同一引擎）

- 提示本体 **teleport 到 body、`position: fixed`**：坐标由 `useFloatingPosition` 的触发器 rect 逐帧写入（与 Popover 同一模式），不受祖先 `overflow: hidden` / 层叠上下文裁剪；移入气泡经 `mouseenter` 续显，指针在触发器与气泡间穿过间隙也不会闪断
- 共享 `useFloatingPosition` 引擎返回 `actualPlacement` 与触发器 `rect`——rAF 逐帧检测边界，当前侧空间不足（< 120px）且对侧宽裕 48px 以上才翻转方向，CSS 类 `nm-tooltip--{top|bottom|left|right}` 随之切换（箭头仍由方位类在气泡内定位）
- 与 Popover 其余差异仅在内容形态：单行文本气泡（`white-space: nowrap`）无最小宽度约束，不需要点击外部关闭

### 触发与隐藏

- `hover`：进触发器或提示本体经 `delay` 延迟显示，移出即隐藏（提示本体可悬停不消失）
- `click`：点击触发器切换显隐；`focus`：`focusin` 显示 / `focusout` 隐藏
- 任何模式下 `Esc` 立即隐藏

### 进出场

0.2s 淡入、0.15s 淡出（teleport + fixed 化后与 Popover 一致：坐标与 transform 由 computedStyle 内联写入，入场动效为透明度过渡）。Reduced-motion 下全部过渡与动画移除。

### 层级与无障碍

提示层 z-index 取全局 `useZIndex` 的 `tooltip` 层（基础 200），Modal / Drawer 打开时自动 +1000/层，保证浮在遮罩之上。气泡 `role="tooltip"`，内容 id 自动生成供触发器 `aria-describedby` 关联。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名与 `useTooltip` / `useFloatingPosition` 复用
