<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import artImage from '../../assets/images.jpeg'

/**
 * 字符画（NeumorphismAsciiArt）：图片 → ASCII 栅格的调参面板。
 *
 * 参数全部搬进配置台（密度 / 速度 / 指针交互 / 圆角 / 尺寸模式 / 宽高 /
 * 配色 / 无障碍名），预览区实时跟随；尺寸模式的文案原样保留，与旧演示一致。
 */
type AsciiRadius = 'none' | 'small' | 'medium' | 'large' | 'xl'
type AsciiSizeMode = 'auto' | 'fixed'
type AsciiPaletteName = 'theme' | 'warm' | 'cool'

// ---- 配置台状态（沿用原页面命名，便于与旧演示逐项对照）----
const asciiDensity = ref(1.2)
const asciiSpeed = ref(1)
const asciiReactive = ref(true)
const asciiRadius = ref<AsciiRadius>('large')
const asciiSizeMode = ref<AsciiSizeMode>('auto')
const asciiWidth = ref(360)
const asciiHeight = ref(340)
const asciiPaletteName = ref<AsciiPaletteName>('theme')
const asciiPalette = computed(() => {
  if (asciiPaletteName.value === 'warm') return ['#ff6b6b', '#feca57', '#ff9f43']
  if (asciiPaletteName.value === 'cool') return ['#48dbfb', '#54a0ff', '#5f27cd']
  return undefined
})
const asciiAriaLabel = ref('字符画')

const asciiRadiusOptions: { label: string; value: AsciiRadius }[] = [
  { label: '直角', value: 'none' },
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
  { label: '特大', value: 'xl' },
]
const asciiSizeOptions: { label: string; value: AsciiSizeMode }[] = [
  { label: '自适应', value: 'auto' },
  { label: '固定尺寸', value: 'fixed' },
]
const asciiPaletteOptions: { label: string; value: AsciiPaletteName }[] = [
  { label: '主题默认', value: 'theme' },
  { label: '暖色', value: 'warm' },
  { label: '冷色', value: 'cool' },
]

/** 配置台的 96px 标签栏——参数名偏长（含 prop 名）时统一到这一档 */
const labelWidth = '96px'

