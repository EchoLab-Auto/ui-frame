---
'@echolab-auto/ui-frame': minor
---

`NeumorphismSwitch` 新增 `variant="power"` 电力开关变体：器件质感的「整径扳动」开关——金属外圈 + 凹陷内腔 + 带拉丝纹理的圆形旋钮。通电时橙色面自左擦入、旋钮整径滑到右端（半透明叠于通电面）、指示点与指示条换位、`ON` 刻印闪烁后定格为通电色（`0.55s` 延迟 `0.35s`，断电回闪 `0.6s` 延迟 `0.1s`，曲线 `cubic-bezier(0.46, 0.03, 0.52, 0.96)`）。几何按 171u × 91u 设计稿逐帧还原，全部尺寸随设计单位 `u` 缩放；三档尺寸（small/medium/large）共用一套几何，支持全局配置 `switch.size` / `switch.variant` 级联；颜色全部走 `--nm-switch-power-*` token（亮/暗两套，通电面为器件光源两主题保持常亮）；`activeColor` 可覆盖通电色，`inactiveColor` 可覆盖内腔底色。无障碍：复用 `role="switch"` + `aria-checked`、locale `switchToggle` 兜底名称、键盘空格切换、外圈键盘焦点环、`prefers-reduced-motion` 降级（状态瞬时呈现）；点击任意部位（含两侧刻印）均可切换。逐帧对齐视频参考：同规格下采样对比整体平均通道差 < 8/255（残差为 4px 拉丝纹理相位与亚像素边缘）。

配套：示例站点在「开关 Switch」演示卡内新增 power 变体演示；组件总览 / API / Agent 指南随变体说明同步（组件总数保持 62 个）。
