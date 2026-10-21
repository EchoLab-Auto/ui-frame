# termsyn 6x11 — 字体出处与许可

本目录内嵌的 `termsyn-6x11.woff2` / `termsyn-6x11-bold.woff2` 由 **termsyn** 位图字体转换而来：

- **字体名称**：termsyn（6x11 尺寸，Medium / Bold）
- **作者**：stlarch（stlarchie@gmail.com）
- **来源**：https://sourceforge.net/projects/termsyn/（1.8.7，2012）
- **设计血统**：基于 [Terminus](https://terminus-font.sourceforge.net/) 与 Tamsyn（Scott Fial）的混合位图字体
- **许可**：GPL-2.0（按原项目分发条款使用；如作为该字体的再分发方，请随附 GPL-2.0 许可文本）
- **本库转换说明**：
  1. 从 `termsyn6x11r.pcf` / `termsyn6x11b.pcf` 提取 11 行像素位图（PCF 规范解析）；
  2. 按 100 units/设计像素、upm 1100 重建为像素轮廓 TTF（1 设计像素 = 1px @ 11px 字号）；
     `hmtx` 左边距按 TrueType 规范取字形墨迹 `xMin`，保证各字形在浏览器中落在设计位；
  3. 转换 woff2（fontTools）供 Web 嵌入。
  - 转换脚本与逐字形像素校验记录见内部构建流程；全部字形的墨迹与 PCF 原字形**逐像素一致**（可离线复核）。
  - 唯一例外在**横向步进**而非字形：字母 `I` 的步进按片头样张收紧为 4px（粗体 5px；等宽原为 6px）——
    样张中 `I` 的间距与其余字母一致（3px 墨迹 + 两侧各 1px 空隙），而等宽格会留下 3px 空隙。
