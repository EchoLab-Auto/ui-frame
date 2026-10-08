#!/usr/bin/env node

/**
 * 设计 token 合规检查（spacing + font-size）。
 *
 * 规则见 document/develop/design-philosophy.md 第七节：
 *   1) 间距（padding / margin / gap）：档表内值必须消费 --nm-spacing-*；
 *      档表外的值必须命中豁免名单（物理特例），未登记的值一律报出。
 *   2) 字号（CSS font-size 与 SVG font-size 属性）：必须消费 --nm-font-*
 *      或 --nm-heading-*-size，任何纯 px 字面量都是缺陷。
 *
 * 检查范围：src/**\/*.vue、src/**\/*.scss、src/**\/*.ts（tokens.scss 除外）。
 * 不覆盖：非 px 单位（%、em、calc 中的相对运算）。
 *
 * Exit 0 = 通过，1 = 发现违规。
 *
 * Usage: node scripts/check-styles.mjs
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcDir = resolve(root, 'src')

// ── 规则 1：间距 ──
// 档表内值 → 建议 token（出现即违规，必须消费 token）
const SPACING_TOKEN = {
  '2px': '--nm-spacing-2xs',
  '4px': '--nm-spacing-xs',
  '6px': '--nm-spacing-6',
  '8px': '--nm-spacing-sm',
  '10px': '--nm-spacing-10',
  '12px': '--nm-spacing-12',
  '14px': '--nm-spacing-14',
  '16px': '--nm-spacing-md',
  '20px': '--nm-spacing-20',
  '24px': '--nm-spacing-lg',
  '32px': '--nm-spacing-xl',
  '40px': '--nm-spacing-2xl',
  '48px': '--nm-spacing-3xl',
  '-4px': '--nm-spacing-neg-xs',
  '-8px': '--nm-spacing-neg-sm',
}

// 物理特例豁免（发丝级 / sr-only / 光学对位等）
const SPACING_EXEMPT = new Set([
  '1px',
  '-1px',
  '-5px',
  '3px',
  '5px',
  '7px',
  '18px',
  '22px',
  '28px',
  '36px',
])

const SKIP_FILES = new Set(['tokens.scss'])
const SPACING_PROP_RE =
  /^\s*(padding|margin|gap|row-gap|column-gap|padding-[\w-]+|margin-[\w-]+)\s*:\s*([^;{}]+)/
const FONT_SIZE_RE = /font-size\s*:\s*(\d+(?:\.\d+)?)px/
const SVG_FONT_SIZE_RE = /font-size="(\d+(?:\.\d+)?)"/

// ── 规则 3/4：图标尺寸与线宽档位（--nm-icon-size-* 值域；线宽语义）──
const ICON_SIZE_ALLOWED = new Set(['12', '14', '16', '18', '20', '24', '32'])
const STROKE_ALLOWED = new Set(['0.5', '1', '1.5', '2', '2.5', '3'])
const PX_RE = /(?<![\w.-])(-?\d+(?:\.\d+)?)px/g

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(vue|scss|ts)$/.test(name) && !name.endsWith('.stories.ts')) yield p
  }
}

const findings = []

for (const file of walk(srcDir)) {
  if (SKIP_FILES.has(file.split('/').pop())) continue
  const text = readFileSync(file, 'utf-8')
  const lines = text.split('\n')
  const isVue = file.endsWith('.vue')
  let inStyle = !isVue
  let inTemplate = false
  let svgTagOpen = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isVue) {
      if (/<style[^>]*>/.test(line)) {
        inStyle = true
        continue
      }
      if (/<\/style>/.test(line)) {
        inStyle = false
      }
      if (/<template[^>]*>/.test(line)) {
        inTemplate = true
        continue
      }
      if (/<\/template>/.test(line)) {
        inTemplate = false
      }
    }
    const stripped = line.replace(/\/\/.*$/, '')

    // 规则 1：间距（仅样式区）
    if (inStyle) {
      const m = stripped.match(SPACING_PROP_RE)
      if (m) {
        for (const pm of m[2].matchAll(PX_RE)) {
          const value = `${pm[1]}px`
          if (SPACING_EXEMPT.has(value)) continue
          findings.push({
            file: relative(root, file),
            line: i + 1,
            kind: 'spacing',
            decl: m[0].trim(),
            value,
            suggestion: SPACING_TOKEN[value]
              ? `应消费 var(${SPACING_TOKEN[value]})`
              : '未登记档位（需收编或加入豁免并说明）',
          })
        }
      }
    }

    // 规则 2：字号（样式区 CSS font-size；模板区 SVG font-size 属性）
    if (inStyle) {
      const fm = stripped.match(FONT_SIZE_RE)
      if (fm) {
        findings.push({
          file: relative(root, file),
          line: i + 1,
          kind: 'font-size',
          decl: fm[0].trim(),
          value: `${fm[1]}px`,
          suggestion: '应消费 var(--nm-font-*) 或 var(--nm-heading-*-size)',
        })
      }
    }
    if (isVue && inTemplate) {
      const sm = stripped.match(SVG_FONT_SIZE_RE)
      if (sm) {
        findings.push({
          file: relative(root, file),
          line: i + 1,
          kind: 'svg-attr',
          decl: sm[0].trim(),
          value: `${sm[1]}px`,
          suggestion: 'SVG 属性不支持 var()——改用 class/style 走 --nm-font-*',
        })
      }

      // 规则 3：SVG 图标尺寸档（--nm-icon-size-* 的值域）——仅限 <svg> 开标签内
      // 状态机：多行开标签「<svg 行（未闭合）→ 属性行 → '>' 行」；单行完整标签不进入状态
      const svgStart = stripped.trim()
      if (/^<svg(\s|>|$)/.test(svgStart)) {
        svgTagOpen = !svgStart.endsWith('>') // 单行完整标签（以 > 结尾）不进入
      } else if (svgTagOpen && /(^\s*>|\/>)\s*$/.test(stripped)) {
        svgTagOpen = false
      }
      const im = svgTagOpen ? stripped.match(/^\s*(width|height)="(\d+)"\s*$/) : null
      if (im && !ICON_SIZE_ALLOWED.has(im[2])) {
        findings.push({
          file: relative(root, file),
          line: i + 1,
          kind: 'icon-size',
          decl: im[0].trim(),
          value: `${im[2]}px`,
          suggestion: `图标尺寸须 ∈ {${[...ICON_SIZE_ALLOWED].join(', ')}}（--nm-icon-size-* 值域）`,
        })
      }
      // 规则 4：SVG 线宽档
      const stm = stripped.match(/^\s*stroke-width="([\d.]+)"\s*$/)
      if (stm && !STROKE_ALLOWED.has(stm[1])) {
        findings.push({
          file: relative(root, file),
          line: i + 1,
          kind: 'icon-stroke',
          decl: stm[0].trim(),
          value: stm[1],
          suggestion: `线宽须 ∈ {${[...STROKE_ALLOWED].join(', ')}}（0.5/1 图表 · 1.5 大图标 · 2 标准 · 2.5 微图标/转圈 · 3 勾选）`,
        })
      }
    }
  }
}

if (findings.length === 0) {
  console.log('✓ check:styles — 间距 / 字号字面量检查通过')
  process.exit(0)
}

console.error(`✗ check:styles — 发现 ${findings.length} 处字面量：\n`)
for (const f of findings) {
  console.error(`  [${f.kind}] ${f.file}:${f.line}  ${f.decl}  [${f.value} → ${f.suggestion}]`)
}
console.error(
  '\n规则见 document/develop/design-philosophy.md 第七节；豁免名单在 scripts/check-styles.mjs。'
)
process.exit(1)
