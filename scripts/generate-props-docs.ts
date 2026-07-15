/**
 * Parse Vue SFC components and generate API documentation from
 * defineProps type interfaces and JSDoc comments.
 *
 * Usage: npx tsx scripts/generate-props-docs.ts
 *
 * Output: docs/api-props.md — auto-generated props reference
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { resolve, basename, dirname } from 'path'

const SRC = resolve(__dirname, '../src/components')
const DOCS = resolve(__dirname, '../docs')
const OUT = resolve(DOCS, 'api-props.md')

interface PropDoc {
  name: string
  type: string
  required: boolean
  default: string
  description: string
}

interface ComponentDoc {
  name: string
  props: PropDoc[]
  events: string[]
  slots: string[]
}

function parseType(typeStr: string): string {
  return typeStr
    .replace(/\|/g, ' \\| ')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\n/g, ' ')
    .trim()
}

function parseProps(source: string): PropDoc[] {
  const props: PropDoc[] = []

  // Match `export interface XxxProps { ... }` blocks
  const interfaceMatch = source.match(
    /export\s+interface\s+\w+Props\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s
  )
  if (!interfaceMatch) return props

  // Match each property with optional JSDoc comment
  const propRegex =
    /\/\*\*\s*\n\s*\*\s*(.+?)\s*\n(?:\s*\*[^\n]*\n)*\s*\*\/\s*\n\s*(\w+)(\?)?:\s*(.+?);/g

  let match
  while ((match = propRegex.exec(source)) !== null) {
    const description = match[1].trim()
    const name = match[2]
    const optional = !!match[3]
    const typeStr = parseType(match[4])

    props.push({
      name,
      type: typeStr,
      required: !optional,
      default: '',
      description,
    })
  }

  // Fallback: simpler pattern without JSDoc
  if (props.length === 0) {
    const simpleRegex = /(\w+)(\?)?:\s*(.+?);/g
    const blockStart = source.indexOf(interfaceMatch[0])
    const blockEnd = blockStart + interfaceMatch[0].length
    const block = source.slice(blockStart, blockEnd)

    let sm
    while ((sm = simpleRegex.exec(block)) !== null) {
      const name = sm[1]
      if (name.startsWith('_') || name === 'prefix') continue
      props.push({
        name,
        type: parseType(sm[3]),
        required: !sm[2],
        default: '',
        description: '',
      })
    }
  }

  // Parse withDefaults for default values
  const defaultsMatch = source.match(/withDefaults\(defineProps<\w+Props>\(\),\s*\{([^}]+)\}/s)
  if (defaultsMatch) {
    const defBody = defaultsMatch[1]
    const defRegex = /(\w+):\s*(.+?)(?:,|\n|$)/g
    let dm
    while ((dm = defRegex.exec(defBody)) !== null) {
      const prop = props.find(p => p.name === dm[1])
      if (prop) prop.default = dm[2].trim().replace(/,$/, '')
    }
  }

  return props
}

function parseEvents(source: string): string[] {
  const events: string[] = []
  const emitRegex = /(?:emit|defineEmits)<\{[^}]*\}>/g
  const match = source.match(emitRegex)
  if (match) {
    const eventDefs = match[0].match(/\(e:\s*'([^']+)'/g)
    if (eventDefs) {
      for (const e of eventDefs) {
        const name = e.match(/'([^']+)'/)?.[1]
        if (name) events.push(name)
      }
    }
  }
  return events
}

function parseComponent(filePath: string): ComponentDoc | null {
  const source = readFileSync(filePath, 'utf-8')
  const name = basename(dirname(filePath))

  const props = parseProps(source)
  const events = parseEvents(source)
  const slots: string[] = []
  const slotRegex = /<!--\s*@slot\s+(.+?)\s*-->/g
  let sm
  while ((sm = slotRegex.exec(source)) !== null) {
    slots.push(sm[1].trim())
  }

  if (props.length === 0 && events.length === 0 && slots.length === 0) return null

  return { name, props, events, slots }
}

// ---- Main ----
const componentDirs = readdirSync(SRC, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

const docs: ComponentDoc[] = []

for (const dir of componentDirs) {
  const vueFile = resolve(SRC, dir, `${dir}.vue`)
  if (!existsSync(vueFile)) {
    // Check for multi-component directories
    const files = readdirSync(resolve(SRC, dir)).filter(f => f.endsWith('.vue'))
    for (const f of files) {
      const doc = parseComponent(resolve(SRC, dir, f))
      if (doc) docs.push(doc)
    }
    continue
  }

  const doc = parseComponent(vueFile)
  if (doc) docs.push(doc)
}

// Generate markdown
let md = '# Component API Reference (Auto-Generated)\n\n'
md += '> Generated from component source files. Do not edit manually.\n\n'
md += `**Total components documented:** ${docs.length}\n\n`

for (const doc of docs.sort((a, b) => a.name.localeCompare(b.name))) {
  md += `## ${doc.name}\n\n`

  if (doc.props.length > 0) {
    md += '### Props\n\n'
    md += '| Name | Type | Required | Default | Description |\n'
    md += '|------|------|----------|---------|-------------|\n'
    for (const p of doc.props) {
      md += `| \`${p.name}\` | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | \`${p.default || '-'}\` | ${p.description || '-'} |\n`
    }
    md += '\n'
  }

  if (doc.events.length > 0) {
    md += '### Events\n\n'
    md += '| Event |\n'
    md += '|-------|\n'
    for (const e of doc.events) {
      md += `| \`${e}\` |\n`
    }
    md += '\n'
  }

  if (doc.slots.length > 0) {
    md += '### Slots\n\n'
    for (const s of doc.slots) {
      md += `- ${s}\n`
    }
    md += '\n'
  }
}

mkdirSync(DOCS, { recursive: true })
writeFileSync(OUT, md)
console.log(`✅ Generated ${OUT} (${docs.length} components)`)
