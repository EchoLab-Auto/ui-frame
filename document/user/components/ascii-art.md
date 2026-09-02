---
id: comp-ascii-art
title: 'NeumorphismAsciiArt'
x: 1029
y: 1199
group: 使用
---

# NeumorphismAsciiArt

> 字符画组件——把图片渲染为 ASCII 字符画（[NeumorphismArt](./art.md) 试验场 `ascii` 效果的正式化）。保持原图宽高比、亮度直方图拉伸保证对比度、可选指针交互。源码：`src/components/NeumorphismAsciiArt/`。

```vue
<NeumorphismAsciiArt src="/images/mona-lisa.jpeg" :density="1.2" reactive :height="340" />
```

> **命名说明**：本库不支持 `NeumorphismArt.Ascii` 式二级命名（Vue 模板无法解析点号组件名）；「主组件 + 子组件」一律注册为扁平全名（如 `NeumorphismRadioGroup` / `NeumorphismFormItem`），本组件遵循同一惯例。

---

## 可配置项

### Props

| 名称        | 类型                                               | 默认值                 | 说明                                       |
| ----------- | -------------------------------------------------- | ---------------------- | ------------------------------------------ |
| `src`       | `string`                                           | **必填**               | 图片地址（URL / 打包导入的资源路径）       |
| `density`   | `number`                                           | `1`                    | 字符栅格密度倍率（越大字符越密）           |
| `width`     | `string \| number`                                 | `'100%'`               | 容器宽度                                   |
| `height`    | `string \| number`                                 | —（自适应）            | 容器高度；留空按图片宽高比自动定高         |
| `radius`    | `'none' \| 'small' \| 'medium' \| 'large' \| 'xl'` | `'large'`              | 容器圆角档位（`none` 为直角）              |
| `reactive`  | `boolean`                                          | `false`                | 指针交互：指针附近字符提亮放大             |
| `speed`     | `number`                                           | `1`                    | 呼吸流光速度倍率                           |
| `palette`   | `string[]`                                         | 主题 token             | 自定义配色；缺省用 `--nm-primary-color` 等 |
| `ariaLabel` | `string`                                           | locale `asciiArtLabel` | 无障碍名称（`role="img"`）                 |

### Slots

| 名称 | 说明                             |
| ---- | -------------------------------- |
| 默认 | 覆盖层内容（如图注，不响应指针） |

---

## 效果与机制

- **字符梯度**：` .·:-=+*#%@`（十级），亮度经 Rec.601 加权采样
- **保持原图比例**：栅格按图片宽高比适配画布（contain）并居中，等宽字体字符高宽比（1.15）计入换算，图片零形变
- **容器尺寸**：`width` 默认撑满父级；`height` 显式传入即拉伸为该尺寸，留空时容器按图片原始宽高比自适应（图片加载完成前为 240px 占位）
- **直方图拉伸**：采样亮度按图片自身 [min, max] 归一化，中间调图片也能用满整个梯度（深底→空格、高光→主色密字符）
- **动态**：字符亮度随时间轻微呼吸（相位按位置错开形成缓慢流光）；高亮字符用主色、其余用文字色按透明度分层
- **指针交互**：`reactive` 时指针附近 120px 内字符提亮并放大；触屏与 reduced-motion 自动禁用
- **reduced-motion**：不启动动画循环，只渲染一帧静态字符画

---

## 预设与常用组合

```vue
<!-- 基础字符画（高度按原图比例自适应） -->
<NeumorphismAsciiArt src="/images/photo.jpeg" />

<!-- 固定尺寸拉伸 -->
<NeumorphismAsciiArt src="/images/photo.jpeg" :width="320" :height="400" />

<!-- 高密度 + 指针交互 -->
<NeumorphismAsciiArt src="/images/photo.jpeg" :density="1.5" reactive />

<!-- 覆盖图注 -->
<NeumorphismAsciiArt src="/images/photo.jpeg">
  <figcaption>蒙娜丽莎</figcaption>
</NeumorphismAsciiArt>
```

---

## 深入

- [NeumorphismArt](./art.md) — 试验性动态效果画布（本组件的效果来源）
- [组件总览](../components.md) — 返回全组件分类目录
- [API 参考](../api.md) — 完整 Props/Slots 签名
