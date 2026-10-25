<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'
import { ForceLayout } from './forceLayout'
import type { ForceSettings, SimNode } from './forceLayout'
import {
  boundsOf,
  clampScale,
  fitTransform,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from './graphMath'
import type { Point } from './graphMath'
import type { GraphLabelMode, GraphLink, GraphNode, GraphView } from './types'

export interface NeumorphismGraphViewProps {
  /** 节点数据 */
  nodes?: GraphNode[]
  /** 连线数据（引用节点 id） */
  links?: GraphLink[]
  /** 容器高度（CSS 值或像素数） */
  height?: string | number
  /** 基础节点半径（画布坐标）；度数越高画得越大 */
  nodeRadius?: number
  /** 弹簧静止边长——越大图越松散 */
  linkDistance?: number
  /** 排斥强度——越大节点越分散 */
  repulsion?: number
  /**
   * 力学参数覆盖（高级）。可调 `spring` / `gravity` / `velocityDecay` /
   * `alphaDecay` / `alphaMin` / `alphaTarget` / `maxSpeed` / `maxRepulsionForce`；
   * `linkDistance` 与 `repulsion` 请优先用同名 prop（显式 prop > 本项 > 内置默认）。
   */
  forceSettings?: Partial<ForceSettings>
  /** 标签显示策略 */
  showLabels?: GraphLabelMode
  /** 显示右下角缩放控件 */
  showControls?: boolean
  /** 显示左下角分组图例 */
  showLegend?: boolean
  /** 悬停/选中时高亮邻居并淡化其余部分 */
  highlightNeighbors?: boolean
  /** 允许拖拽节点 */
  draggable?: boolean
  /** 允许拖拽背景平移 */
  pannable?: boolean
  /** 允许滚轮/双指缩放 */
  zoomable?: boolean
  /** 数据变化与首次挂载后自动适应视图 */
  autoFit?: boolean
  /** 数据刷新时保留既有节点位置（关闭则整图重新播种） */
  preservePositions?: boolean
  /** 无障碍名称 */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismGraphViewProps>(), {
  nodes: () => [],
  links: () => [],
  height: '520px',
  nodeRadius: undefined,
  linkDistance: undefined,
  repulsion: undefined,
  forceSettings: undefined,
  showLabels: undefined,
  showControls: undefined,
  showLegend: false,
  highlightNeighbors: undefined,
  draggable: undefined,
  pannable: true,
  zoomable: true,
  autoFit: true,
  preservePositions: true,
  ariaLabel: '',
})

const emit = defineEmits<{
  (e: 'node-click', node: GraphNode): void
  (e: 'node-hover', node: GraphNode | null): void
  (e: 'node-dblclick', node: GraphNode): void
  (e: 'background-click'): void
  (e: 'zoom-change', scale: number): void
  /** 力学模拟开始（从静止重新动起来） */
  (e: 'layout-start'): void
  /** 力学模拟静止（节点不再移动，渲染循环停止） */
  (e: 'layout-settled'): void
}>()

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedNodeRadius = computed(() =>
  resolveProp(props.nodeRadius, config.value.graph?.nodeRadius, 7)
)
const resolvedLinkDistance = computed(() =>
  resolveProp(props.linkDistance, config.value.graph?.linkDistance, 78)
)
const resolvedRepulsion = computed(() =>
  resolveProp(props.repulsion, config.value.graph?.repulsion, 900)
)
const resolvedShowLabels = computed(() =>
  resolveProp(props.showLabels, config.value.graph?.showLabels, 'auto' as GraphLabelMode)
)
const resolvedShowControls = computed(() =>
  resolveProp(props.showControls, config.value.graph?.showControls, true)
)
const resolvedHighlightNeighbors = computed(() =>
  resolveProp(props.highlightNeighbors, config.value.graph?.highlightNeighbors, true)
)
const resolvedDraggable = computed(() =>
  resolveProp(props.draggable, config.value.graph?.draggable, true)
)

/**
 * 最终力学参数：内置默认 ← forceSettings ← 显式 linkDistance / repulsion。
 *
 * 两个专用 prop 优先级最高——它们是最常调的两个旋钮，不该被 `forceSettings`
 * 里的同名字段悄悄盖掉。
 */
const forceSettings = computed<Partial<ForceSettings>>(() => ({
  ...(props.forceSettings ?? {}),
  linkDistance: resolvedLinkDistance.value,
  repulsion: resolvedRepulsion.value,
}))

const resolvedAriaLabel = computed(() => props.ariaLabel || t('graphLabel'))

// ============================================================
// 视图状态
// ============================================================

const MIN_SCALE = 0.15
const MAX_SCALE = 4
/** 自适应视图时的屏幕留白（CSS 像素） */
const FIT_PADDING = 48
/** auto 模式下标签显现的缩放阈值 */
const LABEL_ZOOM = 0.85
/** 命中测试容差（屏幕像素，随缩放折算到世界坐标） */
const HIT_SLOP = 6
/** 指针移动超过该距离才算拖拽，否则按点击处理 */
const DRAG_THRESHOLD = 3
const LABEL_FONT = "500 12px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

const FALLBACK_GROUP_COLORS = [
  '#5a8def',
  '#3fb27f',
  '#e8a13a',
  '#e0655b',
  '#8d7bf0',
  '#2fb8c6',
  '#d0578f',
  '#7f8c9b',
]

const GROUP_COLOR_VARS = [
  '--nm-color-primary-500',
  '--nm-color-success-500',
  '--nm-color-warning-500',
  '--nm-color-error-500',
  '--nm-color-info-500',
  '--nm-color-primary-300',
  '--nm-color-success-300',
  '--nm-color-info-300',
]

const rootRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const viewport = ref({ width: 0, height: 0 })
const pixelRatio = ref(1)
const view = ref<GraphView>({ scale: 1, tx: 0, ty: 0 })
const hoveredId = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const themeAttr = ref('')

/** 力学模拟：非响应式（每帧改动上百个坐标，交给 Vue 代理只会白烧 CPU） */
let layout: ForceLayout | null = null

const heightStyle = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
)

