<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type CheckboxSize = 'small' | 'medium' | 'large'

/**
 * 三档指示器的真实边长。
 *
 * 组件里（`src/styles/_checkable.scss`）这三档是**硬编码**的 18 / 24 / 30px，没有 token
 * 可覆写；演示页只能用 `.demo-size-checkbox` + `--demo-checkbox-size` 做演示级桥接，
 * 而那条桥接选择器只写了 `--medium` 档（见 `examples/styles/demo.scss`）。
 */
const TIER_BOX: Record<CheckboxSize, number> = { small: 18, medium: 24, large: 30 }
const BOX_MIN = 16
const BOX_MAX = 36

// ---- 配置台状态 ----
const checked = ref(false)
const size = ref<CheckboxSize>('medium')
const boxSize = ref(TIER_BOX.medium)
const indeterminate = ref(false)
const disabled = ref(false)
const label = ref('复选框')

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/** 指示器尺寸走演示桥接：内联变量只作用在 medium 档的 CSS 上 */
const boxVars = computed(() => ({ '--demo-checkbox-size': `${boxSize.value}px` }))

function pickSize(value: string | number) {
  size.value = value as CheckboxSize
  // 读数必须跟着档位走，否则切到 small 后滑块还写着 24px，读数就成了谎话
  boxSize.value = TIER_BOX[size.value]
}

function pickBoxSize(value: number) {
  boxSize.value = value
  // 桥接只命中 medium 档：不把档位钉回 medium 的话，small / large 下拖动滑块
  // 会出现「读数变了、预览没变」的静默失效，比直接改档位更容易让人困惑
  if (size.value !== 'medium') size.value = 'medium'
}

// ---- 变体一览 ----
interface CheckboxConfig {
  checked: boolean
  size: CheckboxSize
  indeterminate: boolean
  disabled: boolean
}

function cfg(patch: Partial<CheckboxConfig>): CheckboxConfig {
  return { checked: false, size: 'medium', indeterminate: false, disabled: false, ...patch }
}

const presetRows: { key: string; code: string; config: CheckboxConfig }[] = [
  { key: 'unchecked', code: ':model-value="false"', config: cfg({}) },
  { key: 'checked', code: ':model-value="true"', config: cfg({ checked: true }) },
  {
    key: 'indeterminate',
    code: ':indeterminate="true"',
    config: cfg({ checked: true, indeterminate: true }),
  },
  { key: 'small', code: 'size="small"', config: cfg({ checked: true, size: 'small' }) },
  { key: 'large', code: 'size="large"', config: cfg({ checked: true, size: 'large' }) },
  { key: 'disabled', code: 'disabled', config: cfg({ checked: true, disabled: true }) },
]

const current = computed<CheckboxConfig>(() => ({
  checked: checked.value,
  size: size.value,
  indeterminate: indeterminate.value,
  disabled: disabled.value,
}))

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => {
    const c = row.config
    const active =
      c.checked === current.value.checked &&
      c.size === current.value.size &&
      c.indeterminate === current.value.indeterminate &&
      c.disabled === current.value.disabled
    return { key: row.key, code: row.code, active }
  })
)

function rowOf(key: string) {
  return presetRows.find(row => row.key === key)!
}

function applyPreset(key: string) {
  const next = rowOf(key).config
  checked.value = next.checked
  size.value = next.size
  indeterminate.value = next.indeterminate
  disabled.value = next.disabled
  boxSize.value = TIER_BOX[next.size]
}

/** 格子里的真实复选框：v-bind 一份组件 prop（文案固定成短名，格子窄） */
function cellProps(key: string) {
  const c = rowOf(key).config
  return {
    modelValue: c.checked,
    size: c.size,
    indeterminate: c.indeterminate,
    disabled: c.disabled,
    label: '复选',
  }
}

function reset() {
  checked.value = false
  size.value = 'medium'
  boxSize.value = TIER_BOX.medium
  indeterminate.value = false
  disabled.value = false
  label.value = '复选框'
}

// ---- 后续演示块独立状态 ----
const basicUnchecked = ref(false)
const basicChecked = ref(true)
const basicIndeterminate = ref(true)
const smallOn = ref(true)
const mediumOn = ref(true)
const largeOn = ref(true)

// ---- 全选 / 半选联动：indeterminate 的真实用法 ----
const fruitOptions = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '樱桃', value: 'cherry' },
]
const picked = ref<string[]>(['apple'])
const allChecked = computed(() => picked.value.length === fruitOptions.length)
const partChecked = computed(
  () => picked.value.length > 0 && picked.value.length < fruitOptions.length
)

function setAll(on: boolean) {
  picked.value = on ? fruitOptions.map(option => option.value) : []
}

