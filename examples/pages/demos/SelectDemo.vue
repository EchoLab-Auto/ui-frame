<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
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

// ---- 功能格自己的状态 ----
const basicValue = ref<string | number>('vue')
const labeledValue = ref<string | number>('')
const filterValue = ref<string | number>('')
const multiSelectValue = ref<(string | number)[]>(['vue', 'react'])
const groupedValue = ref<string | number>('')

// ---- 远程加载格：自己持有 loading 与计时器，卸载时清掉 ----
const asyncValue = ref<string | number>('')
const asyncLoading = ref(false)
let asyncTimer: ReturnType<typeof setTimeout> | null = null

function simulateSelectAsync() {
  // 连续展开时先清上一轮计时器，否则旧的 2s 到期会把新一次加载态提前熄灭
  if (asyncTimer) clearTimeout(asyncTimer)
  asyncLoading.value = true
  asyncTimer = setTimeout(() => {
    asyncLoading.value = false
    asyncTimer = null
  }, 2000)
}

onBeforeUnmount(() => {
  if (asyncTimer) clearTimeout(asyncTimer)
})

/**
 * 双变体对比块故意让两列共享同一份 v-model：
 * 在 default 侧选中一项，outlined 侧同步变化——除 `variant` 外没有任何差异，
 * 这正是这个对比块想说明的事。
 */
const variantSingle = ref<string | number>('vue')
const variantMulti = ref<(string | number)[]>(['vue', 'react'])

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
  return `<NeumorphismSelect\n  ${attrs.join('\n  ')}\n/>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: min(320px, 100%)">
        <NeumorphismSelect
          v-model="previewValue"
          :options="selectOptions"
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

  <div class="demo-block">
    <h4 class="demo-label">功能特性（每种能力都能单独使用）</h4>
    <!--
      demo.scss 里没有多列网格类（原 `select-grid` 随 ComponentsPage 拆分一起删了），
      这里用行内 grid 表达「等宽自适应列」，避免为一张卡新增全局样式。
    -->
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px"
    >
      <div>
        <h5 class="demo-label">基本选择器</h5>
        <NeumorphismSelect v-model="basicValue" :options="selectOptions" placeholder="请选择框架" />
        <p class="demo-hint">
          已选：<strong>{{ basicValue || '无' }}</strong>
        </p>
      </div>

      <div>
        <h5 class="demo-label">带标签、可清空</h5>
        <NeumorphismSelect
          v-model="labeledValue"
          :options="selectOptions"
          label="框架"
          placeholder="请选择..."
          clearable
        />
        <p class="demo-hint">标签由 <code>label</code> 渲染，清空按钮只在有值时出现。</p>
      </div>

      <div>
        <h5 class="demo-label">可搜索过滤</h5>
        <NeumorphismSelect
          v-model="filterValue"
          :options="selectOptions"
          placeholder="输入关键字过滤..."
          filterable
          clearable
        />
        <p class="demo-hint">
          已选：<strong>{{ filterValue || '无' }}</strong>
        </p>
      </div>

      <div>
        <h5 class="demo-label">多选 + 标签折叠</h5>
        <NeumorphismSelect
          v-model="multiSelectValue"
          :options="selectOptions"
          placeholder="选择多个框架..."
          multiple
          collapse-tags
          :max-collapse-tags="2"
          clearable
        />
        <p class="demo-hint">
          已选：<strong>{{ multiSelectValue.join(', ') || '无' }}</strong>
        </p>
      </div>

      <div>
        <h5 class="demo-label">选项分组</h5>
        <NeumorphismSelect
          v-model="groupedValue"
          :options="selectGroupedOptions"
          placeholder="按生态分组..."
        />
        <p class="demo-hint">只在选项带 <code>group</code> 时出现分组标题。</p>
      </div>

      <div>
        <h5 class="demo-label">远程加载</h5>
        <NeumorphismSelect
          v-model="asyncValue"
          :options="selectOptions"
          placeholder="点击模拟远程加载..."
          :loading="asyncLoading"
          @visible-change="(open: boolean) => open && simulateSelectAsync()"
        />
        <p class="demo-hint">展开触发 2 秒模拟加载；打开配置台的 loading 开关也能看到同一状态。</p>
      </div>

      <div>
        <h5 class="demo-label">禁用</h5>
        <NeumorphismSelect :options="selectOptions" placeholder="已禁用" disabled />
        <p class="demo-hint">禁用时触发器不响应点击，也不进入 Tab 焦点序列。</p>
      </div>

      <div>
        <h5 class="demo-label">错误态</h5>
        <NeumorphismSelect
          :options="selectOptions"
          label="必填字段"
          placeholder="请选择..."
          error="此字段为必填项"
        />
        <p class="demo-hint">
          传字符串时错误文案由组件自带的 <code>FieldError</code> 渲染（<code>role="alert"</code>）。
        </p>
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">两种视觉变体</h4>
    <p class="demo-hint" style="margin: 0 0 8px">
      同一份数据与逻辑，仅 <code>variant</code> 不同 —— 左侧 <code>default</code> 新拟态凹陷，右侧
      <code>outlined</code> 主色描边 + 连体下拉。两列共用同一个
      <code>v-model</code>，在任意一侧选中，另一侧同步变化。
    </p>
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px"
    >
      <div>
        <code>variant="default"</code>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px">
          <div>
            <h5 class="demo-label">单选</h5>
            <NeumorphismSelect
              v-model="variantSingle"
              :options="selectOptions"
              variant="default"
              placeholder="请选择..."
              clearable
            />
          </div>
          <div>
            <h5 class="demo-label">多选</h5>
            <NeumorphismSelect
              v-model="variantMulti"
              :options="selectOptions"
              variant="default"
              multiple
              collapse-tags
              :max-collapse-tags="2"
              clearable
            />
          </div>
        </div>
      </div>

      <div>
        <code>variant="outlined"</code>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px">
          <div>
            <h5 class="demo-label">单选</h5>
            <NeumorphismSelect
              v-model="variantSingle"
              :options="selectOptions"
              variant="outlined"
              placeholder="请选择..."
              clearable
            />
          </div>
          <div>
            <h5 class="demo-label">多选</h5>
            <NeumorphismSelect
              v-model="variantMulti"
              :options="selectOptions"
              variant="outlined"
              multiple
              collapse-tags
              :max-collapse-tags="2"
              clearable
            />
          </div>
        </div>
      </div>
    </div>
    <p class="demo-hint">
      描边色、发光、圆角等均由 <code>--nm-select-outlined-*</code> Token 控制，亮/暗主题均可覆盖。
    </p>
  </div>
</template>
