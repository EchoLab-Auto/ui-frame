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
  3. 转换 woff2（fontTools）供 Web 嵌入。
  - 转换脚本与逐字形像素校验记录见内部构建流程；重建后与 PCF 原字形**逐像素一致**（可离线复核）。
