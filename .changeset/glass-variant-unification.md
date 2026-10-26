---
'@echolab-auto/ui-frame': minor
---

**玻璃拟态档位统一**：按钮与卡片共用同一套档位名 `float` / `raised` / `pressed`（`src/utils/glass.ts` 的 `GlassVariant`），不再各造别名。

按钮侧**玻璃是 `variant` 的一档，不是独立 prop**：

- `variant` 现为 `'raised' | 'pressed' | 'primary' | 'glow' | 'glass' | 'glass-raised' | 'glass-pressed'`，新增第三档 `glass-pressed`（磨砂玻璃 + 凹陷内阴影），此前按钮只有悬浮 / 凸起两档
- 之所以不做成独立 prop：阴影方向只有一条轴（凸 / 凹），玻璃三档同时决定「材质 + 凸凹」，拆成两个 prop 会允许 `variant="pressed"` + 凸起玻璃这类自相矛盾的组合；而且玻璃表面会覆盖 `primary` 的底色，所谓「与 variant 正交」并不成立——「彩色玻璃」只能靠改 `--nm-glass-bg` 得到
- 三档对应关系：`glass` → 档位 `float`、`glass-raised` → `raised`、`glass-pressed` → `pressed`，均由 `glassClassNames()` 生成 `nm-button--glass` + `nm-button--glass-<档位>` 两个类
- 全局配置改为 `button.variant: 'glass'`（原 `button.glass` 已移除）；顺带把 `button.variant` 的类型从 `'raised' | 'pressed'` 放开到全部七档，此前无法全局默认 `primary` / `glow`

> 迁移：按钮上的 `glass` 属性已不存在，`glass="float"` → `variant="glass"`、`glass="raised"` → `variant="glass-raised"`、`glass="pressed"` → `variant="glass-pressed"`。`variant="glass"` / `"glass-raised"` 的写法完全不变。`NeumorphismCard` 与 `ChatComposer` 仍保留 `glass` prop——它们的凸凹由 `elevation` / 无竞争轴承载，玻璃对它们确实是独立的材质维度。

样式与可用性改进（两组件共用）：

- 类名拆成「表面 + 档位」两层（`.x--glass` 只放材质、`.x--glass-<档位>` 放阴影），档位阴影用双类选择器（特异性 0,2,0）压过基础变体规则，**不再依赖样式表书写顺序**
- 1px 亮边由 `border` 改为 `inset 0 0 0 1px` 内描边：贴合圆角、不占布局（顺带消除玻璃按钮/卡片比同类少 2px 内容区的差异）
- `isolation: isolate` 让 `backdrop-filter` 只在本层发生一次，避免嵌套
