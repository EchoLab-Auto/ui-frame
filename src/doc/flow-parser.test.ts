import { describe, it, expect } from 'vitest'
import { parseProDocFlow, extractFlowBlocks, writeFlowNodePosition } from './flow-parser'

describe('parseProDocFlow', () => {
  it('解析方向声明（四种方向）', () => {
    for (const dir of ['LR', 'RL', 'TB', 'BT'] as const) {
      const g = parseProDocFlow(`graph ${dir}\nA --> B`)
      expect(g.direction).toBe(dir)
      expect(g.errors).toHaveLength(0)
    }
  })

  it('缺少方向声明时默认 LR 并记录容错', () => {
    const g = parseProDocFlow('A --> B')
    expect(g.direction).toBe('LR')
    expect(g.errors).toHaveLength(1)
    expect(g.errors[0].line).toBe(1)
    // 该行仍按普通语句解析
    expect(g.nodes).toHaveLength(2)
    expect(g.edges).toHaveLength(1)
  })

  it('解析四种节点形状', () => {
    const g = parseProDocFlow(`graph LR
      A[矩形] --> B[/圆角/]
      B --> C(体育场)
      C --> D{菱形}`)
    const shapes = Object.fromEntries(g.nodes.map(n => [n.id, n.shape]))
    expect(shapes).toEqual({ A: 'rect', B: 'rounded', C: 'stadium', D: 'diamond' })
  })

  it('裸 id 引用自动登记矩形节点（label=id）', () => {
    const g = parseProDocFlow('graph LR\nA --> B')
    const b = g.nodes.find(n => n.id === 'B')
    expect(b).toMatchObject({ label: 'B', shape: 'rect' })
  })

  it('解析边标签', () => {
    const g = parseProDocFlow('graph LR\nA -->|是| B\nA -->|否| C')
    expect(g.edges).toEqual([
      { from: 'A', to: 'B', label: '是' },
      { from: 'A', to: 'C', label: '否' },
    ])
  })

  it('链式边展开为多条边', () => {
    const g = parseProDocFlow('graph LR\nA --> B -->|是| C --> D')
    expect(g.edges).toEqual([
      { from: 'A', to: 'B', label: undefined },
      { from: 'B', to: 'C', label: '是' },
      { from: 'C', to: 'D', label: undefined },
    ])
  })

  it('文档链接拆分（统一无前导斜杠）', () => {
    const g = parseProDocFlow(
      'graph LR\nA[首页|/guide/index.md] --> B[相对|./a.md] --> C[上级|../b.md]'
    )
    const a = g.nodes.find(n => n.id === 'A')
    const b = g.nodes.find(n => n.id === 'B')
    const c = g.nodes.find(n => n.id === 'C')
    expect(a).toMatchObject({ label: '首页', docPath: 'guide/index.md' })
    expect(b).toMatchObject({ label: '相对', docPath: 'a.md' })
    expect(c).toMatchObject({ label: '上级', docPath: 'b.md' })
  })

  it('含竖线但非路径的文本不误判为链接', () => {
    const g = parseProDocFlow('graph LR\nA[选项一|选项二] --> B')
    const a = g.nodes.find(n => n.id === 'A')
    expect(a?.label).toBe('选项一|选项二')
    expect(a?.docPath).toBeUndefined()
  })

  it('%% 注释：整行与行中截断', () => {
    const g = parseProDocFlow(`graph LR
      %% 整行注释
      A --> B %% 行中注释
      C --> D`)
    expect(g.nodes.map(n => n.id)).toEqual(['A', 'B', 'C', 'D'])
    expect(g.errors).toHaveLength(0)
  })

  it('非法行进入 errors，其余行照常解析', () => {
    const g = parseProDocFlow(`graph LR
      A --> B
      这不是合法语句!!
      B --> C`)
    expect(g.errors).toHaveLength(1)
    expect(g.errors[0].line).toBe(3)
    expect(g.edges).toHaveLength(2)
  })

  it('后出现的完整声明合并升级裸引用', () => {
    const g = parseProDocFlow(`graph LR
      A --> B
      B{升级菱形|/b.md}`)
    const b = g.nodes.find(n => n.id === 'B')
    expect(b).toMatchObject({ label: '升级菱形', shape: 'diamond', docPath: 'b.md' })
  })

  it('重复边去重', () => {
    const g = parseProDocFlow('graph LR\nA --> B\nA --> B')
    expect(g.edges).toHaveLength(1)
  })

  it('中文与含空格文本', () => {
    const g = parseProDocFlow('graph LR\nA[开始 流程] --> B{是否 通过?}')
    expect(g.nodes[0].label).toBe('开始 流程')
    expect(g.nodes[1].label).toBe('是否 通过?')
  })

  it('空源码返回空图并记录容错', () => {
    const g = parseProDocFlow('')
    expect(g.nodes).toHaveLength(0)
    expect(g.direction).toBe('LR')
  })

  it('箭头后缺少目标节点进 errors', () => {
    const g = parseProDocFlow('graph LR\nA -->')
    expect(g.errors).toHaveLength(1)
    expect(g.edges).toHaveLength(0)
  })
})

