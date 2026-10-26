import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  interpolateAnchor,
  normalizeNumericSize,
  positionOf,
  resolveControlScale,
} from './controlScale'
import { CONTROL_SCALES } from './controlScales'

/**
 * 锚点与 token 的一致性核对。
 *
 * `controlScales.ts` 里写的是 px 数字，组件样式消费的是 `tokens.scss` 的 token。
 * 两边各写一份就会漂移，所以这里解析 token 源文件逐个核对：改 token 忘了改锚点
 * （或反之）会直接红。
 */
const TOKENS = readFileSync(resolve(__dirname, '../styles/tokens.scss'), 'utf8')

/** 轻量 token 表：只认 `--nm-x: y;` 与 `--nm-x: var(--nm-y);` 的链式引用 */
function buildTokenTable(source: string): Map<string, string> {
  const table = new Map<string, string>()
  for (const line of source.split('\n')) {
    const m = line.match(/^\s*(--nm-[a-z0-9-]+):\s*(.+?);/)
    if (m) table.set(m[1], m[2].trim())
  }
  return table
}

const table = buildTokenTable(TOKENS)

/** 把 token 值解析成 px：支持纯 px 与 `var(--nm-*)` 引用链（最多 5 层） */
function toPx(value: string, depth = 0): number | undefined {
  if (depth > 5) return undefined
  const px = value.match(/^(-?\d+(?:\.\d+)?)px$/)
  if (px) return Number(px[1])
  const ref = value.match(/^var\((--nm-[a-z0-9-]+)\)$/)
  if (ref) {
    const next = table.get(ref[1])
    return next === undefined ? undefined : toPx(next, depth + 1)
  }
  return undefined
}

/**
 * 「锚点变量名后缀 → token 前缀」映射。
 *
 * 只列真正有 token 支撑的指标；组件内部硬编码的几何量（如 Tag 的高度、Steps 的
 * 圆直径）没有 token，就不参与核对。
 */
const TOKEN_BACKED: Record<string, Record<string, string>> = {
  button: {
    '--nm-button-sz-height': '--nm-button-min-height' /* PRIMARY_CLIENT_SIDE */,
    '--nm-button-sz-font': '--nm-button-font',
    '--nm-button-sz-pad-y': '--nm-button-padding-y',
    '--nm-button-sz-pad-x': '--nm-button-padding-x',
  },
  field: {
    '--nm-field-sz-height': '--nm-field-min-height' /* PRIMARY_CLIENT_SIDE */,
    '--nm-field-sz-font': '--nm-field-font',
    '--nm-field-sz-pad-y': '--nm-field-padding-y',
    '--nm-field-sz-pad-x': '--nm-field-padding-x',
    '--nm-field-sz-affix-x': '--nm-field-affix-padding-x',
  },
  tag: {
    '--nm-tag-sz-font': '--nm-tag-font' /* PRIMARY_CLIENT_SIDE */,
    '--nm-tag-sz-pad-y': '--nm-tag-padding-y',
    '--nm-tag-sz-pad-x': '--nm-tag-padding-x',
  },
  alert: {
    '--nm-alert-sz-font': '--nm-alert-font' /* PRIMARY_CLIENT_SIDE */,
    '--nm-alert-sz-title-font': '--nm-alert-title-font',
    '--nm-alert-sz-pad-y': '--nm-alert-padding-y',
    '--nm-alert-sz-pad-x': '--nm-alert-padding-x',
  },
  tabs: {
    '--nm-tabs-sz-font': '--nm-tabs-tab-font' /* PRIMARY_CLIENT_SIDE */,
    '--nm-tabs-sz-pad-y': '--nm-tabs-tab-padding-y',
    '--nm-tabs-sz-pad-x': '--nm-tabs-tab-padding-x',
  },
  collapse: {
    '--nm-collapse-sz-font': '--nm-collapse-trigger-font' /* PRIMARY_CLIENT_SIDE */,
    '--nm-collapse-sz-pad-y': '--nm-collapse-trigger-padding-y',
    '--nm-collapse-sz-pad-x': '--nm-collapse-trigger-padding-x',
  },
  table: {
    '--nm-table-sz-pad-y': '--nm-table-cell-padding-y' /* PRIMARY_CLIENT_SIDE */,
    '--nm-table-sz-pad-x': '--nm-table-cell-padding-x',
  },
  pagination: {
    '--nm-pagination-sz-height': '--nm-pagination-btn-height' /* PRIMARY_CLIENT_SIDE */,
    '--nm-pagination-sz-min-width': '--nm-pagination-btn-min-width',
    '--nm-pagination-sz-font': '--nm-pagination-btn-font',
  },
  progress: {
    '--nm-progress-sz-height': '--nm-progress-height' /* PRIMARY_CLIENT_SIDE */,
  },
  avatar: {
    '--nm-avatar-sz-size': '--nm-avatar-size' /* PRIMARY_CLIENT_SIDE */,
    '--nm-avatar-sz-font': '--nm-avatar-font',
  },
  breadcrumb: {
    '--nm-breadcrumb-sz-font': '--nm-breadcrumb-font' /* PRIMARY_CLIENT_SIDE */,
  },
  upload: {
    '--nm-upload-sz-trigger-height': '--nm-upload-trigger-min-height' /* PRIMARY_CLIENT_SIDE */,
  },
}

