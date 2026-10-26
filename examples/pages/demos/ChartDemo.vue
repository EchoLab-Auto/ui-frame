<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type BarOrientation = 'vertical' | 'horizontal'
type LineCurve = 'linear' | 'smooth' | 'step'

// ---- 配置台状态（主角是柱状图：分组 / 堆叠 × 纵向 / 横向）----
const stacked = ref(false)
const orientation = ref<BarOrientation>('vertical')
const height = ref(300)
const showLegend = ref(true)
const showGrid = ref(true)

// ---- 折线图自己的两个开关（柱状图是主角，所以把它们放在折线块里）----
const lineCurve = ref<LineCurve>('smooth')
const lineArea = ref(true)

/**
 * 分组 / 堆叠用 computed 代理而不是在模板里 `@update:model-value="v => ..."`：
 * 组件发出的是 `string | number`，代理里做一次收窄，模板就只剩一个干净的 v-model。
 */
const stackMode = computed<'grouped' | 'stacked'>({
  get: () => (stacked.value ? 'stacked' : 'grouped'),
  set: mode => {
    stacked.value = mode === 'stacked'
  },
})

const stackModeOptions = [
  { label: '分组', value: 'grouped' },
  { label: '堆叠', value: 'stacked' },
]
const orientationOptions = [
  { label: '纵向', value: 'vertical' },
  { label: '横向', value: 'horizontal' },
]
const curveOptions = [
  { label: '折线', value: 'linear' },
  { label: '平滑', value: 'smooth' },
  { label: '阶梯', value: 'step' },
]

/**
 * MA 周期写成常量而不是模板里的 `:ma-periods="[5, 10, 20]"`：
 * 内联数组每次渲染都是新引用，会让内部的 watch 白跑一遍。
 */
const maPeriods = [5, 10, 20]

function reset() {
  stacked.value = false
  orientation.value = 'vertical'
  height.value = 300
  showLegend.value = true
  showGrid.value = true
  lineCurve.value = 'smooth'
  lineArea.value = true
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = [':series="series"']
  if (stacked.value) attrs.push('stacked')
  if (orientation.value !== 'vertical') attrs.push(`orientation="${orientation.value}"`)
  if (height.value !== 300) attrs.push(`height="${height.value}px"`)
  if (!showLegend.value) attrs.push(':show-legend="false"')
  if (!showGrid.value) attrs.push(':show-grid="false"')
  return `<NeumorphismChartBar ${attrs.join(' ')} />`
})

// ---- 示例数据（与原演示一致，直接内联，避免额外数据文件）----
const chartBarData = [
  {
    name: '产品A',
    data: [
      { label: 'Q1', value: 40 },
      { label: 'Q2', value: 70 },
      { label: 'Q3', value: 55 },
      { label: 'Q4', value: 90 },
    ],
  },
  {
    name: '产品B',
    data: [
      { label: 'Q1', value: 30 },
      { label: 'Q2', value: 50 },
      { label: 'Q3', value: 45 },
      { label: 'Q4', value: 65 },
    ],
  },
]

const chartBarDataStacked = [
  {
    name: '线上',
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 150 },
      { label: '3月', value: 180 },
      { label: '4月', value: 140 },
    ],
  },
  {
    name: '线下',
    data: [
      { label: '1月', value: 80 },
      { label: '2月', value: 90 },
      { label: '3月', value: 100 },
      { label: '4月', value: 110 },
    ],
  },
]

const chartLineData = [
  {
    name: '访问量',
    data: [
      { label: '1月', value: 400 },
      { label: '2月', value: 600 },
      { label: '3月', value: 550 },
      { label: '4月', value: 720 },
      { label: '5月', value: 680 },
      { label: '6月', value: 810 },
    ],
  },
  {
    name: '注册量',
    data: [
      { label: '1月', value: 100 },
      { label: '2月', value: 180 },
      { label: '3月', value: 150 },
      { label: '4月', value: 220 },
      { label: '5月', value: 200 },
      { label: '6月', value: 260 },
    ],
  },
]

const chartPieData = [
  { label: 'Vue 3', value: 45 },
  { label: 'React', value: 30 },
  { label: 'Angular', value: 15 },
  { label: '其他', value: 10 },
]

const chartDonutData = [
  { label: '已完成', value: 65 },
  { label: '进行中', value: 25 },
  { label: '未开始', value: 10 },
]

