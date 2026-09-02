---
id: comp-art
title: 'NeumorphismArt'
x: 1709
y: 1569
group: 使用
---

# NeumorphismArt

> 试验性动态效果画布——库内视觉效果的「孵化器」：参数化的程序化效果先在这里试验，成熟后可晋升到正式组件或 token 体系。内嵌 `<canvas>` 由 headless `useArtRenderer` 驱动（rAF 循环 + DPR 适配 + ResizeObserver）。源码：`src/components/NeumorphismArt/`。

```vue
<NeumorphismArt effect="pixel-field" reactive :speed="1" :density="1" :height="280" />
```

---

## 可配置项

### Props

| 名称        | 类型                                               | 默认值            | 说明                                                  |
| ----------- | -------------------------------------------------- | ----------------- | ----------------------------------------------------- |
| `effect`    | `'pixel-field' \| 'particles' \| 'waves' \| 'goo'` | `'pixel-field'`   | 效果选择，支持全局配置 `art.effect` 级联              |
| `reactive`  | `boolean`                                          | `false`           | 指针交互开关，支持 `art.reactive` 级联                |
| `speed`     | `number`                                           | `1`               | 播放速度倍率                                          |
| `density`   | `number`                                           | `1`               | 密度倍率（像素格数 / 粒子数 / 波浪层数 / 色团数）     |
| `palette`   | `string[]`                                         | 主题 token        | 自定义配色；缺省读取 `--nm-primary-color` 等 CSS 变量 |
| `seed`      | `number`                                           | 随机              | 固定随机种子可复现同一图案（LCG 确定性伪随机）        |
| `src`       | `string`                                           | —                 | 图片资源地址（图片类效果使用，如字符画）              |
| `height`    | `string \| number`                                 | `240`             | 容器高度                                              |
| `ariaLabel` | `string`                                           | locale `artLabel` | 无障碍名称（`role="img"`）                            |

### Events / Slots

| 名称            | 说明                                       |
| --------------- | ------------------------------------------ |
| `effect-change` | 实际生效的效果变化时触发（含全局配置级联） |
| 默认 slot       | 覆盖层内容（标题文案等，不响应指针）       |

---

## 预设效果

| effect        | 效果                                                                                                                                          | 指针交互（reactive）       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `pixel-field` | 像素脉冲场：网格点阵按径向波 + 随机相位呼吸明暗/缩放                                                                                          | 指针成为波源，扰动随其移动 |
| `particles`   | 粒子连线星座：粒子匀速漂移、边界回弹，近邻自动连线（透明度随距离衰减）                                                                        | 指针吸附附近粒子           |
| `waves`       | 流动波浪：3–5 层贝塞尔波浪带水平流动，层间速度/振幅/透明度递减                                                                                | 波浪在指针下方隆起         |
| `goo`         | 融合色团：半透明色团漂移，canvas 叠加 `blur + contrast` CSS 滤镜产生 gooey 融合                                                               | 色团被指针排斥             |
| `ascii`       | 字符画：图片经亮度采样映射为字符栅格（` .·:-=+*#%@` 梯度），保持原图宽高比适配（contain）并居中；亮度直方图拉伸保证对比度；字符随时间呼吸流光 | 指针附近字符提亮放大       |

```vue
<!-- 背景横幅：波浪 + 覆盖标题 -->
<NeumorphismArt effect="waves" :height="200">
  <h2>欢迎使用</h2>
</NeumorphismArt>

<!-- 可复现的固定图案（例如文档配图） -->
<NeumorphismArt effect="particles" :seed="42" />

<!-- 自定义配色 -->
<NeumorphismArt effect="goo" :palette="['#ff6b6b', '#feca57', '#48dbfb']" />
```

全局预设：

```ts
app.use(NeumorphismUI, { art: { effect: 'waves', reactive: true } })
```

---

## 交互动画详解

### 渲染管线

- rAF 逐帧驱动，`t` 以秒计（`speed` 缩放）；效果切换 / 密度 / 种子 / 图片地址变化时重建实体并重绘
- 图片类效果（字符画）经效果的可选异步 `prepare()` 加载资源，就绪后自动重绘；加载失败保持空白背景不中断渲染
- **DPR 适配**：canvas 物理尺寸 = CSS 尺寸 × `devicePixelRatio`（上限 2），高分屏不模糊
- **尺寸跟踪**：ResizeObserver 监听容器，尺寸变化后重新初始化效果
- **主题联动**：监听 `<html data-theme>` 变化，自动重读主题 token 配色（传了 `palette` 则不跟踪）

### 指针交互（reactive）

- 开启后监听画布 pointermove/leave，指针位置进入效果的渲染状态
- **触屏自动禁用**（`pointer: coarse`），reduced-motion 下同样禁用
- 覆盖层（slot 内容）`pointer-events: none`，不遮挡画布交互

### Reduced-motion 降级

`prefers-reduced-motion` 时不启动 rAF 循环，只渲染一帧 t=0.7 的静态画面（选取了各效果视觉较好的时刻）；偏好变化时动态切换播放/静止。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useArtRenderer`
