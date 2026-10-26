<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

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

function reset() {
  checked.value = false
  size.value = 'medium'
  boxSize.value = TIER_BOX.medium
  indeterminate.value = false
  disabled.value = false
  label.value = '复选框'
}

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
</template>
