<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type SwitchVariant = 'default' | 'power'
/** 通电色预设；'default' = 不传 activeColor，完全交给组件自身的 token */
type SwitchColor = 'default' | '#27ae60' | '#e74c3c' | '#3498db'

/**
 * 一只开关的完整可调状态。
 *
 * 配置台、变体一览、实时代码片段共用这同一份形状：载入某一格 = 整份赋值，
 * 「当前配置是否等于该格」= 一次逐字段比较，不必再为每格写一遍字段映射。
 */
interface SwitchConfig {
  checked: boolean
  variant: SwitchVariant
  size: number
  activeText: string
  inactiveText: string
  activeColor: SwitchColor
  disabled: boolean
}

/**
 * 两变体的原生高度：default 的 size 直接是轨道高（30px）；power 的 size 是器件高，
 * 器件稿 171u × 91u、缺省 91px。代码片段靠它判断「size 是不是默认值」。
 */
const NATIVE_HEIGHT: Record<SwitchVariant, number> = { default: 30, power: 91 }
/**
 * 配置台滑块沿用原演示的 18–44px 紧凑档：power 的原生 91px 器件宽 171px，
 * 塞进 320px 的预览台会把背景切换器挤到换行。要看实物比例直接把 size 写 91 即可。
 */
const SIZE_MIN = 18
const SIZE_MAX = 44
/** 提示文案里的区间读数（拆成常量，免得插值被换行折断） */
const SIZE_RANGE = `${SIZE_MIN}–${SIZE_MAX}px`

// ---- 配置台状态 ----
const checked = ref(false)
const variant = ref<SwitchVariant>('default')
const size = ref(NATIVE_HEIGHT.default)
const activeText = ref('')
const inactiveText = ref('')
const activeColor = ref<SwitchColor>('default')
const disabled = ref(false)

const variantOptions = [
  { label: '默认', value: 'default' },
  { label: '电力', value: 'power' },
]
const colorOptions = [
  { label: '默认', value: 'default' },
  { label: '绿', value: '#27ae60' },
  { label: '红', value: '#e74c3c' },
  { label: '蓝', value: '#3498db' },
]

/**
 * 非默认色才落到 `--nm-switch-active-color`。
 * 必须是 undefined 而不是 ''：空串会被组件当成合法颜色写进内联变量，把 token 覆盖成无效值。
 */
const activeColorValue = computed(() =>
  activeColor.value === 'default' ? undefined : activeColor.value
)

function pickVariant(value: string | number) {
  variant.value = value as SwitchVariant
  // 两变体原生高度差 3 倍（30 / 91），把 default 的 30px 原样带进 power 会得到一颗
  // 看不清刻印的迷你器件；切档时各自回到自己的紧凑档默认值，左右预览才可比。
  size.value = variant.value === 'power' ? SIZE_MAX : NATIVE_HEIGHT.default
}

// ---- 变体一览 ----
/** 用补丁构造完整配置，避免每格都抄 7 个字段 */
function cfg(patch: Partial<SwitchConfig>): SwitchConfig {
  return {
    checked: false,
    variant: 'default',
    size: NATIVE_HEIGHT.default,
    activeText: '',
    inactiveText: '',
    activeColor: 'default',
    disabled: false,
    ...patch,
  }
}

const presetRows: { key: string; code: string; config: SwitchConfig }[] = [
  { key: 'default-off', code: ':model-value="false"', config: cfg({}) },
  { key: 'default-on', code: ':model-value="true"', config: cfg({ checked: true }) },
  {
    key: 'slim-18',
    code: ':size="18"',
    config: cfg({ size: SIZE_MIN, checked: true }),
  },
  {
    key: 'default-label',
    code: 'active-text/inactive-text',
    config: cfg({ checked: true, activeText: '开', inactiveText: '关' }),
  },
  { key: 'power-off', code: 'variant="power"', config: cfg({ variant: 'power', size: SIZE_MAX }) },
  {
    key: 'power-on',
    code: 'variant="power" + 开',
    config: cfg({ variant: 'power', size: SIZE_MAX, checked: true }),
  },
  {
    key: 'power-color',
    code: 'active-color="#27ae60"',
    config: cfg({ variant: 'power', size: SIZE_MAX, checked: true, activeColor: '#27ae60' }),
  },
  {
    key: 'power-label',
    code: 'active-text="通电"',
    config: cfg({
      variant: 'power',
      size: SIZE_MAX,
      checked: true,
      activeText: '通电',
      inactiveText: '断电',
    }),
  },
  {
    key: 'power-disabled',
    code: 'disabled',
    config: cfg({ variant: 'power', size: SIZE_MAX, checked: true, disabled: true }),
  },
]

