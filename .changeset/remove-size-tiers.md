---
'@echolab-auto/ui-frame': major
---

`size` 彻底只收 px 数字：字符串档位（`'small' | 'medium' | 'large'`）从库中移除，不是弃用别名。

**为什么是破坏性变更而不是继续兼容**：两套入口意味着两套结果的可能——档位与数字在锚点处等价，但这个等价性只能靠测试守，调用方无从判断何时会漂。删掉字符串后，「传了什么即渲染什么」在类型层就可验证。三档锚点仍然存在，它们是**锚点表里的数字**（`src/utils/controlScales.ts`），不再是 API。

**移除面**（34 个组件 + 3 个 composable）：

- 34 个 `XxxSize` 类型（`ButtonSize` / `InputSize` / `TagSize` / … 全部），以及它们在 `index.ts` barrel 与组件目录 `index.ts` 的 re-export
- 8 个组件自带的旧档位映射表（`LEGACY_SIZE_PX` / `LEGACY_DIAMETER` / `LEGACY_MAX_WIDTH` / `LEGACY_WIDTH_PX` / `SIZE_MAP` / `TIER_POSITION`）
- 组件内的双通道机制（`rawSize` / `resolvedSize` / 三元的 `classList` / 可空的 `sizeStyle`）：现在**恒走** `--sized` 类 + 内联 CSS 变量，`numericSize` 恒为数字
- `UseCheckableOptions.size`（几何由组件内联变量驱动，composable 不再管尺寸）
- `FormFieldConfig.size: FieldSize` 收窄为 `number`；`UseProgressOptions.size` 收窄为 `Ref<number>`
- `NeumorphismGlobalConfig` 里 34 处 `size` 全部收窄为 `number`

**默认值语义**：无 prop / 无全局配置时取**锚点表 `md`**（与旧的 `medium` 逐像素相同）。Anchor 表调整时兜底自动跟随，不再各处重复写一遍数字。

**三档 CSS 保留**（`.nm-*-small|medium|large`）：它们是锚点数值的声明源，`controlScales.tiers.test.ts` 解析这些规则，守护「数字在锚点处 == 设计稿三档」。删掉它们就失去对照物。

**迁移**（外部调用方）：

| 旧 | 新 |
| --- | --- |
| `size="small"` | `:size="32"`（Button）/ 见各组件锚点 |
| `size="medium"` | `:size="44"`（Button，默认值可省略） |
| `size="large"` | `:size="56"` |

锚点速查：Button 32/44/56、Input 族 36/48/60、Tag 11/12/14、Avatar 32/44/64、Modal 400/560/720、Switch 24/30/36、Spinner 14/20/28、Segmented 26/32/38——全表见 `src/utils/controlScales.ts`。

**顺带修掉的两个回归**（迁移中由测试抓到）：`RadioGroup` 的 size 级联被 `props.size ?? …` 覆盖掉（组级尺寸不再生效）；`Switch` 的 8px 下限与 `StatusDot` 的 4px 下限在改用 `normalizeNumericSize` 后丢失。

**防回归**：`npm run check:sizes` 扩展为四条规则——模板属性、对象字面量、`Size = 'small' | 'medium' | 'large'` 类型别名、注释里引用已移除的档位写法；已接进 CI。

**未改动**：图标尺寸（`NeumorphismIcon` 的 `xs…3xl` 七档）保留为枚举——它是 `check:icons` 守护的"可枚举刻度"（设计稿批准的七个显示尺寸），与控件 `size` 是两条不同的轴，见 `design-philosophy.md` §8 的说明。
