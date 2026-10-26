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

const progressVariants = ['primary', 'success', 'warning', 'error'] as const
const progressEffects = ['default', 'pulse', 'flow', 'wave', 'stripes', 'sparkle'] as const

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
      <NeumorphismProgress
        v-if="shape === 'line'"
        :model-value="value"
        :variant="variant"
        :size="size"
        :effect="effect"
        :show-label="showLabel"
        :indeterminate="indeterminate"
      />
      <!-- 环形直径由 size 档位决定（64 / 120 / 160）；想连续调直径见下方「环形进度」块 -->
      <NeumorphismProgress
        v-else
        type="circle"
        :model-value="value"
        :variant="variant"
        :size="size"
        :show-label="showLabel"
        :indeterminate="indeterminate"
      />

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
        <code>type="line"</code> 有效；环形是 SVG 描边，选动效不会有变化。 不确定模式下
        <code>modelValue</code> 会被忽略，滑块置灰是刻意的。
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

  <div class="demo-block">
    <h4 class="demo-label">颜色变体与标签</h4>
    <div class="progress-rows form-demo-width">
      <div v-for="v in progressVariants" :key="v" class="progress-row">
        <span class="progress-row__tag">{{ v }}</span>
        <NeumorphismProgress
          :model-value="value"
          :variant="v"
          :show-label="true"
          class="progress-row__bar"
        />
      </div>
    </div>
    <!-- 这排按钮操作的就是全卡片共用的 value，所以上面四行会同步 -->
    <div class="demo-row" style="margin-top: 12px">
      <NeumorphismButton
        size="small"
        :disabled="isSimulating"
        @click="value = Math.max(0, value - 10)"
        >-10%</NeumorphismButton
      >
      <NeumorphismButton
        size="small"
        :disabled="isSimulating"
        @click="value = Math.min(100, value + 10)"
        >+10%</NeumorphismButton
      >
      <NeumorphismButton size="small" :disabled="isSimulating" @click="simulateLoading()">
        {{ isSimulating ? '加载中…' : '模拟加载' }}
      </NeumorphismButton>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">尺寸调参（条体高度）</h4>
    <div class="demo-row demo-row--stacked form-demo-width">
      <div class="demo-row">
        <NeumorphismSlider
          v-model="barHeight"
          :min="4"
          :max="24"
          :step="1"
          style="width: 200px; flex: 0 0 200px"
        />
        <code>{{ barHeight }}px</code>
      </div>
      <!--
        滑块写的是 md 档 token：这一行没有传 size，走的正是 medium 档位。
        传 small / large 时组件读的是 --nm-progress-height-sm / -lg，这里故意不联动。

        宽度给 100% 而不是复用 .progress-row__bar：那个类带 flex: 1，
        在 --stacked（纵向）容器里会变成纵向拉伸 + 横向收缩。
      -->
      <NeumorphismProgress
        :model-value="value"
        :style="{ '--nm-progress-height-md': barHeight + 'px', width: '100%' }"
      />
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">视觉动效</h4>
    <div class="progress-rows form-demo-width">
      <div v-for="e in progressEffects" :key="e" class="progress-row">
        <span class="progress-row__tag">{{ e }}</span>
        <NeumorphismProgress
          :model-value="value"
          variant="primary"
          :effect="e"
          :show-label="true"
          class="progress-row__bar"
        />
      </div>
    </div>
    <ul class="progress-effect-notes">
      <li>
        <strong>pulse 脉冲光束</strong>：一道能量光束——短尾迹渐隐，白热彗星头（核心 + 光晕 +
        拖尾星火）呼吸明灭，偶有一道细闪掠过。
      </li>
      <li><strong>flow 流光</strong>：丝绸般的光带在条体上缓缓流动。</li>
      <li><strong>wave 波光</strong>：两层液面波光相向滑过，如水光在条体内荡漾。</li>
      <li><strong>stripes 斜纹</strong>：柔和的斜向光带持续向前流动（理发店条纹）。</li>
      <li><strong>sparkle 星点</strong>：细小光点相向漂移、各自明灭，如慢速星野。</li>
    </ul>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">不确定模式</h4>
    <div class="progress-rows form-demo-width">
      <div class="progress-row">
        <span class="progress-row__tag">medium</span>
        <NeumorphismProgress :indeterminate="true" variant="primary" class="progress-row__bar" />
      </div>
      <div class="progress-row">
        <span class="progress-row__tag">small</span>
        <NeumorphismProgress
          :indeterminate="true"
          variant="success"
          size="small"
          class="progress-row__bar"
        />
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">环形进度（直径可调）</h4>
    <div class="demo-row demo-row--stacked" style="gap: 12px">
      <div class="demo-row">
        <NeumorphismSlider
          v-model="circleDiameter"
          :min="64"
          :max="200"
          :step="4"
          style="width: 200px; flex: 0 0 200px"
        />
        <code>Ø {{ circleDiameter }}px</code>
      </div>
      <div class="progress-rings">
        <div class="progress-ring">
          <!-- 组件内部几何仍是 size 档位的 120px，这里用演示级 CSS 桥接覆盖 -->
          <div
            class="demo-size-progress-circle"
            :style="{ '--demo-circle-d': circleDiameter + 'px' }"
          >
            <NeumorphismProgress
              type="circle"
              :model-value="value"
              variant="primary"
              :show-label="true"
            />
          </div>
          <span class="progress-ring__caption">determinate（直径可调）</span>
        </div>
        <div class="progress-ring">
          <NeumorphismProgress type="circle" size="medium" :indeterminate="true" />
          <span class="progress-ring__caption">indeterminate</span>
        </div>
      </div>
    </div>
  </div>
</template>