const current = computed<SwitchConfig>(() => ({
  checked: checked.value,
  variant: variant.value,
  size: size.value,
  activeText: activeText.value,
  inactiveText: inactiveText.value,
  activeColor: activeColor.value,
  disabled: disabled.value,
}))

function sameConfig(a: SwitchConfig, b: SwitchConfig) {
  return (Object.keys(a) as (keyof SwitchConfig)[]).every(key => a[key] === b[key])
}

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active: sameConfig(row.config, current.value),
  }))
)

function applyConfig(next: SwitchConfig) {
  checked.value = next.checked
  variant.value = next.variant
  size.value = next.size
  activeText.value = next.activeText
  inactiveText.value = next.inactiveText
  activeColor.value = next.activeColor
  disabled.value = next.disabled
}

function rowOf(key: string) {
  return presetRows.find(row => row.key === key)!
}

/** 格子里的真实开关：v-bind 一份组件 prop（activeColor 的 'default' 同样要转 undefined） */
function cellProps(key: string) {
  const c = rowOf(key).config
  return {
    modelValue: c.checked,
    variant: c.variant,
    size: c.size,
    activeText: c.activeText,
    inactiveText: c.inactiveText,
    activeColor: c.activeColor === 'default' ? undefined : c.activeColor,
    disabled: c.disabled,
  }
}

function applyPreset(key: string) {
  applyConfig(rowOf(key).config)
}

function reset() {
  applyConfig(cfg({}))
}