const nodeMetaById = computed(() => new Map(props.nodes.map(n => [n.id, n])))

const groupNames = computed(() => {
  const names = new Set<string>()
  for (const node of props.nodes) names.add(node.group ?? '')
  return [...names].sort((a, b) => a.localeCompare(b))
})

/** 从主题 token 读分组配色；CSS 变量不是响应式的，靠 data-theme 变化触发重算 */
const palette = computed<string[]>(() => {
  void themeAttr.value
  if (typeof document === 'undefined') return FALLBACK_GROUP_COLORS
  const styles = getComputedStyle(document.documentElement)
  const values = GROUP_COLOR_VARS.map(name => styles.getPropertyValue(name).trim()).filter(Boolean)
  return values.length > 0 ? values : FALLBACK_GROUP_COLORS
})

const groupColors = computed(() => {
  const list = palette.value
  const map = new Map<string, string>()
  groupNames.value.forEach((name, i) => {
    map.set(name, list[i % list.length] ?? FALLBACK_GROUP_COLORS[0])
  })
  return map
})

/** 主题色（画布 2D 上下文拿不到 CSS 变量，必须显式解析成色值） */
const themeColors = computed(() => {
  void themeAttr.value
  const fallback = { text: '#8a8f98', textStrong: '#1f2430', accent: '#5a8def', bg: '#eceff3' }
  if (typeof document === 'undefined') return fallback
  const styles = getComputedStyle(document.documentElement)
  return {
    text: styles.getPropertyValue('--nm-text-secondary').trim() || fallback.text,
    textStrong: styles.getPropertyValue('--nm-text-primary').trim() || fallback.textStrong,
    accent: styles.getPropertyValue('--nm-primary-color').trim() || fallback.accent,
    bg: styles.getPropertyValue('--nm-bg-color').trim() || fallback.bg,
  }
})

const colorByNodeId = computed(() => {
  const map = new Map<string, string>()
  for (const node of props.nodes) {
    map.set(
      node.id,
      node.color ?? groupColors.value.get(node.group ?? '') ?? themeColors.value.accent
    )
  }
  return map
})

