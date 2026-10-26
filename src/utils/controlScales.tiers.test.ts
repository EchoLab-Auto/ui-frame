import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CONTROL_SCALES } from './controlScales'

/**
 * 锚点 ↔ 组件三档 CSS 的一致性核对（防漂移的主力守卫）。
 *
 * `controlScales.ts` 的锚点是手抄的，而组件真正的三档取值在各自的 `.vue`
 * `<style>` 里（或 `checkable-sizes` 之类混基里）。两边一旦不一致，「数字 size
 * 在锚点上与档位别名逐像素一致」这个承诺就静默失效——用户看到 `:size="24"`
 * 和 `size="medium"` 长得不一样，却没有任何测试报警。
 *
 * 这类错误真发生过：`CHECKBOX_SCALE` 曾抄成图标枚举档 12/14/16，而盒边长是
 * 18/24/30。当时 `TOKEN_BACKED` 只覆盖有 token 支撑的指标，漏了它。所以这里
 * **直接解析组件 CSS**，不依赖 token 是否存在。
 *
 * 新增「数字 size」组件时，请把它的三档取值加进 `TIER_SOURCES`。
 */

const SRC = resolve(__dirname, '../components')
const SCSS = resolve(__dirname, '../styles')

const read = (p: string) => readFileSync(p, 'utf8')

/** tokens.scss 的 `--nm-x: y;` 表（值可能是 `var()` 引用，解析时再递归） */
const TOKEN_TABLE = new Map<string, string>()
for (const line of read(resolve(SCSS, 'tokens.scss')).split('\n')) {
  const m = line.match(/^\s*(--nm-[a-z0-9-]+):\s*(.+?);/)
  if (m) TOKEN_TABLE.set(m[1], m[2].trim())
}

/** 把一段 CSS 值解析成 px：裸 px、`var(--nm-*)`（含引用链）、或 spacing/icon token */
function toPx(value: string, depth = 0): number | undefined {
  if (depth > 6) return undefined
  const v = value.trim()
  const px = v.match(/^(-?\d+(?:\.\d+)?)px$/)
  if (px) return Number(px[1])
  const ref = v.match(/^var\((--nm-[a-z0-9-]+)(?:,\s*[^)]+)?\)$/)
  if (ref) {
    const next = TOKEN_TABLE.get(ref[1])
    return next === undefined ? undefined : toPx(next, depth + 1)
  }
  return undefined
}

/**
 * 从 `.vue` 的样式里抽某选择器下某个属性的三档取值。
 *
 * 支持的两种书写形态（覆盖本仓全部现状）：
 *   1. 平铺：`.nm-x--small .nm-x__y { width: …px }`
 *   2. 嵌套：`.nm-x--small { .nm-x__y { width: …px } }`
 */
function tierValues(
  file: string,
  className: string,
  innerSelector: string,
  property: string
): (number | undefined)[] {
  const css = read(file)
  return (['small', 'medium', 'large'] as const).map(tier => {
    // 形态 0：属性直接写在档位块自身。仅当 innerSelector 就是根类时成立——
    // 否则会把「档位块内第一个内层规则的属性」误当成本选择器的（Radio 的
    // --small 块里先出现 __circle 再出现 __dot，正是这个坑）。
    if (innerSelector === `.${className}`) {
      const own = new RegExp(`\\.${className}--${tier}\\s*\\{([^}]*)\\}`, 's').exec(css)
      if (own && prop(own[1], property)) return toPx(prop(own[1], property)!)
    }

    // 形态 1：一行写完选择器
    const flat = new RegExp(
      `\\.${className}--${tier}\\s+\\${innerSelector}\\s*\\{([^}]*)\\}`,
      's'
    ).exec(css)
    if (flat) return toPx(prop(flat[1], property) ?? '')

    // 形态 2：档位块内嵌套
    const nested = new RegExp(`\\.${className}--${tier}\\s*\\{([\\s\\S]*?)\\n\\}`, 's').exec(css)
    if (!nested) return undefined
    const block = new RegExp(`\\${innerSelector}\\s*\\{([^}]*)\\}`, 's').exec(nested[1])
    if (!block) return undefined
    return toPx(prop(block[1], property) ?? '')
  })
}

/** 从一段声明里取某属性值；medium 档可能不声明（继承基础规则），返回 undefined */
function prop(block: string, property: string): string | undefined {
  const m = new RegExp(`(?:^|[\\s;{])${property}:\\s*([^;]+);`).exec(block)
  return m ? m[1].trim() : undefined
}

/**
 * `checkable-sizes($name, $class)` 混基给出的三档边长。
 *
 * Checkbox / Radio 的指示器尺寸不写在 `.vue` 里，而在 `styles/_checkable.scss`。
 */
