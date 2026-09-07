---
id: comp-steps
title: 'NeumorphismSteps（步骤条）'
x: 2885
y: 1544
group: 使用
---

# NeumorphismSteps

> 步骤条——凸起序号圆点 + 主色当前步 + 对勾完成态 + 错误抖动，连接线随进度半染色。状态推算与跳转来自 headless `useSteps`。源码：`src/components/NeumorphismSteps/`。

```vue
<NeumorphismSteps v-model:current="current" :steps="steps" />
```

---

## 可配置项

### Props

| 名称        | 类型                             | 默认值         | 说明                                                     |
| ----------- | -------------------------------- | -------------- | -------------------------------------------------------- |
| `steps`     | `StepItem[]`                     | `[]`           | 步骤项列表                                               |
| `current`   | `number`                         | `0`            | 当前步骤索引（0-based，`v-model:current`）               |
| `direction` | `'horizontal' \| 'vertical'`     | `'horizontal'` | 布局方向，支持全局配置 `steps.direction` 级联            |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'`     | 圆点直径与字号档位（28/36/48px），支持 `steps.size` 级联 |
| `center`    | `boolean`                        | `false`        | 标题与描述在圆点下方居中，支持 `steps.center` 级联       |

```ts
type StepStatus = 'wait' | 'process' | 'finish' | 'error'

interface StepItem {
  key: string
  title: string
  description?: string
  status?: StepStatus // 缺省时按 current 自动推算
}
```

### Events / Slots

| 名称                               | 说明                                     |
| ---------------------------------- | ---------------------------------------- |
| `update:current(value)` / `change` | 点击可跳转步骤时同步触发                 |
| `stepClick(step)`                  | 点击任意步骤圆点时携带 StepItem 额外触发 |
| `empty`                            | `steps` 为空时渲染的占位内容             |

---

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { StepItem } from '@echolab-auto/ui-frame'

const current = ref(1)
const steps: StepItem[] = [
  { key: 'cart', title: '确认订单', description: '核对商品与数量' },
  { key: 'pay', title: '支付', description: '选择支付方式' },
  { key: 'ship', title: '发货' },
  { key: 'done', title: '完成' },
]
</script>

<template>
  <!-- 竖排 + 居中文案 -->
  <NeumorphismSteps v-model:current="current" :steps="steps" direction="vertical" center />

  <!-- 手动覆盖某步状态（如校验失败） -->
  <NeumorphismSteps
    v-model:current="current"
    :steps="[
      { key: 'cart', title: '确认订单' },
      { key: 'pay', title: '支付', status: 'error' },
      { key: 'done', title: '完成' },
    ]"
  />
</template>
```

全局预设：

```ts
app.use(NeumorphismUI, { steps: { direction: 'horizontal', center: false, size: 'medium' } })
```

---

## 交互动画详解

### 状态自动推算

未显式传 `status` 时：索引 < `current` 为 `finish`，等于为 `process`，大于为 `wait`；显式 `status` 优先。

| 状态      | 圆点表现                                                   |
| --------- | ---------------------------------------------------------- |
| `wait`    | 凸起 + 次要文字色序号                                      |
| `process` | 主色填充 + 深凹陷，0.4s bounce 激活脉冲（0.9 → 1.08 → 1）  |
| `finish`  | 主色填充 + 微凸起，序号替换为对勾（0.3s 从 -30° 旋入放大） |
| `error`   | 错误色填充 + × 图标，0.4s `nm-shake` 横向抖动              |

连接线：`finish` 步后的线整段主色；当前步后的线主色到 50% 渐变截断（竖排为纵向渐变），其余为禁用色。

### 点击行为

- `finish` / `wait` / 当前步的圆点可点击（hover 上浮 1px、按压 scale 0.95）；点击调用 `setCurrent` 并触发 `stepClick`
- 其余状态圆点 `disabled`，不可跳转
- 当前步圆点 `aria-current="step"`；容器 `role="list"`、项 `role="listitem"`，聚焦有 3px 主色外环

### Reduced-motion

`prefers-reduced-motion` 时移除圆点过渡、激活脉冲、对勾入场与连接线过渡。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useSteps`（含 `next` / `prev` / `setStepStatus`）
