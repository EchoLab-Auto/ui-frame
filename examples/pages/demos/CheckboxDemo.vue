<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

/**
 * 尺寸只有一个量：**方盒边长 px**。
 *
 * 2026-11 起 `size` 直接收 px（数字 size 的语义就是边长），组件内部把锚点表按
 * 16–36 分段插值后写进 `--nm-checkbox-sz-*`。所以老演示里那套「档位 + 桥接
 * `--demo-checkbox-size`」的双轨机制不再需要——桥接只对档位类生效，数字路径根本
 * 不挂档位类。
 */
const BOX_MIN = 16
const BOX_MAX = 36
const DEFAULT_BOX = 24

// ---- 配置台状态 ----
const checked = ref(false)
const boxSize = ref(DEFAULT_BOX)
/** 别名：模板与片段里沿用 `size` 这个名字 */
const size = boxSize
const indeterminate = ref(false)
const disabled = ref(false)
const label = ref('复选框')

/** 常用边长（原三档锚点 18 / 24 / 30）当快捷取值 */
const sizeOptions = [
  { label: '18', value: 18 },
  { label: '24', value: 24 },
  { label: '30', value: 30 },
]

function pickSize(value: string | number) {
  boxSize.value = Number(value)
}

function reset() {
  checked.value = false
  boxSize.value = DEFAULT_BOX
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
  if (size.value !== DEFAULT_BOX) attrs.push(`:size="${size.value}"`)
  if (indeterminate.value) attrs.push('indeterminate')
  if (disabled.value) attrs.push('disabled')
  if (label.value) attrs.push(`label="${label.value}"`)
  return `<NeumorphismCheckbox ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismCheckbox
        v-model="checked"
        :size="size"
        :indeterminate="indeterminate"
        :disabled="disabled"
        :label="label || '复选框'"
      />

      <template #spec>
        size=<b>{{ size }}px</b> · 状态=<b>{{
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
          <NeumorphismSwitch v-model="checked" :size="24" />
          <span class="demo-form-label">{{ checked ? '已选中' : '未选中' }}</span>
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            :size="26"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="微调" :value="`${boxSize}px`" grow>
          <NeumorphismSlider
            :model-value="boxSize"
            :min="BOX_MIN"
            :max="BOX_MAX"
            :step="2"
            :size="6"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="半选 indeterminate">
          <NeumorphismSwitch v-model="indeterminate" :size="24" />
        </DemoField>

        <DemoField label="禁用 disabled">
          <NeumorphismSwitch v-model="disabled" :size="24" />
        </DemoField>

        <DemoField label="文案 label" grow>
          <NeumorphismInput v-model="label" :size="36" placeholder="复选框" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" :size="32" @click="reset()"
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