describe('extractFlowBlocks', () => {
  it('提取全部 prodoc-flow 代码块', () => {
    const body = `# 标题

\`\`\`prodoc-flow
graph LR
A --> B
\`\`\`

中间文本

\`\`\`prodoc-flow
graph TB
C --> D
\`\`\`

\`\`\`ts
const x = 1
\`\`\`
`
    const blocks = extractFlowBlocks(body)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toContain('A --> B')
    expect(blocks[1]).toContain('C --> D')
  })

  it('无流程块时返回空数组', () => {
    expect(extractFlowBlocks('# 无流程\n\n```ts\ncode\n```')).toEqual([])
  })
})

describe('手动排版标注（@ x, y）', () => {
  it('声明行尾标注解析为节点坐标', () => {
    const g = parseProDocFlow('graph LR\nA[开始] @ 100, 200\nA --> B')
    expect(g.errors).toEqual([])
    expect(g.nodes.find(n => n.id === 'A')).toMatchObject({ x: 100, y: 200 })
    expect(g.nodes.find(n => n.id === 'B')!.x).toBeUndefined()
  })

  it('裸 id 行与边链行尾标注均可', () => {
    const g = parseProDocFlow('graph LR\nA --> B @ 40, 64\nC @ 8, 8')
    expect(g.nodes.find(n => n.id === 'B')).toMatchObject({ x: 40, y: 64 })
    expect(g.nodes.find(n => n.id === 'C')).toMatchObject({ x: 8, y: 8 })
  })

  it('标注后的普通内容照常解析', () => {
    const g = parseProDocFlow('graph LR\nA @ 1, 2\nA --> B[说明]')
    expect(g.edges).toEqual([{ from: 'A', to: 'B', label: undefined }])
  })
})

describe('writeFlowNodePosition', () => {
  const body = [
    '# 文档',
    '',
    '```prodoc-flow',
    'graph LR',
    '  A[开始] --> B[结束]',
    '```',
    '',
  ].join('\n')

  it('为边链中的节点在块尾追加坐标行', () => {
    const out = writeFlowNodePosition(body, 'graph LR\n  A[开始] --> B[结束]', 'A', 100, 200)
    expect(out).toContain('A @ 100, 200')
    expect(out).toContain('A[开始] --> B[结束]')
    // 写回后解析坐标生效
    const blocks = extractFlowBlocks(out)
    const g = parseProDocFlow(blocks[0])
    expect(g.nodes.find(n => n.id === 'A')).toMatchObject({ x: 100, y: 200 })
  })

  it('独立声明行就地追加，重复写回时替换旧坐标', () => {
    const withDecl = body.replace(
      '  A[开始] --> B[结束]',
      '  A[开始] @ 1, 2\n  A[开始] --> B[结束]'
    )
    const out = writeFlowNodePosition(
      withDecl,
      'graph LR\n  A[开始] @ 1, 2\n  A[开始] --> B[结束]',
      'A',
      300,
      400
    )
    expect(out).toContain('A[开始] @ 300, 400')
    expect(out).not.toContain('@ 1, 2')
  })

  it('找不到匹配块时原样返回', () => {
    expect(writeFlowNodePosition(body, 'graph TB\nX --> Y', 'A', 1, 2)).toBe(body)
  })
})
