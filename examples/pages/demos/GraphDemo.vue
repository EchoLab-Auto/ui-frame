<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import type { GraphLink, GraphNode } from '../../../src/components/NeumorphismGraphView'

/**
 * 节点图（NeumorphismGraphView，实验性）：力导向布局 + 自绘 canvas。
 *
 * 参数分三层展示：
 * 1. 配置台——最常改的四个旋钮（节点半径 / 理想边长 / 排斥强度 / 容器高度）
 *    与三个纯视觉开关，改完立刻在预览里生效；
 * 2. 力学动力学——`forceSettings` 的七个高级旋钮，用 `.graph-controls` 网格铺开；
 * 3. 交互与行为——拖拽 / 平移 / 缩放 / 自适应 / 保留坐标，外加操作按钮。
 *
 * 力学参数改动只 setSettings 不 setData，所以调参时节点留在原位；
 * 只有「重新布局」「新增 / 移除节点」这类改数据的动作才会重排。
 */

// ---- 布局与视图（组件 props）----
const graphNodeRadius = ref(7)
const graphLinkDistance = ref(78)
const graphRepulsion = ref(900)
const graphHeight = ref(520)

type GraphLabelMode = 'auto' | 'always' | 'hover'
const graphLabelMode = ref<GraphLabelMode>('auto')
const graphLabelOptions: { label: string; value: GraphLabelMode }[] = [
  { label: '自动', value: 'auto' },
  { label: '常显', value: 'always' },
  { label: '悬停', value: 'hover' },
]

// ---- 交互与行为 ----
const graphShowControls = ref(true)
const graphShowLegend = ref(true)
const graphHighlight = ref(true)
const graphDraggable = ref(true)
const graphPannable = ref(true)
const graphZoomable = ref(true)
const graphAutoFit = ref(true)
const graphPreservePositions = ref(true)

// ---- 力学动力学（经 forceSettings 下传，走的是 ForceLayout 的高级旋钮）----
const graphSpring = ref(0.008)
const graphGravity = ref(0.0004)
const graphVelocityDecay = ref(0.4)
const graphAlphaDecay = ref(0.0228)
const graphAlphaMin = ref(0.001)
const graphMaxSpeed = ref(10)
const graphMaxRepulsionForce = ref(6)

const graphForceSettings = computed(() => ({
  spring: graphSpring.value,
  gravity: graphGravity.value,
  velocityDecay: graphVelocityDecay.value,
  alphaDecay: graphAlphaDecay.value,
  alphaMin: graphAlphaMin.value,
  maxSpeed: graphMaxSpeed.value,
  maxRepulsionForce: graphMaxRepulsionForce.value,
}))

/**
 * 组件实例暴露的命令式 API。
 *
 * 只声明用得到的四个方法：`zoomIn/zoomOut/focusNode/getZoom` 在右下角缩放控件
 * 与键盘里已有入口，演示卡片上不必再摆一遍。
 */
const graphRef = ref<{
  resetLayout: () => void
  fit: () => void
  reheat: (strength?: number) => void
  getAlpha: () => number
} | null>(null)
const graphHovered = ref<GraphNode | null>(null)
const graphSelected = ref<GraphNode | null>(null)
const graphSettled = ref(false)

/** 退火系数读数：模拟运行期间轮询（静止后停表，不留下空转定时器） */
const graphAlpha = ref(0)
let graphAlphaTimer: ReturnType<typeof setInterval> | null = null

function startGraphAlphaPoll() {
  if (graphAlphaTimer) return
  graphAlphaTimer = setInterval(() => {
    graphAlpha.value = graphRef.value?.getAlpha() ?? 0
  }, 100)
}

function stopGraphAlphaPoll() {
  if (!graphAlphaTimer) return
  clearInterval(graphAlphaTimer)
  graphAlphaTimer = null
}

function onGraphLayoutStart() {
  graphSettled.value = false
  startGraphAlphaPoll()
}

