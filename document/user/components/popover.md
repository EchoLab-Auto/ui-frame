---
id: comp-popover
title: 'NeumorphismPopover（弹出面板）'
x: 3277
y: 800
group: 使用
---

# NeumorphismPopover

> 弹出面板——teleport 到 body 的富内容浮层：`useFloatingPosition` rAF 逐帧跟随（嵌套滚动也不脱节）+ 边界翻转滞后 + 点击外部关闭，支持编程式控制。源码：`src/components/NeumorphismPopover/`。

```vue
<NeumorphismPopover trigger="click" position="auto" content="一段说明文字">
  <NeumorphismButton>查看说明</NeumorphismButton>
</NeumorphismPopover>
```

---

## 可配置项

### Props

| 名称        | 类型                                               | 默认值    | 说明                                                                                               |
| ----------- | -------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `position`  | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'auto'`  | 期望方向；`auto` 按 bottom→top→right→left 选首个容得下的方向，支持全局配置 `popover.position` 级联 |
| `trigger`   | `'click' \| 'hover' \| 'focus' \| 'manual'`        | `'click'` | 触发方式；`manual` 时只能用 expose 的方法控制，支持 `popover.trigger` 级联                         |
| `disabled`  | `boolean`                                          | `false`   | 禁用（wrapper 半透明且不响应指针）                                                                 |
| `offset`    | `number`                                           | `8`       | 与触发器的间距（px），支持 `popover.offset` 级联                                                   |
| `width`     | `'auto' \| 'trigger' \| number`                    | `'auto'`  | 面板宽度；`'trigger'` 跟随触发器宽度，number 固定 px，支持 `popover.width` 级联                    |
| `content`   | `string`                                           | —         | 纯文本内容（不用 `content` slot 时）                                                               |
| `showArrow` | `boolean`                                          | `true`    | 显示指向触发器的箭头，支持 `popover.showArrow` 级联                                                |

### Events / Slots / Expose

| 名称                             | 说明                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `visible-change(open)`           | 显隐变化                                                                                                                 |
| 默认 slot                        | 触发器，作用域参数 `{ expanded, contentId, tooltipMode }`——供绑定 `aria-expanded` / `aria-controls` / `aria-describedby` |
| `content` slot                   | 自定义面板内容，覆盖 `content` 文本                                                                                      |
| `show()` / `hide()` / `toggle()` | 编程式显隐（`manual` 模式的主要入口）                                                                                    |
| `isOpen`                         | 当前显隐（响应式 ref）                                                                                                   |
| `contentId`                      | 面板 id，供触发器侧 ARIA 关联                                                                                            |

---

## 用法

```vue
<!-- 宽度跟随触发器 -->
<NeumorphismPopover width="trigger" position="bottom">
  <NeumorphismButton block>下拉面板</NeumorphismButton>
  <template #content>与按钮等宽的内容</template>
</NeumorphismPopover>

<!-- manual 编程控制 -->
<NeumorphismPopover ref="popRef" trigger="manual">
  <NeumorphismButton @click="popRef.toggle()">切换</NeumorphismButton>
  <template #content>由代码全权控制</template>
</NeumorphismPopover>
```

全局预设：

```ts
app.use(NeumorphismUI, { popover: { position: 'auto', offset: 12, showArrow: true } })
```

---

## 交互动画详解

### 定位引擎（useFloatingPosition）

- 面板 teleport 到 body、`position: fixed`，坐标由引擎 rAF **逐帧轮询**触发器 rect 写入——不依赖 scroll 事件（嵌套滚动容器与平滑滚动下事件会漏发/滞后），位置更新与页面绘制同帧，永不错位
- 显式方向带**翻转滞后**：当前侧可用空间 < 120px 且对侧比当前侧宽裕 48px 以上才翻转，防边界抖动；`auto` 方向仅在打开/resize 时重新选向，滚动中冻结
- 打开与 `offset` 变化时立即 `refresh()` 全量重算

### 关闭路径（全覆盖）

- 点击外部：document capture 阶段监听 click，触发器与面板内部点击不关闭
- `Esc` 关闭；`Tab` 焦点移出触发器与面板之外后关闭（nextTick 校验焦点落点）
- `focus` 触发下 `focusout` 经 nextTick 确认焦点未落入面板才隐藏

### 语义随触发方式切换

`click` / `manual` 时面板 `role="dialog"`；`hover` / `focus` 时退化为 `role="tooltip"`（作用域参数 `tooltipMode` 同步暴露给触发器侧选 ARIA 属性）。

### 进出场与层级

0.25s 淡入 + 朝触发器 6px 回弹（spring），0.15s 淡出。z-index 取全局 `useZIndex` 的 `popover` 层（基础 300），Modal / Drawer 打开时自动 +1000/层，面板始终浮在遮罩之上。Reduced-motion 下全部过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots/Expose 签名与 `usePopover` 复用
