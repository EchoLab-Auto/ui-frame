<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type SwitchVariant = 'default' | 'power'
/** 通电色预设；'default' = 不传 activeColor，完全交给组件自身的 token */
type SwitchColor = 'default' | '#27ae60' | '#e74c3c' | '#3498db'

/**
 * 一只开关的完整可调状态。
 *
 * 配置台与实时代码片段共用这同一份形状：改任一处 = 整份赋值，
 * 读数与片段都从它派生，不必为每个字段各写一遍映射。
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

function applyConfig(next: SwitchConfig) {
  checked.value = next.checked
  variant.value = next.variant
  size.value = next.size
  activeText.value = next.activeText
  inactiveText.value = next.inactiveText
  activeColor.value = next.activeColor
  disabled.value = next.disabled
}

function reset() {
  applyConfig(cfg({}))
}

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
</template>
