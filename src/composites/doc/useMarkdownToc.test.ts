import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useMarkdownToc } from './useMarkdownToc'

describe('useMarkdownToc', () => {
  it('提取 heading 为扁平列表并构建层级树', () => {
    const content = ref('# 一\n\n## 一.一\n\n### 一.一.一\n\n## 一.二\n\n# 二')
    const { toc, tocTree } = useMarkdownToc(content)

    expect(toc.value).toHaveLength(5)
    expect(tocTree.value).toHaveLength(2)
    expect(tocTree.value[0].text).toBe('一')
    expect(tocTree.value[0].children.map(c => c.text)).toEqual(['一.一', '一.二'])
    expect(tocTree.value[0].children[0].children[0].text).toBe('一.一.一')
    expect(tocTree.value[1].text).toBe('二')
  })

  it('heading id 带实例前缀且同名去重加后缀', () => {
    const { toc } = useMarkdownToc(ref('# Same\n\n# Same'))
    expect(toc.value[0].id).toMatch(/^toc-.+-same$/)
    expect(toc.value[1].id).toMatch(/-same-1$/)
    expect(toc.value[0].id).not.toBe(toc.value[1].id)
  })

  it('纯标点标题回退为 heading slug', () => {
    const { toc } = useMarkdownToc(ref('# !!!'))
    expect(toc.value[0].id).toContain('heading')
  })

  it('内容变化时目录响应式更新', async () => {
    const content = ref('# A')
    const { toc, tocTree } = useMarkdownToc(content)
    expect(toc.value).toHaveLength(1)

    content.value = '# A\n\n# B\n\n## B.1'
    expect(toc.value).toHaveLength(3)
    expect(tocTree.value[1].children[0].text).toBe('B.1')
  })

  it('多实例 id 互不冲突', () => {
    const a = useMarkdownToc(ref('# 标题'))
    const b = useMarkdownToc(ref('# 标题'))
    expect(a.toc.value[0].id).not.toBe(b.toc.value[0].id)
  })

  it('makeUniqueId 生成带实例前缀的 id', () => {
    const { makeUniqueId, toc } = useMarkdownToc(ref('# 你好'))
    expect(makeUniqueId('你好')).toBe(toc.value[0].id)
  })
})
