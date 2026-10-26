---
'@echolab-auto/ui-frame': minor
---

**尺寸全面数字化：`size` 收数字（px），三档字符串降级为兼容别名**

所有几何量 prop 现在都接受数字，语义统一为「该组件的**主几何量** px」；字符串档位（`'small' | 'medium' | 'large'`）保留可用但标 `@deprecated`，等价于三个锚点数字。

```vue
<!-- 旧（仍可用，但已弃用） -->
<NeumorphismButton size="small" />
<!-- 新 -->
<NeumorphismButton :size="32" />
<!-- 锚点之间也行（以前做不到） -->
<NeumorphismButton :size="38" />
```

| 主几何量 | 组件 | 数字含义 |
| --- | --- | --- |
| 最小高度 | Button / Input / Textarea / Select / AutoComplete / DatePicker / InputNumber（共 `--nm-field-*`）/ Segmented / Upload | 控件最小高度 |
| 字号 | Tag / Alert / Breadcrumb / List / Tabs / Collapse / Menu / NavMenu | 正文字号 |
| 密度 | Table（单元格上下内距）/ Pagination（页码按钮高） | 行密度 / 按钮尺寸 |
| 独立几何 | Avatar（直径）/ Empty（插图边长）/ Steps（序号圆直径）/ Checkbox（勾选框边长）/ Radio（圆点直径）/ Slider（轨道粗细）/ Progress（线形条厚度）/ ThemeToggle（内层上下内距） | 见左 |

**其余几何量按三锚点分段线性插值**（`src/utils/controlScale.ts`）：

- **主几何量原样采信**：`:size="28"` 就是 28px，不会被锚点夹成 32px
- 落在锚点 → 与该档**逐像素一致**：`:size="32"` 与 `size="small"` 渲染相同（有测试守着）
- 落在两锚之间 → 派生量线性过渡：`:size="38"` → 38px 高、13.5px 字号、10px / 20px 内距
- 派生量超出两端 → 取端点值，不外推（`:size="80"` 高度照传 80px，字号停在 16px）
- 0 / 负数 / NaN → 回落 medium 锚点（负内距、0 尺寸会让控件消失，不该由调用方 debug）

为什么不用「相对 medium 的倍率」：三档锚点并不等比（按钮高 32/44/56 = 1 : 1.375 : 1.75，字号 13/14/16 = 1 : 1.077 : 1.231），按倍率缩放会让同一几何量出现两套结果。

实现约定：

- 锚点表集中 `src/utils/controlScales.ts`，与 `styles/tokens.scss` 的组件 token 一一对应，`controlScale.test.ts` 解析 token 源文件逐个核对（防漂移）
- 组件 CSS 只新增一条 `.x--sized` 规则把 `--nm-x-sz-*` 接到实际声明，**三档 class 一行未改**，数字路径与档位路径互不覆盖
- 全局配置同样接受数字：`app.use(NeumorphismUI, { button: { size: 40 } })`

> 破坏性：`size` 的 TS 类型从字符串枚举变成 `number | 枚举`。既有 `size="small"` 写法不受影响（别名仍在），但**语义上已弃用**，建议迁移到数字。`document/develop/design-philosophy.md` §七 已改写为「数字是一等公民」，废弃了此前「三档负责跨组件对齐」的说法。
