<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

/**
 * 像素字体（NeumorphismPixelFont）：termsyn 6x11 位图字体。
 *
 * 演示分三段：片头样张（可调）+ 字符集/多行/粗体 + 字体出处。
 * 缩放是本组件唯一「有物理含义」的参数——位图字体只在整数倍设计尺寸
 * （11px × scale）下逐像素对齐，所以档位用 1..6 的整数滑块而不是连续值。
 */
type PixelAlign = 'left' | 'center' | 'right'

/** 组件内置默认缩放——snippet 里「默认值不写」的比对基准 */
const PIXEL_DEFAULT_SCALE = 3

// ---- 配置台状态（沿用原页面命名，便于与旧演示逐项对照）----
const pixelTitle = ref('ASCII MOTION')
const pixelSubtitle = ref('CODE MEETS MOVEMENT')
const pixelScale = ref(3)
const pixelCursor = ref(true)
const pixelAlign = ref<PixelAlign>('left')
const pixelAlignOptions: { label: string; value: PixelAlign }[] = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

/** 副题比标题小一档缩放（不低于 1 倍设计尺寸；原作副题约为标题高度的 60%） */
const pixelSubtitleScale = computed(() => Math.max(1, pixelScale.value - 1))

/** 字体出处声明：授权信息，原文照抄（放脚本里避免模板换行把中文句子切出多余空格） */
const fontNotice =
  '字体出处：termsyn 6x11（stlarch 作；Terminus × Tamsyn 混合位图字体，GPL-2）——由 PCF 位图重建为 woff2 内嵌（字形逐像素一致），字母 I 的步进按片头样张收紧，两侧字距与其余字母一致；含 400 / 700 双字重。'

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = [`text="${pixelTitle.value || 'ASCII MOTION'}"`]
  if (pixelScale.value !== PIXEL_DEFAULT_SCALE) attrs.push(`:scale="${pixelScale.value}"`)
  if (pixelCursor.value) attrs.push('cursor')
  if (pixelAlign.value !== 'left') attrs.push(`align="${pixelAlign.value}"`)
  return `<NeumorphismPixelFont ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示（「ASCII MOTION」片头风格：标题 + 副题 + 闪烁光标）</h4>
    <!-- 终端舞台自带凹陷底色，预览台换个背景也看不出差别，故关掉背景切换 -->
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!-- 舞台撑满：对齐方式（左/中/右）要有整行宽度才看得出来 -->
      <div class="pixel-stage" style="width: 100%">
        <NeumorphismPixelFont
          :text="pixelTitle"
          :scale="pixelScale"
          :cursor="pixelCursor"
          :align="pixelAlign"
          aria-label="片头标题"
        />
        <NeumorphismPixelFont
          :text="pixelSubtitle"
          :scale="pixelSubtitleScale"
          :align="pixelAlign"
          aria-label="片头副题"
        />
      </div>

      <template #spec>
        scale=<b>{{ pixelScale }}</b
        >（{{ pixelScale * 11 }}px）· 副题 scale=<b>{{ pixelSubtitleScale }}</b> · cursor=<b>{{
          pixelCursor ? 'on' : 'off'
        }}</b>
        · align=<b>{{ pixelAlign }}</b>
      </template>

      <template #hint>
        <span style="display: block; margin-bottom: 6px">{{ fontNotice }}</span>
        显示区字号 = 11px × scale——位图字体仅在整数倍设计尺寸下保持像素锐利（scale
        自动取整）；光标随 reduced-motion 设置自动停闪。
      </template>

      <template #config>
        <DemoField label="标题文本">
          <NeumorphismInput v-model="pixelTitle" size="small" />
        </DemoField>

        <DemoField label="副题文本">
          <NeumorphismInput v-model="pixelSubtitle" size="small" />
        </DemoField>

        <DemoField label="缩放 scale" :value="`${pixelScale}×`" grow>
          <NeumorphismSlider v-model="pixelScale" :min="1" :max="6" :step="1" size="small" />
        </DemoField>

        <DemoField label="光标 cursor">
          <NeumorphismSwitch v-model="pixelCursor" size="small" />
        </DemoField>

        <DemoField label="对齐 align">
          <NeumorphismSegmented v-model="pixelAlign" :options="pixelAlignOptions" size="small" />
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