const labelByNodeId = computed(() => {
  const map = new Map<string, string>()
  for (const node of props.nodes) map.set(node.id, node.label ?? node.id)
  return map
})

const legendItems = computed(() =>
  groupNames.value
    .filter(name => name !== '')
    .map(name => ({ name, color: groupColors.value.get(name) ?? themeColors.value.accent }))
)

const zoomPercent = computed(() => Math.round(view.value.scale * 100))

function colorOf(node: SimNode): string {
  return colorByNodeId.value.get(node.id) ?? themeColors.value.accent
}

// ============================================================
// 数据同步
// ============================================================

function syncLayout(): void {
  if (!layout) return
  layout.setSettings(forceSettings.value)
  layout.setData(props.nodes, props.links, {
    nodeRadius: resolvedNodeRadius.value,
    preservePositions: props.preservePositions,
  })
}

/** 挂载 / 数据变化后：先离线跑若干帧再绘制，避免首帧是"炸开"的初始螺旋 */
function warmupLayout(ticks: number): void {
  if (!layout) return
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  layout.warmup(reduced ? Math.max(ticks, 400) : ticks)
}

// ============================================================
// 视图操作
// ============================================================

function applyView(next: GraphView): void {
  view.value = next
  emit('zoom-change', next.scale)
  requestDraw()
}

function fit(): void {
  const { width, height } = viewport.value
  if (!layout || width <= 0 || height <= 0 || layout.nodes.length === 0) return
  const points: Point[] = layout.nodes.map(node => ({
    x: node.x,
    y: node.y,
  }))
  // 留出节点半径，避免边缘节点被容器裁掉
  const maxRadius = layout.nodes.reduce((max, node) => Math.max(max, node.radius), 0)
  const bounds = boundsOf(points, maxRadius)
  view.value = fitTransform(bounds, { width, height }, FIT_PADDING, MIN_SCALE, MAX_SCALE)
  emit('zoom-change', view.value.scale)
  requestDraw()
}

function zoomBy(factor: number, anchor?: Point): void {
  const { width, height } = viewport.value
  const point = anchor ?? { x: width / 2, y: height / 2 }
  applyView(zoomAt(view.value, factor, point, MIN_SCALE, MAX_SCALE))
}

function zoomIn(): void {
  zoomBy(1.25)
}

function zoomOut(): void {
  zoomBy(1 / 1.25)
}

function focusNode(id: string): void {
  const node = layout?.getNode(id)
  if (!node || !layout) return
  const { width, height } = viewport.value
  const scale = Math.max(view.value.scale, 1)
  view.value = { scale, tx: width / 2 - node.x * scale, ty: height / 2 - node.y * scale }
  emit('zoom-change', view.value.scale)
  requestDraw()
}

/** 重新播种并跑热力学（丢弃既有坐标） */
function resetLayout(): void {
  if (!layout) return
  layout.setData(props.nodes, props.links, {
    nodeRadius: resolvedNodeRadius.value,
    preservePositions: false,
  })
  warmupLayout(200)
  if (props.autoFit) fit()
  startLoop()
}

// ============================================================
// 渲染
// ============================================================

let rafId = 0
let settledEmitted = false

function requestDraw(): void {
  startLoop()
}

function startLoop(): void {
  if (rafId || typeof requestAnimationFrame === 'undefined') return
  rafId = requestAnimationFrame(frame)
}

function frame(): void {
  rafId = 0
  const moving = layout ? layout.tick() : false
  draw()
  if (moving) {
    rafId = requestAnimationFrame(frame)
    if (settledEmitted) {
      settledEmitted = false
      emit('layout-start')
    }
    return
  }
  if (!settledEmitted) {
    settledEmitted = true
    emit('layout-settled')
  }
}

