/**
 * Parse tokens.scss and generate:
 *   - docs/tokens.md  — human-readable token reference table
 *   - docs/tokens.json — machine-readable token data
 *
 * Usage: npx tsx scripts/generate-token-docs.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const TOKENS_FILE = resolve(__dirname, '../src/styles/tokens.scss')
const DOCS_DIR = resolve(__dirname, '../docs')

interface TokenEntry {
  name: string
  value: string
  category: string
  description: string
}

function parseTokens(scss: string): TokenEntry[] {
  const tokens: TokenEntry[] = []
  const lines = scss.split('\n')
  let currentCategory = 'General'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track category comments
    const catMatch = line.match(/^\s*\/\/\s*-+\s*(.+?)\s*-+$/)
    if (catMatch) {
      currentCategory = catMatch[1].trim()
      continue
    }
    const sectionMatch = line.match(/^\s*\/\/\s*(.+)$/)
    if (sectionMatch && !sectionMatch[1].startsWith('=') && !line.includes('---')) {
      const potentialCat = sectionMatch[1].trim()
      if (!potentialCat.includes(':')) {
        currentCategory = potentialCat
        continue
      }
    }

    // Match CSS custom property declarations
    const tokenMatch = line.match(/^\s*(--[\w-]+):\s*(.+?);/)
    if (!tokenMatch) continue

    const name = tokenMatch[1]
    const value = tokenMatch[2].trim()

    // Check preceding lines for a description comment
    let description = ''
    for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
      const prevLine = lines[j]
      const commentMatch = prevLine.match(/^\s*\/\/\s*(.+)/)
      if (commentMatch) {
        const comment = commentMatch[1].trim()
        // Skip section headers and divider lines
        if (!comment.startsWith('=') && !comment.startsWith('---') && !comment.match(/^-+$/)) {
          description = comment
          break
        }
      }
    }

    tokens.push({ name, value, category: currentCategory, description })
  }

  return tokens
}

function generateMarkdown(tokens: TokenEntry[]): string {
  const categories = [...new Set(tokens.map(t => t.category))]

  let md = '# CSS Custom Properties (Design Tokens)\n\n'
  md += '> Auto-generated from `src/styles/tokens.scss`. Do not edit manually.\n\n'

  md += `**Total tokens:** ${tokens.length}\n\n`

  for (const cat of categories) {
    const catTokens = tokens.filter(t => t.category === cat)
    if (catTokens.length === 0) continue

    md += `## ${cat}\n\n`
    md += '| Name | Value | Description |\n'
    md += '|------|-------|-------------|\n'

    for (const t of catTokens) {
      const escapedValue = t.value.replace(/\|/g, '\\|')
      md += `| \`${t.name}\` | \`${escapedValue}\` | ${t.description} |\n`
    }
    md += '\n'
  }

  return md
}

// ---- Main ----
const scss = readFileSync(TOKENS_FILE, 'utf-8')
const tokens = parseTokens(scss)

mkdirSync(DOCS_DIR, { recursive: true })

// Write markdown
const mdPath = resolve(DOCS_DIR, 'tokens.md')
writeFileSync(mdPath, generateMarkdown(tokens))
console.log(`✅ Generated ${mdPath} (${tokens.length} tokens)`)

// Write JSON
const jsonPath = resolve(DOCS_DIR, 'tokens.json')
writeFileSync(jsonPath, JSON.stringify(tokens, null, 2))
console.log(`✅ Generated ${jsonPath} (${tokens.length} tokens)`)
