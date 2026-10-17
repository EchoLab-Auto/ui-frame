#!/usr/bin/env node

/**
 * 图标规范守卫（2026-10 图标统一）。
 *
 * 规则来源：`document/develop/design-philosophy.md` §8「图标体系」。
 * 校验项：
 *   1. 图标注册表（`src/icons/registry.ts`）自身合法——每条至少 1 个 path，
 *      `d` 只含 SVG path 语法字符；
 *   2. 组件不得再**新建**第二套图标尺寸档：`<svg>` 显式 `width`/`height`
 *      属性须 ∈ {12,14,16,18,20,24,32}；`stroke-width` ∈ {0.5,1,1.5,2,2.5,3}；
 *   3. 组件模板里不得用 emoji / 符号字符充当图标（内容表达除外）。
 *
 * 豁免：`src/composites/doc/**`（文档树自带一套 16 viewBox 图标，历史遗留，
 * 待迁移到注册表）；`*.test.ts` / `*.stories.ts`。
 *
 * 用法：node scripts/check-icons.mjs   （退出码 1 = 有违例）
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { dirname, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcDir = resolve(root, 'src')

/** §8 图标尺寸枚举档（--nm-icon-size-* 值域）。 */
const ICON_SIZE_ALLOWED = new Set([12, 14, 16, 18, 20, 24, 32])
/** §8 描边线宽六档。 */
const STROKE_ALLOWED = new Set([0.5, 1, 1.5, 2, 2.5, 3])
/** 豁免目录：locales（语言包文案，非图标）。 */
const SKIP_DIRS = [join('src', 'locales')]
/** emoji / 图形符号（不含箭头→↔等排版符号，它们在文案里合法）。 */
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u

const findings = []

/** 当前行是否处在「图标类」样式块内（向上找最近的 `{` 所在选择器）。 */
function isInIconBlock(lines, index) {
  for (let k = index; k >= Math.max(0, index - 8); k--) {
    const line = lines[k]
    if (/\}\s*$/.test(line) && k !== index) break
    if (/^\s*[.&][\w-]*(icon|ico)[\w-]*[^{]*\{/.test(line) || /\bicon\b/.test(line) && /\{/.test(line)) {
      return true
    }
  }
  return false
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (/\.(vue|ts)$/.test(name)) out.push(full)
  }
  return out
}

const rel = file => relative(root, file)

// ── 规则 1：注册表自身 ─────────────────────────────────────────────
const registryPath = resolve(srcDir, 'icons/registry.ts')
const registry = readFileSync(registryPath, 'utf-8')
const pathLiterals = [...registry.matchAll(/'(M[^']{5,})'/g)].map(m => m[1])
if (pathLiterals.length === 0) {
  findings.push(`${rel(registryPath)}  注册表未解析到任何 path（格式变了？同步更新本脚本）`)
}
for (const d of pathLiterals) {
  if (!/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\-\s]+$/.test(d)) {
    findings.push(`${rel(registryPath)}  path 含非 SVG 语法字符：${d.slice(0, 40)}`)
  }
}

// ── 规则 2/3：组件模板 ────────────────────────────────────────────
for (const file of walk(srcDir)) {
  const r = rel(file)
  if (SKIP_DIRS.some(skip => r.startsWith(skip))) continue
  if (/\.(test|stories)\.ts$/.test(r)) continue
  if (!file.endsWith('.vue')) continue

  const lines = readFileSync(file, 'utf-8').split('\n')
  let inTemplate = false
  let svgOpen = false

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const where = `${r}:${i + 1}`
    if (/<template[^>]*>/.test(raw)) inTemplate = true
    if (/<\/template>/.test(raw)) inTemplate = false

    // stroke-width：
    //  • 模板区——SVG 属性，必须是图标档位；
    //  • 样式区——只对**图标类**（类名含 icon）校验；图表连线 / 坐标轴 /
    //    流程图边等数据可视化线条属 §8 豁免，允许任意细线（如 1.6）。
    const sw = raw.match(/stroke-width\s*[:=]\s*["']?([\d.]+)/)
    if (sw && !STROKE_ALLOWED.has(Number(sw[1]))) {
      const inTemplateAttr = inTemplate && /stroke-width\s*=/.test(raw)
      const inIconBlock = /stroke-width\s*:/.test(raw) && isInIconBlock(lines, i)
      if (inTemplateAttr || inIconBlock) {
        findings.push(`${where}  图标线宽 ${sw[1]} 不在档位 {0.5,1,1.5,2,2.5,3}`)
      }
    }
    // 百分比尺寸（会随容器缩放 → 落不到枚举档）。
    // 只针对 **SVG 图标容器**（类名含 `__icon`）：装饰性 CSS 圆点
    // （如 Switch 的 thumb-dot）本就应随容器等比，不属此规则。
    for (let k = i; k >= Math.max(0, i - 4); k--) {
      if (/^\s*\.nm-[\w-]*__icon[\w-]*\s*\{/.test(lines[k])) {
        const m = raw.match(/width:\s*([\d.]+)%/)
        if (m) {
          findings.push(`${where}  图标尺寸用百分比 ${m[1]}%（应改 --nm-icon-size-* 枚举档）`)
        }
        break
      }
      if (/\}/.test(lines[k])) break
    }

    if (!inTemplate) continue
    const stripped = raw.trim()

    // <svg> 显式 width/height（多行开标签状态机；排除 stroke-width 的 width）
    if (/^<svg(\s|>|$)/.test(stripped)) {
      svgOpen = !stripped.endsWith('>')
      for (const m of stripped.matchAll(/(?<![-\w])(width|height)="(\d+)"/g)) {
        if (!ICON_SIZE_ALLOWED.has(Number(m[2]))) {
          findings.push(`${where}  图标尺寸 ${m[2]}px 不在档位 {12,14,16,18,20,24,32}`)
        }
      }
    } else if (svgOpen && /^(>|\/>)$/.test(stripped)) {
      svgOpen = false
    } else if (svgOpen) {
      const m = stripped.match(/^(width|height)="(\d+)"/)
      if (m && !ICON_SIZE_ALLOWED.has(Number(m[2]))) {
        findings.push(`${where}  图标尺寸 ${m[2]}px 不在档位 {12,14,16,18,20,24,32}`)
      }
    }

    // emoji 当图标（跳过注释行；只在"类名像图标"的元素上判，避免误伤正文）
    if (/^\/\/|^\*|^<!--|^\/\*/.test(stripped)) continue
    if (
      /class="[^"]*(icon|ico|mark|caret|grip|badge|dot)[^"]*"[^>]*>\s*[^<\s]{1,3}\s*</.test(raw)
    ) {
      const inner = raw.replace(/<[^>]+>/g, '')
      if (EMOJI_RE.test(inner)) {
        findings.push(`${where}  emoji/符号充当控件图标（改用 NeumorphismIcon）：${inner.trim()}`)
      }
    }
  }
}

if (findings.length > 0) {
  console.error(`\n发现 ${findings.length} 处图标规范违例：`)
  for (const f of findings) console.error(`  ✗ ${f}`)
  process.exit(1)
}

console.log(
  `✓ check:icons — 注册表 ${pathLiterals.length} 条 path 合法；组件图标尺寸/线宽/emoji 检查通过`
)
