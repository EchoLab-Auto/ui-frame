---
id: comp-icon
title: 'NeumorphismIcon 图标'
x: 300
y: 1200
---

# NeumorphismIcon 图标

> 线框单色图标组件。79 个语义名集中定义在 `src/icons/registry.ts`，内置组件与业务代码共用同一套几何——不再各自内联 `<path>`，也不再需要用 emoji 或字符顶替图标。

## 为什么需要它

图标规范（[设计理念](../develop/design-philosophy.md) §8）此前只能被"检查"（`check:styles` 校验尺寸与线宽字面量），不能被"复用"：31 个内置组件各自内联了 75 个 `<svg>`，同一几何反复重写——`close` 出现在 9 个组件、`chevron-down` 5 个、`chevron-right` 3 个、`check` 2 个、spinner 弧 2 个。消费方拿不到 `lock` / `home` / `folder` / `link` 这类语义图标，只好用 🔒 🏠 📁 ⛓ 之类的 emoji 拼界面，尺寸与基线在混排时全部失控。

`NeumorphismIcon` 把图标收敛为一处事实源：组件按语义名渲染，尺寸走 `--nm-icon-size-*` 七档，线宽按显示尺寸自动取档。

## 基本用法

```vue
<script setup>
import { NeumorphismIcon } from '@echolab-auto/ui-frame'
</script>

<template>
  <NeumorphismIcon name="close" />
  <!-- 默认 sm = 14px -->
  <NeumorphismIcon name="chevron-down" size="xs" />
  <!-- 12px，线宽自动 2.5 -->
  <NeumorphismIcon name="check" :stroke-width="3" />
  <!-- 勾选语义强调 -->
  <NeumorphismIcon name="refresh" spin />
  <!-- 加载中 -->
  <NeumorphismIcon name="warning" label="高风险" />
  <!-- 语义图标必配 label -->
</template>
```

也可经子路径只装图标表（不拖整包）：

```ts
import { ICON_NAMES, ICON_REGISTRY } from '@echolab-auto/ui-frame/icons'
```

## API

| Prop          | 类型                                                                 | 默认    | 说明                                                                             |
| ------------- | -------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `name`        | `IconName`（79 个语义名）                                            | —       | 必填。未知名回退 `close`（不空白、不报错）                                       |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` 或 `number` | `'sm'`  | 档位对应 12/14/16/18/20/24/32；数字直传，须落在这 7 个值上（`check:icons` 校验） |
| `strokeWidth` | `number`                                                             | —       | 覆盖按档自动值；合法 0.5/1/1.5/2/2.5/3                                           |
| `spin`        | `boolean`                                                            | `false` | 匀速旋转（`1s linear`，`transform-box: view-box` 锁定中心）                      |
| `pulse`       | `boolean`                                                            | `false` | 呼吸脉冲（只动透明度，不位移/缩放——列表里不"跳动"）                              |
| `label`       | `string`                                                             | `''`    | 有值 → `role="img"` + `aria-label`；留空 → `aria-hidden="true"`（装饰性）        |

`spin` / `pulse` 在 `prefers-reduced-motion: reduce` 下自动停用。

## 尺寸与线宽

尺寸档位与 `--nm-icon-size-*` 一一对应（§8）：

| 档位  | px  | 典型场景                       | 线宽（自动） |
| ----- | --- | ------------------------------ | ------------ |
| `xs`  | 12  | 下拉箭头、排序 chevron、树展开 | `2.5`        |
| `sm`  | 14  | 行内小图标、按钮内、输入框清空 | `2`          |
| `md`  | 16  | 默认图标、搜索框               | `2`          |
| `lg`  | 18  | 菜单项图标、选择器箭头（大档） | `2`          |
| `xl`  | 20  | 大号菜单                       | `2`          |
| `2xl` | 24  | 上传列表图标、空态小插图       | `1.5`        |
| `3xl` | 32  | 插图主图标                     | `1.5`        |

线宽档语义（§8）：`2` 标准 / `2.5` 微图标补偿（≤12px）与转圈 / `3` 勾选标记 / `1.5` 大图标轻描（≥24px）/ `1`·`0.5` 图表细线（数据可视化豁免）。

## 图标目录（79 个）

| 分组       | 语义名                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 方向与导航 | `chevron-down` `chevron-up` `chevron-left` `chevron-right` `chevrons-left` `chevrons-right` `arrow-left` `arrow-right` `arrow-up` `arrow-down` `home` `external` |
| 状态与标记 | `check` `close` `warning` `info` `dot` `lock` `unlock` `check-square` `square` `minus` `star` `circle-info` `circle-close`                                       |
| 文件系统   | `folder` `folder-open` `file` `link` `cloud` `inbox`                                                                                                             |
| 操作       | `gear` `refresh` `plus` `search` `trash` `copy` `pin` `grip` `more` `drag`                                                                                       |
| 数据与内容 | `table` `list` `chart` `calendar` `clock` `user` `users` `upload` `download` `image` `eye` `language`                                                            |
| 文档与编辑 | `guide` `changelog` `faq` `example` `install` `config` `plug` `pencil` `save` `book` `file-text` `map` `clipboard` `split`                                       |
| 主题与状态 | `sun` `moon` `monitor` `spinner`                                                                                                                                 |
| 消息与智能 | `message` `network` `sparkle`                                                                                                                                    |
| 画布与缩放 | `zoom-in` `zoom-out` `maximize` `minimize` `arrows-out`                                                                                                          |

实心图标（`dot` / `grip` / `more`）在注册表里标 `filled: true`，渲染时 `fill: currentColor` + `stroke: none`，颜色仍随 `currentColor`。

运行时取全集：

```ts
import { ICON_NAMES } from '@echolab-auto/ui-frame/icons'
console.log(ICON_NAMES.length) // 79
```

## 自定义图标

注册表是**只读常量**——业务自定义图标建议包一层自己的组件，或直接内联 `<svg>` 但遵守同一规范（24 viewBox / `currentColor` / 枚举档尺寸 / 六档线宽）：

```vue
<template>
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="…" />
  </svg>
</template>
```

若某个语义在业务里反复出现，更合适的做法是提到库内注册表（发 PR 加一条 `ICON_REGISTRY` 条目即可，`check:icons` 会自动纳入校验）。

## 防回归

```bash
npm run check:icons
```

校验四项：① 注册表每条至少一个 `path` 且 `d` 只含 SVG path 语法字符；② 组件内 `<svg>` 显式 `width`/`height` 须在枚举档；③ `stroke-width` 须在六档；④ 图标容器不得用百分比尺寸、模板里不得用 emoji/符号充当控件图标。

## 相关

- [设计理念 · 八、图标体系](../develop/design-philosophy.md#八图标体系)— 规范来源
- [主题切换 ThemeToggle](./theme-toggle.md) — 三态图标已改走本组件（`sun` / `monitor` / `moon`）
- [组件总览](../components.md) — 全部组件分类