describe('controlScale 引擎', () => {
  it('锚点上取值不漂移（small/medium/large ≡ sm/md/lg）', () => {
    const anchor = { sm: 32, md: 44, lg: 56 }
    expect(interpolateAnchor(anchor, 0)).toBe(32)
    expect(interpolateAnchor(anchor, 1)).toBe(44)
    expect(interpolateAnchor(anchor, 2)).toBe(56)
  })

  it('两锚之间线性过渡', () => {
    const anchor = { sm: 32, md: 44, lg: 56 }
    // 正中间
    expect(interpolateAnchor(anchor, 0.5)).toBe(38)
    // md → lg 的中点
    expect(interpolateAnchor(anchor, 1.5)).toBe(50)
  })

  it('超出两端取端点值（不外推）', () => {
    const anchor = { sm: 32, md: 44, lg: 56 }
    expect(interpolateAnchor(anchor, -3)).toBe(32)
    expect(interpolateAnchor(anchor, 9)).toBe(56)
  })

  it('positionOf 按主几何量定位，端点夹取', () => {
    const primary = { sm: 32, md: 44, lg: 56 }
    expect(positionOf(primary, 32)).toBe(0)
    expect(positionOf(primary, 44)).toBe(1)
    expect(positionOf(primary, 56)).toBe(2)
    expect(positionOf(primary, 38)).toBeCloseTo(0.5, 5)
    expect(positionOf(primary, 10)).toBe(0)
    expect(positionOf(primary, 999)).toBe(2)
  })

  it('normalizeNumericSize 拦住 0 / 负数 / NaN', () => {
    expect(normalizeNumericSize(40, 44)).toBe(40)
    expect(normalizeNumericSize(0, 44)).toBe(44)
    expect(normalizeNumericSize(-8, 44)).toBe(44)
    expect(normalizeNumericSize(Number.NaN, 44)).toBe(44)
    expect(normalizeNumericSize('40' as unknown, 44)).toBe(44)
  })

  it('resolveControlScale 把全部指标换算成 px 字符串', () => {
    const style = resolveControlScale(CONTROL_SCALES.button, 44)
    expect(style['--nm-button-sz-height']).toBe('44px')
    expect(style['--nm-button-sz-font']).toBe('14px')
    expect(style['--nm-button-sz-pad-y']).toBe('12px')
    expect(style['--nm-button-sz-pad-x']).toBe('24px')
  })

  it('主几何量原样采信：锚点之外也不夹取', () => {
    // 超出上端：高度照传，字号/内距取端点值
    const big = resolveControlScale(CONTROL_SCALES.button, 80)
    expect(big['--nm-button-sz-height']).toBe('80px')
    expect(big['--nm-button-sz-font']).toBe('16px')
    expect(big['--nm-button-sz-pad-y']).toBe('16px')

    // 低于下端同理：传 28 就是 28px，不该被抬成 32px
    const small = resolveControlScale(CONTROL_SCALES.button, 28)
    expect(small['--nm-button-sz-height']).toBe('28px')
    expect(small['--nm-button-sz-font']).toBe('13px')
  })

  it('数字尺寸与档位别名逐像素一致（32 ≡ small / 44 ≡ medium / 56 ≡ large）', () => {
    const spec = CONTROL_SCALES.button
    const anchors = [
      [32, 'sm'],
      [44, 'md'],
      [56, 'lg'],
    ] as const
    for (const [px, step] of anchors) {
      const style = resolveControlScale(spec, px)
      expect(style[spec.primaryVar]).toBe(`${px}px`)
      for (const [metric, anchor] of Object.entries(spec.metrics)) {
        expect(style[metric]).toBe(`${anchor[step]}px`)
      }
    }
  })

  it('每份 spec 都声明了 primaryVar，且该变量不在 metrics 里重复', () => {
    for (const [name, spec] of Object.entries(CONTROL_SCALES)) {
      const s = spec as unknown as {
        primaryVar: string
        primary: { sm: number; md: number; lg: number }
        metrics: Record<string, unknown>
      }
      expect(s.primaryVar, `${name} 缺 primaryVar`).toBeTruthy()
      expect(Object.keys(s.metrics), `${name} 的 primaryVar 不该再出现在 metrics 里`).not.toContain(
        s.primaryVar
      )
    }
  })
})

describe('controlScales 锚点 ↔ tokens.scss', () => {
  for (const [componentName, mapping] of Object.entries(TOKEN_BACKED)) {
    const spec = (CONTROL_SCALES as Record<string, { metrics: Record<string, unknown> }>)[
      componentName
    ]
    it(`${componentName}：${Object.keys(mapping).length} 个指标与 token 一致`, () => {
      expect(spec).toBeDefined()
      for (const [metricVar, tokenPrefix] of Object.entries(mapping)) {
        const full = spec as unknown as {
          primaryVar: string
          primary: { sm: number; md: number; lg: number }
          metrics: Record<string, { sm: number; md: number; lg: number }>
        }
        // 主几何量已从 metrics 提到 primaryVar：它的锚点就是 spec.primary
        const anchor = metricVar === full.primaryVar ? full.primary : full.metrics[metricVar]
        expect(anchor, `${componentName} 缺少 ${metricVar}`).toBeDefined()
        for (const step of ['sm', 'md', 'lg'] as const) {
          const tokenName = `${tokenPrefix}-${step}`
          const raw = table.get(tokenName)
          expect(raw, `tokens.scss 缺少 ${tokenName}`).toBeDefined()
          expect(toPx(raw!), `${tokenName} 无法解析为 px`).toBeDefined()
          expect(anchor[step], `${componentName} ${metricVar}.${step} 与 ${tokenName} 不一致`).toBe(
            toPx(raw!)
          )
        }
      }
    })
  }
})
