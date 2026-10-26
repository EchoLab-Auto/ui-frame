---
'@echolab-auto/ui-frame': minor
---

**NeumorphismAsciiArt 泛化为「图片蒙版」：新增波点蒙版（`mask="dots"`）**

组件原本只会画字符画。现在它是一条「图片 → 亮度栅格 → 逐格绘制」的管线，
`mask` 决定每格画什么，字符画只是其中一种：

```vue
<!-- 字符画（默认，旧代码不变） -->
<NeumorphismAsciiArt src="/photo.jpg" />

<!-- 波点：点径 1→8px，网格占用 0.92 -->
<NeumorphismAsciiArt src="/photo.jpg" mask="dots" :dot-min="1" :dot-max="8" />
```

| 蒙版 | 每格画什么 | 参数 |
| --- | --- | --- |
| `ascii` | 字符梯度 ` .·:-=+*#%@` | `density` |
| `dots` | 波点（半调网点），直径随亮度连续变化 | `dotMin` / `dotMax` / `occupancy` |

**波点的大小与网格占用**（对应「不同大小的波点、不同大小的网格占用」）：

- `dotMin` / `dotMax` 是波点**直径的像素值**（暗部 → 亮部），中间按亮度线性过渡；
- `occupancy` 是**网格占用** = 最大波点直径占单元格边长的比例，栅格步长 `pitch = dotMax / occupancy`
  （`1` = 最亮处相切，`0.5` = 只占半格，`>1` 允许轻微重叠）；
- `density` 是整体精细度倍率，网格与点径同比缩放、占用比不变。

实现上把原来的 `effects/ascii.ts` 拆成 `effects/image-mask.ts`（采样 + 适配 + 呼吸 + 指针）
与 `effects/masks/{ascii-mask,dot-mask}.ts`（每格画什么），`ART_MASKS` 注册表登记蒙版；
`effects/ascii.ts` 保留为兼容入口，`ASCII_RAMP` / `charFor` / `asciiEffect` 导出不变。
新增蒙版只需实现 `ImageMask` 接口并登记，采样与动态逻辑一处不改。

配套：

- 无障碍名随蒙版切换（新增 locale 键 `dotArtLabel`：「波点画」/ "Dot pattern"）
- 新增 `AsciiArtMask` 类型导出
- 新增端到端测试：合成「左黑右白」渐变图走完整条管线，验证波点直径随亮度左→右递增（防倒挂/防错位）