// ---- 后续演示块独立状态 ----
const labeled = ref(true)
/** 三档高度共用：点任意一个一起通断，同一状态下比较几何差异 */
const powerOn = ref(true)
const powerColored = ref(true)
const powerLabeled = ref(false)
const powerHeights = [44, 36, 30]

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="checked"']
  if (variant.value !== 'default') attrs.push(`variant="${variant.value}"`)
  // 与「该变体的原生高度」比，而不是与配置台默认值比：power 写 :size="91" 是冗余的
  if (size.value !== NATIVE_HEIGHT[variant.value]) attrs.push(`:size="${size.value}"`)
  if (activeText.value) attrs.push(`active-text="${activeText.value}"`)
  if (inactiveText.value) attrs.push(`inactive-text="${inactiveText.value}"`)
  if (activeColor.value !== 'default') attrs.push(`active-color="${activeColor.value}"`)
  if (disabled.value) attrs.push('disabled')
  return `<NeumorphismSwitch ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismSwitch
        v-model="checked"
        :variant="variant"
        :size="size"
        :active-text="activeText"
        :inactive-text="inactiveText"
        :active-color="activeColorValue"
        :disabled="disabled"
        aria-label="预览开关"
      />

      <template #spec>
        variant=<b>{{ variant }}</b> · size=<b>{{ size }}px</b> · 状态=<b>{{
          checked ? '开' : '关'
        }}</b>
        · 文案=<b>{{ inactiveText || '—' }}/{{ activeText || '—' }}</b> · 通电色=<b>{{
          activeColor === 'default' ? '默认' : activeColor
        }}</b>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        数字直接传给 <code>size</code>（px 高度）：default 变体驱动轨道高度（原生 30px），power
        变体把 171u × 91u 的器件整机等比缩放（原生 91px）。配置台沿用原演示的
        {{ SIZE_RANGE }} 紧凑档，切到 power 时自动落到档位上限——想看实物比例，把
        <code>size</code> 直接传 91 即可。通电色只对 power 的擦入面有明显作用，default
        变体仅给轨道叠一层 25% 的色。
      </template>

      <template #config>
        <DemoField label="开关状态">
          <NeumorphismSwitch v-model="checked" size="small" />
          <span class="demo-form-label">{{ checked ? '开' : '关' }}</span>
        </DemoField>

        <DemoField label="变体 variant">
          <NeumorphismSegmented
            :model-value="variant"
            :options="variantOptions"
            size="small"
            @update:model-value="pickVariant"
          />
        </DemoField>

        <DemoField label="尺寸 size" :value="`${size}px`" grow>
          <NeumorphismSlider
            v-model="size"
            :min="SIZE_MIN"
            :max="SIZE_MAX"
            :step="2"
            size="small"
          />
        </DemoField>

        <DemoField label="开启文本">
          <NeumorphismInput v-model="activeText" size="small" placeholder="active-text" />
        </DemoField>

        <DemoField label="关闭文本">
          <NeumorphismInput v-model="inactiveText" size="small" placeholder="inactive-text" />
        </DemoField>

        <DemoField label="通电色">
          <NeumorphismSegmented v-model="activeColor" :options="colorOptions" size="small" />
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

  <div class="demo-block">
    <h4 class="demo-label">文本标签与禁用</h4>
    <div class="demo-row">
      <NeumorphismSwitch v-model="labeled" active-text="开" inactive-text="关" />
      <NeumorphismSwitch :model-value="true" disabled />
      <NeumorphismSwitch :model-value="false" disabled />
    </div>
    <p class="demo-hint">
      两个文案同时给时不会并排显示。组件按当前状态切换主次色：选中侧主色、另一侧次要色——所以「开 /
      关」读起来始终只有一个高亮。禁用态整只降透明度并吃掉点击，文案依旧保留（无障碍名优先取自
      <code>active-text</code> / <code>inactive-text</code>）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">power 变体（电力开关）· 器件高度 44 / 36 / 30px 对比</h4>
    <div class="demo-row" style="align-items: flex-end; gap: 28px">
      <div
        v-for="height in powerHeights"
        :key="height"
        style="display: flex; flex-direction: column; align-items: center; gap: 8px"
      >
        <NeumorphismSwitch v-model="powerOn" variant="power" :size="height" />
        <code style="font-size: 11px">{{ height }}px</code>
      </div>
    </div>
    <p class="demo-hint">
      数字直接传给 <code>size</code>（px 高度），器件整机等比缩放；器件高 &lt; 36px
      时刻印文本自动隐藏（字号不可辨读）；圆钮拉丝纹理始终保留——低于 34px
      后冻结缩放（图案周期恒定，不再加深亚像素摩尔纹）。三档共用同一个
      <code>v-model</code>，点任意一只一起通断，便于在同一状态下比较几何差异。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">power · 通电色与禁用（44px 紧凑档）</h4>
    <div class="demo-row">
      <NeumorphismSwitch v-model="powerColored" variant="power" :size="44" active-color="#27ae60" />
      <NeumorphismSwitch variant="power" :size="44" :model-value="true" disabled />
      <NeumorphismSwitch variant="power" :size="44" :model-value="false" disabled />
    </div>
    <div class="demo-row">
      <NeumorphismSwitch
        v-model="powerLabeled"
        variant="power"
        :size="44"
        active-text="通电"
        inactive-text="断电"
      />
    </div>
    <p class="demo-hint">
      刻印文本为可选：不传时器件纯净无文字（上方三个）；传入 <code>active-text</code> /
      <code>inactive-text</code> 时显示自定义刻印（下方）。<code>active-color</code>
      改的是自左擦入的通电面颜色，断电腔体与金属外圈不受影响。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">全部变体一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!-- 格子本身是 button，内嵌开关只作展示：吃掉指针事件，否则点一下既载入预设又切换了状态 -->
        <NeumorphismSwitch v-bind="cellProps(item.key)" style="pointer-events: none" />
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      <code>variant</code> 只有两档：<code>default</code> 是凹陷轨道 + 弹簧滑块，
      <code>power</code> 是金属外圈 + 整径扳动圆钮。两者共用同一个
      <code>size</code> 属性，语义都是「px 高度」——换变体不改变高度口径，只改变几何的算法（轨道高 /
      器件高）。
    </p>
  </div>
</template>
