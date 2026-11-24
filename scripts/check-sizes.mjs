#!/usr/bin/env node
/**
 * 尺寸写法守卫（2026-11）：`size` 只收 px 数字，字符串档位已从库里移除。
 *
 * 规则来源：`document/develop/design-philosophy.md` §7「尺寸：px 数字是唯一写法」。
 * `size="small"` 让读者必须去翻锚点表才知道是 32px，且无法表达「在这个基础上加 8」。
 * 数字写法的语义就是各组件的主几何量，`:size="32"` 把数值摆在调用处。
 *
 * 校验项：
 *   1. 模板开标签上的 `size="small|medium|large"`
 *   2. 对象字面量 / props 里的 `size: 'small' | 'medium' | 'large'`
 *   3. 类型里残留的 `Size = 'small' | 'medium' | 'large'` 别名
 *   4. 注释里「与 size="medium" 逐像素相同」这类**已失效**的说法
 *      （档位不存在了，等价性只能靠锚点表说明）
 *
 * 豁免：
 *   - `*.test.ts`：单测要验证「非数字输入按容错回落到默认」，那是行为契约
 *   - 图标尺寸（`xs|sm|md|lg|xl|2xl|3xl`）：属 §8 图标体系的七档枚举，与
 *     `small|medium|large` 是两套东西，本脚本不匹配它们
 *   - `AsciiArt` 的 `radius`（`none|small|medium|large|xl`）：圆角半径的枚举，
 *     不是 `size` prop
 *
 * 用法：node scripts/check-sizes.mjs   （退出码 1 = 有违例）
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-example', 'coverage', '.git'])
/** `radius` 是另一套枚举，按文件豁免（不是 size prop）。 */
const SKIP_SIZE_FILES = new Set(['src/components/NeumorphismAsciiArt/NeumorphismAsciiArt.vue'])

const CHECKS = [
  { re: /\ssize="(?:small|medium|large)"/, what: '模板属性 size="档位"' },
  { re: /\bsize:\s*'(?:small|medium|large)'/, what: "对象字面量 size: '档位'" },
  {
    re: /\bSize = 'small' \| 'medium' \| 'large'/,
    what: "类型别名 Size = 'small' | 'medium' | 'large'",
  },
  { re: /与 `size="(?:small|medium|large)"`/, what: '注释里引用已移除的档位写法' },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(vue|ts|md)$/.test(name)) out.push(full)
  }
  return out
}

const findings = []
for (const scope of ['src', 'examples', 'document']) {
  for (const file of walk(resolve(root, scope))) {
    const rel = relative(root, file)
    if (rel.endsWith('.test.ts') || rel.endsWith('.spec.ts')) continue
    if (SKIP_SIZE_FILES.has(rel)) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      for (const { re, what } of CHECKS) {
        if (re.test(line)) {
          findings.push(`${rel}:${i + 1}  [${what}]  ${line.trim().slice(0, 100)}`)
          break
        }
      }
    })
  }
}

if (findings.length) {
  console.error('✗ 发现字符串尺寸档位（size 只收 px 数字）：\n')
  for (const f of findings) console.error(`  ${f}`)
  console.error(
    `\n共 ${findings.length} 处。锚点表见 src/utils/controlScales.ts；` +
      '主几何量语义见 document/develop/design-philosophy.md §7。'
  )
  process.exit(1)
}

console.log('✓ check:sizes — size 只收 px 数字（无字符串档位残留）')