function draw(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = viewport.value
  if (width <= 0 || height <= 0 || !layout) return

  const dpr = pixelRatio.value
  const backingWidth = Math.max(1, Math.round(width * dpr))
  const backingHeight = Math.max(1, Math.round(height * dpr))
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth
    canvas.height = backingHeight
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const colors = themeColors.value
  const current = view.value
  const activeId = hoveredId.value ?? selectedId.value
  const activeSet =
    activeId && resolvedHighlightNeighbors.value ? layout.neighborsOf(activeId) : null
  const mode = resolvedShowLabels.value
  const showAllLabels = mode === 'always' || (mode === 'auto' && current.scale >= LABEL_ZOOM)

  const onScreen = (p: Point, margin = 40): boolean =>
    p.x >= -margin && p.x <= width + margin && p.y >= -margin && p.y <= height + margin

  // ---- 连线 ----
  ctx.lineCap = 'round'
  for (const link of layout.links) {
    const a = layout.nodes[link.source]
    const b = layout.nodes[link.target]
    const p1 = worldToScreen(a, current)
    const p2 = worldToScreen(b, current)
    if (!onScreen(p1) && !onScreen(p2)) continue

    const touchesActive = activeId !== null && (a.id === activeId || b.id === activeId)
    const insideActiveSet = activeSet !== null && activeSet.has(a.id) && activeSet.has(b.id)

    let stroke = colors.text
    let alpha = 0.16
    let lineWidth = 1
    if (touchesActive) {
      stroke = colors.accent
      alpha = 0.7
      lineWidth = 1.8
    } else if (insideActiveSet) {
      stroke = colors.accent
      alpha = 0.32
      lineWidth = 1.3
    } else if (activeSet) {
      alpha = 0.05
    }

    ctx.globalAlpha = alpha
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  // ---- 节点 ----
  for (const node of layout.nodes) {
    const p = worldToScreen(node, current)
    const radius = Math.max(1.5, node.radius * current.scale)
    if (!onScreen(p, radius + 60)) continue

    const isActive = node.id === activeId
    const highlighted = activeSet ? activeSet.has(node.id) : true
    const alpha = activeSet ? (highlighted ? 1 : 0.14) : 1
    const color = colorOf(node)

    ctx.globalAlpha = alpha
    // 光晕：Obsidian 的节点带一圈同色柔光，暗色主题下尤其明显
    if (highlighted) {
      ctx.shadowColor = color
      ctx.shadowBlur = isActive ? 18 : 9
    }
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 选中节点加一道描边环，键盘操作时也能看清当前焦点
    if (node.id === selectedId.value) {
      ctx.globalAlpha = 1
      ctx.strokeStyle = colors.textStrong
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // ---- 标签 ----
    const labelVisible = showAllLabels || (activeSet !== null && activeSet.has(node.id))
    if (!labelVisible) continue
    const label = labelByNodeId.value.get(node.id) ?? node.id
    ctx.font = LABEL_FONT
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    // 用背景色描边做出"光晕底"，标签压在连线上依然可读
    ctx.globalAlpha = Math.max(alpha, 0.55)
    ctx.strokeStyle = colors.bg
    ctx.lineWidth = 3
    ctx.strokeText(label, p.x + radius + 5, p.y)
    ctx.fillStyle = isActive ? colors.textStrong : colors.text
    ctx.fillText(label, p.x + radius + 5, p.y)
  }

  ctx.globalAlpha = 1
}

// ============================================================
// 尺寸 / 主题监听
// ============================================================

let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

function measure(): void {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const width = rect.width || el.clientWidth
  const height = rect.height || el.clientHeight
  if (width > 0 && height > 0) {
    viewport.value = { width, height }
  }
  pixelRatio.value = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
}

// ============================================================
// 指针交互
// ============================================================

const pointers = new Map<number, Point>()
let dragId: string | null = null
let dragOffset: Point = { x: 0, y: 0 }
let dragMoved = false
let panning = false
let panOrigin: Point = { x: 0, y: 0 }
let panStart: Point = { x: 0, y: 0 }
let pinchStart: { distance: number; center: Point; view: GraphView } | null = null
/** 本次指针序列发生过捏合——抬手时不再当作点击（避免收指误触节点） */
let pinched = false

function toLocal(event: { clientX: number; clientY: number }): Point {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function hitTest(point: Point): SimNode | null {
  if (!layout) return null
  const world = screenToWorld(point, view.value)
  const slop = HIT_SLOP / view.value.scale
  // 反向遍历：后绘制的节点在上层，优先命中
  for (let i = layout.nodes.length - 1; i >= 0; i--) {
    const node = layout.nodes[i]
    if (Math.hypot(node.x - world.x, node.y - world.y) <= node.radius + slop) return node
  }
  return null
}

function setHovered(node: SimNode | null): void {
  const nextId = node?.id ?? null
  if (hoveredId.value === nextId) return
  hoveredId.value = nextId
  emit('node-hover', nextId ? (nodeMetaById.value.get(nextId) ?? null) : null)
  if (canvasRef.value) {
    canvasRef.value.style.cursor = nextId
      ? resolvedDraggable.value
        ? 'grab'
        : 'pointer'
      : panning
        ? 'grabbing'
        : 'default'
  }
  requestDraw()
}

function onPointerDown(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const point = toLocal(event)
  pointers.set(event.pointerId, point)
  try {
    canvas.setPointerCapture(event.pointerId)
  } catch {
    /* 部分环境（jsdom / 旧浏览器）不支持指针捕获，忽略即可 */
  }

  if (pointers.size >= 2) {
    // 双指：进入捏合缩放，终止单指拖拽
    dragId = null
    panning = false
    pinched = true
    const [a, b] = [...pointers.values()]
    pinchStart = {
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      view: { ...view.value },
    }
    return
  }

  const hit = hitTest(point)
  if (hit && resolvedDraggable.value) {
    const world = screenToWorld(point, view.value)
    dragId = hit.id
    dragOffset = { x: world.x - hit.x, y: world.y - hit.y }
    dragMoved = false
    layout?.pin(hit.id, hit.x, hit.y)
    if (canvas) canvas.style.cursor = 'grabbing'
    return
  }

  if (!hit && props.pannable) {
    panning = true
    panStart = point
    panOrigin = { x: view.value.tx, y: view.value.ty }
    if (canvas) canvas.style.cursor = 'grabbing'
  }
}

function onPointerMove(event: PointerEvent): void {
  const point = toLocal(event)
  if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point)

  if (pointers.size >= 2 && pinchStart) {
    const [a, b] = [...pointers.values()]
    const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const factor = distance / pinchStart.distance
    const scale = clampScale(pinchStart.view.scale * factor, MIN_SCALE, MAX_SCALE)
    // 以捏合始视图为基准换算，避免逐帧累积漂移；中点位移自然带来平移
    const ratio = scale / pinchStart.view.scale
    view.value = {
      scale,
      tx: center.x - (pinchStart.center.x - pinchStart.view.tx) * ratio,
      ty: center.y - (pinchStart.center.y - pinchStart.view.ty) * ratio,
    }
    emit('zoom-change', scale)
    requestDraw()
    return
  }

  if (dragId && layout) {
    const world = screenToWorld(point, view.value)
    dragMoved = true
    layout.pin(dragId, world.x - dragOffset.x, world.y - dragOffset.y)
    requestDraw()
    return
  }

  if (panning) {
    const dx = point.x - panStart.x
    const dy = point.y - panStart.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) dragMoved = true
    view.value = { scale: view.value.scale, tx: panOrigin.x + dx, ty: panOrigin.y + dy }
    requestDraw()
    return
  }

  setHovered(hitTest(point))
}

function onPointerUp(event: PointerEvent): void {
  const canvas = canvasRef.value
  const point = toLocal(event)
  pointers.delete(event.pointerId)
  if (pointers.size < 2) pinchStart = null
  try {
    canvas?.releasePointerCapture(event.pointerId)
  } catch {
    /* 同上：不支持捕获时忽略 */
  }

  const hit = hitTest(point)
  const dragged = dragMoved || pinched
  const wasPanning = panning

  if (dragId) {
    layout?.release(dragId)
    dragId = null
  }
  panning = false
  dragMoved = false
  if (pointers.size === 0) pinched = false
  if (canvas) canvas.style.cursor = hoveredId.value ? 'grab' : 'default'

  // 拖拽结束不当作点击（避免拖完节点顺带触发一次打开）
  if (!dragged && hit) {
    selectedId.value = hit.id
    emit('node-click', nodeMetaById.value.get(hit.id) ?? { id: hit.id })
    requestDraw()
    return
  }
  if (!dragged && wasPanning) {
    selectedId.value = null
    emit('background-click')
    requestDraw()
    return
  }
  requestDraw()
}

function onPointerLeave(): void {
  if (!dragId && !panning) setHovered(null)
}

function onDoubleClick(event: MouseEvent): void {
  const hit = hitTest(toLocal(event))
  if (!hit) return
  focusNode(hit.id)
  emit('node-dblclick', nodeMetaById.value.get(hit.id) ?? { id: hit.id })
}

function onWheel(event: WheelEvent): void {
  if (!props.zoomable) return
  event.preventDefault()
  const point = toLocal(event)
  // deltaMode 1 = 行，按 16px 折算；触控板多为 0（像素）
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
  const factor = Math.exp(-delta * 0.0015)
  zoomBy(factor, point)
}

function onKeydown(event: KeyboardEvent): void {
  const order = props.nodes
  const currentIndex = selectedId.value ? order.findIndex(n => n.id === selectedId.value) : -1

  const moveSelection = (step: number): void => {
    if (order.length === 0) return
    const nextIndex = (currentIndex + step + order.length) % order.length
    const node = order[currentIndex === -1 ? 0 : nextIndex]
    selectedId.value = node.id
    emit('node-hover', node)
    requestDraw()
  }

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      moveSelection(1)
      event.preventDefault()
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      moveSelection(-1)
      event.preventDefault()
      break
    case 'Enter':
    case ' ': {
      const node = order.find(n => n.id === selectedId.value)
      if (node) emit('node-click', node)
      event.preventDefault()
      break
    }
    case '+':
    case '=':
      zoomIn()
      event.preventDefault()
      break
    case '-':
    case '_':
      zoomOut()
      event.preventDefault()
      break
    case '0':
      fit()
      event.preventDefault()
      break
    case 'Escape':
      selectedId.value = null
      requestDraw()
      break
  }
}

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  if (typeof window === 'undefined') return
  layout = new ForceLayout(forceSettings.value)

  themeAttr.value = document.documentElement.getAttribute('data-theme') ?? ''
  themeObserver = new MutationObserver(() => {
    themeAttr.value = document.documentElement.getAttribute('data-theme') ?? ''
    requestDraw()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  measure()
  syncLayout()
  warmupLayout(320)
  if (props.autoFit) fit()

  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      measure()
      requestDraw()
    })
    resizeObserver.observe(rootRef.value)
  }

  canvasRef.value?.addEventListener('wheel', onWheel, { passive: false })
  startLoop()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  resizeObserver?.disconnect()
  resizeObserver = null
  themeObserver?.disconnect()
  themeObserver = null
  canvasRef.value?.removeEventListener('wheel', onWheel)
  pointers.clear()
  layout = null
})