// ---- K 线图示例数据 (模拟 60 个交易日) ----
const chartStockData = [
  { date: '2024-07-01', open: 102, high: 106, low: 101, close: 105, volume: 82000 },
  { date: '2024-07-02', open: 105, high: 108, low: 104, close: 106, volume: 95000 },
  { date: '2024-07-03', open: 106, high: 110, low: 105, close: 109, volume: 110000 },
  { date: '2024-07-04', open: 109, high: 111, low: 107, close: 108, volume: 78000 },
  { date: '2024-07-05', open: 108, high: 112, low: 107, close: 111, volume: 88000 },
  { date: '2024-07-08', open: 111, high: 114, low: 110, close: 113, volume: 92000 },
  { date: '2024-07-09', open: 113, high: 115, low: 109, close: 110, volume: 105000 },
  { date: '2024-07-10', open: 110, high: 112, low: 107, close: 108, volume: 120000 },
  { date: '2024-07-11', open: 108, high: 109, low: 103, close: 104, volume: 140000 },
  { date: '2024-07-12', open: 104, high: 108, low: 102, close: 107, volume: 115000 },
  { date: '2024-07-15', open: 107, high: 113, low: 106, close: 112, volume: 98000 },
  { date: '2024-07-16', open: 112, high: 116, low: 111, close: 115, volume: 130000 },
  { date: '2024-07-17', open: 115, high: 118, low: 113, close: 114, volume: 125000 },
  { date: '2024-07-18', open: 114, high: 117, low: 112, close: 116, volume: 108000 },
  { date: '2024-07-19', open: 116, high: 120, low: 115, close: 119, volume: 135000 },
  { date: '2024-07-22', open: 119, high: 122, low: 118, close: 121, volume: 142000 },
  { date: '2024-07-23', open: 121, high: 124, low: 119, close: 120, volume: 118000 },
  { date: '2024-07-24', open: 120, high: 121, low: 116, close: 117, volume: 155000 },
  { date: '2024-07-25', open: 117, high: 118, low: 113, close: 114, volume: 160000 },
  { date: '2024-07-26', open: 114, high: 117, low: 113, close: 116, volume: 128000 },
  { date: '2024-07-29', open: 116, high: 120, low: 115, close: 118, volume: 105000 },
  { date: '2024-07-30', open: 118, high: 121, low: 117, close: 120, volume: 112000 },
  { date: '2024-07-31', open: 120, high: 123, low: 119, close: 122, volume: 138000 },
  { date: '2024-08-01', open: 122, high: 125, low: 120, close: 121, volume: 145000 },
  { date: '2024-08-02', open: 121, high: 122, low: 117, close: 118, volume: 160000 },
  { date: '2024-08-05', open: 118, high: 119, low: 114, close: 115, volume: 180000 },
  { date: '2024-08-06', open: 115, high: 117, low: 112, close: 116, volume: 155000 },
  { date: '2024-08-07', open: 116, high: 120, low: 115, close: 119, volume: 142000 },
  { date: '2024-08-08', open: 119, high: 122, low: 118, close: 121, volume: 130000 },
  { date: '2024-08-09', open: 121, high: 124, low: 120, close: 123, volume: 148000 },
  { date: '2024-08-12', open: 123, high: 127, low: 122, close: 126, volume: 165000 },
  { date: '2024-08-13', open: 126, high: 128, low: 124, close: 125, volume: 138000 },
  { date: '2024-08-14', open: 125, high: 129, low: 124, close: 128, volume: 152000 },
  { date: '2024-08-15', open: 128, high: 130, low: 126, close: 129, volume: 170000 },
  { date: '2024-08-16', open: 129, high: 132, low: 128, close: 131, volume: 185000 },
  { date: '2024-08-19', open: 131, high: 134, low: 130, close: 133, volume: 175000 },
  { date: '2024-08-20', open: 133, high: 136, low: 132, close: 134, volume: 168000 },
  { date: '2024-08-21', open: 134, high: 135, low: 130, close: 131, volume: 155000 },
  { date: '2024-08-22', open: 131, high: 132, low: 127, close: 128, volume: 180000 },
  { date: '2024-08-23', open: 128, high: 131, low: 127, close: 130, volume: 162000 },
  { date: '2024-08-26', open: 130, high: 133, low: 129, close: 132, volume: 148000 },
  { date: '2024-08-27', open: 132, high: 135, low: 131, close: 134, volume: 158000 },
  { date: '2024-08-28', open: 134, high: 137, low: 133, close: 136, volume: 172000 },
  { date: '2024-08-29', open: 136, high: 138, low: 134, close: 135, volume: 145000 },
  { date: '2024-08-30', open: 135, high: 139, low: 134, close: 138, volume: 190000 },
  { date: '2024-09-02', open: 138, high: 141, low: 137, close: 140, volume: 178000 },
  { date: '2024-09-03', open: 140, high: 142, low: 138, close: 139, volume: 165000 },
  { date: '2024-09-04', open: 139, high: 140, low: 135, close: 136, volume: 168000 },
  { date: '2024-09-05', open: 136, high: 138, low: 134, close: 137, volume: 152000 },
  { date: '2024-09-06', open: 137, high: 138, low: 133, close: 134, volume: 170000 },
  { date: '2024-09-09', open: 134, high: 137, low: 132, close: 136, volume: 160000 },
  { date: '2024-09-10', open: 136, high: 139, low: 135, close: 138, volume: 155000 },
  { date: '2024-09-11', open: 138, high: 140, low: 136, close: 139, volume: 148000 },
  { date: '2024-09-12', open: 139, high: 142, low: 138, close: 141, volume: 175000 },
  { date: '2024-09-13', open: 141, high: 144, low: 140, close: 143, volume: 188000 },
  { date: '2024-09-16', open: 143, high: 145, low: 141, close: 142, volume: 165000 },
  { date: '2024-09-17', open: 142, high: 145, low: 141, close: 144, volume: 172000 },
  { date: '2024-09-18', open: 144, high: 147, low: 143, close: 146, volume: 195000 },
  { date: '2024-09-19', open: 146, high: 148, low: 144, close: 145, volume: 180000 },
  { date: '2024-09-20', open: 145, high: 148, low: 144, close: 147, volume: 188000 },
]
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（柱状图，左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <NeumorphismChartBar
        :series="chartBarData"
        :stacked="stacked"
        :orientation="orientation"
        :height="`${height}px`"
        :show-legend="showLegend"
        :show-grid="showGrid"
      />

      <template #spec>
        模式=<b>{{ stacked ? '堆叠' : '分组' }}</b> · orientation=<b>{{ orientation }}</b> ·
        height=<b>{{ height }}px</b> · 图例=<b>{{ showLegend ? '开' : '关' }}</b> · 网格=<b>{{
          showGrid ? '开' : '关'
        }}</b>
      </template>

      <template #hint>
        堆叠与分组共用同一份 <code>series</code>：<code>stacked</code> 只改变同一 label
        上的柱体是并排还是累加。横向布局（<code>orientation="horizontal"</code>）在类目变多、标签变长时更好读。
      </template>

      <template #config>
        <DemoField label="模式 stacked">
          <NeumorphismSegmented v-model="stackMode" :options="stackModeOptions" size="small" />
        </DemoField>

        <DemoField label="方向 orientation">
          <NeumorphismSegmented v-model="orientation" :options="orientationOptions" size="small" />
        </DemoField>

        <DemoField label="高度 height" :value="`${height}px`" grow>
          <NeumorphismSlider v-model="height" :min="200" :max="420" :step="20" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showLegend" size="small" />
              <span>show-legend</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showGrid" size="small" />
              <span>show-grid</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="pressed" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">柱状图（分组）</h4>
    <NeumorphismChartBar :series="chartBarData" title="季度销售对比" height="280px" />
  </div>

  <div class="demo-block">
    <h4 class="demo-label">柱状图（堆叠）</h4>
    <NeumorphismChartBar
      :series="chartBarDataStacked"
      title="月度渠道销售"
      :stacked="true"
      height="280px"
    />
  </div>

  <div class="demo-block">
    <h4 class="demo-label">折线图（平滑曲线 + 面积填充）</h4>
    <div class="demo-row" style="margin-bottom: 12px">
      <span class="demo-form-label">曲线 curve</span>
      <NeumorphismSegmented v-model="lineCurve" :options="curveOptions" size="small" />
      <span class="demo-form-label">面积 area</span>
      <!-- .demo-toggle 只定义在 .demo-playground__stage 里，这块在预览台之外，所以只用行内间距 -->
      <NeumorphismSwitch v-model="lineArea" size="small" />
      <code>area-opacity=0.08</code>
    </div>
    <NeumorphismChartLine
      :series="chartLineData"
      title="月度访客趋势"
      :area="lineArea"
      :area-opacity="0.08"
      :curve="lineCurve"
      height="280px"
    />
  </div>

  <div class="demo-block">
    <h4 class="demo-label">饼图（外标签 / 内标签 + 自定义 center 插槽）</h4>
    <div class="demo-row" style="align-items: flex-start">
      <div style="width: 45%; min-width: 240px">
        <NeumorphismChartPie
          :data="chartPieData"
          title="框架使用占比"
          label-position="outside"
          height="280px"
        />
      </div>
      <div style="width: 45%; min-width: 240px">
        <NeumorphismChartPie
          :data="chartDonutData"
          title="项目进度"
          :inner-radius="50"
          label-position="inside"
          height="280px"
        >
          <template #center="{ total }">
            <div style="text-align: center">
              <div style="font-size: 20px; font-weight: 700; color: var(--nm-text-primary)">
                {{ total }}
              </div>
              <div style="font-size: 11px; color: var(--nm-text-secondary)">总任务</div>
            </div>
          </template>
        </NeumorphismChartPie>
      </div>
    </div>
    <p class="demo-hint">
      <code>inner-radius</code> 大于 0 才会露出圆心，<code>#center</code> 插槽的作用域参数是
      <code>{ total }</code>（各扇区数值之和）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">K 线图（OHLC + 成交量 + MA 均线）</h4>
    <NeumorphismChartCandlestick
      :data="chartStockData"
      title="股价走势"
      :show-volume="true"
      :show-ma="true"
      :ma-periods="maPeriods"
      height="420px"
    />
  </div>
</template>
