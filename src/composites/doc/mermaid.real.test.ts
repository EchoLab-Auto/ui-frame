import { describe, it } from 'vitest'
import mermaid from '../../../node_modules/mermaid/dist/mermaid.core.mjs'

describe('Mermaid 真实解析器', () => {
  it('接受带中文标签的插件依赖图语法', async () => {
    await mermaid.parse(
      'flowchart BT\n  LLM["llm 服务"] --> Loop["loop 插件"]\n  Host["宿主"] --> Tools["tools.builtin"]'
    )
  }, 15000)
})