function onGraphLayoutSettled() {
  graphSettled.value = true
  stopGraphAlphaPoll()
  graphAlpha.value = graphRef.value?.getAlpha() ?? 0
}

/**
 * 开屏即轮询。
 *
 * 组件只在「已静止后重新动起来」时发 `layout-start`——首次挂载那轮模拟不发，
 * 不主动起轮询的话退火读数会一直停在 0.000（而图其实在动）。静止即由
 * `layout-settled` 停表，不会留下空转定时器。
 */
onMounted(startGraphAlphaPoll)
onBeforeUnmount(stopGraphAlphaPoll)

/** 数字读数统一保留固定小数位，避免 0.008000000000000002 之类浮点噪声 */
function fmt(value: number, digits: number): string {
  return value.toFixed(digits)
}

// ---- 数据：模拟一个 Obsidian 风格的知识库（笔记 = 节点，双链 = 连线）----
const graphNodes = ref<GraphNode[]>([
  // 核心
  { id: 'philosophy', label: '设计哲学', group: '核心', size: 11 },
  { id: 'tokens', label: '设计令牌', group: '核心', size: 10 },
  { id: 'theme', label: '主题切换', group: '核心' },
  { id: 'shadows', label: '阴影模型', group: '核心' },
  { id: 'easing', label: '缓动曲线', group: '核心' },
  { id: 'a11y', label: '无障碍', group: '核心' },
  // 表单
  { id: 'button', label: '按钮', group: '表单' },
  { id: 'input', label: '输入框', group: '表单' },
  { id: 'select', label: '选择器', group: '表单' },
  { id: 'switch', label: '开关', group: '表单' },
  { id: 'slider', label: '滑块', group: '表单' },
  { id: 'form', label: '表单校验', group: '表单' },
  { id: 'datepicker', label: '日期选择', group: '表单' },
  // 数据
  { id: 'table', label: '表格', group: '数据' },
  { id: 'chart', label: '图表', group: '数据' },
  { id: 'tree', label: '树形导航', group: '数据' },
  { id: 'list', label: '列表', group: '数据' },
  { id: 'pagination', label: '分页', group: '数据' },
  { id: 'steps', label: '步骤条', group: '数据' },
  // 文档
  { id: 'doc', label: '文档渲染', group: '文档' },
  { id: 'markdown', label: 'Markdown 解析', group: '文档' },
  { id: 'code-block', label: '代码块', group: '文档' },
  { id: 'toc', label: '目录导航', group: '文档' },
  { id: 'chat', label: '聊天面板', group: '文档' },
  // 实验
  { id: 'art', label: '试验效果', group: '实验' },
  { id: 'ascii', label: '字符画', group: '实验' },
  { id: 'pixel-font', label: '像素字体', group: '实验' },
  { id: 'canvas', label: '无限画布', group: '实验' },
  { id: 'graph', label: '节点图', group: '实验', size: 10 },
])

