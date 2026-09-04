import { describe, it, expect } from 'vitest'
import { parseFrontmatter, extractTitle, createNode, buildDocTree } from './parser'

describe('parser', () => {
  describe('parseFrontmatter', () => {
    it('parses YAML frontmatter', () => {
      const content = '---\ntitle: Hello\norder: 1\n---\n# Body'
      const { meta, body } = parseFrontmatter(content)
      expect(meta.title).toBe('Hello')
      expect(meta.order).toBe(1)
      expect(body).toBe('# Body')
    })

    it('returns empty meta when no frontmatter', () => {
      const content = '# Body'
      const { meta, body } = parseFrontmatter(content)
      expect(meta).toEqual({})
      expect(body).toBe('# Body')
    })

    it('parses boolean and float values', () => {
      const content = '---\npublished: true\nrate: 3.14\n---\n'
      const { meta } = parseFrontmatter(content)
      expect(meta.published).toBe(true)
      expect(meta.rate).toBe(3.14)
    })

    it('strips quoted string wrappers', () => {
      const content = '---\ntitle: "Quoted"\n---\n'
      const { meta } = parseFrontmatter(content)
      expect(meta.title).toBe('Quoted')
    })
  })

  describe('extractTitle', () => {
    it('uses frontmatter title over H1', () => {
      expect(extractTitle('# Hello', { title: 'Frontmatter' })).toBe('Frontmatter')
    })

    it('extracts title from H1', () => {
      expect(extractTitle('# Hello World\n\nBody', {})).toBe('Hello World')
    })

    it('falls back to Untitled', () => {
      expect(extractTitle('No heading here', {})).toBe('Untitled')
    })
  })

  describe('createNode', () => {
    it('creates a node from file path and content', () => {
      const node = createNode('guide/start.md', '# Start\n\nBody')
      expect(node.path).toBe('guide/start.md')
      expect(node.title).toBe('Start')
      expect(node.id).toBe('guide-start')
      expect(node.order).toBe(9999)
    })

    it('uses frontmatter order', () => {
      const node = createNode('guide/start.md', '---\norder: 5\n---\n# Start')
      expect(node.order).toBe(5)
    })
  })

  describe('buildDocTree', () => {
    it('builds a tree from flat file map', () => {
      const files: Record<string, string> = {
        'index.md': '---\norder: 0\n---\n# Home',
        'guide.md': '# Guide',
        'guide/start.md': '# Start',
        'guide/advanced.md': '# Advanced',
      }
      const root = buildDocTree(files)
      expect(root.children.length).toBe(2)
      expect(root.children[0].title).toBe('Home')
      expect(root.children[1].title).toBe('Guide')
      expect(root.children[1].children.length).toBe(2)
    })

    it('sorts children by order then title', () => {
      const files: Record<string, string> = {
        'b.md': '---\norder: 2\n---\n# B',
        'a.md': '---\norder: 1\n---\n# A',
      }
      const root = buildDocTree(files)
      expect(root.children.map(n => n.title)).toEqual(['A', 'B'])
    })
  })
})
