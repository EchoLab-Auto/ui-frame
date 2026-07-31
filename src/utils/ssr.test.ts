import { describe, it, expect } from 'vitest'
import { safeMatchMedia, isBrowser } from './ssr'
import { getNodeIcon, nodeToTreeData } from '@/doc/tree-utils'
import type { ProDocNode } from '@/doc/types'

describe('ssr utils', () => {
  it('isBrowser 在测试环境为 true', () => {
    expect(isBrowser).toBe(true)
  })

  it('safeMatchMedia 在浏览器环境返回真实 query list', () => {
    const mql = safeMatchMedia('(min-width: 1024px)')
    expect(typeof mql.matches).toBe('boolean')
    expect(mql.media).toBe('(min-width: 1024px)')
  })
})

describe('doc/tree-utils', () => {
  it('getNodeIcon 按路径特征返回图标', () => {
    expect(getNodeIcon({ path: 'api/select' } as ProDocNode)).toBe('🔌')
    expect(getNodeIcon({ path: 'guide/start' } as ProDocNode)).toBe('📖')
    expect(getNodeIcon({ path: 'config/theme' } as ProDocNode)).toBe('⚙️')
    expect(getNodeIcon({ path: 'changelog/v1' } as ProDocNode)).toBe('📝')
    expect(getNodeIcon({ path: 'other/page' } as ProDocNode)).toBe('📄')
  })

  it('nodeToTreeData 递归转换并继承图标', () => {
    const node = {
      id: 'root',
      title: 'Root',
      path: 'api',
      content: '',
      body: '',
      meta: {},
      order: 0,
      children: [
        {
          id: 'child',
          title: 'Child',
          path: 'api/select',
          content: '',
          body: '',
          meta: {},
          order: 1,
          children: [],
        },
      ],
    } as unknown as ProDocNode
    const tree = nodeToTreeData(node)
    expect(tree.label).toBe('Root')
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].icon).toBe('🔌')
    expect(tree.children[0].label).toBe('Child')
  })
})
