<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type RadioDirection = 'horizontal' | 'vertical'

/**
 * 尺寸只有一个量：**圆环直径 px**。
 *
 * 2026-11 起 `size` 直接收 px（数字 size 的语义就是直径），组件按锚点表插值写进
 * `--nm-radio-sz-*`，数字路径不再挂档位类——所以老演示里 `.demo-size-radio` +
 * `--demo-radio-size` 那套桥接（原本只覆盖 medium 档）整体删掉。
 */
const CIRCLE_MIN = 16
const CIRCLE_MAX = 36
const DEFAULT_CIRCLE = 24

// ---- 配置台状态 ----
const radioValue = ref('a')
const circleSize = ref(DEFAULT_CIRCLE)
/** 别名：模板与片段里沿用 `size` 这个名字 */
const size = circleSize
const direction = ref<RadioDirection>('horizontal')
const disabled = ref(false)

/** 常用直径（原三档锚点 18 / 24 / 30）当快捷取值 */
const sizeOptions = [
  { label: '18', value: 18 },
  { label: '24', value: 24 },
  { label: '30', value: 30 },
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

function pickSize(value: string | number) {
  circleSize.value = Number(value)
}

function reset() {
  radioValue.value = 'a'
  circleSize.value = DEFAULT_CIRCLE
  direction.value = 'horizontal'
  disabled.value = false
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="radioValue"']
  if (direction.value !== 'horizontal') attrs.push(`direction="${direction.value}"`)
  if (size.value !== DEFAULT_CIRCLE) attrs.push(`:size="${size.value}"`)
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
      <div>
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
      </div>

      <template #spec>
        size=<b>{{ size }}</b> · direction=<b>{{ direction }}</b> · value=<b>{{ radioValue }}</b> ·
        直径=<b>{{ circleSize }}px</b>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        <code>size</code> 就是圆环直径（px）：组件按锚点表分段插值写进
        <code>--nm-radio-sz-*</code>，圆点与图标按比例一起缩放，放大缩小时内外不会脱节。
      </template>

      <template #config>
        <DemoField label="选中值 value">
          <NeumorphismSegmented v-model="radioValue" :options="valueOptions" :size="26" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            :size="26"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="方向 direction">
          <NeumorphismSegmented v-model="direction" :options="directionOptions" :size="26" />
        </DemoField>

        <DemoField label="微调" :value="`${circleSize}px`" grow>
          <NeumorphismSlider
            :model-value="circleSize"
            :min="CIRCLE_MIN"
            :max="CIRCLE_MAX"
            :step="2"
            :size="6"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="禁用 disabled">
          <NeumorphismSwitch v-model="disabled" :size="24" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" :size="32" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
