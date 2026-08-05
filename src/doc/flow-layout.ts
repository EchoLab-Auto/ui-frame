/**
 * ProDoc Flow —— 轻量分层 DAG 布局引擎（Sugiyama-lite）
 *
 * 零依赖、纯函数、输出确定（同输入必同输出）。
 * 流程：尺寸估算 → 方向归一化（RL→LR、BT→TB，末步镜像）→ Kahn 分层（防环，
 * 回边仍绘制）→ 层内单轮 barycenter 排序 → 坐标分配 → 贝塞尔边路径。
 * 复杂度 O(V+E)，文档级流程图（< 50 节点）瞬时完成。
 */

import type { ProDocFlowGraph, ProDocFlowNode } from './types.js'

export interface FlowLayoutNode {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export interface FlowLayoutEdge {
  from: string
  to: string
  label?: string
  /** SVG path d（三次贝塞尔） */
  path: string
  /** 边标签定位点 */
  labelPos: { x: number; y: number }
  /** 回边（构成环的边）：虚线绕行绘制，不参与分层 */
  isBackEdge: boolean
}

export interface FlowLayoutResult {
  nodes: Map<string, FlowLayoutNode>
  edges: FlowLayoutEdge[]
  width: number
  height: number
}

// ==========================================
// 常量
// ==========================================
const NODE_H = 44
const NODE_MIN_W = 96
const NODE_MAX_W = 280
const PAD_X = 16
const CJK_W = 14
const ASCII_W = 8
const LAYER_GAP = 90
const NODE_GAP = 28
const CANVAS_PAD = 48
/** barycenter 排序轮数（默认 1；复杂图可调大） */
const DEFAULT_PASSES = 1

/** CJK / 全角字符区间 */
const CJK_RE = /[぀-ヿ㐀-鿿豈-﫿￠-￦⺀-�＀-￯]/

/** 文本宽度估算（CJK 感知） */
function estimateTextWidth(label: string): number {
  let w = 0
  for (const ch of label) {
    w += CJK_RE.test(ch) ? CJK_W : ASCII_W
  }
  return w
}

/** 节点尺寸估算 */
function estimateSize(node: ProDocFlowNode): { w: number; h: number } {
  const labelW = estimateTextWidth(node.label) + PAD_X * 2
  if (node.shape === 'diamond') {
    // 菱形内切文本利用率低，放宽
    const w = Math.min(Math.max(labelW * 1.5 + 32, NODE_MIN_W * 1.4), NODE_MAX_W * 1.4)
    return { w, h: Math.max(64, w * 0.55) }
  }
  return { w: Math.min(Math.max(labelW, NODE_MIN_W), NODE_MAX_W), h: NODE_H }
}

interface SizeMap {
  [id: string]: { w: number; h: number }
}

/**
 * 分层 DAG 布局。
 * @param graph 解析后的流程图
 * @param passes 层内 barycenter 排序轮数（默认 1）
 */
export function layoutProDocFlow(
  graph: ProDocFlowGraph,
  passes: number = DEFAULT_PASSES
): FlowLayoutResult {
  const { nodes, edges, direction } = graph
  const result: FlowLayoutResult = { nodes: new Map(), edges: [], width: 0, height: 0 }
  if (nodes.length === 0) return result

  const sizes: SizeMap = {}
  for (const n of nodes) sizes[n.id] = estimateSize(n)

  // ==========================================
  // 分层（Kahn 变体 / longest-path，防环）
  // ==========================================
  const outEdges = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  for (const n of nodes) {
    outEdges.set(n.id, [])
    indegree.set(n.id, 0)
  }
  for (const e of edges) {
    if (!outEdges.has(e.from) || !indegree.has(e.to)) continue
    outEdges.get(e.from)!.push(e.to)
    indegree.set(e.to, indegree.get(e.to)! + 1)
  }

  const layer = new Map<string, number>()
  const backEdgeIdx = new Set<number>()
  // 以声明序为确定性的起点
  const queue: string[] = nodes.filter(n => (indegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const indeg = new Map(indegree)
  while (queue.length > 0) {
    const u = queue.shift()!
    const uLayer = layer.get(u) ?? 0
    layer.set(u, uLayer)
    for (const to of outEdges.get(u) ?? []) {
      layer.set(to, Math.max(layer.get(to) ?? 0, uLayer + 1))
      indeg.set(to, indeg.get(to)! - 1)
      if (indeg.get(to) === 0) queue.push(to)
    }
  }
  // 环上节点：强制落到"已分层邻居最大层 + 1"（按声明序逐个落层，保证终止）
  // 回边不在此标记 —— 落层完成后统一按"目标层 <= 源层"判定，才符合最终几何
  for (const n of nodes) {
    if (layer.has(n.id)) continue
    let maxNeighbor = -1
    for (const e of edges) {
      if (e.to === n.id && layer.has(e.from)) {
        maxNeighbor = Math.max(maxNeighbor, layer.get(e.from)!)
      }
    }
    layer.set(n.id, maxNeighbor + 1)
  }
  // 回边判定：目标层 <= 源层（构成回流的边仍绘制，绕行虚线呈现）
  edges.forEach((e, i) => {
    if ((layer.get(e.to) ?? 0) <= (layer.get(e.from) ?? 0)) backEdgeIdx.add(i)
  })

  // ==========================================
  // 层内排序（单轮 barycenter，初始序 = 声明序）
  // ==========================================
  const maxLayer = Math.max(...layer.values())
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => [])
  const declOrder = new Map(nodes.map((n, i) => [n.id, i]))
  for (const n of nodes) {
    layers[layer.get(n.id)!].push(n.id)
  }
  for (const l of layers) {
    l.sort((a, b) => declOrder.get(a)! - declOrder.get(b)!)
  }

  const orderInLayer = new Map<string, number>()
  function refreshOrder() {
    orderInLayer.clear()
    layers.forEach(l => l.forEach((id, i) => orderInLayer.set(id, i)))
  }
  refreshOrder()

  const inEdges = new Map<string, string[]>()
  for (const e of edges) {
    if (!inEdges.has(e.to)) inEdges.set(e.to, [])
    inEdges.get(e.to)!.push(e.from)
  }

  for (let pass = 0; pass < passes; pass++) {
    for (let li = 1; li < layers.length; li++) {
      const prevLayerIds = new Set(layers[li - 1])
      layers[li].sort((a, b) => {
        const baryA = barycenter(a, prevLayerIds)
        const baryB = barycenter(b, prevLayerIds)
        if (baryA !== baryB) return baryA - baryB
        return orderInLayer.get(a)! - orderInLayer.get(b)! // 稳定
      })
      refreshOrder()
    }
  }

  function barycenter(id: string, prevLayerIds: Set<string>): number {
    const froms = (inEdges.get(id) ?? []).filter(f => prevLayerIds.has(f))
    if (froms.length === 0) return orderInLayer.get(id)!
    const sum = froms.reduce((acc, f) => acc + (orderInLayer.get(f) ?? 0), 0)
    return sum / froms.length
  }

  // ==========================================
  // 坐标分配（LR 为基准方向；层=列，层内=行，层内整体居中）
  // ==========================================
  const isVertical = direction === 'TB' || direction === 'BT'
  const mirror = direction === 'RL' || direction === 'BT'

  // 每层的最大跨轴尺寸（决定层推进：LR 为列宽、TB 为行高）与层内主轴总长
  const layerCross: number[] = layers.map(l =>
    l.reduce((m, id) => Math.max(m, isVertical ? sizes[id].h : sizes[id].w), 0)
  )
  const layerMain: number[] = layers.map(
    l =>
      l.reduce((acc, id) => acc + (isVertical ? sizes[id].w : sizes[id].h), 0) +
      Math.max(l.length - 1, 0) * NODE_GAP
  )
  const maxMain = Math.max(...layerMain)

  const crossOffsets: number[] = []
  {
    let acc = CANVAS_PAD
    for (let li = 0; li < layers.length; li++) {
      crossOffsets.push(acc)
      acc += layerCross[li] + LAYER_GAP
    }
  }

  const placed = new Map<string, FlowLayoutNode>()
  layers.forEach((l, li) => {
    let main = CANVAS_PAD + (maxMain - layerMain[li]) / 2 // 层内居中
    for (const id of l) {
      const w = sizes[id].w
      const h = sizes[id].h
      const nodeCross = isVertical ? h : w // 节点自身跨轴尺寸
      const cross = crossOffsets[li] + (layerCross[li] - nodeCross) / 2
      placed.set(id, {
        id,
        // LR：层推进为 x（列）、层内堆叠为 y；TB：层推进为 y（行）、层内为 x
        x: isVertical ? main : cross,
        y: isVertical ? cross : main,
        w,
        h,
      })
      main += (isVertical ? w : h) + NODE_GAP
    }
  })

  // 画布尺寸（镜像前）
  let width = 0
  let height = 0
  for (const p of placed.values()) {
    width = Math.max(width, p.x + p.w)
    height = Math.max(height, p.y + p.h)
  }
  width += CANVAS_PAD
  height += CANVAS_PAD

  // 镜像（RL: 水平翻转；BT: 垂直翻转）
  if (mirror) {
    for (const p of placed.values()) {
      if (direction === 'RL') p.x = width - p.x - p.w
      else p.y = height - p.y - p.h
    }
  }

  // ==========================================
  // 边路径（三次贝塞尔；回边绕行虚线）
  // ==========================================
  const layoutEdges: FlowLayoutEdge[] = []
  edges.forEach((e, i) => {
    const from = placed.get(e.from)
    const to = placed.get(e.to)
    if (!from || !to) return
    const isBack = backEdgeIdx.has(i)

    let sx: number,
      sy: number,
      tx: number,
      ty: number,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number
    if (isVertical) {
      const dirSign = mirror ? -1 : 1
      sx = from.x + from.w / 2
      sy = from.y + (dirSign > 0 ? from.h : 0)
      tx = to.x + to.w / 2
      ty = to.y + (dirSign > 0 ? 0 : to.h)
      const dy = Math.max(40, Math.abs(ty - sy) / 2)
      if (isBack) {
        // 回边：同侧绕行（右侧绕出）
        const detour = 40
        c1x = sx + (from.w / 2 + detour)
        c1y = sy
        c2x = tx + (to.w / 2 + detour)
        c2y = ty
      } else {
        c1x = sx
        c1y = sy + dy * dirSign
        c2x = tx
        c2y = ty - dy * dirSign
      }
    } else {
      const dirSign = mirror ? -1 : 1
      sx = from.x + (dirSign > 0 ? from.w : 0)
      sy = from.y + from.h / 2
      tx = to.x + (dirSign > 0 ? 0 : to.w)
      ty = to.y + to.h / 2
      const dx = Math.max(40, Math.abs(tx - sx) / 2)
      if (isBack) {
        const detour = 40
        c1x = sx
        c1y = sy + (from.h / 2 + detour)
        c2x = tx
        c2y = ty + (to.h / 2 + detour)
      } else {
        c1x = sx + dx * dirSign
        c1y = sy
        c2x = tx - dx * dirSign
        c2y = ty
      }
    }

    layoutEdges.push({
      from: e.from,
      to: e.to,
      label: e.label,
      path: `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`,
      labelPos: { x: (c1x + c2x) / 2, y: (c1y + c2y) / 2 },
      isBackEdge: isBack,
    })
  })

  return { nodes: placed, edges: layoutEdges, width, height }
}
