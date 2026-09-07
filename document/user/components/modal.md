---
id: comp-modal
title: 'NeumorphismModal（模态对话框）'
x: 2885
y: 1668
group: 使用
---

# NeumorphismModal

> 模态对话框——teleport 到 body 的遮罩弹层：焦点陷阱 + 焦点栈嵌套恢复 + body 滚动锁定 + 全局 z-index 分层，行为逻辑全部在 headless `useModal` 中。源码：`src/components/NeumorphismModal/`。

```vue
<NeumorphismModal v-model="visible" title="确认操作" @confirm="onConfirm">
  确定要删除这条记录吗？
</NeumorphismModal>
```

---

## 可配置项

### Props

| 名称             | 类型                             | 默认值                | 说明                                                                     |
| ---------------- | -------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `modelValue`     | `boolean`                        | `false`               | v-model 控制显示                                                         |
| `title`          | `string`                         | —                     | 标题（渲染为 `<h2>` 并关联 `aria-labelledby`）                           |
| `size`           | `'small' \| 'medium' \| 'large'` | `'medium'`            | 最大宽度 400 / 560 / 720px，支持全局配置 `modal.size` 级联               |
| `closable`       | `boolean`                        | `true`                | 是否可关闭（Esc / 关闭按钮 / 遮罩），支持 `modal.closable` 级联          |
| `maskClosable`   | `boolean`                        | `true`                | 点击遮罩关闭，支持 `modal.maskClosable` 级联                             |
| `showClose`      | `boolean`                        | `true`                | 显示右上角关闭按钮，支持 `modal.showClose` 级联                          |
| `destroyOnClose` | `boolean`                        | `false`               | 关闭 200ms（leave 动画结束）后销毁 DOM，支持 `modal.destroyOnClose` 级联 |
| `footer`         | `boolean`                        | `true`                | 显示底部按钮区（含默认取消/确认按钮）                                    |
| `closeLabel`     | `string`                         | locale `modalClose`   | 关闭按钮的 `aria-label`                                                  |
| `cancelLabel`    | `string`                         | locale `modalCancel`  | 取消按钮文字                                                             |
| `confirmLabel`   | `string`                         | locale `modalConfirm` | 确认按钮文字                                                             |

### Events / Slots

| 名称                       | 说明                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| `update:modelValue(value)` | 显示状态变化                                                         |
| `confirm`                  | 点击确认按钮（随后自动关闭）                                         |
| `cancel`                   | 点击取消按钮 / 关闭按钮 / 遮罩关闭                                   |
| `open` / `close`           | 已在 `defineEmits` 中声明，但当前版本未实际触发（Drawer 有对应实现） |
| `header` slot              | 头部追加内容（与 title 并列）                                        |
| 默认 slot                  | 对话框主体（可滚动区）                                               |
| `footer` slot              | 自定义底部，覆盖默认取消/确认按钮                                    |

---

## 用法

```vue
<!-- 无底部按钮 + 禁止遮罩关闭 -->
<NeumorphismModal v-model="visible" title="须知" :footer="false" :mask-closable="false">
  只读内容
</NeumorphismModal>

<!-- 自定义底部 -->
<NeumorphismModal v-model="visible" title="自定义">
  <template #footer>
    <NeumorphismButton @click="visible = false">知道了</NeumorphismButton>
  </template>
</NeumorphismModal>
```

全局预设：

```ts
app.use(NeumorphismUI, { modal: { size: 'medium', maskClosable: false } })
```

---

## 交互动画详解

### 打开/关闭

- 两层 `<transition>`：`nm-modal-fade`（遮罩 0.35s 淡入 + `backdrop-filter` 模糊渐进，0.2s 淡出）与 `nm-modal-scale`（面板 `scale(0.88) translateY(12px)` → 1 的 0.4s spring 弹入，离开时缩到 0.92 并上移 4px）
- `destroyOnClose` 时 DOM 在 leave 动画结束后（200ms 定时器）才移除；否则仅隐藏保留状态

### 焦点管理（focus trap + 焦点栈）

- 打开时经共享 `useFocusStack` 压入当前焦点元素，随后聚焦对话框本体（`tabindex="-1"`）再聚焦第一个可交互元素
- `Tab` / `Shift+Tab` 在面板内可聚焦元素间循环（焦点陷阱），`Esc` 关闭（`closable` 为 false 时忽略）
- 关闭时从焦点栈弹出并恢复焦点——**嵌套弹层**（Modal 里再开 Modal / Drawer）按 LIFO 逐层回到正确的触发元素，而不是笼统回到 body

### 滚动锁定与层级

- body 滚动锁定走按 document 计数的全局计数器（与 Drawer 共享），多层弹层叠加不会提前解锁；首次锁定时用 `padding-right` 补偿滚动条宽度，页面不横向跳动
- 打开时向全局 `useZIndex` 注册 overlay：遮罩 z-index = `overlay(400) + (嵌套深度-1) × 1000`；内部的 Select 下拉、Tooltip 等浮层自动再加一档 stride，保证永远压在遮罩之上。关闭时延迟 250ms 注销，让内部浮层的离场动画仍读到正确层级

### 无障碍

`role="dialog"` + `aria-modal="true"`；有 `title` 时 `aria-labelledby` 指向标题 id，否则回退 `aria-label="Dialog"`；`aria-describedby` 指向内容区。Reduced-motion 下全部过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名
