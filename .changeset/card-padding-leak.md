---
'@echolab-auto/ui-frame': patch
---

修复 NeumorphismCard 内边距级联泄漏：padding 规则由后代选择器改为子选择器，外层普通卡片不再向内层卡片（含 `no-padding` 卡片）泄漏 24px 内边距。DocTocNav 目录框新增默认内边距 24px（`--nm-spacing-lg`），原先 example 页恰好由该泄漏提供，现由组件自身保证，视觉不变。
