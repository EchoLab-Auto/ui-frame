<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField, type DemoStage } from '../../demo'

/**
 * 玻璃是 `variant` 的三档取值，不是独立 prop —— 所以这里只有一个变体状态。
 * 阴影方向只有一条轴（凸 / 凹），玻璃三档同时决定「材质 + 凸凹」。
 */
type ButtonVariant =
  'raised' | 'pressed' | 'primary' | 'glow' | 'glass' | 'glass-raised' | 'glass-pressed'

// ---- 配置台状态 ----
const variant = ref<ButtonVariant>('raised')
const size = ref<'small' | 'medium' | 'large'>('medium')
const shape = ref<'rounded' | 'pill' | 'circle'>('rounded')
const text = ref('按钮')
const loading = ref(false)
const disabled = ref(false)
const height = ref(44)
const stage = ref<DemoStage>('gradient')

/**
 * 七档平铺在一条分段控件里：玻璃三档与基础四档是同一个 prop 的取值，
 * 分成两条控件会暗示「可以叠着选」——那正是要消灭的组合。
 */
const variantOptions = [
  { label: '凸起', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
  { label: '主色', value: 'primary' },
  { label: '辉光', value: 'glow' },
  { label: '玻璃', value: 'glass' },
  { label: '玻璃凸', value: 'glass-raised' },
  { label: '玻璃凹', value: 'glass-pressed' },
]
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const shapeOptions = [
  { label: '圆角', value: 'rounded' },
  { label: '胶囊', value: 'pill' },
  { label: '圆形', value: 'circle' },
]

/** 玻璃变体集合：用于「套用玻璃」与台面自动切换 */
const GLASS_VARIANTS = new Set<ButtonVariant>(['glass', 'glass-raised', 'glass-pressed'])
const isGlass = computed(() => GLASS_VARIANTS.has(variant.value))

/**
 * 预览用的高度样式。
 *
 * 组件的尺寸档位分别消费 `--nm-button-*-sm/md/lg`，所以滑块必须写到**当前档位**
 * 对应的那组 token 上——否则选 small / large 时滑块会静默失效。
 */
const previewStyle = computed(() => {
  const h = height.value
  const suffix = size.value === 'small' ? 'sm' : size.value === 'large' ? 'lg' : 'md'
  // 以 md 档为基准按比例缩放内边距与字号，保持视觉比例不变
  const k = h / 44
  return {
    [`--nm-button-min-height-${suffix}`]: `${h}px`,
    [`--nm-button-padding-y-${suffix}`]: `${Math.round(12 * k)}px`,
    [`--nm-button-padding-x-${suffix}`]: `${Math.round(24 * k)}px`,
    [`--nm-button-font-${suffix}`]: `${Math.max(11, Math.round(14 * k))}px`,
  }
})

/**
 * 切到玻璃变体时把台面切成彩色。
 *
 * 玻璃的三分之一观感来自「背后有东西」——平面底色上磨砂几乎不可见。
 * 这里只在变体变化时顺手切一次，用户之后仍可手动切回平面。
 */
watch(variant, next => {
  if (GLASS_VARIANTS.has(next)) stage.value = 'gradient'
})

function reset() {
  variant.value = 'raised'
  size.value = 'medium'
  shape.value = 'rounded'
  text.value = '按钮'
  loading.value = false
  disabled.value = false
  height.value = 44
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (variant.value !== 'raised') attrs.push(`variant="${variant.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (shape.value !== 'rounded') attrs.push(`shape="${shape.value}"`)
  if (loading.value) attrs.push('loading')
  if (disabled.value) attrs.push('disabled')
  const open = attrs.length ? `<NeumorphismButton ${attrs.join(' ')}>` : '<NeumorphismButton>'
  const notes: string[] = []
  if (height.value !== 44) {
    notes.push(`  <!-- 高度经 --nm-button-* 变量调整：${height.value}px -->`)
  }
  if (isGlass.value) {
    notes.push('  <!-- 玻璃需置于彩色/图片背景上，磨砂半透明才可见 -->')
  }
  return `${open}${text.value || '按钮'}</NeumorphismButton>\n${notes.join('\n')}`.trimEnd()
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground v-model:stage="stage" :snippet="snippet">
      <NeumorphismButton
        :variant="variant"
        :size="size"
        :shape="shape"
        :loading="loading"
        :disabled="disabled"
        :style="previewStyle"
        aria-label="预览按钮"
      >
        {{ text || '按钮' }}
      </NeumorphismButton>

      <template #spec>
        variant=<b>{{ variant }}</b> · size=<b>{{ size }}</b> · shape=<b>{{ shape }}</b> · height=<b
          >{{ height }}px</b
        >
        <template v-if="loading"> · loading</template>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        玻璃三档需在彩色背景上才看得到磨砂半透明；<code>circle</code> 形状建议配 1–2 字内容。玻璃是
        <code>variant</code> 的一档而非独立开关——它同时决定材质与阴影方向，与
        <code>pressed</code> 这类凸凹变体本就同轴，所以不能叠加。想要彩色玻璃请改
        <code>--nm-glass-bg</code>：玻璃表面会盖住 <code>primary</code> 的底色。
      </template>

      <template #config>
        <DemoField label="内容文本">
          <NeumorphismInput v-model="text" size="small" placeholder="按钮" />
        </DemoField>

        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="形状 shape">
          <NeumorphismSegmented v-model="shape" :options="shapeOptions" size="small" />
        </DemoField>

        <DemoField label="高度 height" :value="`${height}px`" grow>
          <NeumorphismSlider v-model="height" :min="28" :max="64" :step="2" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="loading" size="small" />
              <span>loading</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="disabled" size="small" />
              <span>disabled</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="variant = 'glass'">
            套用玻璃
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
