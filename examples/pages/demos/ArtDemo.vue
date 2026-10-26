<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'
import artImage from '../../assets/images.jpeg'

/**
 * 试验效果画布（NeumorphismArt）。
 *
 * 卡片里所有参数都收敛到配置台：效果 / 指针交互 / 速度 / 密度 / 高度。
 * `palette`、`seed` 与覆盖层插槽不适合塞进「一行一个值」的表单，放在
 * 第二个 block 里单独演示（横幅用法）。
 */
type ArtEffect = 'pixel-field' | 'particles' | 'waves' | 'goo' | 'ascii'

interface ArtEffectOption {
  /** 配置台里的短标签：5 个中文全长名会把分段控件撑出参数栏 */
  label: string
  value: ArtEffect
  /** 预览台覆盖层用的全名 */
  title: string
}

/** 组件内置默认高度——snippet 里「默认值不写」的比对基准（见 NeumorphismArt 的 withDefaults） */
const ART_DEFAULT_HEIGHT = 240

// ---- 配置台状态（沿用原页面命名，便于与旧演示逐项对照）----
const artEffect = ref<ArtEffect>('pixel-field')
const artReactive = ref(true)
const artSpeed = ref(1)
const artDensity = ref(1)
const artHeight = ref(280)

const artEffectOptions: ArtEffectOption[] = [
  { label: '像素场', value: 'pixel-field', title: '像素脉冲场' },
  { label: '粒子', value: 'particles', title: '粒子连线' },
  { label: '波浪', value: 'waves', title: '流动波浪' },
  { label: '色团', value: 'goo', title: '融合色团' },
  { label: '字符画', value: 'ascii', title: '字符画' },
]

const artEffectTitle = computed(
  () => artEffectOptions.find(option => option.value === artEffect.value)?.title ?? ''
)

/** 分段控件需要 `{ label, value }` 两项，别把 title 一起传下去 */
const artSegmentedOptions = artEffectOptions.map(({ label, value }) => ({ label, value }))

// ---- 横幅用法（覆盖层 + 固定种子 + 自定义配色）----
const bannerPalette = ['#5b8def', '#3fb27f', '#f0a04b']

// ---- 5 种效果一览 ----
const presets = computed<DemoPreset[]>(() =>
  artEffectOptions.map(option => ({
    key: option.value,
    code: `effect="${option.value}"`,
    active: option.value === artEffect.value,
  }))
)

function applyPreset(key: string) {
  const option = artEffectOptions.find(item => item.value === key)
  if (option) artEffect.value = option.value
}

