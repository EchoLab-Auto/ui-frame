---
'@echolab-auto/ui-frame': minor
---

**玻璃拟态档位统一**：按钮与卡片现在共用同一套档位名 `float` / `raised` / `pressed`（`src/utils/glass.ts` 的 `GlassVariant`），不再各造别名。

- `NeumorphismButton` 新增 `glass` prop（`boolean | 'float' | 'raised' | 'pressed'`），与 `variant` **正交**——`variant="primary" glass="raised"` 即"主色玻璃"；新增第三档 `'pressed'`（磨砂玻璃 + 凹陷内阴影），此前按钮只有悬浮 / 凸起两档
- 向后兼容：`variant="glass"` ≡ `glass="float"`、`variant="glass-raised"` ≡ `glass="raised"`，两者均折算出与旧版一致的类名（`nm-button--glass` + `nm-button--glass-<档位>`），DOM 与观感不变；`ButtonVariant` 仍保留这两个值
- 优先级：显式 `glass` prop > 全局配置 `button.glass`（新增）> 旧 `variant` 的玻璃语义；`glass: false` 可显式关掉旧 `variant="glass"` 带来的玻璃
- `NeumorphismCard` 的 `CardGlass` 改为 `GlassVariant` 的别名，档位解析与类名生成统一走 `normalizeGlass()` / `glassClassNames()`

样式与可用性改进（两组件共用）：

- 类名拆成「表面 + 档位」两层（`.x--glass` 只放材质、`.x--glass-<档位>` 放阴影），档位阴影用双类选择器（特异性 0,2,0）压过基础变体规则，**不再依赖样式表书写顺序**
- 1px 亮边由 `border` 改为 `inset 0 0 0 1px` 内描边：贴合圆角、不占布局（顺带消除玻璃按钮/卡片比同类少 2px 内容区的差异）
- `isolation: isolate` 让 `backdrop-filter` 只在本层发生一次，避免嵌套玻璃层层叠加（昂贵且糊边）
- `@supports` 降级：不支持 `backdrop-filter` 时退回 94% 不透明的 `--nm-surface-color`
- 玻璃按钮的 `:focus-visible` 改用 `outline` 焦点环（2px 主色 + 2px 偏移）——档位阴影覆盖了 `box-shadow`，用 outline 保证键盘焦点始终可见

新增公开导出：`GlassVariant`、`GlassValue`、`GLASS_VARIANTS`、`normalizeGlass()`、`glassClassNames()`（主入口与 `@echolab-auto/ui-frame/utils` 均可引入）。

example 侧：按钮区重构为「预览 + 调参」工作台——左侧实时预览台（可切平面 / 彩色背景）、右侧参数表单（内容文本 / `variant` / `glass` / `size` / `shape` / 高度 / `loading` / `disabled`）、底部实时代码片段，以及 8 格「变体一览」（含旧写法对照）点击即载入预览并高亮当前项。高度滑块改为写入当前尺寸档位的 token（`--nm-button-*-sm/md/lg`），修正切到 small / large 后滑块静默失效的问题。
