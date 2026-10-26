<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type SelectVariant = 'default' | 'outlined'
type SelectSize = 'small' | 'medium' | 'large'
type SelectValue = string | number | (string | number)[] | undefined

// ---- 演示数据：配置台与下面每个功能格共用同一份，示例之间不会悄悄漂移 ----
const selectOptions = [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular 16', value: 'angular' },
  // 禁用项同时验证「键盘导航会跳过不可选项」
  { label: 'Svelte 4', value: 'svelte', disabled: true },
  { label: 'Solid.js', value: 'solid' },
]

/** 分组视图只认 `option.group`：同名选项在下拉中归为一组，组间顺序沿用原数组顺序 */
const selectGroupedOptions = [
  { label: 'Vue 3', value: 'vue', group: '渐进式框架' },
  { label: 'Nuxt', value: 'nuxt', group: '渐进式框架' },
  { label: 'React 18', value: 'react', group: '组件化生态' },
  { label: 'Preact', value: 'preact', group: '组件化生态' },
  { label: 'Svelte 4', value: 'svelte', group: '编译时框架' },
  { label: 'Solid.js', value: 'solid', group: '编译时框架' },
]

// ---- 配置台状态：默认值对齐组件默认值，片段里就只剩「非默认」属性 ----
const variant = ref<SelectVariant>('default')
const size = ref<SelectSize>('medium')
const label = ref('框架')
const placeholder = ref('请选择')
const clearable = ref(false)
const filterable = ref(false)
const multiple = ref(false)
const collapseTags = ref(true)
const maxCollapseTags = ref(2)
const loading = ref(false)
const disabled = ref(false)
const errorText = ref('')
/** 分组视图只认 `option.group`，所以靠换一份 options 表达，而非某个 prop */
const grouped = ref(false)
const previewOptions = computed(() => (grouped.value ? selectGroupedOptions : selectOptions))

const variantOptions = [
  { label: '凹陷', value: 'default' },
  { label: '描边', value: 'outlined' },
]
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/**
 * 单选与多选各存一份模型，由这个 computed 决定当前往组件里喂哪一种。
 *
 * 好处是拨 `multiple` 开关时不需要在两个 ref 之间搬数据——切回来仍是
 * 上次选中的那一项，演示过程不会因为「切一下多选就把值清空」而中断。
 */
const singleValue = ref<string | number>('vue')
const multiValue = ref<(string | number)[]>(['vue', 'react'])
const previewValue = computed<SelectValue>({
  get: () => (multiple.value ? multiValue.value : singleValue.value),
  set: value => {
    if (Array.isArray(value)) multiValue.value = value
    else singleValue.value = value ?? ''
  },
})

function labelOf(value: string | number): string {
  return selectOptions.find(option => option.value === value)?.label ?? String(value)
}

const previewSelected = computed(() => {
  if (multiple.value) return multiValue.value.map(labelOf).join('、') || '无'
  return singleValue.value === '' ? '无' : labelOf(singleValue.value)
})
function reset() {
  variant.value = 'default'
  size.value = 'medium'
  label.value = '框架'
  placeholder.value = '请选择'
  clearable.value = false
  filterable.value = false
  multiple.value = false
  collapseTags.value = true
  maxCollapseTags.value = 2
  loading.value = false
  disabled.value = false
  errorText.value = ''
  singleValue.value = 'vue'
  multiValue.value = ['vue', 'react']
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="value"', ':options="options"']
  if (variant.value !== 'default') attrs.push(`variant="${variant.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (label.value.trim()) attrs.push(`label="${label.value.trim()}"`)
  if (placeholder.value.trim()) attrs.push(`placeholder="${placeholder.value.trim()}"`)
  if (clearable.value) attrs.push('clearable')
  if (filterable.value) attrs.push('filterable')
  // collapseTags / maxCollapseTags 只在多选下有语义，单选时写进去是噪音
  if (multiple.value) {
    attrs.push('multiple')
    if (collapseTags.value) {
      attrs.push('collapse-tags')
      // maxCollapseTags 默认 1，没调过就不写
      if (maxCollapseTags.value !== 1) attrs.push(`:max-collapse-tags="${maxCollapseTags.value}"`)
    }
  }
  if (loading.value) attrs.push('loading')
  if (disabled.value) attrs.push('disabled')
  const error = errorText.value.trim()
  if (error) attrs.push(`error="${error}"`)
  // 分组不是 prop 而是 data 形状：提醒「options 每项带 group 字段」
  const note = grouped.value
    ? ['  <!-- 分组：options 每项带上 group 字段，同名选项自动归为一组 -->']
    : []
  return [`<NeumorphismSelect\n  ${attrs.join('\n  ')}\n/>`, ...note].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: min(320px, 100%)">
        <NeumorphismSelect
          v-model="previewValue"
          :options="previewOptions"
          :variant="variant"
          :size="size"
          :label="label"
          :placeholder="placeholder"
          :clearable="clearable"
          :filterable="filterable"
          :multiple="multiple"
          :collapse-tags="collapseTags"
          :max-collapse-tags="maxCollapseTags"
          :loading="loading"
          :disabled="disabled"
          :error="errorText.trim() || false"
        />
      </div>

      <template #spec>
        variant=<b>{{ variant }}</b> · size=<b>{{ size }}</b> · 已选=<b>{{ previewSelected }}</b>
        <template v-if="multiple"> · multiple</template>
        <template v-if="filterable"> · filterable</template>
        <template v-if="loading"> · loading</template>
        <template v-if="disabled"> · disabled</template>
        <template v-if="errorText.trim()"> · error</template>
        <template v-if="grouped"> · 分组选项</template>
      </template>

      <template #hint>
        <code>filterable</code> 下展开后可继续打字过滤；<code>collapse-tags</code> 仅多选生效；
        <code>outlined</code> 是「盒体连体展开」，视口空间不足时会自动向上翻转。
      </template>

      <template #config>
        <DemoField label="标签 label">
          <NeumorphismInput v-model="label" size="small" placeholder="留空则不渲染标签" />
        </DemoField>

        <DemoField label="占位 placeholder">
          <NeumorphismInput v-model="placeholder" size="small" placeholder="请选择" />
        </DemoField>

        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="错误 error">
          <NeumorphismInput v-model="errorText" size="small" placeholder="留空则不显示错误" />
        </DemoField>

        <DemoField label="选项分组">
          <NeumorphismSwitch v-model="grouped" size="small" />
        </DemoField>

        <DemoField label="能力开关">
          <div class="demo-row" style="gap: 16px; row-gap: 8px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="clearable" size="small" />
              <span>clearable</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="filterable" size="small" />
              <span>filterable</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="multiple" size="small" />
              <span>multiple</span>
            </label>
          </div>
        </DemoField>

        <DemoField v-if="multiple" label="折叠 collapseTags">
          <NeumorphismSwitch v-model="collapseTags" size="small" />
        </DemoField>

        <DemoField
          v-if="multiple && collapseTags"
          label="折叠数 maxCollapseTags"
          :value="`${maxCollapseTags}`"
          label-width="128px"
          grow
        >
          <NeumorphismSlider v-model="maxCollapseTags" :min="1" :max="4" :step="1" size="small" />
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
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
