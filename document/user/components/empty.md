---
id: comp-empty
title: 'NeumorphismEmpty（空状态）'
x: 2493
y: 1668
group: 使用
---

# NeumorphismEmpty

> 空状态——无数据时的占位插画：内置「空盒子 + 放大镜」线性 SVG，支持自定义图片与底部操作区，常嵌在 Table / List 的 `empty` 插槽里。源码：`src/components/NeumorphismEmpty/`。

```vue
<NeumorphismEmpty description="暂无数据" />
```

---

## 可配置项

### Props

| 名称          | 类型                             | 默认值     | 说明                                                          |
| ------------- | -------------------------------- | ---------- | ------------------------------------------------------------- |
| `image`       | `string`                         | —          | 自定义占位图地址（`object-fit: contain`，alt 取 description） |
| `description` | `string`                         | —          | 描述文字（次级文字色，最大宽 320px 居中）                     |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档位，支持全局配置 `empty.size` 级联                      |

### Events / Slots

| 名称         | 说明                                            |
| ------------ | ----------------------------------------------- |
| `image` slot | 完全替换插画区（优先级高于 `image` prop）       |
| 默认 slot    | 底部操作区（放置按钮等，自动 8px 间距换行排布） |

---

## 尺寸规格

| size     | 插画尺寸 | 描述字号         |
| -------- | -------- | ---------------- |
| `small`  | 60px     | `--nm-font-sm`   |
| `medium` | 100px    | `--nm-font-base` |
| `large`  | 140px    | `--nm-font-lg`   |

```vue
<!-- 自定义图片 + 操作按钮 -->
<NeumorphismEmpty image="/img/no-result.svg" description="没有找到相关内容">
  <NeumorphismButton variant="primary" @click="reset">清除筛选</NeumorphismButton>
</NeumorphismEmpty>

<!-- 完全自定义插画 -->
<NeumorphismEmpty description="还没有收藏">
  <template #image>🗂️</template>
</NeumorphismEmpty>
```

全局预设：

```ts
app.use(NeumorphismUI, { empty: { size: 'small' } })
```

---

## 内置插画

未传 `image` 与 `image` slot 时渲染 160×160 viewBox 的线性 SVG：半透明描边的外盒 + 盒盖折线 + 三条文档行 + 右下放大镜，颜色取自 `--nm-text-disabled`，明暗主题下均为低存在感的中性灰。

整体容器纵向居中排布（上下 32px / 左右 16px 内边距），`user-select: none`。

### Reduced-motion

`prefers-reduced-motion` 时移除容器上的过渡与动画（组件本身无常驻动效）。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Slots 签名
