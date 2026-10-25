import { seedPosition } from './graphMath'
import type { GraphLink, GraphNode } from './types'

/**
 * 轻量力导向布局（无第三方依赖）。
 *
 * 每次 `tick()` 叠加三类力：
 *   1. 节点两两排斥——`repulsion / d²`，让节点散开且不互相压叠；
 *   2. 连线弹簧——`(d - linkDistance) × spring × weight`，把关联节点拉回理想边长；
 *   3. 向心引力——`-position × gravity`，防止孤立子图无限漂移。
 *
 * 三类力统一乘「退火系数 alpha」：alpha 从 1 起按 `alphaDecay` 指数衰减到
 * `alphaMin` 以下判定静止（同 d3-force 的做法）。相比固定阻尼，"先猛后缓"
 * 的能量曲线能让图在几秒内铺开并稳稳停住，而不是长久微微抖动；速度另按
 * `velocityDecay` 逐帧衰减并钳制上限。静止后调用方可停掉 requestAnimationFrame
 * ——不动的图不再耗电。
 */

export interface SimNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  /** 被钉住的节点不参与位移（拖拽中 / 数据里 fixed: true） */
  fixed: boolean
  /** 渲染半径（随度数增大） */
  radius: number
  /** 连线条数——用于按连接度放大节点 */
  degree: number
}

export interface SimLink {
  /** 起点在 `nodes` 数组中的下标 */
  source: number
  /** 终点在 `nodes` 数组中的下标 */
  target: number
  weight: number
}

export interface ForceSettings {
  /** 弹簧静止长度（画布坐标） */
  linkDistance: number
  /** 排斥强度常数（加速度 × d²） */
  repulsion: number
  /** 弹簧刚度 */
  spring: number
  /** 向心引力系数（相对坐标） */
  gravity: number
  /** 速度逐帧损耗比例（0~1，越大越"黏"） */
  velocityDecay: number
  /** 单帧速度上限，避免数值爆炸 */
  maxSpeed: number
  /** 单对节点排斥力上限 */
  maxRepulsionForce: number
  /** 退火系数逐帧衰减率——alpha 每帧乘 (1 - alphaDecay) 量级地趋向 alphaTarget */
  alphaDecay: number
  /** 判定静止的 alpha 下限 */
  alphaMin: number
  /** 退火目标值（通常为 0；拖拽时可临时抬高保持活性） */
  alphaTarget: number
}

export const DEFAULT_FORCE_SETTINGS: ForceSettings = {
  linkDistance: 78,
  repulsion: 900,
  spring: 0.008,
  gravity: 0.0004,
  velocityDecay: 0.4,
  maxSpeed: 10,
  maxRepulsionForce: 6,
  // alphaDecay = 0.0228 时 alpha 从 1 衰减到 0.001 约需 300 帧（60fps ≈ 5s）
  alphaDecay: 0.0228,
  alphaMin: 0.001,
  alphaTarget: 0,
}

/** 节点半径随度数增长的系数（连接越多画得越大，与 Obsidian 观感一致） */
const DEGREE_GROWTH = 0.12
/** 度数放大上限，避免枢纽节点变成巨型球 */
const DEGREE_CAP = 8
/** 相邻节点的最小间距（世界坐标），防止完全重叠导致方向退化 */
const MIN_SEPARATION = 1

export interface SetDataOptions {
  /** 基础节点半径 */
  nodeRadius: number
  /** 是否保留旧节点位置（默认 true；false 时全部按螺旋重新播种） */
  preservePositions?: boolean
}

export class ForceLayout {
  nodes: SimNode[] = []
  links: SimLink[] = []
  settings: ForceSettings
  /** 动能已降到阈值以下——调用方可停止渲染循环 */
  settled = false

  /**
   * 退火系数：1 = 满能量，衰减到 alphaMin 以下即静止。
   * 对外只读——外部只能通过 `wake()` / `reheat()` / `setData()` 影响它，
   * 免得调用方手动改温度破坏"确定性收敛"的前提。
   */
  get alpha(): number {
    return this._alpha
  }

  private _alpha = 1
  private indexById = new Map<string, number>()

  constructor(settings: Partial<ForceSettings> = {}) {
    this.settings = { ...DEFAULT_FORCE_SETTINGS, ...settings }
  }

  /** 更新力学参数；参数变化会唤醒模拟 */
  setSettings(settings: Partial<ForceSettings>): void {
    this.settings = { ...this.settings, ...settings }
    this.wake()
  }

  /**
   * 用新数据重建模拟世界。
   *
   * 按 `id` 复用旧坐标：数据增删（例如过滤分组）时既有节点留在原位，
   * 只有新节点按黄金角螺旋补位，避免整图重排造成的视觉跳变。
   */
  setData(nodes: readonly GraphNode[], links: readonly GraphLink[], options: SetDataOptions): void {
    const previous = new Map(this.nodes.map(n => [n.id, n]))
    const preserve = options.preservePositions !== false
    const spacing = Math.max(12, this.settings.linkDistance * 0.62)

    this.nodes = nodes.map((node, i) => {
      const old = preserve ? previous.get(node.id) : undefined
      const seeded = seedPosition(i, spacing)
      const x = old?.x ?? node.x ?? seeded.x
      const y = old?.y ?? node.y ?? seeded.y
      return {
        id: node.id,
        x,
        y,
        vx: 0,
        vy: 0,
        fixed: node.fixed === true,
        radius: options.nodeRadius,
        degree: 0,
      }
    })

    this.indexById = new Map(this.nodes.map((n, i) => [n.id, i]))

    const resolved: SimLink[] = []
    for (const link of links) {
      const source = this.indexById.get(link.source)
      const target = this.indexById.get(link.target)
      // 悬空引用与自环直接丢弃——无效边只会把节点钉在原地
      if (source === undefined || target === undefined || source === target) continue
      resolved.push({ source, target, weight: link.weight ?? 1 })
      this.nodes[source].degree += 1
      this.nodes[target].degree += 1
    }
    this.links = resolved

    // 半径按度数补齐（显式 size 由调用方通过 nodeRadius 之外的通道覆盖）
    this.nodes.forEach((sim, i) => {
      const explicit = nodes[i]?.size
      sim.radius =
        explicit ?? options.nodeRadius * (1 + Math.min(sim.degree, DEGREE_CAP) * DEGREE_GROWTH)
    })

    this._alpha = 1
    this.settled = false
  }

