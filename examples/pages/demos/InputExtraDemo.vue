<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type SliderSize = 'small' | 'medium' | 'large'

// ---- 配置台主角：NeumorphismSlider ----
const sliderValue = ref(40)
const sliderMin = ref(0)
const sliderMax = ref(100)
const sliderStep = ref(1)
const showTooltip = ref(true)
const showStops = ref(false)
const sliderDisabled = ref(false)
const sliderSize = ref<SliderSize>('medium')

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/**
 * 区间或步长一变，就把当前值夹回合法范围并对齐刻度。
 *
 * 三个滑块各管一头：把 max 从 200 拖回 60、或把 min 往上推，当前值都可能落到区间外，
 * 读数与滑块位置就对不上了；不对齐步长时，值还会卡在两根刻度之间——开了 show-stops
 * 看起来像渲染 bug。
 *
 * min 的上限（40）与 max 的下限（60）故意不交叉，从结构上排除 min ≥ max 的非法组合。
 */
watch([sliderMin, sliderMax, sliderStep], ([min, max, step]) => {
  const clamped = Math.min(Math.max(sliderValue.value, min), max)
  const snapped = Math.round((clamped - min) / step) * step + min
  sliderValue.value = Math.min(Math.max(snapped, min), max)
})

// ---- 另外三个组件的最小示例状态 ----
const demoInputNumber = ref<number | undefined>(3)
const demoDate = ref<Date | null>(null)
const demoAutoComplete = ref<string | number | undefined>('')

const autoCompleteOptions = [
  { label: 'Vue 3', value: 'vue' },
  { label: 'Vite', value: 'vite' },
  { label: 'Vitest', value: 'vitest' },
  { label: 'Vue Router', value: 'router' },
]

/**
 * DatePicker 内部按 `yyyy-MM-dd` 呈现，这里自己格式化读数，
 * 避免直接用 toLocaleDateString 在不同环境下拿到不同分隔符。
 */
function formatDate(date: Date | null): string {
  if (!date) return '未选择'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const autoCompleteLabel = computed(() => {
  const hit = autoCompleteOptions.find(option => option.value === demoAutoComplete.value)
  if (hit) return hit.label
  return demoAutoComplete.value ? String(demoAutoComplete.value) : '无'
})

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="value"']
  // min=0 / max=100 / step=1 是组件默认值，没改过就不写进片段
  if (sliderMin.value !== 0) attrs.push(`:min="${sliderMin.value}"`)
  if (sliderMax.value !== 100) attrs.push(`:max="${sliderMax.value}"`)
  if (sliderStep.value !== 1) attrs.push(`:step="${sliderStep.value}"`)
  // showTooltip 默认是开的（可被全局配置改），关掉时必须显式传 false
  if (!showTooltip.value) attrs.push(':show-tooltip="false"')
  if (showStops.value) attrs.push('show-stops')
  if (sliderDisabled.value) attrs.push('disabled')
  if (sliderSize.value !== 'medium') attrs.push(`size="${sliderSize.value}"`)
  return `<NeumorphismSlider\n  ${attrs.join('\n  ')}\n/>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（Slider 主角，左侧实时预览）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: min(420px, 100%)">
        <NeumorphismSlider
          v-model="sliderValue"
          :min="sliderMin"
          :max="sliderMax"
          :step="sliderStep"
          :show-tooltip="showTooltip"
          :show-stops="showStops"
          :disabled="sliderDisabled"
          :size="sliderSize"
        />
      </div>

      <template #spec>
        值=<b>{{ sliderValue }}</b> · 区间=<b>{{ sliderMin }}–{{ sliderMax }}</b> · step=<b>{{
          sliderStep
        }}</b>
        · size=<b>{{ sliderSize }}</b>
        <template v-if="showStops"> · 刻度</template>
        <template v-if="sliderDisabled"> · disabled</template>
      </template>

      <template #hint>
        键盘 ←/→ 按 <code>step</code> 步进，Home/End 跳到两端；<code>show-stops</code>
        的刻度按步长均分，步长太大时刻度会变粗，调小 step 才看得到密集刻度。
      </template>

      <template #config>
        <DemoField label="最小值 min" :value="`${sliderMin}`" grow>
          <NeumorphismSlider v-model="sliderMin" :min="0" :max="40" :step="5" size="small" />
        </DemoField>

        <DemoField label="最大值 max" :value="`${sliderMax}`" grow>
          <NeumorphismSlider v-model="sliderMax" :min="60" :max="200" :step="10" size="small" />
        </DemoField>

        <DemoField label="步长 step" :value="`${sliderStep}`" grow>
          <NeumorphismSlider v-model="sliderStep" :min="1" :max="20" :step="1" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="sliderSize" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px; row-gap: 8px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showTooltip" size="small" />
              <span>show-tooltip</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showStops" size="small" />
              <span>show-stops</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="sliderDisabled" size="small" />
              <span>disabled</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="sliderValue = 40"
            >复位数值</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">InputNumber 数字输入（步进 / 边界钳制）</h4>
    <div style="width: min(220px, 100%)">
      <NeumorphismInputNumber v-model="demoInputNumber" :min="0" :max="10" :step="1" label="数量" />
    </div>
    <p class="demo-hint">
      当前值：<strong>{{ demoInputNumber ?? '空' }}</strong>
    </p>
    <p class="demo-hint">
      <code
        >&lt;NeumorphismInputNumber v-model="n" :min="0" :max="10" :step="1" label="数量"
        /&gt;</code
      >
      —— 越界输入会被钳回 0–10，↑/↓ 键按 <code>step</code> 步进。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">DatePicker 日期选择（键盘可达）</h4>
    <div style="width: min(260px, 100%)">
      <NeumorphismDatePicker v-model="demoDate" clearable placeholder="选择日期" label="发布日期" />
    </div>
    <p class="demo-hint">
      已选：<strong>{{ formatDate(demoDate) }}</strong>
    </p>
    <p class="demo-hint">
      <code>&lt;NeumorphismDatePicker v-model="date" clearable placeholder="选择日期" /&gt;</code>
      —— 触发器是 <code>role="combobox"</code>，展开后方向键在日历网格里走位，Esc 收起。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">AutoComplete 输入联想</h4>
    <div style="width: min(280px, 100%)">
      <NeumorphismAutoComplete
        v-model="demoAutoComplete"
        :options="autoCompleteOptions"
        placeholder="输入 v 试试"
        clearable
        label="框架"
      />
    </div>
    <p class="demo-hint">
      已选：<strong>{{ autoCompleteLabel }}</strong>
    </p>
    <p class="demo-hint">
      <code>&lt;NeumorphismAutoComplete v-model="keyword" :options="options" clearable /&gt;</code>
      —— 输入即过滤本地 <code>options</code>，↑/↓ 移动高亮、Enter 回填选项值。
    </p>
  </div>
</template>
