<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type RadioSize = 'small' | 'medium' | 'large'
type RadioDirection = 'horizontal' | 'vertical'

/**
 * 三档圆环的真实直径。
 *
 * 组件里（`src/styles/_checkable.scss`）是硬编码的 18 / 24 / 30px，没有 token；
 * 演示页用 `.demo-size-radio` + `--demo-radio-size` 桥接，而那条选择器只覆盖
 * `--medium` 档（见 `examples/styles/demo.scss`）。
 */
const TIER_CIRCLE: Record<RadioSize, number> = { small: 18, medium: 24, large: 30 }
const CIRCLE_MIN = 16
const CIRCLE_MAX = 36

// ---- 配置台状态 ----
const radioValue = ref('a')
const size = ref<RadioSize>('medium')
const direction = ref<RadioDirection>('horizontal')
const circleSize = ref(TIER_CIRCLE.medium)
const disabled = ref(false)

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const directionOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' },
]
const valueOptions = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
]

/** 圆环直径走演示桥接：内联变量只作用在 medium 档的 CSS 上 */
const circleVars = computed(() => ({ '--demo-radio-size': `${circleSize.value}px` }))

function pickSize(value: string | number) {
  size.value = value as RadioSize
  // 读数跟随档位，否则切到 small 后滑块仍写着 24px，读数与预览就对不上了
  circleSize.value = TIER_CIRCLE[size.value]
}

function pickCircleSize(value: number) {
  circleSize.value = value
  // 桥接只命中 medium：不钉回档位的话，small / large 下拖滑块会「读数变、预览不变」
  if (size.value !== 'medium') size.value = 'medium'
}

function reset() {
  radioValue.value = 'a'
  size.value = 'medium'
  direction.value = 'horizontal'
  circleSize.value = TIER_CIRCLE.medium
  disabled.value = false
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="radioValue"']
  if (direction.value !== 'horizontal') attrs.push(`direction="${direction.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (disabled.value) attrs.push('disabled')
  // 整组渲染出来，直接粘进业务页面就能看到一个能点的单选组
  return `<NeumorphismRadioGroup ${attrs.join(' ')}>
  <NeumorphismRadio value="a" label="选项 A" />
  <NeumorphismRadio value="b" label="选项 B" />
  <NeumorphismRadio value="c" label="选项 C（已禁用）" :disabled="true" />
</NeumorphismRadioGroup>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <span class="demo-size-radio" :style="circleVars">
        <NeumorphismRadioGroup
          v-model="radioValue"
          :size="size"
          :direction="direction"
          :disabled="disabled"
        >
          <NeumorphismRadio value="a" label="选项 A" />
          <NeumorphismRadio value="b" label="选项 B" />
          <NeumorphismRadio value="c" label="选项 C（已禁用）" :disabled="true" />
        </NeumorphismRadioGroup>
      </span>

      <template #spec>
        size=<b>{{ size }}</b> · direction=<b>{{ direction }}</b> · value=<b>{{ radioValue }}</b> ·
        圆环=<b>{{ circleSize }}px</b>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        三档圆环直径（18 / 24 / 30px）是组件内的枚举常量，没有 token；配置台的 px 滑块走演示级 CSS
        桥接，只命中 <code>medium</code> 档，所以拖动时档位会被钉回 medium。圆点在组件里另有
        8、12、16px 三档，桥接把它按「环径的一半」重算，所以放大缩小时内外不会脱节。
      </template>

      <template #config>
        <DemoField label="选中值 value">
          <NeumorphismSegmented v-model="radioValue" :options="valueOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            size="small"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="方向 direction">
          <NeumorphismSegmented v-model="direction" :options="directionOptions" size="small" />
        </DemoField>

        <DemoField label="圆环直径" :value="`${circleSize}px`" grow>
          <NeumorphismSlider
            :model-value="circleSize"
            :min="CIRCLE_MIN"
            :max="CIRCLE_MAX"
            :step="2"
            size="small"
            @update:model-value="pickCircleSize"
          />
        </DemoField>

        <DemoField label="禁用 disabled">
          <NeumorphismSwitch v-model="disabled" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
