---
'@echolab-auto/ui-frame': minor
---

新增 `NeumorphismPixelFont` 像素字体组件：内嵌 **termsyn 6x11** 位图字体（stlarch 作，基于 Terminus 与 Tamsyn 的 GPL-2 位图字体；由 PCF 位图重建为像素轮廓 woff2，字形与原始位图逐像素一致（字母 `I` 的步进按片头样张收紧为 4px、粗体 5px，两侧字距与其余字母一致），含 400 / 700 双字重），按 `11px × scale` 整数倍缩放渲染文本、保持像素网格锐利。支持 `text`（`\n` 多行、空白按字符栅格保留）、`scale`（自动取整、下限 1）、`cursor`（闪烁块光标，`prefers-reduced-motion` 下停闪常亮）、`align`、`ariaLabel`；字号公式与光标尺寸经 CSS 变量下传，字距 / 行高 / 字重合成为像素保真固定值。`@font-face` 随组件样式注册（字族名 `'Termsyn 6x11'`），业务代码可直接复用该字族渲染任意文本。
