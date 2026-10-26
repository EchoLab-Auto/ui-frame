---
id: comp-ascii-art
title: 'NeumorphismAsciiArt（图片蒙版）'
x: 1709
y: 1805
group: 使用
---

# NeumorphismAsciiArt

> 图片蒙版组件——把一张图按亮度重绘成点阵。**字符画只是其中一种蒙版**：`mask` 决定「每格画什么」，目前有字符画（`ascii`）与波点（`dots`）。两者共用同一条采样管线（contain 适配 / 直方图拉伸 / 呼吸 / 指针交互），所以换蒙版时只有图案变。源码：`src/components/NeumorphismAsciiArt/` 与 `src/components/NeumorphismArt/effects/masks/`。

```vue
<!-- 字符画（默认） -->
<NeumorphismAsciiArt src="/images/mona-lisa.jpeg" :density="1.2" reactive :height="340" />

<!-- 波点：点径 1→8px，网格占用 0.92 -->
<NeumorphismAsciiArt src="/images/mona-lisa.jpeg" mask="dots" :dot-min="1" :dot-max="8" />
```

> **命名说明**：组件名沿用 `NeumorphismAsciiArt`（首次发布时只有字符画），行为已泛化为图片蒙版；`mask` 的默认值仍是 `ascii`，旧代码无需改动。
>
> **命名说明 2**：本库不支持 `NeumorphismArt.Ascii` 式二级命名（Vue 模板无法解析点号组件名）；「主组件 + 子组件」一律注册为扁平全名（如 `NeumorphismRadioGroup` / `NeumorphismFormItem`），本组件遵循同一惯例。

---

## 可配置项

### Props

| 名称        | 类型                | 默认值                                 | 说明                                                           |
| ----------- | ------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `src`       | `string`            | **必填**                               | 图片地址（URL / 打包导入的资源路径）                           |
| `mask`      | `'ascii' \| 'dots'` | `'ascii'`                              | 图片蒙版：字符画 / 波点                                        |
| `dotMin`    | `number`            | `1`                                    | 波点蒙版：暗部波点直径（px）                                   |
| `dotMax`    | `number`            | `8`                                    | 波点蒙版：亮部波点直径（px）                                   |
| `occupancy` | `number`            | `0.92`                                 | 波点蒙版：网格占用（最大波点直径 / 单元格边长）                |
| `density`   | `number`            | `1`                                    | 精细度倍率（字符画 = 字符栅格密度；波点 = 网格与点径同比缩放） |
| `width`     | `string \| number`  | `'100%'`                               | 容器宽度                                                       |
| `height`    | `string \| number`  | —（自适应）                            | 容器高度；留空按图片宽高比自动定高                             |
| `radius`    | `number`            | `24`                                   | 容器圆角半径（px，直接写像素值；`0` 为直角）                   |
| `reactive`  | `boolean`           | `false`                                | 指针交互：指针附近笔画提亮放大 / 波点增大                      |
| `speed`     | `number`            | `1`                                    | 呼吸流光速度倍率                                               |
| `palette`   | `string[]`          | 主题 token                             | 自定义配色；缺省用 `--nm-primary-color` 等                     |
| `ariaLabel` | `string`            | locale `asciiArtLabel` / `dotArtLabel` | 无障碍名称（`role="img"`），随 `mask` 取默认值                 |

### Slots

| 名称 | 说明                             |
| ---- | -------------------------------- |
| 默认 | 覆盖层内容（如图注，不响应指针） |

---

## 蒙版

蒙版只决定「每格画什么」，采样与动态全部共用：

| 蒙版    | 每格画什么                           | 主要参数                          |
| ------- | ------------------------------------ | --------------------------------- |
| `ascii` | 字符梯度 ` .·:-=+*#%@`（十级）       | `density` 决定字符栅格密度        |
| `dots`  | 波点（半调网点），直径随亮度连续变化 | `dotMin` / `dotMax` / `occupancy` |

### 波点蒙版的大小与网格占用

- **点径是像素数字**：`dotMin`（暗部）→ `dotMax`（亮部），中间按亮度线性过渡，所以一幅图里波点是连续变化的多种大小；
- **网格占用** `occupancy` = 最大波点直径占单元格边长的比例，于是栅格步长 `pitch = dotMax / occupancy`：
  - `1` → 最亮处波点相切（最密）；
  - `0.5` → 波点只占半格（稀疏网格）；
  - `>1` → 最亮处允许轻微重叠。
- **`density` 是整体精细度倍率**：把网格与点径同比缩放，占用比不变（`dotMax` / `dotMin` 是 `density = 1` 时的像素值）。

```vue
<!-- 大点、稀疏网格：网点感强 -->
<NeumorphismAsciiArt src="/photo.jpg" mask="dots" :dot-min="2" :dot-max="14" :occupancy="0.6" />

<!-- 细点、密网格：像印刷网点 -->
<NeumorphismAsciiArt src="/photo.jpg" mask="dots" :dot-min="0.5" :dot-max="4" :occupancy="1" />
```

---

## 效果与机制

- **共用采样管线**：图片 → 亮度栅格（保持原图比例 contain + 居中）→ 蒙版逐格绘制；换蒙版不改变采样结果。
- **保持原图比例**：栅格按图片宽高比适配画布并居中，字符画把等宽字体的高宽比（1.15）计入换算，图片零形变。
- **直方图拉伸**：采样亮度按图片自身 `[min, max]` 归一化，中间调图片也能用满整个梯度（深底 → 留白，高光 → 主色密笔画 / 大波点）。
- **动态**：亮度随时间轻微呼吸（相位按位置错开形成缓慢流光）；高亮格用主色、其余用文字色按透明度分层。
- **指针交互**：`reactive` 时指针 120px 内提亮——字符画放大字形，波点则升档变大（同批绘制，不额外增加状态切换）；触屏与 reduced-motion 自动禁用。
- **批量绘制**：两种蒙版都按 32 档亮度归位后分档下笔，canvas 状态切换从「逐格」降为「每档」；字符画另有基准字体每帧只设一次的性能契约（`effects/image-mask.test.ts` 锁定）。
- **reduced-motion**：不启动动画循环，只渲染一帧静态图。
- **容器尺寸**：`width` 默认撑满父级；`height` 显式传入即拉伸为该尺寸，留空时容器按图片原始宽高比自适应（图片加载完成前为 240px 占位）。

---

## 预设与常用组合

```vue
<!-- 基础字符画（高度按原图比例自适应） -->
<NeumorphismAsciiArt src="/images/photo.jpeg" />

<!-- 固定尺寸拉伸 -->
<NeumorphismAsciiArt src="/images/photo.jpeg" :width="320" :height="400" />

<!-- 高密度 + 指针交互 -->
<NeumorphismAsciiArt src="/images/photo.jpeg" :density="1.5" reactive />

<!-- 波点蒙版 -->
<NeumorphismAsciiArt src="/images/photo.jpeg" mask="dots" :dot-max="10" :occupancy="0.85" />

<!-- 覆盖图注 -->
<NeumorphismAsciiArt src="/images/photo.jpeg">
  <figcaption>蒙娜丽莎</figcaption>
</NeumorphismAsciiArt>
```

---

## 深入

- [NeumorphismArt](./art.md) — 试验性动态效果画布（`effect="ascii"` 复用本组件的蒙版管线）
- [组件总览](../components.md) — 返回全组件分类目录
- [API 参考](../api.md) — 完整 Props/Slots 签名
