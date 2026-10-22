---
'@echolab-auto/ui-frame': minor
---

`NeumorphismCard` 支持**超椭圆圆角**（`squircle`，可选）+ 自定义轮廓（`clipPath`），并把超椭圆几何内核公开为 `@echolab-auto/ui-frame/utils` 的一组函数。

**为什么需要**：CSS `border-radius` 只能画**圆弧**，而 iOS 设备屏幕角是超椭圆（连续曲率）。拿圆弧去贴超椭圆，无论半径取多少都会在 45° 附近错位 —— 实测最优半径仍有 2.3px 的间隙波动（肉眼读作「不平行」）。`corner-shape: superellipse()` 能直接画，但 Safari 至今不支持，所以统一走 `clip-path: path()`。

**卡片的两个新 prop**

| prop | 类型 | 说明 |
| --- | --- | --- |
| `squircle` | `boolean \| number` | `true` = 指数 2.5（iOS 屏角实测 2.42~2.54）；`number` = 自定义指数。默认 `false`（保持圆弧，**零行为变化**） |
| `clipPath` | `string` | 任意 `clip-path` 值，优先于 `squircle` 与 `border-radius`。用于「四角不对称」的场景 |

- 半径取卡片**当前生效的** `border-radius`（`radius` prop / 全局配置 / 消费方 CSS 覆盖之后的值），所以「角形状」与「角大小」互不干扰；
- 轮廓生效时 `border-radius` 自动置 0 —— clip 与圆角是**取交集**关系，留着会把超椭圆又裁回圆角矩形；
- 尺寸变化由 `ResizeObserver` 跟随重算（多行输入把卡片撑高等场景）；
- 只在开启时才测量与观察，未用的卡片零开销。

**几何内核**（`@echolab-auto/ui-frame/utils`）

| 导出 | 用途 |
| --- | --- |
| `squirclePoints` / `squircleClipPath` | 等半径超椭圆闭合轮廓 / 其 `path()` 值 |
| `superellipseCorner` | 单角超椭圆采样（逐角组装用） |
| `sampleCornerOffset` | 设备屏角超椭圆**沿法线内缩**后的曲线 —— 「元件角与屏幕角等间隙平行」的正确形状（用同族超椭圆近似会偏 2.65px） |
| `pointsToPathData` / `pointsToClipPath` | 点集 → path data / `path()` |
| `squirclePower` | 指数 → 参数式幂次 |

`sampleCornerOffset` 配 `clipPath` prop 即可实现「下角贴设备屏角、上角自由」这类不对称轮廓（Panel 的会话输入区即此用法）。
