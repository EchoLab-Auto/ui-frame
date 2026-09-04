/**
 * ProDoc 画布视图的数据源：文档节点 → 流程图
 *
 * 解析策略（与"从抽象到具体"的层次组织对应）：
 * 1. 正文第一个有效 prodoc-flow 块 —— 作者显式定义的流程（优先）
 * 2. 节点有子文档 —— 自动合成层级地图（子文档卡片，点击钻取下一层）
 * 3. 叶子且无流程 —— null（回退文档视图）
 */

import { parseProDocFlow, extractFlowBlocks } from './flow-parser'
import type { ProDocFlowGraph, ProDocNode } from './types.js'

/** 层级地图根卡片 id（不可能与 flow 语法的裸标识符冲突） */
const HIERARCHY_ROOT_ID = '__hier_root'

/** 当前节点 + 子文档卡片的空间布局图 */
export function buildHierarchyGraph(node: ProDocNode): ProDocFlowGraph {
  const nodes: ProDocFlowGraph['nodes'] = [
    {
      id: HIERARCHY_ROOT_ID,
      label: node.title,
      shape: 'stadium',
      docPath: node.path || undefined,
    },
  ]
  const edges: ProDocFlowGraph['edges'] = []

  for (const child of node.children) {
    nodes.push({
      id: child.id,
      label: child.title,
      // 有子级 = 可继续钻取（圆角），叶子 = 矩形
      shape: child.children.length > 0 ? 'rounded' : 'rect',
      docPath: child.path,
    })
    edges.push({ from: HIERARCHY_ROOT_ID, to: child.id })
  }

  return {
    // 子项较多时纵向排布更可读
    direction: node.children.length <= 5 ? 'LR' : 'TB',
    nodes,
    edges,
    errors: [],
  }
}

/**
 * 解析节点的画布图：显式流程优先，子文档层级地图回退，叶子返回 null。
 */
export function resolveCanvasGraph(node: ProDocNode): ProDocFlowGraph | null {
  for (const source of extractFlowBlocks(node.body)) {
    const graph = parseProDocFlow(source)
    if (graph.nodes.length > 0) return graph
  }
  if (node.children.length > 0) return buildHierarchyGraph(node)
  return null
}
