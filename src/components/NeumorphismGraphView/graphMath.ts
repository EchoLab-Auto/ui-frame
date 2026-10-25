import type { GraphView } from './types'

/**
 * 节点图的纯几何与视图变换工具。
 *
 * 全部为无副作用纯函数（无 DOM / 无随机数），因此同一份数据在任何环境下
 * 都得到同一份布局起点——便于快照式单测，也避免每次刷新图形态乱跳。
 */

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 黄金角（≈137.5°）——向日葵种子式螺旋，落位均匀且不重叠 */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * 按索引计算螺旋播种坐标。
 *
 * 省略初始坐标的节点用节点序号落位：同一份数据每次得到完全一样的位置，
 * 且新节点天然排在已有点外围（`r ∝ √i`），不会与既有节点重叠。
 */
export function seedPosition(index: number, spacing: number): Point {
  const radius = Math.sqrt(index + 0.5) * spacing
  const angle = index * GOLDEN_ANGLE
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

/** 计算点集包围盒；空集返回以原点为中心的零尺寸盒 */
export function boundsOf(points: readonly Point[], padding = 0): Bounds {
  if (points.length === 0) {
    return { minX: -padding, minY: -padding, maxX: padding, maxY: padding }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  }
}

/** 缩放倍率钳制（同时规避 NaN / 0） */
export function clampScale(scale: number, min: number, max: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return min
  return Math.min(max, Math.max(min, scale))
}

/**
 * 计算「把包围盒完整装进视口」的变换。
 *
 * `padding` 为屏幕 CSS 像素留白；包围盒退化成点或线时按 1 处理，避免除零。
 */
export function fitTransform(
  bounds: Bounds,
  viewport: Size,
  padding = 40,
  minScale = 0.1,
  maxScale = 4
): GraphView {
  const boxWidth = Math.max(1, bounds.maxX - bounds.minX)
  const boxHeight = Math.max(1, bounds.maxY - bounds.minY)
  const availableWidth = Math.max(1, viewport.width - padding * 2)
  const availableHeight = Math.max(1, viewport.height - padding * 2)
  const scale = clampScale(
    Math.min(availableWidth / boxWidth, availableHeight / boxHeight),
    minScale,
    maxScale
  )
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return {
    scale,
    tx: viewport.width / 2 - centerX * scale,
    ty: viewport.height / 2 - centerY * scale,
  }
}

/** 世界坐标 → 屏幕坐标 */
export function worldToScreen(point: Point, view: GraphView): Point {
  return { x: point.x * view.scale + view.tx, y: point.y * view.scale + view.ty }
}

/** 屏幕坐标 → 世界坐标 */
export function screenToWorld(point: Point, view: GraphView): Point {
  return { x: (point.x - view.tx) / view.scale, y: (point.y - view.ty) / view.scale }
}

/**
 * 以屏幕上的 `anchor` 为不动点缩放。
 *
 * 滚轮缩放的「朝着鼠标那一点放大」——锚点下的世界坐标缩放前后保持贴住光标。
 */
export function zoomAt(
  view: GraphView,
  factor: number,
  anchor: Point,
  minScale = 0.1,
  maxScale = 4
): GraphView {
  const scale = clampScale(view.scale * factor, minScale, maxScale)
  const ratio = scale / view.scale
  return {
    scale,
    tx: anchor.x - (anchor.x - view.tx) * ratio,
    ty: anchor.y - (anchor.y - view.ty) * ratio,
  }
}

/** 两点距离 */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