/** 矩阵回传的是裸 string，这里收回成效果名联合类型，避免模板里出现类型断言 */
function effectOf(key: string): ArtEffect {
  return artEffectOptions.find(item => item.value === key)?.value ?? 'pixel-field'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (artEffect.value !== 'pixel-field') attrs.push(`effect="${artEffect.value}"`)
  if (artReactive.value) attrs.push('reactive')
  if (artSpeed.value !== 1) attrs.push(`:speed="${artSpeed.value.toFixed(1)}"`)
  if (artDensity.value !== 1) attrs.push(`:density="${artDensity.value.toFixed(1)}"`)
  if (artHeight.value !== ART_DEFAULT_HEIGHT) attrs.push(`:height="${artHeight.value}"`)
  // 只有字符画效果吃图片；其它效果传 src 无害但都是噪音，索性不写
  if (artEffect.value === 'ascii') attrs.push(':src="poster"')

  const attrsText = attrs.length ? ` ${attrs.join(' ')}` : ''
  // 字符画本身就是画面，再压标题会挡住内容——这时给自闭合写法，别留个空的子节点
  const ascii = artEffect.value === 'ascii'
  const body = ascii ? ' />' : `\n  <h3>${artEffectTitle.value}</h3>\n</NeumorphismArt>`
  const importNote = ascii ? '<!-- poster = import 进来的图片地址（字符画必需 src） -->\n' : ''
  return `${importNote}<NeumorphismArt${attrsText}${body}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <!-- 画布自带 --nm-bg-color 底色，预览台背景切换对它没有意义，故关掉切换器 -->
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <NeumorphismArt
        :effect="artEffect"
        :reactive="artReactive"
        :speed="artSpeed"
        :density="artDensity"
        :height="artHeight"
        :src="artImage"
        aria-label="动态效果预览"
      >
        <!-- 覆盖层 pointer-events: none，不会挡住画布的指针交互 -->
        <h3 v-if="artEffect !== 'ascii'" style="font-weight: 600; opacity: 0.85">
          {{ artEffectTitle }}
        </h3>
      </NeumorphismArt>

      <template #spec>
        effect=<b>{{ artEffect }}</b> · reactive=<b>{{ artReactive ? 'on' : 'off' }}</b> · speed=<b
          >{{ artSpeed.toFixed(1) }}</b
        >
        · density=<b>{{ artDensity.toFixed(1) }}</b> · height=<b>{{ artHeight }}px</b>
      </template>

      <template #hint>
        提示：开启 <code>reactive</code>
        后将指针移入画布——像素场以指针为波源、粒子被吸附、波浪隆起、色团被排斥、字符画提亮。触屏与
        <code>prefers-reduced-motion</code> 下自动降级为静态画面。
      </template>

      <template #config>
        <DemoField label="效果 effect" label-width="88px">
          <NeumorphismSegmented v-model="artEffect" :options="artSegmentedOptions" size="small" />
        </DemoField>

        <DemoField label="指针交互" label-width="88px">
          <NeumorphismSwitch v-model="artReactive" size="small" />
        </DemoField>

        <DemoField label="速度 speed" :value="artSpeed.toFixed(1)" label-width="88px" grow>
          <NeumorphismSlider v-model="artSpeed" :min="0.2" :max="3" :step="0.1" size="small" />
        </DemoField>

        <DemoField label="密度 density" :value="artDensity.toFixed(1)" label-width="88px" grow>
          <NeumorphismSlider v-model="artDensity" :min="0.5" :max="3" :step="0.1" size="small" />
        </DemoField>

        <DemoField label="高度 height" :value="`${artHeight}px`" label-width="88px" grow>
          <NeumorphismSlider v-model="artHeight" :min="160" :max="480" :step="20" size="small" />
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">当横幅底图：覆盖层 + 固定种子 + 自定义配色</h4>
    <NeumorphismArt
      effect="waves"
      :height="180"
      :seed="42"
      :palette="bannerPalette"
      aria-label="波浪横幅示例"
    >
      <h3 style="font-weight: 600; opacity: 0.85">把动态效果当横幅底图</h3>
    </NeumorphismArt>
    <p class="demo-hint">
      默认插槽渲染在画布之上且不响应指针（<code>pointer-events: none</code>），适合压标题、水印；
      <code>:seed</code> 固定后图案可复现（同一份数据每次渲染都长一样），<code>:palette</code>
      传入后不再跟随主题 token 换色——配色交给使用方，主题切换时画面保持不变。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">5 种效果一览（点击载入到上方配置台）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!--
          缩略图静态化（speed=0 冻结时间轴）：5 张画布各自带一条 rAF 循环，
          矩阵里要的是「长什么样」而不是「动起来」，静态帧足以辨认。
        -->
        <NeumorphismArt
          :effect="effectOf(item.key)"
          :height="76"
          :speed="0"
          :density="0.7"
          :src="artImage"
          :aria-label="`${item.key} 效果缩略图`"
        />
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      画布滚出视口即停摆（IntersectionObserver），页面滚动期间也跳过重绘——所以同一页放多张画布不会
      一直烧 CPU；但真要铺满屏的装饰背景，仍建议只用一张。
    </p>
  </div>
</template>
