---
id: comp-logo
title: 'NeumorphismLogo（动态像素 Logo）'
x: 2101
y: 924
group: 使用
---

# NeumorphismLogo

> 品牌动态像素 Logo——8×8 像素块 + 对角桥接线 + 火花粒子的 SVG 动效，由 headless `usePixelLogoAnimation` 驱动（rAF 逐帧 + 指针交互），外层叠加呼吸光晕与上下浮动。源码：`src/components/NeumorphismLogo/`。

```vue
<NeumorphismLogo mode="pulse" />
```

---

## 可配置项

### Props

| 名称        | 类型                                         | 默认值            | 说明                                                                           |
| ----------- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `mode`      | `'pulse' \| 'liquid' \| 'wave' \| 'pointer'` | `'pulse'`         | 像素动效模式（v-model:mode），支持全局配置 `logo.mode` 级联                    |
| `size`      | `'small' \| 'medium' \| 'large'`             | `'medium'`        | 预设宽度 120 / 220 / 360px，支持全局配置 `logo.size` 级联                      |
| `width`     | `string \| number`                           | —                 | 自定义 SVG 宽度（数字按 px 计），覆盖 size 档位                                |
| `goo`       | `boolean`                                    | `true`            | gooey 融合滤镜（feGaussianBlur + feColorMatrix），支持全局配置 `logo.goo` 级联 |
| `autoplay`  | `boolean`                                    | `true`            | 播放入场汇聚动画，支持全局配置 `logo.autoplay` 级联                            |
| `floating`  | `boolean`                                    | `true`            | 整体 7s 上下浮动，支持全局配置 `logo.floating` 级联                            |
| `ariaLabel` | `string`                                     | `'动态像素 Logo'` | 无障碍名称（`role="img"`）                                                     |

### Events / Slots

| 名称                 | 说明                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `update:mode(value)` | 通过 slot 作用域的 `setMode` 切换模式时同步 v-model:mode               |
| `mode-change(value)` | 与 `update:mode` 同时触发                                              |
| 默认 slot            | Logo 下方控制面板，作用域 `{ mode, setMode, replay, isReducedMotion }` |

---

## 预设模式

| mode      | 效果                                                                       | 指针交互             |
| --------- | -------------------------------------------------------------------------- | -------------------- |
| `pulse`   | 随机像素成为波源，脉冲沿距离向外传播（途经块提亮缩放，跨越桥接线时迸火花） | 弱扰动（权重 0.32）  |
| `liquid`  | 像素块低频正弦漂移 + 微旋转 + 呼吸缩放（配合 goo 滤镜呈液态融合）          | 弱扰动（权重 0.32）  |
| `wave`    | 环形波前自中心周期性向外扩散，途经像素高斯衰减地提亮、放大、外推           | 弱扰动（权重 0.32）  |
| `pointer` | 指针成为主驱动力，像素被指针推开                                           | 全权重扰动（权重 1） |

```vue
<!-- 带模式切换控制面板 -->
<NeumorphismLogo v-model:mode="mode">
  <template #default="{ setMode, replay }">
    <NeumorphismSegmented
      :model-value="mode"
      :options="[
        { label: '脉冲', value: 'pulse' },
        { label: '液态', value: 'liquid' },
        { label: '波浪', value: 'wave' },
        { label: '指针', value: 'pointer' },
      ]"
      @change="setMode"
    />
    <NeumorphismButton @click="replay">重播</NeumorphismButton>
  </template>
</NeumorphismLogo>
```

全局预设：

```ts
app.use(NeumorphismUI, { logo: { mode: 'liquid', goo: true, floating: false } })
```

---

## 交互动画详解

### 渲染结构

- 512×512 viewBox 黑色圆角底板（19% 圆角 + 内发光描边），内部三层 `<g>`：桥接线 / 像素块 / 火花
- 8×8 网格中 31 个像素块（原图提取布局）+ 10 条对角桥接线 + 10 枚火花粒子，全部 rAF 逐帧驱动
- 入场汇聚：像素块从四周以 easeOutBack 弹性归位（`autoplay` 控制），slot 作用域的 `replay()` 可随时重播
- **goo 滤镜**：每实例生成唯一 filter id（`generateId`），同页多个 Logo 互不串滤镜；`goo: false` 时移除 filter 属性

### 氛围层

- 主色径向光晕 4.2s 呼吸脉动（scale 1↔1.07）
- `floating` 开启时整体 7s 上下浮动 ±8px

### Reduced-motion

`prefers-reduced-motion` 时：光晕与浮动停止，像素动效由 `usePixelLogoAnimation` 内部感知降级，组件加 `nm-logo--reduced-motion` 类。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `usePixelLogoAnimation`