watch(
  () => [props.nodes, props.links],
  () => {
    if (!layout) return
    syncLayout()
    warmupLayout(240)
    if (props.autoFit) fit()
    else requestDraw()
    startLoop()
  },
  { deep: true }
)

// 力学参数变化：只改设置并唤醒（不重建数据 → 位置得以保留，滑块拖动时才不会整图乱跳）
watch(
  forceSettings,
  () => {
    if (!layout) return
    layout.setSettings(forceSettings.value)
    startLoop()
  },
  { deep: true }
)

// 半径变化影响布局（半径参与度数补偿），需重建节点对象
watch(resolvedNodeRadius, () => {
  if (!layout) return
  syncLayout()
  layout.wake(0.4)
  startLoop()
})

watch(colorByNodeId, () => requestDraw())

defineExpose({
  /** 适应视图：把全部节点装进容器 */
  fit,
  zoomIn,
  zoomOut,
  /** 重新播种 + 重新布局 */
  resetLayout,
  /** 让已静止的布局重新舒展 */
  reheat: (strength?: number) => {
    layout?.reheat(strength ?? 0.6)
    startLoop()
  },
  /** 把某个节点移到视图中心 */
  focusNode,
  getZoom: () => view.value.scale,
  /** 当前退火系数（1 = 满能量，0 = 已静止）——用于展示动力学进度 */
  getAlpha: () => layout?.alpha ?? 0,
  /** 当前生效的力学参数（内置默认 + forceSettings + 专用 prop 合并后的结果） */
  getForceSettings: () => layout?.settings ?? null,
})
</script>