  /** 相邻节点 id 集合（含自身，便于"高亮自身 + 邻居"直接查表） */
  neighborsOf(id: string): Set<string> {
    const set = new Set<string>([id])
    const idx = this.indexById.get(id)
    if (idx === undefined) return set
    for (const link of this.links) {
      if (link.source === idx) set.add(this.nodes[link.target].id)
      else if (link.target === idx) set.add(this.nodes[link.source].id)
    }
    return set
  }

  getNode(id: string): SimNode | undefined {
    const idx = this.indexById.get(id)
    return idx === undefined ? undefined : this.nodes[idx]
  }

  /**
   * 钉住某个节点（拖拽期间临时固定）。
   *
   * 只改坐标与固定标记、不做速度扰动——拖拽每帧都会调用它，
   * 若顺手 reheat 会让其余节点跟着抖动。
   */
  pin(id: string, x: number, y: number): void {
    const node = this.getNode(id)
    if (!node) return
    node.x = x
    node.y = y
    node.vx = 0
    node.vy = 0
    node.fixed = true
    this.wake()
  }

  /** 解除钉住并交还给模拟 */
  release(id: string): void {
    const node = this.getNode(id)
    if (!node) return
    node.fixed = false
    node.vx = 0
    node.vy = 0
    this.wake()
  }

  /**
   * 重新唤醒已静止的模拟（不改变既有速度）。
   *
   * `alpha` 抬到给定值而不重置为 1——交互（拖拽、改参数）只需局部舒展，
   * 满能量会让整图重新洗牌。
   */
  wake(alpha = 0.35): void {
    this._alpha = Math.max(this._alpha, alpha)
    this.settled = false
  }

  /** 给所有可动节点一点确定性的扰动，让已静止的图重新舒展 */
  reheat(strength = 0.6): void {
    this._alpha = Math.min(1, Math.max(this._alpha, strength))
    this.settled = false
    this.nodes.forEach((node, i) => {
      if (node.fixed) return
      // 确定性伪随机（无 Math.random）：同一帧序列在任何环境都一样
      const nudge = ((((i + 1) * 9301 + 49297) % 233280) / 233280 - 0.5) * strength
      const angle = i * 2.399963
      node.vx += Math.cos(angle) * nudge
      node.vy += Math.sin(angle) * nudge
    })
  }

  /** 预先跑若干帧，挂载时直接呈现基本成形的布局 */
  warmup(ticks: number): void {
    for (let i = 0; i < ticks && !this.settled; i++) this.tick()
  }

  /** 推进一帧；返回是否仍在运动（已静止时直接返回，不再积分产生漂移） */
  tick(): boolean {
    if (this.settled) return false
    const { nodes, links, settings } = this
    const alpha = this._alpha
    const count = nodes.length
    if (count === 0) {
      this.settled = true
      return false
    }

    // ---- 1. 两两排斥 ----
    for (let i = 0; i < count; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < count; j++) {
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let d2 = dx * dx + dy * dy
        if (d2 < MIN_SEPARATION) {
          // 完全重叠：用索引给一个确定性的分离方向
          dx = (i % 7) - 3 + 0.25
          dy = (j % 5) - 2 + 0.25
          d2 = dx * dx + dy * dy
          if (d2 < MIN_SEPARATION) {
            dx = 0.5
            dy = 0.5
            d2 = 0.5
          }
        }
        const d = Math.sqrt(d2)
        const strength = Math.min(settings.repulsion / d2, settings.maxRepulsionForce) * alpha
        const fx = (dx / d) * strength
        const fy = (dy / d) * strength
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
    }

    // ---- 2. 连线弹簧 ----
    for (const link of links) {
      const a = nodes[link.source]
      const b = nodes[link.target]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 0.01
      const strength = (d - settings.linkDistance) * settings.spring * link.weight * alpha
      const fx = (dx / d) * strength
      const fy = (dy / d) * strength
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // ---- 3. 向心引力 + 速度衰减 + 积分 ----
    for (const node of nodes) {
      if (node.fixed) {
        node.vx = 0
        node.vy = 0
        continue
      }
      node.vx -= node.x * settings.gravity * alpha
      node.vy -= node.y * settings.gravity * alpha
      const retention = 1 - settings.velocityDecay
      node.vx *= retention
      node.vy *= retention

      const speed = Math.hypot(node.vx, node.vy)
      if (speed > settings.maxSpeed) {
        const k = settings.maxSpeed / speed
        node.vx *= k
        node.vy *= k
      }
      node.x += node.vx
      node.y += node.vy
    }

    // ---- 4. 退火与静止判定 ----
    this._alpha += (settings.alphaTarget - this._alpha) * settings.alphaDecay
    if (this._alpha < settings.alphaMin) {
      this._alpha = 0
      this.settled = true
    }
    return !this.settled
  }
}
