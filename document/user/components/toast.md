---
id: comp-toast
title: 'NeumorphismToastProvider（消息提示）'
x: 2885
y: 1916
group: 使用
---

# NeumorphismToastProvider

> 全局消息提示——teleport 到 body 的六方位队列容器：ref 方法推送、自动关闭计时、超出上限挤掉最旧一条，队列管理在 headless `useToast` 中。源码：`src/components/NeumorphismToast/`。

```vue
<NeumorphismToastProvider ref="toastRef" position="top-right" />
```

```ts
toastRef.value.addToast({ message: '保存成功', type: 'success' })
```

---

## 可配置项

### Props

| 名称         | 类型            | 默认值              | 说明                                                                                                                         |
| ------------ | --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `position`   | `ToastPosition` | `'top-right'`       | 六方位：`top-left / top-center / top-right / bottom-left / bottom-center / bottom-right`，支持全局配置 `toast.position` 级联 |
| `maxCount`   | `number`        | `5`                 | 最大同时显示条数，超出挤掉最旧消息，支持 `toast.maxCount` 级联                                                               |
| `closeLabel` | `string`        | locale `toastClose` | 关闭按钮的 `aria-label`                                                                                                      |

### Slots / Expose

| 名称                | 说明                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `toast-item` slot   | 自定义单条渲染，作用域参数 `{ toast, remove }`（`remove()` 关闭该条） |
| `addToast(options)` | 推送一条消息，返回消息 id（`string`）                                 |
| `removeToast(id)`   | 按 id 移除（先播 250ms 离场动画再移除 DOM）                           |
| `clearAll()`        | 清空全部（同样先播离场动画；期间新推送的消息会打断清空）              |
| `toasts`            | 当前队列（`ToastItem[]`，响应式）                                     |

`ToastOptions`：`{ message: string; type?: 'info' | 'success' | 'warning' | 'error'; duration?: number; closable?: boolean }`——`duration` 默认 3000ms，`0` 为不自动关闭；`closable` 默认 `true`。

---

## 用法

```vue
<template>
  <NeumorphismToastProvider ref="toastRef" position="bottom-center" :max-count="3" />

  <!-- 自定义单条渲染 -->
  <NeumorphismToastProvider ref="toastRef2">
    <template #toast-item="{ toast, remove }">
      <div class="my-toast" @click="remove">{{ toast.message }}</div>
    </template>
  </NeumorphismToastProvider>
</template>
```

```ts
const id = toastRef.value.addToast({ message: '上传中…', type: 'info', duration: 0 })
// 完成后手动关闭
toastRef.value.removeToast(id)
```

全局预设：

```ts
app.use(NeumorphismUI, { toast: { position: 'bottom-right', maxCount: 3 } })
```

---

## 交互动画详解

### 队列与生命周期

- 每条消息入队即按 `duration` 挂独立定时器；`removeToast` 先置 `leaving` 播 250ms 离场动画，再真正从队列移除
- 超出 `maxCount` 时直接裁掉最旧消息并清理其定时器；`clearAll` 期间若有新消息入队，清空动作会被取消、已进入 leaving 态的旧消息立即移除
- 按 `Esc` 清空全部消息（document 级监听，Provider 卸载时自动移除）

### 进出场

- 进入：0.35s spring，按方位滑入——左右侧 `translateX(±40px) scale(0.95)`，居中位 `translateY(-20px) scale(0.95)`
- 离开：0.2s accelerate，`translateX(30px) scale(0.95)` 淡出
- 底部方位容器为 `column-reverse`，新消息从贴近屏幕底/顶边的一端长出，旧消息被顶向屏幕中心

### 层级与无障碍

- 容器经 `useZIndex` 取 `toast` 层（基础 500），且随 overlay 栈深度自动 +1000/层——Modal / Drawer 打开时消息提示仍浮在遮罩之上
- `error` / `warning` 类型 `role="alert"`，其余 `role="status"`；另挂一个独立的 `aria-live="assertive"` 屏幕阅读器播报区（`nm-sr-only`）
- Reduced-motion 下所有过渡与图标动画移除

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots/Expose 签名与 `useToast` 复用