function toggle(value: string, on: boolean) {
  picked.value = on ? [...picked.value, value] : picked.value.filter(item => item !== value)
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="checked"']
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (indeterminate.value) attrs.push('indeterminate')
  if (disabled.value) attrs.push('disabled')
  if (label.value) attrs.push(`label="${label.value}"`)
  // px 级微调是演示页的 CSS 桥接，不是组件能力：用注释标出来，避免被误当成 API 抄走
  const boxNote =
    boxSize.value !== TIER_BOX[size.value]
      ? `\n<!-- 指示器 ${boxSize.value}px 只能靠演示级 CSS 桥接（--demo-checkbox-size），组件只认 size 档位 -->`
      : ''
  return `<NeumorphismCheckbox ${attrs.join(' ')} />${boxNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <span class="demo-size-checkbox" :style="boxVars">
        <NeumorphismCheckbox
          v-model="checked"
          :size="size"
          :indeterminate="indeterminate"
          :disabled="disabled"
          :label="label || '复选框'"
        />
      </span>

      <template #spec>
        size=<b>{{ size }}</b> · 指示器=<b>{{ boxSize }}px</b> · 状态=<b>{{
          indeterminate ? '半选' : checked ? '已选中' : '未选中'
        }}</b>
        · 文案=<b>{{ label || '—' }}</b>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        三档边长（18 / 24 / 30px）在组件里是枚举常量、没有 token；这里的 px 滑块走的是演示级 CSS
        桥接，只命中 <code>medium</code> 档，所以拖动时档位会被钉回 medium——small / large
        请用档位切换。<code>indeterminate</code> 只影响绘制（画横杠），不会改写
        <code>modelValue</code>。
      </template>

      <template #config>
        <DemoField label="勾选状态">
          <NeumorphismSwitch v-model="checked" size="small" />
          <span class="demo-form-label">{{ checked ? '已选中' : '未选中' }}</span>
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            size="small"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="指示器" :value="`${boxSize}px`" grow>
          <NeumorphismSlider
            :model-value="boxSize"
            :min="BOX_MIN"
            :max="BOX_MAX"
            :step="2"
            size="small"
            @update:model-value="pickBoxSize"
          />
        </DemoField>

        <DemoField label="半选 indeterminate">
          <NeumorphismSwitch v-model="indeterminate" size="small" />
        </DemoField>

        <DemoField label="禁用 disabled">
          <NeumorphismSwitch v-model="disabled" size="small" />
        </DemoField>

        <DemoField label="文案 label" grow>
          <NeumorphismInput v-model="label" size="small" placeholder="复选框" />
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
    <h4 class="demo-label">基本与半选状态</h4>
    <div class="demo-row">
      <NeumorphismCheckbox v-model="basicUnchecked" label="未选中" />
      <NeumorphismCheckbox v-model="basicChecked" label="已选中" />
      <NeumorphismCheckbox v-model="basicIndeterminate" :indeterminate="true" label="半选状态" />
    </div>
    <p class="demo-hint">
      半选的语义是「下属项部分选中」：<code>indeterminate</code> 与
      <code>modelValue</code> 互不推导——勾选它时组件只把
      <code>modelValue</code> 置反，横杠该不该出现由调用方决定 （典型写法见下方「全选 /
      半选联动」）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">尺寸档位与禁用</h4>
    <div class="demo-row">
      <NeumorphismCheckbox v-model="smallOn" size="small" label="小 18px" />
      <NeumorphismCheckbox v-model="mediumOn" size="medium" label="中 24px" />
      <NeumorphismCheckbox v-model="largeOn" size="large" label="大 30px" />
    </div>
    <div class="demo-row">
      <NeumorphismCheckbox :model-value="true" label="已选中禁用" disabled />
      <NeumorphismCheckbox :model-value="false" label="未选中禁用" disabled />
      <NeumorphismCheckbox :model-value="true" :indeterminate="true" label="半选禁用" disabled />
    </div>
    <p class="demo-hint">
      原演示里那根 16–36px 的指示器滑块已经搬进上方配置台（走
      <code>.demo-size-checkbox</code> 桥接）；生产代码请用 <code>size</code> 枚举档，px
      微调不是组件 API。禁用态除了吃掉点击，还会把整行降到 50%
      透明度——图标与文案一并变淡，不做「半透明指示器 + 实心文字」的分裂处理。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">全选 / 半选联动（indeterminate 的典型用法）</h4>
    <div class="demo-row" style="align-items: flex-start; gap: 32px">
      <NeumorphismCheckbox
        :model-value="allChecked"
        :indeterminate="partChecked"
        label="全选"
        @update:model-value="setAll"
      />
      <div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 10px">
        <NeumorphismCheckbox
          v-for="option in fruitOptions"
          :key="option.value"
          :model-value="picked.includes(option.value)"
          :label="option.label"
          @update:model-value="(on: boolean) => toggle(option.value, on)"
        />
      </div>
    </div>
    <p class="demo-hint">
      已选：<strong>{{ picked.length ? picked.join(' / ') : '（空）' }}</strong
      >。父级的三态由子级推导：全选 → <code>modelValue=true</code>，部分选中 →
      <code>indeterminate=true</code>，全不选 → <code>false</code>。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">状态一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!-- 格子本身是 button，内嵌复选框只作展示：吃掉指针事件，否则点一下既载入预设又勾选了一次 -->
        <NeumorphismCheckbox v-bind="cellProps(item.key)" style="pointer-events: none" />
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      三档指示器边长固定（18 / 24 / 30px），勾选图标随之取 12 / 14 / 16px
      的图标档——尺寸变的是指示器，行高与文案字号保持不变，所以混排时基线依然对齐。
    </p>
  </div>
</template>