<template>
  <div ref="rootRef" class="nm-graph" :style="{ height: heightStyle }">
    <canvas
      ref="canvasRef"
      class="nm-graph__canvas"
      tabindex="0"
      role="application"
      :aria-label="resolvedAriaLabel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @dblclick="onDoubleClick"
      @keydown="onKeydown"
    />

    <div v-if="resolvedShowControls" class="nm-graph__controls">
      <button
        type="button"
        class="nm-graph__btn"
        :aria-label="t('graphZoomOut')"
        @click.stop="zoomOut"
      >
        <NeumorphismIcon name="zoom-out" size="md" />
      </button>
      <span class="nm-graph__zoom">{{ zoomPercent }}%</span>
      <button
        type="button"
        class="nm-graph__btn"
        :aria-label="t('graphZoomIn')"
        @click.stop="zoomIn"
      >
        <NeumorphismIcon name="zoom-in" size="md" />
      </button>
      <span class="nm-graph__divider" aria-hidden="true" />
      <button type="button" class="nm-graph__btn" :aria-label="t('graphZoomFit')" @click.stop="fit">
        <NeumorphismIcon name="maximize" size="md" />
      </button>
      <button
        type="button"
        class="nm-graph__btn"
        :aria-label="t('graphRelayout')"
        @click.stop="resetLayout"
      >
        <NeumorphismIcon name="refresh" size="md" />
      </button>
    </div>

    <div v-if="showLegend && legendItems.length" class="nm-graph__legend">
      <span v-for="item in legendItems" :key="item.name" class="nm-graph__legend-item">
        <i
          class="nm-graph__legend-dot"
          :style="{ backgroundColor: item.color }"
          aria-hidden="true"
        />
        {{ item.name }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-graph {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--nm-border-radius-lg);
  background-color: var(--nm-bg-color);
  @include nm-inset-strong(4px, 10px);
  @include nm-theme-transition;
}

