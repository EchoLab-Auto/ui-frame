<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

/**
 * 本地别名刻意与组件 props 的字面量一一对应：条形是 `line` 而不是 `bar`，
 * 因为组件内部的 SVG 分支判断的是 `type === 'circle'`，其余一律当条形处理。
 */
type ProgressVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'
type ProgressEffect = 'default' | 'pulse' | 'flow' | 'wave' | 'stripes' | 'sparkle'
type ProgressShape = 'line' | 'circle'
type ProgressSize = 'small' | 'medium' | 'large'

// ---- 配置台状态 ----
const variant = ref<ProgressVariant>('primary')
const effect = ref<ProgressEffect>('default')
const shape = ref<ProgressShape>('line')
const size = ref<ProgressSize>('medium')
const showLabel = ref(false)
const indeterminate = ref(false)

/**
 * 整张卡片共用一个进度值。
 *
 * 演示的意图就是「同一个 modelValue 驱动条形 / 环形 / 五种动效」，
 * 所以拖动配置台滑块时下面几块会一起动——这是特性，不是状态没隔离。
 */
const value = ref(60)
const isSimulating = ref(false)
let simulateTimer: ReturnType<typeof setInterval> | null = null

// ---- 尺寸调参（两块的滑块各自独立，与配置台的 size 档位互补）----
const barHeight = ref(8)
const circleDiameter = ref(120)

const variantOptions = [
  { label: '默认', value: 'default' },
  { label: '主色', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const shapeOptions = [
  { label: '条形', value: 'line' },
  { label: '环形', value: 'circle' },
]
/** 动效有 6 项，Segmented 一行塞不进 320px 的配置栏，所以用下拉 */
const effectOptions = [
  { label: '无（default）', value: 'default' },
  { label: '脉冲 pulse', value: 'pulse' },
  { label: '流光 flow', value: 'flow' },
  { label: '波光 wave', value: 'wave' },
  { label: '斜纹 stripes', value: 'stripes' },
  { label: '星点 sparkle', value: 'sparkle' },
]

function stopSimulation() {
  if (simulateTimer) {
    clearInterval(simulateTimer)
    simulateTimer = null
  }
  isSimulating.value = false
}

/**
 * 模拟一次真实加载：从 0 起随机步进到 100。
 *
 * 计时器由本组件自己持有——演示文件是页面的子组件，切换路由/卸载卡片时
 * 必须清掉，否则会继续改一个已卸载组件的 ref。
 */
function simulateLoading() {
  if (isSimulating.value) return
  stopSimulation()
  value.value = 0
  isSimulating.value = true
  simulateTimer = setInterval(() => {
    value.value = Math.min(100, value.value + Math.ceil(Math.random() * 14))
    if (value.value >= 100) stopSimulation()
  }, 240)
}

onBeforeUnmount(stopSimulation)

function reset() {
  variant.value = 'primary'
  effect.value = 'default'
  shape.value = 'line'
  size.value = 'medium'
  showLabel.value = false
  indeterminate.value = false
  value.value = 60
  barHeight.value = 8
  circleDiameter.value = 120
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (shape.value === 'circle') attrs.push('type="circle"')
  if (variant.value !== 'primary') attrs.push(`variant="${variant.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  // 五种动效都画在 .nm-progress__bar 的伪元素上；环形走 SVG 描边，不吃 effect
  if (effect.value !== 'default' && shape.value === 'line') attrs.push(`effect="${effect.value}"`)
  if (indeterminate.value) attrs.push('indeterminate')
  if (showLabel.value) attrs.push('show-label')

  // 不确定模式下 modelValue 被组件忽略，写出来只会误导
  const valueAttr = indeterminate.value ? '' : ` :model-value="${value.value}"`
  const head = `<NeumorphismProgress${valueAttr}${attrs.map(a => ` ${a}`).join('')} />`
  const notes: string[] = []
  if (effect.value !== 'default' && shape.value === 'circle') {
    notes.push('<!-- effect 只作用于条形：环形由 SVG 描边绘制，不消费动效层 -->')
  }
  if (showLabel.value && shape.value === 'circle') {
    notes.push('<!-- 环形的 show-label 画在圆心，不是右侧读数 -->')
  }
  return [head, ...notes].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <!-- 条体高度与环形直径都写成 token / 桥接变量，滑块一改预览立刻跟着变 -->
      <NeumorphismProgress
        v-if="shape === 'line'"
        :model-value="value"
        :variant="variant"
        :size="size"
        :effect="effect"
        :show-label="showLabel"
        :indeterminate="indeterminate"
        :style="{ '--nm-progress-height-md': `${barHeight}px`, width: '100%' }"
      />
      <div
        v-else
        class="demo-size-progress-circle"
        :style="{ '--demo-circle-d': `${circleDiameter}px` }"
      >
        <NeumorphismProgress
          type="circle"
          :model-value="value"
          :variant="variant"
          :show-label="showLabel"
          :indeterminate="indeterminate"
        />
      </div>

      <template #spec>
        type=<b>{{ shape }}</b> · variant=<b>{{ variant }}</b> · size=<b>{{ size }}</b> · effect=<b
          >{{ effect }}</b
        >
        · modelValue=<b>{{ indeterminate ? '—' : value }}</b>
        <template v-if="indeterminate"> · indeterminate</template>
        <template v-if="showLabel"> · show-label</template>
      </template>

      <template #hint>
        五种动效都挂在条体（<code>.nm-progress__bar</code>）的伪元素上，所以只对
        <code>type="line"</code> 有效——环形是 SVG 描边，选动效不会有变化；不确定模式下
        <code>modelValue</code> 被忽略，进度滑块置灰是刻意的。
        <br />
        <strong>pulse</strong> 一道能量光束（白热彗星头 + 拖尾星火，偶有细闪掠过）·
        <strong>flow</strong> 丝绸般的光带缓缓流动 · <strong>wave</strong> 两层液面波光相向滑过 ·
        <strong>stripes</strong> 柔和斜纹持续向前（理发店条纹）·
        <strong>sparkle</strong> 细小光点相向漂移、各自明灭。
      </template>

      <template #config>
        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="形状 type">
          <NeumorphismSegmented v-model="shape" :options="shapeOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="动效 effect">
          <NeumorphismSelect
            v-model="effect"
            :options="effectOptions"
            :disabled="shape === 'circle'"
            size="small"
          />
        </DemoField>

        <DemoField label="进度 modelValue" :value="`${value}%`" grow>
          <NeumorphismSlider
            v-model="value"
            :min="0"
            :max="100"
            :step="5"
            :disabled="indeterminate"
            size="small"
          />
        </DemoField>

        <DemoField label="条体高度" :value="`${barHeight}px`" grow>
          <NeumorphismSlider v-model="barHeight" :min="4" :max="24" :step="1" size="small" />
        </DemoField>

        <DemoField label="环直径" :value="`Ø ${circleDiameter}px`" grow>
          <NeumorphismSlider v-model="circleDiameter" :min="64" :max="200" :step="4" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showLabel" size="small" />
              <span>show-label</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="indeterminate" size="small" />
              <span>indeterminate</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton
            variant="raised"
            size="small"
            :disabled="isSimulating"
            @click="simulateLoading()"
            >{{ isSimulating ? '加载中…' : '播放模拟加载' }}</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
