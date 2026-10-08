#!/usr/bin/env node

/**
 * 检查组件层间距字面量（padding / margin / gap 及其方向变体）。
 *
 * 规则见 document/develop/design-philosophy.md 第七节：
 *   - 档表内的值必须消费 --nm-spacing-* token（否则违规）
 *   - 档表外的值必须命中豁免名单（物理特例），未登记的值一律报出
 *
 * 检查范围：src/**\/*.vue 的 <style> 块 + src/**\/*.scss（tokens.scss 除外）。
 * 不覆盖：template 内联 :style 动态绑定、非 px 单位。
 *
 * Exit 0 = 通过，1 = 发现违规。
 *
 * Usage: node scripts/check-spacing.mjs
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcDir = resolve(root, 'src')

// 档表内值 → 建议 token（出现即违规，必须消费 token）
const SCALE_TOKEN = {
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

// 物理特例豁免（发丝级 / sr-only / 光学对位 / 待归队档）
const EXEMPT = new Set(['1px', '-1px', '-5px', '3px', '5px', '7px', '18px', '22px', '28px', '36px'])

const SKIP_FILES = new Set(['tokens.scss'])
const PROP_RE =
  /^\s*(padding|margin|gap|row-gap|column-gap|padding-[\w-]+|margin-[\w-]+)\s*:\s*([^;{}]+)/
const PX_RE = /(?<![\w.-])(-?\d+(?:\.\d+)?)px/g

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(vue|scss)$/.test(name)) yield p
  }
}

const findings = []

for (const file of walk(srcDir)) {
  if (SKIP_FILES.has(file.split('/').pop())) continue
  const text = readFileSync(file, 'utf-8')
  const lines = text.split('\n')
  const isVue = file.endsWith('.vue')
  let inStyle = !isVue

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isVue) {
      if (/<style[^>]*>/.test(line)) {
        inStyle = true
        continue
      }
      if (/<\/style>/.test(line)) {
        inStyle = false
        continue
      }
    }
    if (!inStyle) continue

    const stripped = line.replace(/\/\/.*$/, '')
    const m = stripped.match(PROP_RE)
    if (!m) continue

    for (const pm of m[2].matchAll(PX_RE)) {
      const value = `${pm[1]}px`
      if (EXEMPT.has(value)) continue
      const suggestion = SCALE_TOKEN[value]
      findings.push({
        file: relative(root, file),
        line: i + 1,
        decl: m[0].trim(),
        value,
        suggestion,
      })
    }
  }
}

if (findings.length === 0) {
  console.log('✓ check:spacing — 组件层间距字面量检查通过（档表外仅豁免项）')
  process.exit(0)
}

console.error(`✗ check:spacing — 发现 ${findings.length} 处间距字面量：\n`)
for (const f of findings) {
  const hint = f.suggestion ? `应消费 var(${f.suggestion})` : '未登记档位（需收编或加入豁免并说明）'
  console.error(`  ${f.file}:${f.line}  ${f.decl}  [${f.value} → ${hint}]`)
}
console.error(
  '\n规则见 document/develop/design-philosophy.md 第七节；豁免名单在 scripts/check-spacing.mjs。'
)
process.exit(1)
