---
id: comp-pixel-font
title: 'NeumorphismPixelFont（像素字体）'
x: 1709
y: 1930
group: 使用
---

# NeumorphismPixelFont

> 像素字体组件——以内嵌的 **termsyn 6x11** 位图字体渲染文本：整数倍缩放保持像素网格锐利、可选闪烁块光标、支持 `\n` 多行。题材来源：ASCII Motion 宣传图左上角「ASCII MOTION」标题字体（该图使用的即 termsyn 6x11 一族）。源码：`src/components/NeumorphismPixelFont/`。

```vue
<NeumorphismPixelFont text="ASCII MOTION" :scale="3" cursor />
```

---

## 可配置项

### Props

| 名称        | 类型                            | 默认值   | 说明                                                                        |
| ----------- | ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `text`      | `string`                        | **必填** | 要渲染的文本；`\n` 换行，空白按字符栅格原样保留（`white-space: pre`）       |
| `scale`     | `number`                        | `3`      | 整数缩放倍率（1 = 11px 设计尺寸）；非整数自动四舍五入、下限 1               |
| `cursor`    | `boolean`                       | `false`  | 末尾追加闪烁块光标（宽 1 设计单元、高 7 设计单元，随字号等比缩放）          |
| `align`     | `'left' \| 'center' \| 'right'` | `'left'` | 文本对齐方式                                                                |
| `ariaLabel` | `string`                        | —        | 无障碍名称；传入时根元素为 `role="img"`（内部文本对读屏隐藏），否则文本可读 |

### Slots / Events

无——纯展示组件，零交互副作用。

---

## 效果与机制

- **字号公式**：`font-size = 11px × scale`（CSS 变量 `--nm-pixel-font-scale` 下传）。位图字体只在**整数倍设计尺寸**下逐像素对齐，因此 `scale` 会被规整为不小于 1 的整数
- **像素保真**：`letter-spacing/word-spacing: 0`、`line-height: 1`、`font-synthesis: none`，禁止宿主样式（字距继承、伪粗体合成）破坏像素网格
- **光标**：`steps(1)` 阶跃闪烁（1.06s），不产生抗锯齿过渡；`prefers-reduced-motion` 下停闪常亮
- **配色**：默认消费 `--nm-text-primary`，随主题联动；可用 `style="color: …"` 或外层 CSS 覆盖
- **字重**：内嵌 400 / 700 两个字面——`font-weight: 700` 或 `<strong>` 即切换为 termsyn 6x11 粗体

---

## 字体出处（内嵌 termsyn 6x11）

- **termsyn**：stlarch 作（2011–2012），基于 [Terminus](https://terminus-font.sourceforge.net/) 与 Tamsyn 的混合位图字体，**GPL-2**；来源 [SourceForge](https://sourceforge.net/projects/termsyn/)
- 本库内嵌版由 PCF 位图重建为像素轮廓 woff2（1 设计像素 = 1px @ 11px 字号），与原始字形**逐像素一致**（可离线复核）；详细说明见 `src/components/NeumorphismPixelFont/FONT-NOTICE.md`
- `@font-face` 随组件样式注册，字族名 `'Termsyn 6x11'`——也可在业务代码中直接用它渲染任意文本（保持整数倍字号即可）

---

## 用法

```vue
<!-- 片头风格：大标题 + 副题 + 光标 -->
<NeumorphismPixelFont text="ASCII MOTION" :scale="3" cursor />
<NeumorphismPixelFont text="CODE MEETS MOVEMENT" :scale="1" />

<!-- 多行（绑定含 \n 的 JS 字符串） -->
<NeumorphismPixelFont :text="'READY.\nPRESS ANY KEY'" :scale="2" />

<!-- 居中 + 无障碍名 -->
<NeumorphismPixelFont text="GAME OVER" :scale="4" align="center" aria-label="游戏结束" />

<!-- 粗体字面 -->
<NeumorphismPixelFont text="ALERT" :scale="2" style="font-weight: 700" />
```

---

## 深入

- [NeumorphismAsciiArt](./ascii-art.md) — 字符画（图片 → ASCII）
- [组件总览](../components.md) — 返回全组件分类目录
- [API 参考](../api.md) — 完整 Props/Slots 签名