const graphLinks = ref<GraphLink[]>([
  // 核心骨架
  { source: 'philosophy', target: 'tokens', weight: 1.6 },
  { source: 'philosophy', target: 'shadows' },
  { source: 'philosophy', target: 'easing' },
  { source: 'philosophy', target: 'a11y' },
  { source: 'tokens', target: 'theme' },
  { source: 'tokens', target: 'shadows', weight: 1.4 },
  { source: 'tokens', target: 'button' },
  { source: 'tokens', target: 'input' },
  { source: 'theme', target: 'a11y' },
  { source: 'easing', target: 'button' },
  { source: 'shadows', target: 'button', weight: 1.3 },
  { source: 'shadows', target: 'switch' },
  // 表单簇
  { source: 'button', target: 'form' },
  { source: 'input', target: 'form', weight: 1.4 },
  { source: 'select', target: 'form' },
  { source: 'switch', target: 'form' },
  { source: 'slider', target: 'form' },
  { source: 'form', target: 'datepicker' },
  { source: 'input', target: 'select', weight: 1.2 },
  { source: 'button', target: 'switch' },
  { source: 'steps', target: 'form' },
  // 数据簇
  { source: 'table', target: 'pagination' },
  { source: 'table', target: 'list', weight: 1.4 },
  { source: 'chart', target: 'table' },
  { source: 'tree', target: 'list' },
  { source: 'chart', target: 'canvas' },
  { source: 'list', target: 'tree' },
  // 文档簇
  { source: 'doc', target: 'markdown', weight: 1.6 },
  { source: 'doc', target: 'code-block' },
  { source: 'doc', target: 'toc' },
  { source: 'markdown', target: 'code-block', weight: 1.3 },
  { source: 'chat', target: 'markdown' },
  { source: 'chat', target: 'code-block' },
  { source: 'toc', target: 'doc' },
  { source: 'tree', target: 'doc' },
  // 实验簇
  { source: 'art', target: 'canvas' },
  { source: 'ascii', target: 'art', weight: 1.4 },
  { source: 'pixel-font', target: 'art' },
  { source: 'graph', target: 'canvas', weight: 1.4 },
  { source: 'graph', target: 'a11y' },
  { source: 'ascii', target: 'pixel-font' },
  { source: 'chart', target: 'doc' },
])

/** 节点度数——点击节点时展示「这篇笔记被引用了多少条双链」 */
const graphDegree = computed(() => {
  const map = new Map<string, number>()
  for (const link of graphLinks.value) {
    map.set(link.source, (map.get(link.source) ?? 0) + 1)
    map.set(link.target, (map.get(link.target) ?? 0) + 1)
  }
  return map
})

/** 增量数据演示：加/减节点，直观对比 preservePositions（保留坐标）与 autoFit */
let graphProbeSeq = 0

function addGraphNode() {
  graphProbeSeq += 1
  const id = `probe-${graphProbeSeq}`
  graphNodes.value = [
    ...graphNodes.value,
    { id, label: `新增笔记 ${graphProbeSeq}`, group: '实验' },
  ]
  graphLinks.value = [...graphLinks.value, { source: id, target: 'graph', weight: 1.4 }]
}

function removeGraphNode() {
  const probes = graphNodes.value.filter(node => node.id.startsWith('probe-'))
  if (probes.length === 0) return
  const last = probes[probes.length - 1].id
  graphNodes.value = graphNodes.value.filter(node => node.id !== last)
  graphLinks.value = graphLinks.value.filter(link => link.source !== last && link.target !== last)
  graphProbeSeq -= 1
}

/** 把所有调参恢复到与组件内置默认一致 */
function resetGraphDefaults() {
  graphNodeRadius.value = 7
  graphLinkDistance.value = 78
  graphRepulsion.value = 900
  graphHeight.value = 520
  graphLabelMode.value = 'auto'
  graphShowControls.value = true
  graphShowLegend.value = true
  graphHighlight.value = true
  graphDraggable.value = true
  graphPannable.value = true
  graphZoomable.value = true
  graphAutoFit.value = true
  graphPreservePositions.value = true
  graphSpring.value = 0.008
  graphGravity.value = 0.0004
  graphVelocityDecay.value = 0.4
  graphAlphaDecay.value = 0.0228
  graphAlphaMin.value = 0.001
  graphMaxSpeed.value = 10
  graphMaxRepulsionForce.value = 6
}

function onGraphNodeClick(node: GraphNode) {
  graphSelected.value = node
}

function onGraphNodeHover(node: GraphNode | null) {
  graphHovered.value = node
}

// ---- 实时代码片段 ----
/** 与 DEFAULT_FORCE_SETTINGS 对齐的出厂值：只有偏离的旋钮才写进 forceSettings */
const FORCE_DEFAULTS = {
  spring: 0.008,
  gravity: 0.0004,
  velocityDecay: 0.4,
  alphaDecay: 0.0228,
  alphaMin: 0.001,
  maxSpeed: 10,
  maxRepulsionForce: 6,
}

