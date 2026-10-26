<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoStage, type DemoPreset } from '../../demo'

type ButtonVariant = 'raised' | 'pressed' | 'primary' | 'glow'
type ButtonGlass = 'none' | 'float' | 'raised' | 'pressed'

// ---- 配置台状态 ----
const variant = ref<ButtonVariant>('raised')
const glass = ref<ButtonGlass>('none')
const size = ref<'small' | 'medium' | 'large'>('medium')
const shape = ref<'rounded' | 'pill' | 'circle'>('rounded')
const text = ref('按钮')
const loading = ref(false)
const disabled = ref(false)
const height = ref(44)
const stage = ref<DemoStage>('gradient')

const variantOptions = [
  { label: '凸起', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
  { label: '主色', value: 'primary' },
  { label: '辉光', value: 'glow' },
]
const glassOptions = [
  { label: '关闭', value: 'none' },
  { label: '悬浮', value: 'float' },
  { label: '凸面', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
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

/** 传给组件的 glass：'none' 必须显式传 false，否则会走全局配置/旧 variant 语义 */
const glassValue = computed<false | Exclude<ButtonGlass, 'none'>>(() =>
  glass.value === 'none' ? false : glass.value
)

// ---- 变体一览 ----
interface PresetRow extends DemoPreset {
  variant: ButtonVariant | 'glass' | 'glass-raised'
  glass: false | 'float' | 'raised' | 'pressed'
  /** 点击后载入的状态；旧写法格与 float 档等价，故不参与选中态比对 */
  target: { variant: ButtonVariant; glass: ButtonGlass }
  /** false = 不参与选中态比对（等价写法格） */
  match?: false
}

const presetRows: PresetRow[] = [
  {
    key: 'raised',
    code: 'variant="raised"',
    variant: 'raised',
    glass: false,
    target: { variant: 'raised', glass: 'none' },
  },
  {
    key: 'pressed',
    code: 'variant="pressed"',
    variant: 'pressed',
    glass: false,
    target: { variant: 'pressed', glass: 'none' },
  },
  {
    key: 'primary',
    code: 'variant="primary"',
    variant: 'primary',
    glass: false,
    target: { variant: 'primary', glass: 'none' },
  },
  {
    key: 'glow',
    code: 'variant="glow"',
    variant: 'glow',
    glass: false,
    target: { variant: 'glow', glass: 'none' },
  },
  {
    key: 'glass-float',
    code: 'glass="float"',
    variant: 'raised',
    glass: 'float',
    target: { variant: 'raised', glass: 'float' },
  },
  {
    key: 'glass-raised',
    code: 'glass="raised"',
    variant: 'raised',
    glass: 'raised',
    target: { variant: 'raised', glass: 'raised' },
  },
  {
    key: 'glass-pressed',
    code: 'glass="pressed"',
    variant: 'raised',
    glass: 'pressed',
    target: { variant: 'raised', glass: 'pressed' },
  },
  {
    key: 'legacy-glass',
    code: 'variant="glass"',
    variant: 'glass',
    glass: false,
    target: { variant: 'raised', glass: 'float' },
    match: false,
  },
]

/** 格子里的示例文案：给每个变体起个短名，比全叫「按钮」更容易分辨 */
const presetLabel: Record<string, string> = {
  raised: '凸起',
  pressed: '凹陷',
  primary: '主色',
  glow: '辉光',
  'glass-float': '悬浮玻璃',
  'glass-raised': '凸面玻璃',
  'glass-pressed': '凹陷玻璃',
  'legacy-glass': '旧写法',
}

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active:
      row.match !== false &&
      row.target.variant === variant.value &&
      row.target.glass === glass.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(r => r.key === key)
  if (!row) return
  variant.value = row.target.variant
  glass.value = row.target.glass
  // 玻璃只有彩色台面才看得出磨砂，套用时顺手把台面切到彩色
  if (row.target.glass !== 'none') stage.value = 'gradient'
}

function rowOf(key: string) {
  return presetRows.find(r => r.key === key)!
}

function reset() {
  variant.value = 'raised'
  glass.value = 'none'
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
  if (glass.value !== 'none') attrs.push(`glass="${glass.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (shape.value !== 'rounded') attrs.push(`shape="${shape.value}"`)
  if (loading.value) attrs.push('loading')
  if (disabled.value) attrs.push('disabled')
  const open = attrs.length ? `<NeumorphismButton ${attrs.join(' ')}>` : '<NeumorphismButton>'
  const heightNote =
    height.value !== 44 ? `\n  <!-- 高度经 --nm-button-* 变量调整：${height.value}px -->` : ''
  return `${open}${text.value || '按钮'}</NeumorphismButton>${heightNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground v-model:stage="stage" :snippet="snippet">
      <NeumorphismButton
        :variant="variant"
        :glass="glassValue"
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
        variant=<b>{{ variant }}</b> · glass=<b>{{ glass }}</b> · size=<b>{{ size }}</b> · shape=<b
          >{{ shape }}</b
        >
        · height=<b>{{ height }}px</b>
        <template v-if="loading"> · loading</template>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        玻璃档位需在彩色背景上才看得到磨砂半透明；<code>circle</code> 形状建议配 1–2 字内容。
      </template>

      <template #config>
        <DemoField label="内容文本">
          <NeumorphismInput v-model="text" size="small" placeholder="按钮" />
        </DemoField>

        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="玻璃 glass">
          <NeumorphismSegmented v-model="glass" :options="glassOptions" size="small" />
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
          <NeumorphismButton variant="pressed" size="small" @click="glass = 'float'">
            套用玻璃
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">全部变体一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <NeumorphismButton
          :variant="rowOf(item.key).variant"
          :glass="rowOf(item.key).glass"
          size="small"
        >
          {{ presetLabel[item.key] }}
        </NeumorphismButton>
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      旧 <code>variant="glass"</code> / <code>variant="glass-raised"</code> 等价于
      <code>glass="float"</code> /
      <code>glass="raised"</code>，渲染结果不变（同样的类名与计算样式）。 玻璃与
      <code>variant</code> 正交但会覆盖表面底色——要彩色玻璃请改 <code>--nm-glass-bg</code>，而不是叠
      <code>variant="primary"</code>。
    </p>
  </div>
</template>
