#!/usr/bin/env node

/**
 * Verify that every component exported from `src/components/index.ts` (the barrel)
 * is also:
 *   1. Imported from './components' in `src/index.ts`
 *   2. Listed in the `NAME_TO_COMPONENT` map so `app.use()` registers it
 *
 * Exit code 0 = consistent, 1 = gap found.
 *
 * Usage: node scripts/check-component-registry.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const barrelPath = resolve(root, 'src/components/index.ts')
const entryPath = resolve(root, 'src/index.ts')

const barrel = readFileSync(barrelPath, 'utf-8')
const entryLines = readFileSync(entryPath, 'utf-8').split('\n')

// ---- helpers ----

/** Return the semantic component name from a barrel export line. */
function barrelName(line) {
  // export { default as NeumorphismButton } from …
  let m = line.match(/export\s*\{\s*default\s+as\s+(\w+)\s*\}/)
  if (m) return m[1]
  // export { default } …  -> skip (re-export, name is in the import)
  if (/export\s*\{\s*default\s*\}/.test(line)) return null
  // export type { … } -> skip
  if (/export\s+type/.test(line)) return null
  // export { NeumorphismRow, NeumorphismCol } from …
  // Capture each comma-separated word *before* the closing brace
  m = line.match(/export\s*\{([^}]+)\}\s*from/)
  if (m) {
    return m[1]
      .split(',')
      .map(w => w.trim().split(/\s+/)[0])
      .filter(w => /^\w+$/.test(w) && !['type'].includes(w))
  }
  return null
}

/** Extract line-level identifiers between `const NAME_TO_COMPONENT = {` and `} as const`. */
function extractBlock(lines, startMarker, endMarker) {
  const names = []
  let recording = false
  for (const line of lines) {
    if (recording && line.includes(endMarker)) break
    if (recording) {
      const t = line.trim()
      if (t && !t.startsWith('//')) {
        const word = t.endsWith(',') ? t.slice(0, -1) : t
        if (/^\w+$/.test(word)) names.push(word)
      }
    }
    if (line.includes(startMarker)) recording = true
  }
  return names
}

// ---- 1. Barrel exports ----
const barrelNames = new Set()
for (const line of barrel.split('\n')) {
  const names = barrelName(line)
  if (!names) continue
  for (const n of Array.isArray(names) ? names : [names]) {
    barrelNames.add(n)
  }
}

// ---- 2. Import block (the one from './components') ----
// Find the line that ends the block: `} from './components'`
const importEndIdx = entryLines.findIndex(l => l.includes('} from') && l.includes('./components'))
// Scan backwards for the matching `import {` line
let importStartIdx = importEndIdx
while (importStartIdx > 0 && !entryLines[importStartIdx].includes('import {')) {
  importStartIdx--
}

const importedNames = new Set()
for (let i = importStartIdx + 1; i < importEndIdx; i++) {
  const t = entryLines[i].trim()
  if (t && !t.startsWith('//')) {
    const word = t.endsWith(',') ? t.slice(0, -1) : t
    if (/^\w+$/.test(word)) importedNames.add(word)
  }
}

// ---- 3. NAME_TO_COMPONENT ----
const ntcNames = new Set(extractBlock(entryLines, 'const NAME_TO_COMPONENT', '} as const'))

// ---- 4. Diff ----
let errors = 0

for (const name of barrelNames) {
  if (!importedNames.has(name)) {
    console.error(`MISSING import: "${name}" not found in src/index.ts import block`)
    errors++
  }
  if (!ntcNames.has(name)) {
    console.error(`MISSING registration: "${name}" not found in NAME_TO_COMPONENT`)
    errors++
  }
}

// Reverse check — stale entries in NAME_TO_COMPONENT
for (const name of ntcNames) {
  if (!barrelNames.has(name)) {
    console.warn(`STALE: "${name}" in NAME_TO_COMPONENT but not in components/index.ts barrel`)
  }
}

if (errors === 0) {
  console.log(
    `OK — ${barrelNames.size} components: barrel / import / NAME_TO_COMPONENT are consistent`
  )
}

process.exit(errors > 0 ? 1 : 0)