const snippet = computed(() => {
  const attrs: string[] = [':nodes="nodes"', ':links="links"']
  // 下面的比对基准都是组件内置默认（见 NeumorphismGraphView 的 withDefaults）
  if (graphHeight.value !== 520) attrs.push(`:height="${graphHeight.value}"`)
  if (graphNodeRadius.value !== 7) attrs.push(`:node-radius="${graphNodeRadius.value}"`)
  if (graphLinkDistance.value !== 78) attrs.push(`:link-distance="${graphLinkDistance.value}"`)
  if (graphRepulsion.value !== 900) attrs.push(`:repulsion="${graphRepulsion.value}"`)

  // [键名, 当前值, 出厂值, 读数小数位]——小数位与滑块 step 一致，免得片段里出现浮点尾巴。
  // 必须放在 computed 内部现算：放模块作用域会在 setup 时就把值定格在初始状态。
  const forcePairs: [keyof typeof FORCE_DEFAULTS, number, number, number][] = [
    ['spring', graphSpring.value, FORCE_DEFAULTS.spring, 3],
    ['gravity', graphGravity.value, FORCE_DEFAULTS.gravity, 4],
    ['velocityDecay', graphVelocityDecay.value, FORCE_DEFAULTS.velocityDecay, 2],
    ['alphaDecay', graphAlphaDecay.value, FORCE_DEFAULTS.alphaDecay, 3],
    ['alphaMin', graphAlphaMin.value, FORCE_DEFAULTS.alphaMin, 4],
    ['maxSpeed', graphMaxSpeed.value, FORCE_DEFAULTS.maxSpeed, 0],
    ['maxRepulsionForce', graphMaxRepulsionForce.value, FORCE_DEFAULTS.maxRepulsionForce, 1],
  ]
  const forceDiff = forcePairs
    .filter(([, value, fallback]) => value !== fallback)
    .map(([key, value, , digits]) => `${key}: ${Number(value.toFixed(digits))}`)
  if (forceDiff.length) attrs.push(`:force-settings="{ ${forceDiff.join(', ')} }"`)

  if (graphLabelMode.value !== 'auto') attrs.push(`show-labels="${graphLabelMode.value}"`)
  if (!graphShowControls.value) attrs.push(':show-controls="false"')
  if (graphShowLegend.value) attrs.push(':show-legend="true"')
  if (!graphHighlight.value) attrs.push(':highlight-neighbors="false"')
  if (!graphDraggable.value) attrs.push(':draggable="false"')
  if (!graphPannable.value) attrs.push(':pannable="false"')
  if (!graphZoomable.value) attrs.push(':zoomable="false"')
  if (!graphAutoFit.value) attrs.push(':auto-fit="false"')
  if (!graphPreservePositions.value) attrs.push(':preserve-positions="false"')

  attrs.push('@node-click="onNodeClick"', '@node-hover="onNodeHover"')
  return `<NeumorphismGraphView\n  ${attrs.join('\n  ')}\n/>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <!-- 图自带凹陷底色与圆角，预览台背景切换看不出差别，故关掉切换器 -->
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!-- 舞台显式撑满：图内部是按容器宽度自适应的，宽度塌成内容宽就没得看了 -->
      <div class="graph-stage" style="width: 100%">
        <NeumorphismGraphView
          ref="graphRef"
          :nodes="graphNodes"
          :links="graphLinks"
          :height="graphHeight"
          :node-radius="graphNodeRadius"
          :link-distance="graphLinkDistance"
          :repulsion="graphRepulsion"
          :force-settings="graphForceSettings"
          :show-labels="graphLabelMode"
          :show-controls="graphShowControls"
          :show-legend="graphShowLegend"
          :highlight-neighbors="graphHighlight"
          :draggable="graphDraggable"
          :pannable="graphPannable"
          :zoomable="graphZoomable"
          :auto-fit="graphAutoFit"
          :preserve-positions="graphPreservePositions"
          aria-label="组件库知识库节点图"
          @node-click="onGraphNodeClick"
          @node-hover="onGraphNodeHover"
          @layout-start="onGraphLayoutStart"
          @layout-settled="onGraphLayoutSettled"
        />
      </div>

      <div class="graph-readout" style="width: 100%">
        <span class="graph-readout__item">
          节点 <b>{{ graphNodes.length }}</b> · 连线 <b>{{ graphLinks.length }}</b>
        </span>
        <span class="graph-readout__item">
          悬停
          <b>{{ graphHovered ? graphHovered.label : '—' }}</b>
        </span>
        <span class="graph-readout__item">
          选中
          <b>{{ graphSelected ? graphSelected.label : '—' }}</b>
          <template v-if="graphSelected">
            （{{ graphSelected.group }} · {{ graphDegree.get(graphSelected.id) ?? 0 }} 条双链）
          </template>
        </span>
        <span class="graph-readout__item">
          状态
          <b>{{ graphSettled ? '已静止' : '力学模拟中' }}</b>
        </span>
        <span class="graph-readout__item">
          退火 alpha
          <b class="graph-readout__num">{{ fmt(graphAlpha, 3) }}</b>
        </span>
      </div>

      <template #hint>
        拖拽节点可临时钉住并牵引邻居，拖背景平移，滚轮以光标为锚点缩放，双击节点居中；
        悬停高亮一度邻居、其余淡化。键盘：方向键切换节点、Enter 选中、<code>+</code> /
        <code>-</code> 缩放、<code>0</code> 适应视图。
      </template>

      <template #config>
        <DemoField label="节点半径" :value="`${graphNodeRadius}px`" label-width="88px" grow>
          <NeumorphismSlider v-model="graphNodeRadius" :min="2" :max="20" :step="1" size="small" />
        </DemoField>

        <DemoField label="理想边长" :value="`${graphLinkDistance}px`" label-width="88px" grow>
          <NeumorphismSlider
            v-model="graphLinkDistance"
            :min="40"
            :max="200"
            :step="2"
            size="small"
          />
        </DemoField>

        <DemoField label="排斥强度" :value="`${graphRepulsion}`" label-width="88px" grow>
          <NeumorphismSlider
            v-model="graphRepulsion"
            :min="100"
            :max="3000"
            :step="50"
            size="small"
          />
        </DemoField>

        <DemoField label="容器高度" :value="`${graphHeight}px`" label-width="88px" grow>
          <NeumorphismSlider v-model="graphHeight" :min="320" :max="760" :step="20" size="small" />
        </DemoField>

        <!-- 只把「看一眼就知道效果」的视觉开关放这里；交互与行为类集中在后面那组 -->
        <DemoField label="图例" label-width="88px">
          <NeumorphismSwitch v-model="graphShowLegend" size="small" />
        </DemoField>

        <DemoField label="缩放控件" label-width="88px">
          <NeumorphismSwitch v-model="graphShowControls" size="small" />
        </DemoField>

        <DemoField label="高亮邻居" label-width="88px">
          <NeumorphismSwitch v-model="graphHighlight" size="small" />
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">力学动力学（forceSettings → ForceLayout）</h4>
    <div class="graph-controls">
      <div class="graph-ctl">
        <span class="graph-ctl__label">弹簧刚度 spring</span>
        <NeumorphismSlider
          v-model="graphSpring"
          :min="0.001"
          :max="0.03"
          :step="0.001"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphSpring, 3) }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">向心引力 gravity</span>
        <NeumorphismSlider
          v-model="graphGravity"
          :min="0"
          :max="0.002"
          :step="0.0001"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphGravity, 4) }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">速度衰减 velocityDecay</span>
        <NeumorphismSlider
          v-model="graphVelocityDecay"
          :min="0"
          :max="0.9"
          :step="0.05"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphVelocityDecay, 2) }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">单帧限速 maxSpeed</span>
        <NeumorphismSlider
          v-model="graphMaxSpeed"
          :min="2"
          :max="40"
          :step="1"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ graphMaxSpeed }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">退火速率 alphaDecay</span>
        <NeumorphismSlider
          v-model="graphAlphaDecay"
          :min="0.004"
          :max="0.12"
          :step="0.002"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphAlphaDecay, 3) }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">退火下限 alphaMin</span>
        <NeumorphismSlider
          v-model="graphAlphaMin"
          :min="0.0004"
          :max="0.02"
          :step="0.0001"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphAlphaMin, 4) }}</code>
      </div>
      <div class="graph-ctl">
        <span class="graph-ctl__label">排斥上限 maxRepulsion</span>
        <NeumorphismSlider
          v-model="graphMaxRepulsionForce"
          :min="1"
          :max="20"
          :step="0.5"
          size="small"
          style="flex: 1"
        />
        <code class="graph-ctl__value">{{ fmt(graphMaxRepulsionForce, 1) }}</code>
      </div>
    </div>
    <p class="demo-hint" style="margin-top: 10px">
      力学参数改动只更新引擎设置、不重建节点——位置得以保留，拖滑块时图不会整图重排。
      想看"从零重排"点「重新布局」；想温和舒展点「重新唤醒」。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">视图 / 交互 / 行为（开关类 props）</h4>
    <div class="graph-switches">
      <div class="graph-switch">
        <NeumorphismSwitch v-model="graphDraggable" size="small" />
        <span>拖拽节点 draggable</span>
      </div>
      <div class="graph-switch">
        <NeumorphismSwitch v-model="graphPannable" size="small" />
        <span>拖背景平移 pannable</span>
      </div>
      <div class="graph-switch">
        <NeumorphismSwitch v-model="graphZoomable" size="small" />
        <span>缩放 zoomable</span>
      </div>
      <div class="graph-switch">
        <NeumorphismSwitch v-model="graphAutoFit" size="small" />
        <span>自动适应 autoFit</span>
      </div>
      <div class="graph-switch">
        <NeumorphismSwitch v-model="graphPreservePositions" size="small" />
        <span>保留坐标 preservePositions</span>
      </div>
    </div>

    <div class="demo-row" style="flex-wrap: wrap; gap: 24px; align-items: center">
      <div class="demo-row">
        <span class="demo-form-label">标签 showLabels</span>
        <NeumorphismSegmented v-model="graphLabelMode" :options="graphLabelOptions" size="small" />
      </div>
    </div>

    <div class="graph-actions">
      <NeumorphismButton variant="raised" size="small" @click="graphRef?.fit()">
        适应视图
      </NeumorphismButton>
      <NeumorphismButton variant="pressed" size="small" @click="graphRef?.resetLayout()">
        重新布局
      </NeumorphismButton>
      <NeumorphismButton variant="raised" size="small" @click="graphRef?.reheat(0.6)">
        重新唤醒
      </NeumorphismButton>
      <NeumorphismButton variant="raised" size="small" @click="addGraphNode()">
        ＋ 新增节点
      </NeumorphismButton>
      <NeumorphismButton variant="raised" size="small" @click="removeGraphNode()">
        － 移除节点
      </NeumorphismButton>
      <NeumorphismButton variant="raised" size="small" @click="resetGraphDefaults()">
        恢复默认
      </NeumorphismButton>
    </div>
    <p class="demo-hint" style="margin-top: 10px">
      「新增 / 移除节点」会改动数据：<code>preservePositions</code>
      打开时既有节点留在原位、只有新节点补位（配合
      <code>autoFit</code> 自动收进视野）；关掉它整图会重新播种。节点少时可显著看到
      <code>autoFit</code> 引起的视图变化。图例 / 缩放控件 / 高亮邻居三个纯视觉开关在上方配置台里。
    </p>
  </div>
</template>