.nm-graph__canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  // 画布自身不滚动：滚轮一律交给缩放处理
  touch-action: none;
  outline: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--nm-primary-color);
  }
}

.nm-graph__controls {
  position: absolute;
  right: var(--nm-spacing-md);
  bottom: var(--nm-spacing-md);
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-2xs);
  padding: var(--nm-spacing-xs);
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-surface-color);
  @include nm-raised-strong(4px, 10px);
  @include nm-theme-transition;
}

.nm-graph__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background-color: transparent;
  color: var(--nm-text-secondary);
  cursor: pointer;
  transition:
    color var(--nm-transition-fast),
    background-color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 1px;
  }
}

.nm-graph__zoom {
  min-width: 44px;
  font-size: var(--nm-font-xs);
  font-variant-numeric: tabular-nums;
  color: var(--nm-text-secondary);
  text-align: center;
  user-select: none;
}

.nm-graph__divider {
  width: 1px;
  height: 16px;
  margin: 0 var(--nm-spacing-2xs);
  background-color: var(--nm-border-subtle);
}

.nm-graph__legend {
  position: absolute;
  left: var(--nm-spacing-md);
  bottom: var(--nm-spacing-md);
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-xs) var(--nm-spacing-sm);
  max-width: 60%;
  padding: var(--nm-spacing-xs) var(--nm-spacing-sm);
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-surface-color);
  @include nm-raised-strong(3px, 8px);
  @include nm-theme-transition;
}

.nm-graph__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-6);
  font-size: var(--nm-font-xs);
  color: var(--nm-text-secondary);
  white-space: nowrap;
}

.nm-graph__legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
