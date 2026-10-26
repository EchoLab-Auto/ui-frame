<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

/**
 * 像素字体（NeumorphismPixelFont）：termsyn 6x11 位图字体。
 *
 * 演示分四段：片头样张（可调）+ 字符集/多行/粗体 + 缩放档位一览 + 字体出处。
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

// ---- 字符集样张（静态内容，不跟配置台的 scale 走，避免样张被放大到出屏）----
const pixelSpecimenScale = 2
const pixelCharset = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789 !?@#$%&*()[]{}<>',
]
/** 多行文本靠 `\n` 换行（组件内部 white-space: pre，按字符栅格原样保留空白） */
const pixelMultiline = 'READY.\nPRESS ANY KEY'

/** 字体出处声明：授权信息，原文照抄（放脚本里避免模板换行把中文句子切出多余空格） */
const fontNotice =
  '字体出处：termsyn 6x11（stlarch 作；Terminus × Tamsyn 混合位图字体，GPL-2）——由 PCF 位图重建为 woff2 内嵌（字形逐像素一致），字母 I 的步进按片头样张收紧，两侧字距与其余字母一致；含 400 / 700 双字重。'

// ---- 缩放档位一览（位图字体只有整数倍有意义，1..6 即为全部档位）----
const scalePresetItems = computed<DemoPreset[]>(() =>
  [1, 2, 3, 4, 5, 6].map(scale => ({
    key: String(scale),
    code: `:scale="${scale}"`,
    active: scale === pixelScale.value,
  }))
)

function applyScalePreset(key: string) {
  const scale = Number(key)
  if (Number.isFinite(scale)) pixelScale.value = scale
}

/** 矩阵回传的 key 就是倍率字符串；模板里不做 Number() 转换，保持一行 */
function scaleOf(key: string): number {
  return Math.max(1, Math.round(Number(key)))
}

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

  <div class="demo-block">
    <h4 class="demo-label">字符集样张 · 多行 · 粗体字面</h4>
    <div class="pixel-stage" style="width: 100%">
      <div class="pixel-stage__specimen">
        <NeumorphismPixelFont
          v-for="line in pixelCharset"
          :key="line"
          :text="line"
          :scale="pixelSpecimenScale"
          :align="pixelAlign"
        />
      </div>
      <NeumorphismPixelFont
        :text="pixelMultiline"
        :scale="pixelSpecimenScale"
        :align="pixelAlign"
      />
      <!-- 内嵌 400 / 700 双字面：font-weight 700 直接切到 termsyn6x11b -->
      <NeumorphismPixelFont
        text="ALERT · BOLD 700"
        :scale="pixelSpecimenScale"
        :align="pixelAlign"
        style="font-weight: 700"
      />
    </div>
    <p class="demo-hint">
      样张用 <code>scale="2"</code> 固定（不跟随上方滑块，免得放大到出屏）。第二行演示
      <code>\n</code> 换行——文本走
      <code>white-space: pre</code>，换行与连续空格都按字符栅格原样保留； 最后一行只加了
      <code>font-weight: 700</code>，即切到内嵌的粗体位图字面（不是伪粗体合成）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">缩放档位一览（点击载入到上方配置台）</h4>
    <DemoPresets :items="scalePresetItems" @pick="applyScalePreset">
      <template #default="{ item }">
        <NeumorphismPixelFont text="Aa1" :scale="scaleOf(item.key)" />
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      1× = 11px 设计尺寸（正文级），6× = 66px（片头级）。非整数倍（如
      2.5×）会被四舍五入到最近的整数，
      否则字符会落在半像素上、边缘发灰——这是位图字体与矢量字体最大的不同。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">字体出处与授权</h4>
    <p class="demo-hint">{{ fontNotice }}</p>
  </div>
</template>
