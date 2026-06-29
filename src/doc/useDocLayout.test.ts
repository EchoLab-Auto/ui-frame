import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDocLayout } from './useDocLayout'
import { buildDocTree } from './parser'
import type { ProDocNode } from './types'
import { createLocalStorageMock, createMatchMediaMock } from '@/__test-utils__/test-helpers'

function createRoot(): ProDocNode {
  return buildDocTree({
    'index.md': '---\ntitle: Home\norder: 0\n---\n# Home',
    'guide/start.md': '---\ntitle: Start\norder: 1\n---\n# Start',
    'guide/advanced.md': '---\ntitle: Advanced\norder: 2\n---\n# Advanced',
  })
}

describe('useDocLayout', () => {
  const originalLocalStorage = globalThis.localStorage
  const originalMatchMedia = globalThis.matchMedia
  const originalHistory = globalThis.history

  beforeEach(() => {
    globalThis.localStorage = createLocalStorageMock() as unknown as Storage
    globalThis.matchMedia = createMatchMediaMock(false)
  })

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage
    globalThis.matchMedia = originalMatchMedia
    globalThis.history = originalHistory
  })

  it('initializes from initialPath prop', () => {
    const root = createRoot()
    const { selectedPath, displayNode } = useDocLayout({ root, initialPath: 'guide/start.md' })
    expect(selectedPath.value).toBe('guide/start.md')
    expect(displayNode.value?.title).toBe('Start')
  })

  it('falls back to first child when initialPath is empty', () => {
    const root = createRoot()
    const { selectedPath, displayNode } = useDocLayout({ root })
    expect(displayNode.value?.title).toBe('Home')
    expect(selectedPath.value).toBe('index.md')
  })

  it('updates selectedPath on handleTreeSelect', () => {
    const root = createRoot()
    const { selectedPath, handleTreeSelect } = useDocLayout({ root })
    handleTreeSelect('guide/advanced.md')
    expect(selectedPath.value).toBe('guide/advanced.md')
  })

  it('emits docLink and updates path', () => {
    const root = createRoot()
    const emit = vi.fn()
    const { handleDocLink } = useDocLayout({ root })
    handleDocLink(emit, 'guide/start.md')
    expect(emit).toHaveBeenCalledWith('docLink', 'guide/start.md')
  })

  it('filters search results', () => {
    const root = createRoot()
    const { searchQuery, searchResults } = useDocLayout({ root })
    searchQuery.value = 'Start'
    expect(searchResults.value.length).toBeGreaterThan(0)
    expect(searchResults.value.some(n => n.title === 'Start')).toBe(true)
  })

  it('selects node on handleSearchSelect and clears query', () => {
    const root = createRoot()
    const { selectedPath, searchQuery, searchResults, handleSearchSelect } = useDocLayout({ root })
    searchQuery.value = 'Advanced'
    const target = searchResults.value.find(n => n.title === 'Advanced')!
    handleSearchSelect(target)
    expect(selectedPath.value).toBe('guide/advanced.md')
    expect(searchQuery.value).toBe('')
  })

  it('syncs URL hash when syncUrlHash is true', async () => {
    const root = createRoot()
    const replaceState = vi.fn()
    Object.defineProperty(globalThis, 'history', {
      value: { replaceState },
      writable: true,
    })

    const { selectedPath } = useDocLayout({ root, syncUrlHash: true })
    selectedPath.value = 'guide/start.md'
    await nextTick()
    expect(replaceState).toHaveBeenCalledWith(null, '', '#guide/start.md')
  })

  it('does not sync URL hash when syncUrlHash is false', async () => {
    const root = createRoot()
    const replaceState = vi.fn()
    Object.defineProperty(globalThis, 'history', {
      value: { replaceState },
      writable: true,
    })

    const { selectedPath } = useDocLayout({ root, syncUrlHash: false })
    selectedPath.value = 'guide/start.md'
    await nextTick()
    expect(replaceState).not.toHaveBeenCalled()
  })
})