function checkableSizePx(): (number | undefined)[] {
  const src = read(resolve(SCSS, '_checkable.scss'))
  const block = /@mixin checkable-sizes[\s\S]*?\n\}/.exec(src)
  expect(block, '未找到 checkable-sizes 混基').toBeTruthy()
  return (['small', 'medium', 'large'] as const).map(tier => {
    const m = new RegExp(
      `\\.nm-#\\{\\$name\\}--${tier}\\s+\\.nm-#\\{\\$name\\}__#\\{\\$indicator-class\\}\\s*\\{([^}]*)\\}`
    ).exec(block![0])
    if (!m) return undefined
    return toPx(m[1].match(/width:\s*([^;]+);/)?.[1] ?? '')
  })
}

/**
 * 需要核对的「指标 → 三档 CSS 来源」。
 *
 * 只列**有明确三档声明**的指标；靠 `calc()` 派生的（如 Steps 的图标、
 * ThemeToggle 的 label 字号）由各组件的单元测试兜底。
 */
interface TierSource {
  /** spec 里的变量名；等于 `primaryVar` 时核对 `primary` 锚点 */
  metric: string
  /** 三值来源：函数或已解析好的三元组 */
  values: () => (number | undefined)[]
}

const TIER_SOURCES: Record<keyof typeof CONTROL_SCALES, TierSource[]> = {
  button: [
    {
      metric: '--nm-button-sz-height',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismButton/NeumorphismButton.vue`,
          'nm-button',
          '.nm-button',
          'min-height'
        ),
    },
  ],
  field: [],
  segmented: [
    {
      metric: '--nm-segmented-sz-height',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismSegmented/NeumorphismSegmented.vue`,
          'nm-segmented',
          '.nm-segmented__item',
          'min-height'
        ),
    },
  ],
  themeToggle: [],
  upload: [],
  tag: [],
  alert: [],
  breadcrumb: [],
  list: [],
  tabs: [],
  collapse: [],
  table: [],
  pagination: [],
  steps: [
    {
      metric: '--nm-steps-sz-circle',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismSteps/NeumorphismSteps.vue`,
          'nm-steps',
          '.nm-steps__circle',
          'width'
        ),
    },
  ],
  progress: [],
  menu: [],
  navMenu: [],
  avatar: [
    {
      metric: '--nm-avatar-sz-size',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismAvatar/NeumorphismAvatar.vue`,
          'nm-avatar',
          '.nm-avatar',
          'width'
        ),
    },
  ],
  empty: [
    {
      metric: '--nm-empty-sz-illustration',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismEmpty/NeumorphismEmpty.vue`,
          'nm-empty',
          '.nm-empty__illustration',
          'width'
        ),
    },
  ],
  checkbox: [
    // 盒边长来自 checkable-sizes 混基
    { metric: '--nm-checkbox-sz-box', values: checkableSizePx },
    // 勾形图标走 --nm-icon-size-xs/sm/md（12 / 14 / 16）
    {
      metric: '--nm-checkbox-sz-icon',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismCheckbox/NeumorphismCheckbox.vue`,
          'nm-checkbox',
          '.nm-checkbox__icon',
          'width'
        ),
    },
  ],
  radio: [
    { metric: '--nm-radio-sz-box', values: checkableSizePx },
    {
      metric: '--nm-radio-sz-dot',
      values: () =>
        tierValues(
          `${SRC}/NeumorphismRadio/NeumorphismRadio.vue`,
          'nm-radio',
          '.nm-radio__dot',
          'width'
        ),
    },
  ],
  slider: [
    {
      metric: '--nm-slider-sz-rail',
      // 只设间接变量，值是 var(--nm-slider-rail-size) 之前的那一层
      values: () => {
        const css = read(`${SRC}/NeumorphismSlider/NeumorphismSlider.vue`)
        return (['small', 'medium', 'large'] as const).map(tier => {
          const m = new RegExp(
            `\\.nm-slider--${tier}[^{]*\\{[^}]*--nm-slider-rail-size:\\s*([^;]+);`
          ).exec(css)
          return m ? toPx(m[1]) : undefined
        })
      },
    },
  ],
}

describe('锚点 ↔ 组件三档 CSS：逐值核对', () => {
  for (const [componentName, sources] of Object.entries(TIER_SOURCES)) {
    const spec = (
      CONTROL_SCALES as Record<
        string,
        {
          primary: { sm: number; md: number; lg: number }
          primaryVar: string
          metrics: Record<string, { sm: number; md: number; lg: number }>
        }
      >
    )[componentName]
    if (!sources.length) continue

    for (const { metric, values } of sources) {
      it(`${componentName} · ${metric}`, () => {
        const anchor = metric === spec.primaryVar ? spec.primary : spec.metrics[metric]
        expect(anchor, `${componentName} 的 spec 里没有 ${metric}`).toBeDefined()
        const [sm, md, lg] = values()
        // medium 档常常直接继承基础规则、不重复声明；此时只核对有声明的那两档
        expect(sm, 'small 档未解析出 px').toBeDefined()
        expect(lg, 'large 档未解析出 px').toBeDefined()
        expect({ sm, md, lg }).toEqual({ sm: anchor.sm, md: anchor.md, lg: anchor.lg })
      })
    }
  }
})
