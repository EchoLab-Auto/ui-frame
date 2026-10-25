export { default } from './NeumorphismGraphView.vue'
export type { NeumorphismGraphViewProps } from './NeumorphismGraphView.vue'

export type { GraphLabelMode, GraphLink, GraphNode, GraphView } from './types'

// 头less 布局引擎（可在无 DOM 环境下单独使用 / 自行渲染）
export { ForceLayout, DEFAULT_FORCE_SETTINGS } from './forceLayout'
export type { ForceSettings, SetDataOptions, SimLink, SimNode } from './forceLayout'

// 视图变换工具（可逆、无 DOM 依赖，便于自定义渲染器复用）
export {
  GOLDEN_ANGLE,
  boundsOf,
  clampScale,
  distance,
  fitTransform,
  screenToWorld,
  seedPosition,
  worldToScreen,
  zoomAt,
} from './graphMath'
export type { Bounds, Point, Size } from './graphMath'