// ---- 实时代码片段 ----
const snippet = computed(() => {
  // src 是必填项，其它属性只在偏离内置默认时才写出来
  const attrs: string[] = ['src="/images/poster.jpeg"']
  if (asciiDensity.value !== 1) attrs.push(`:density="${asciiDensity.value.toFixed(1)}"`)
  if (asciiSpeed.value !== 1) attrs.push(`:speed="${asciiSpeed.value.toFixed(1)}"`)
  if (asciiReactive.value) attrs.push('reactive')
  if (asciiRadius.value !== 'large') attrs.push(`radius="${asciiRadius.value}"`)
  // 自适应模式的价值就在「不传尺寸」：只有固定模式才把 width / height 写进片段
  if (asciiSizeMode.value === 'fixed') {
    attrs.push(`:width="${asciiWidth.value}"`, `:height="${asciiHeight.value}"`)
  }
  if (asciiPalette.value) {
    attrs.push(`:palette="[${asciiPalette.value.map(color => `'${color}'`).join(', ')}]"`)
  }
  if (asciiAriaLabel.value.trim()) attrs.push(`aria-label="${asciiAriaLabel.value}"`)
  return `<NeumorphismAsciiArt\n  ${attrs.join('\n  ')}\n/>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">调参面板（左侧实时预览，右侧调整全部参数）</h4>
    <!-- 画布自带底色，预览台背景切换对它没有意义，故关掉切换器 -->
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!--
        限宽居中：示例图是竖图（176×220，宽高比 0.8），自适应模式下高度 = 宽度 ÷ 0.8，
        不限宽会把预览顶到半屏高。
      -->
      <div style="width: 100%; max-width: 400px">
        <NeumorphismAsciiArt
          :src="artImage"
          :density="asciiDensity"
          :speed="asciiSpeed"
          :reactive="asciiReactive"
          :radius="asciiRadius"
          :width="asciiSizeMode === 'fixed' ? asciiWidth : undefined"
          :height="asciiSizeMode === 'fixed' ? asciiHeight : undefined"
          :palette="asciiPalette"
          :aria-label="asciiAriaLabel"
        />
      </div>

      <template #spec>
        density=<b>{{ asciiDensity.toFixed(1) }}</b> · speed=<b>{{ asciiSpeed.toFixed(1) }}</b> ·
        reactive=<b>{{ asciiReactive ? 'on' : 'off' }}</b> · radius=<b>{{ asciiRadius }}</b>
      </template>

      <template #hint>
        {{
          asciiSizeMode === 'auto'
            ? '当前为自适应：高度按原图宽高比自动定高'
            : `当前固定 ${asciiWidth}×${asciiHeight}px`
        }}
      </template>

      <template #config>
        <DemoField
          label="密度 density"
          :value="asciiDensity.toFixed(1)"
          :label-width="labelWidth"
          grow
        >
          <NeumorphismSlider v-model="asciiDensity" :min="0.5" :max="3" :step="0.1" size="small" />
        </DemoField>

        <DemoField label="速度 speed" :value="asciiSpeed.toFixed(1)" :label-width="labelWidth" grow>
          <NeumorphismSlider v-model="asciiSpeed" :min="0" :max="3" :step="0.1" size="small" />
        </DemoField>

        <DemoField label="指针交互" :label-width="labelWidth">
          <NeumorphismSwitch v-model="asciiReactive" size="small" />
        </DemoField>

        <DemoField label="圆角 radius" :label-width="labelWidth">
          <NeumorphismSegmented v-model="asciiRadius" :options="asciiRadiusOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸模式" :label-width="labelWidth">
          <NeumorphismSegmented v-model="asciiSizeMode" :options="asciiSizeOptions" size="small" />
        </DemoField>

        <!-- 固定尺寸才需要宽高：自适应时这两个滑块调了也不生效，索性不显示 -->
        <template v-if="asciiSizeMode === 'fixed'">
          <DemoField label="宽度 width" :value="`${asciiWidth}px`" :label-width="labelWidth" grow>
            <NeumorphismSlider v-model="asciiWidth" :min="240" :max="720" :step="10" size="small" />
          </DemoField>

          <DemoField label="高度 height" :value="`${asciiHeight}px`" :label-width="labelWidth" grow>
            <NeumorphismSlider
              v-model="asciiHeight"
              :min="200"
              :max="600"
              :step="10"
              size="small"
            />
          </DemoField>
        </template>

        <DemoField label="配色 palette" :label-width="labelWidth">
          <NeumorphismSegmented
            v-model="asciiPaletteName"
            :options="asciiPaletteOptions"
            size="small"
          />
        </DemoField>

        <DemoField label="无障碍 ariaLabel" :label-width="labelWidth" grow>
          <NeumorphismInput v-model="asciiAriaLabel" size="small" />
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">尺寸策略：自适应 vs 只给 height（同一参数、实时对比）</h4>
    <div class="demo-row" style="align-items: flex-start; gap: 20px">
      <div style="flex: 1 1 200px; min-width: 0">
        <NeumorphismAsciiArt
          :src="artImage"
          :density="asciiDensity"
          :speed="asciiSpeed"
          :radius="asciiRadius"
          :palette="asciiPalette"
          aria-label="自适应高度的字符画"
        />
        <p class="demo-hint">
          <b>不传 width / height</b>：宽度撑满父级，高度按图片原始宽高比算出来（图片加载完成前用
          240px 占位）。
        </p>
      </div>

      <div style="flex: 1 1 200px; min-width: 0">
        <NeumorphismAsciiArt
          :src="artImage"
          :density="asciiDensity"
          :speed="asciiSpeed"
          :radius="asciiRadius"
          :palette="asciiPalette"
          :height="200"
          aria-label="固定高度的字符画"
        />
        <p class="demo-hint">
          <b>只传 height="200"</b>：容器被拉成 200px 高，但字符栅格仍按 contain 居中，图片不形变——
          多出来的两侧留白就是比例差。
        </p>
      </div>
    </div>
  </div>
</template>
