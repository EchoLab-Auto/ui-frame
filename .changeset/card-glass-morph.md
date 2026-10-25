---
'@echolab-auto/ui-frame': minor
---

`NeumorphismCard` 的 `glass` 从布尔开关扩展为**三档玻璃拟态**（与 `NeumorphismButton` 的 `glass` / `glass-raised` 观感对齐）：

| 档位      | 阴影                                             | 对应按钮变体             |
| --------- | ------------------------------------------------ | ------------------------ |
| `float`   | 环境投影（悬浮磨砂，不随 elevation）             | `variant="glass"`        |
| `raised`  | 新拟态凸起双阴影，强度跟随 `\|elevation\|`         | `variant="glass-raised"` |
| `pressed` | 新拟态凹陷内阴影，强度跟随 `\|elevation\|`（新增） | —                        |

向后兼容：`glass: true` 等价 `glass="float"`，类名 `nm-card--glass` 保留，原有观感不变。

设计要点：玻璃**只替换表面材质**（半透明底 + `backdrop-filter: blur() saturate(1.15)` + `inset 0 0 0 1px` 高光内描边），台阶高度模型仍由 `elevation` 决定，两者正交——`glass="raised" :elevation="3"` 用 12px/28px 双阴影，`elevation="0"` 按 1 级呈现避免"没有体积"，档位定方向、`|elevation|` 定强度。`hoverable` 下按档位分别抬升：`float` 上浮 4px、`raised` 上浮 2px 并加强一档阴影、`pressed` 不位移而是内阴影减弱一档（向表面浮起）。

其余改进：`isolation: isolate` 让模糊只发生一次（避免嵌套 `backdrop-filter` 层层叠加、糊边且昂贵）；不支持 `backdrop-filter` 时经 `@supports` 退回 94% 不透明表面色保证可读；`glass` 默认值改为 `undefined` 以支持新增的全局配置 `card.glass` 级联；新增导出类型 `CardGlass`。
