<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type TableSize = 'small' | 'medium' | 'large'

// ---- 配置台状态（主角是 Table）----
const striped = ref(false)
const hoverable = ref(true)
const size = ref<TableSize>('medium')
const showHeader = ref(true)

// ---- 数据 ----
const tableData = [
  { key: '1', name: 'Vue 3', category: '框架', stars: 207 },
  { key: '2', name: 'React 18', category: '框架', stars: 203 },
  { key: '3', name: 'Vite 5', category: '构建', stars: 67 },
  { key: '4', name: 'Svelte 5', category: '框架', stars: 78 },
]

const columns = [
  { key: 'name', label: '名称' },
  { key: 'category', label: '分类' },
  // sortable 打开后点列头即可升/降/取消三态切换，数值列走 defaultSort 的减法分支
  { key: 'stars', label: 'Stars (k)', sortable: true },
]

/** 演示 2 的选中态：受控 selectedKeys */
const selectedKeys = ref<string[]>([])

const listItems = ref([
  '支持键盘导航与 roving tabindex',
  '亮暗双主题 Token 驱动',
  '级联配置全库生效',
])

const virtualItemHeight = ref(36)

/** 1000 项只渲染可视区 + overscan；itemHeight 必须与真实行高一致，否则滚动会抖 */
const virtualItems = computed(() =>
  Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `虚拟列表项 #${i + 1}` }))
)

const sizeOptions = [
  { label: '紧凑', value: 'small' },
  { label: '标准', value: 'medium' },
  { label: '宽松', value: 'large' },
]

function reset() {
  striped.value = false
  hoverable.value = true
  size.value = 'medium'
  showHeader.value = true
  selectedKeys.value = []
  virtualItemHeight.value = 36
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = [':columns="columns"', ':data="tableData"']
  if (striped.value) attrs.push('striped')
  // hoverable 的默认值来自全局配置（true），关掉它必须显式写 false
  if (!hoverable.value) attrs.push(':hoverable="false"')
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (!showHeader.value) attrs.push(':show-header="false"')
  return `<NeumorphismTable ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（Table，左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <div style="width: 100%">
        <NeumorphismTable
          :columns="columns"
          :data="tableData"
          :striped="striped"
          :hoverable="hoverable"
          :size="size"
          :show-header="showHeader"
        />
      </div>

      <template #spec>
        striped=<b>{{ striped }}</b> · hoverable=<b>{{ hoverable }}</b> · size=<b>{{ size }}</b> ·
        show-header=<b>{{ showHeader }}</b>
      </template>

      <template #hint>
        点 <code>Stars (k)</code> 列头可以在 升序 → 降序 → 取消 之间循环（第三态会把排序键清空）。
        组件本身不做分页，长表格请配 <code>NeumorphismPagination</code> 自己做切片。
      </template>

      <template #config>
        <DemoField label="密度 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="striped" size="small" />
              <span>striped</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="hoverable" size="small" />
              <span>hoverable</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showHeader" size="small" />
              <span>show-header</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="pressed" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Table 排序 + 多选（selectedKeys 受控）</h4>
    <NeumorphismTable
      v-model:selected-keys="selectedKeys"
      :columns="columns"
      :data="tableData"
      striped
      selectable="multiple"
    />
    <p class="demo-hint">
      已选 <strong>{{ selectedKeys.length }}</strong> 行<template v-if="selectedKeys.length">
        ：{{ selectedKeys.join('、') }}</template
      >。勾选列会自己处理「全选 / 半选」两种 indeterminate 状态，不需要宿主判断。
    </p>
  </div>

  <div class="demo-block">
    <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
      <div style="flex: 1; min-width: 240px">
        <h4 class="demo-label">List 列表</h4>
        <NeumorphismList :items="listItems" />
      </div>
      <div style="flex: 1; min-width: 240px">
        <h4 class="demo-label">Empty 空状态</h4>
        <NeumorphismEmpty description="这里还没有任何内容" />
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">VirtualList 虚拟列表（1000 项，只渲染可视区）</h4>
    <div class="demo-row" style="margin-bottom: 12px">
      <span class="demo-form-label">行高 itemHeight</span>
      <NeumorphismSlider
        v-model="virtualItemHeight"
        :min="28"
        :max="64"
        :step="2"
        size="small"
        style="width: 200px"
      />
      <code>{{ virtualItemHeight }}px</code>
    </div>
    <NeumorphismVirtualList
      :items="virtualItems"
      :item-height="virtualItemHeight"
      style="max-height: 240px"
    >
      <template #default="{ item }">
        <!--
          行高必须与 item-height 完全相等：把 height / line-height 绑到同一个值，
          拖动上面滑块时行高跟着变，1000 项的偏移才不会越滚越歪。
        -->
        <div
          :style="{
            height: `${virtualItemHeight}px`,
            lineHeight: `${virtualItemHeight}px`,
            padding: '0 12px',
          }"
        >
          {{ item.text }}
        </div>
      </template>
    </NeumorphismVirtualList>
    <p class="demo-hint">
      组件按「下标 × <code>item-height</code>」算绝对偏移，所以行高必须固定且等于它—— 上面把行内
      <code>height</code> / <code>line-height</code> 绑到同一个值，就是为了让 1000
      项永远对得上；行内也别放会换行的内容（一换行行高就变，后面的行会错位）。
    </p>
  </div>
</template>
