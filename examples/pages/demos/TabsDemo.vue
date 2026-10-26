<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, type DemoStage } from '../../demo'

type TabsPosition = 'top' | 'left'
type TabsSize = 'small' | 'medium' | 'large'

interface TabEntry {
  key: string
  label: string
  disabled?: boolean
}

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
const position = ref<TabsPosition>('top')
const size = ref<TabsSize>('medium')
/** 页签数量：2 / 3 / 4。调小数量是为了看导航条在窄容器里的等分表现 */
const tabCount = ref(3)
/** 禁用项：固定压在最后一个页签上，方便肉眼验证「禁用项既点不动、也被键盘跳过」 */
const hasDisabled = ref(false)
const activeTab = ref('tab1')
const stage = ref<DemoStage>('plane')

const positionOptions: DemoOption<TabsPosition>[] = [
  { label: '顶部', value: 'top' },
  { label: '左侧', value: 'left' },
]
const sizeOptions: DemoOption<TabsSize>[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const countOptions: DemoOption<number>[] = [
  { label: '2 个', value: 2 },
  { label: '3 个', value: 3 },
  { label: '4 个', value: 4 },
]

/** 预览用的页签集合：由「数量 + 是否禁用末项」实时派生 */
const tabs = computed<TabEntry[]>(() => {
  const list: TabEntry[] = Array.from({ length: tabCount.value }, (_, i) => ({
    key: `tab${i + 1}`,
    label: `标签页 ${i + 1}`,
  }))
  if (hasDisabled.value) {
    const last = list[list.length - 1]
    // 禁用项落在末项：数量调到 2 时它就是第 2 个，一眼能看出「只剩一个可切换页签」
    list[list.length - 1] = { ...last, label: '已禁用', disabled: true }
  }
  return list
})

/**
 * 受控的当前页签。
 *
 * 数量调小或当前页签刚被禁用时，组件只会停在「没有任何 tab 处于 active」的空态
 * （panel 里留着上一段内容、aria-selected 全为 false）。所以在 getter 里回落到
 * 第一个可用页签，把非法状态挡在组件外面，而不是让组件自己猜。
 */
const activeModel = computed<string>({
  get: () => {
    const list = tabs.value
    const current = list.find(tab => tab.key === activeTab.value)
    if (current && !current.disabled) return activeTab.value
    return list.find(tab => !tab.disabled)?.key ?? ''
  },
  set: value => {
    activeTab.value = value
  },
})

const activeLabel = computed(
  () => tabs.value.find(tab => tab.key === activeModel.value)?.label ?? '—'
)

/** 恢复默认：配置台「恢复默认」按钮直接调它 */
function reset(): void {
  position.value = 'top'
  size.value = 'medium'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  // 默认值（top / medium）不写，片段里只出现真正改变行为的属性
  if (position.value !== 'top') attrs.push(`position="${position.value}"`)
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  const open = attrs.length
    ? `<NeumorphismTabs v-model="active" :tabs="tabs" ${attrs.join(' ')}>`
    : '<NeumorphismTabs v-model="active" :tabs="tabs">'
  const disabledNote = hasDisabled.value
    ? `\n  <!-- 禁用项写法：{ key: 'tab4', label: '已禁用', disabled: true } -->`
    : ''
  return `${open}\n  <p>面板内容</p>\n</NeumorphismTabs>${disabledNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground v-model:stage="stage" :snippet="snippet">
      <div style="width: 100%; max-width: 460px">
        <NeumorphismTabs v-model="activeModel" :tabs="tabs" :position="position" :size="size">
          <p style="margin: 0">这里是「{{ activeLabel }}」的面板内容。</p>
        </NeumorphismTabs>
      </div>

      <template #spec>
        position=<b>{{ position }}</b> · size=<b>{{ size }}</b> · 页签 <b>{{ tabCount }}</b> 个 ·
        选中=<b>{{ activeLabel }}</b>
        <template v-if="hasDisabled"> · 末项禁用</template>
      </template>

      <template #hint>
        键盘导航：<code>top</code> 用 ←/→ 切换、<code>left</code> 用 ↑/↓，Home/End 跳到首尾；
        禁用项会被跳过（roving tabindex，仅当前页签可 Tab 聚焦）。
      </template>

      <template #config>
        <DemoField label="位置 position">
          <NeumorphismSegmented v-model="position" :options="positionOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="页签数量">
          <NeumorphismSegmented v-model="tabCount" :options="countOptions" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="hasDisabled" size="small" />
              <span>含禁用项</span>
            </label>
          </div>
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
