<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type BreadcrumbSize = 'small' | 'medium' | 'large'

interface CrumbItem {
  label: string
  to?: string
  disabled?: boolean
}

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
/** 分隔符是纯文本，允许留空（留空 = 不渲染分隔符），也允许一句中文逗号之类的长分隔 */
const separator = ref('/')
const size = ref<BreadcrumbSize>('medium')

const sizeOptions: DemoOption<BreadcrumbSize>[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/** 预览用的层级：前两层可点（带 to），最后一层是当前页 */
const breadcrumbItems: CrumbItem[] = [
  { label: '首页', to: '#' },
  { label: '组件列表', to: '#' },
  { label: '按钮' },
]

/** 用来演示 #config 里的分隔符快捷按钮 */
const separatorPresets = ['/', '>', '·', '→']

/**
 * 项形状对照：`mixedItems` 是一次把三种边界摆齐——
 * 有 to / 缺 to（组件不读 to）/ disabled / 末层（=当前页）。
 */
const mixedItems: CrumbItem[] = [
  { label: '首页', to: '#' },
  // 没有 to 的中间层：组件不读 to——非末层且未禁用就照样是「链接」样式、照样派发
  // itemClick；to 只是留给调用方做路由跳转的数据，组件本身不导航
  { label: '缺 to 的层' },
  { label: '已禁用层', to: '#', disabled: true },
  { label: '当前页' },
]

/** itemClick 只有可点的层才会触发——「禁用项/当前页点了没反应」这件事在这里被看见 */
const lastClick = ref('—')
/** 预览用哪种 items：常态层级 vs 三种边界情况 */
const itemsMode = ref<'normal' | 'mixed'>('normal')
const previewItems = computed(() => (itemsMode.value === 'mixed' ? mixedItems : breadcrumbItems))

function onItemClick(item: CrumbItem, index: number) {
  lastClick.value = `${item.label}（第 ${index + 1} 层）`
}

/** 恢复默认：配置台「恢复默认」按钮直接调它 */
function reset(): void {
  separator.value = '/'
  itemsMode.value = 'normal'
  lastClick.value = '—'
  size.value = 'medium'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  // 默认分隔符是 '/'，默认尺寸是 medium：只有非默认值才写进片段
  if (separator.value !== '/') attrs.push(`separator="${separator.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  const attrText = attrs.length ? ` ${attrs.join(' ')}` : ''
  const emptyNote = separator.value === '' ? '\n  <!-- separator="" 表示不渲染分隔符 -->' : ''
  return `<NeumorphismBreadcrumb :items="items"${attrText} @item-click="onItemClick" />${emptyNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismBreadcrumb
        :items="previewItems"
        :separator="separator"
        :size="size"
        @item-click="onItemClick"
      />

      <template #spec>
        separator=<b>{{ separator === '' ? '（空）' : separator }}</b> · size=<b>{{ size }}</b> ·
        层级=<b>{{ previewItems.length }}</b> · 项形状=<b>{{ itemsMode }}</b> · 最近
        <code>itemClick</code>=<b>{{ lastClick }}</b>
      </template>

      <template #hint>
        「已禁用层」带 <code>disabled</code>，点了不派发事件；「缺 to 的层」照样可点，因为组件不读
        <code>to</code>（它只是给调用方做路由跳转的数据）。 分隔符只是一段文本，<code>/</code>
        <code>&gt;</code> <code>·</code> <code>→</code> 都可以；末层自动带
        <code>aria-current="page"</code> 并加粗，前面的层若给了 <code>to</code> 才可点。
      </template>

      <template #config>
        <DemoField label="分隔符 separator" grow>
          <NeumorphismInput v-model="separator" size="small" placeholder="/" :maxlength="4" />
        </DemoField>

        <DemoField label="快捷分隔符">
          <NeumorphismButton
            v-for="symbol in separatorPresets"
            :key="symbol"
            variant="pressed"
            size="small"
            @click="separator = symbol"
          >
            {{ symbol }}
          </NeumorphismButton>
        </DemoField>

        <DemoField label="项形状 items">
          <NeumorphismSegmented
            v-model="itemsMode"
            :options="[
              { label: '常态', value: 'normal' },
              { label: '边界（缺 to / 禁用 / 当前页）', value: 'mixed' },
            ]"
            size="small"
          />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
