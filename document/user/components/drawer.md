---
id: comp-drawer
title: 'NeumorphismDrawer（抽屉）'
x: 2885
y: 1792
group: 使用
---

# NeumorphismDrawer

> 四向抽屉——teleport 到 body 的贴边面板：方向感知滑入 + 焦点陷阱 + 滚动锁定，与 Modal 共享焦点栈和 z-index overlay 栈（可互相嵌套）。行为逻辑在 headless `useDrawer` 中。源码：`src/components/NeumorphismDrawer/`。

```vue
<NeumorphismDrawer v-model="open" title="详情" position="right">
  抽屉内容
</NeumorphismDrawer>
```

---

## 可配置项

### Props

| 名称             | 类型                                     | 默认值    | 说明                                                                                   |
| ---------------- | ---------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `modelValue`     | `boolean`                                | `false`   | v-model 控制显示                                                                       |
| `position`       | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 抽屉方向（决定贴边位置与滑入方向）                                                     |
| `title`          | `string`                                 | —         | 标题（渲染为 `<h2>` 并关联 `aria-labelledby`）                                         |
| `width`          | `number \| string`                       | —         | 面板尺寸：左右方向为宽度（默认 320px），上下方向为高度（默认 240px）；number 自动补 px |
| `maskClosable`   | `boolean`                                | `true`    | 点击遮罩关闭                                                                           |
| `closable`       | `boolean`                                | `true`    | 是否可关闭（Esc / 关闭按钮 / 遮罩）                                                    |
| `showClose`      | `boolean`                                | `true`    | 显示右上角关闭按钮                                                                     |
| `destroyOnClose` | `boolean`                                | `false`   | 关闭 200ms（leave 动画结束）后销毁 DOM                                                 |

### Events / Slots

| 名称                       | 说明                                     |
| -------------------------- | ---------------------------------------- |
| `update:modelValue(value)` | 显示状态变化                             |
| `open` / `close`           | 面板打开 / 关闭（watch modelValue 触发） |
| `header` slot              | 头部追加内容（与 title 并列）            |
| 默认 slot                  | 抽屉主体（flex 自适应 + 纵向滚动）       |
| `footer` slot              | 底部操作区（仅传了该 slot 才渲染）       |

---

## 用法

```vue
<!-- 底部抽屉 + 自定义高度 -->
<NeumorphismDrawer v-model="open" position="bottom" :width="360">
  底部面板
</NeumorphismDrawer>

<!-- 带底部操作区 -->
<NeumorphismDrawer v-model="open" title="编辑">
  <p>表单内容</p>
  <template #footer>
    <NeumorphismButton @click="open = false">取消</NeumorphismButton>
    <NeumorphismButton type="primary" @click="save">保存</NeumorphismButton>
  </template>
</NeumorphismDrawer>
```

---

## 交互动画详解

### 滑入/滑出

- 遮罩 `nm-drawer-fade`：0.35s 淡入（含 `backdrop-filter` 模糊渐进），0.2s 淡出
- 面板 `nm-drawer-slide`：按 `position` 从对应边外 `translateX/Y(±100%)` 滑入，0.35s spring；离开时 0.2s accelerate 原路滑回

### 焦点与滚动

- 与 Modal 同一套机制：打开时焦点栈压入当前焦点元素并聚焦面板内首个可交互元素；`Tab` 循环形成焦点陷阱，`Esc` 关闭；关闭时 LIFO 恢复焦点——抽屉里再开 Modal 也能正确回到抽屉内的触发元素
- 滚动锁定与 Modal 共享同一按 document 计数的计数器，叠加不重复锁、不错误解锁，并补偿滚动条宽度

### 层级

打开时注册进全局 `useZIndex` overlay 栈，遮罩 z-index 随嵌套深度按 stride 1000 递增；抽屉内渲染的 Tooltip / Popover / Select 浮层自动再加一档，始终位于遮罩之上。关闭时延迟 250ms 注销，保证内部浮层离场期间层级正确。

### 无障碍

`role="dialog"` + `aria-modal="true"`；有 `title` 时 `aria-labelledby` 关联标题，否则回退 `aria-label`；`aria-describedby` 指向内容区。Reduced-motion 下全部过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useDrawer` 复用
