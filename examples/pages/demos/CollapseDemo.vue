<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type CollapseKey = 'item1' | 'item2'

interface CollapseEntry {
  key: string
  title: string
  disabled?: boolean
}

// ---- 配置台状态 ----
const accordion = ref(false)
const active = ref<string[]>(['item1'])
/** 第三项是否禁用：原演示里它就是禁用态，这里给个开关看「点不动」的效果 */
const disableThird = ref(true)

const items = computed<CollapseEntry[]>(() => [
  { key: 'item1', title: '什么是新拟态？' },
  { key: 'item2', title: '如何使用这个组件库？' },
  // 标题跟着状态变：禁用时按钮整颗置灰，标题还写「已禁用项」才不误导
  { key: 'item3', title: disableThird.value ? '已禁用项' : '第三项', disabled: disableThird.value },
])

/**
 * 手风琴开关。
 *
 * 组件内部（useCollapse）在 accordion 下点击只会回传单元素数组，但它不校验
 * 「传进来的数组是不是已经有多项」——所以从多开切到手风琴时必须自己压成一个，
 * 否则切换瞬间会出现两栏同时展开。
 */
const accordionModel = computed<boolean>({
  get: () => accordion.value,
  set: value => {
    accordion.value = value
    if (value && active.value.length > 1) active.value = active.value.slice(0, 1)
  },
})

function setItem(key: CollapseKey, open: boolean) {
  const rest = active.value.filter(item => item !== key)
  if (!open) {
    active.value = rest
    return
  }
  active.value = accordion.value ? [key] : [...rest, key]
}

/**
 * 「展开 item1 / item2」两个开关。
 *
 * 都从 active 数组派生，所以点面板标题、点开关、点「全部展开」改的是同一份状态，
 * 不会出现开关显示「开」而面板实际关着的错位。
 */
const item1Open = computed<boolean>({
  get: () => active.value.includes('item1'),
  set: value => setItem('item1', value),
})
const item2Open = computed<boolean>({
  get: () => active.value.includes('item2'),
  set: value => setItem('item2', value),
})

/** 全部展开 / 全部折叠：手风琴下只能展开一项，所以退化成「展开第一项」 */
function toggleAll() {
  if (active.value.length) {
    active.value = []
    return
  }
  active.value = accordion.value ? ['item1'] : ['item1', 'item2']
}

// ---- 手风琴对照（第 2 个 block）----
const compareAccordion = ref<string[]>(['item1'])
const plainAccordion = ref<string[]>(['item1', 'item2'])

// ---- 变体一览 ----
interface CollapsePresetRow extends DemoPreset {
  accordion: boolean
  disabled: boolean
  label: string
}

const presetRows: CollapsePresetRow[] = [
  {
    key: 'default',
    code: 'v-model="active"',
    accordion: false,
    disabled: false,
    label: '多开 · 全部可用',
  },
  {
    key: 'accordion',
    code: 'accordion',
    accordion: true,
    disabled: false,
    label: '手风琴 · 全部可用',
  },
  {
    key: 'disabled',
    code: ':items="[{ …, disabled: true }]"',
    accordion: false,
    disabled: true,
    label: '多开 · 第三项禁用',
  },
  {
    key: 'accordion-disabled',
    code: 'accordion + disabled',
    accordion: true,
    disabled: true,
    label: '手风琴 · 第三项禁用',
  },
]

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active: row.accordion === accordion.value && row.disabled === disableThird.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(item => item.key === key)
  if (!row) return
  // 先改开关（会顺手压平展开项），再补上第一项展开，保证预览里看得见内容
  accordionModel.value = row.accordion
  disableThird.value = row.disabled
  active.value = ['item1']
}

function rowOf(key: string) {
  return presetRows.find(item => item.key === key)!
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = ['v-model="active"', ':items="items"']
  // accordion 默认 false，非默认才写
  if (accordion.value) attrs.push('accordion')
  const disabledNote = disableThird.value
    ? `\n  <!-- 禁用项：{ key: 'item3', title: '已禁用项', disabled: true } 连标题都点不动 -->`
    : ''
  return `<NeumorphismCollapse ${attrs.join(' ')}>
  <template #item1>第一栏内容</template>
  <template #item2>第二栏内容</template>
</NeumorphismCollapse>${disabledNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: 100%; max-width: 560px">
        <NeumorphismCollapse v-model="active" :items="items" :accordion="accordionModel">
          <template #item1>
            <p>
              新拟态（Soft
              UI）是一种设计风格，通过阴影和高光营造柔和、挤压般的塑料质感。元素看起来像是从背景中凸起或凹陷下去。
            </p>
          </template>
          <template #item2>
            <p>
              通过 <code>npm install @echolab-auto/ui-frame</code> 安装，然后按需引入组件或使用
              <code>app.use(NeumorphismUI)</code> 全局注册。
            </p>
          </template>
          <template #item3>
            <p>此项已被禁用：标题按钮带 <code>disabled</code>，点击与键盘都进不去。</p>
          </template>
        </NeumorphismCollapse>

        <div style="margin-top: 14px">
          <NeumorphismButton size="small" @click="toggleAll()">
            {{ active.length ? '全部折叠' : '全部展开' }}
          </NeumorphismButton>
        </div>
      </div>

      <template #spec>
        accordion=<b>{{ accordion }}</b> · 展开 <b>{{ active.length }}</b> 项 · 第三项=<b>{{
          disableThird ? '禁用' : '可用'
        }}</b>
      </template>

      <template #hint>
        展开/收起是 <code>grid-template-rows: 0fr → 1fr</code> 的过渡（带回弹的
        cubic-bezier），内容多高都不用 JS 量；<code>disabled</code>
        项整颗按钮禁用，连焦点都不进。
      </template>

      <template #config>
        <DemoField label="手风琴 accordion">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="accordionModel" size="small" />
              <span>同时只开一项</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="展开 active">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="item1Open" size="small" />
              <span>item1</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="item2Open" size="small" />
              <span>item2</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="第三项">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="disableThird" size="small" />
              <span>disabled</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="applyPreset('default')">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">手风琴 vs 多开（同一份 items，两种 modelValue 语义）</h4>
    <div class="demo-row" style="gap: 24px; align-items: flex-start">
      <div style="flex: 1 1 260px; min-width: 240px">
        <p class="demo-hint" style="margin: 0 0 6px">accordion（同时只开一项）</p>
        <NeumorphismCollapse v-model="compareAccordion" :items="items" accordion>
          <template #item1>
            <p>展开这一栏时，另一栏会自动收起。</p>
          </template>
          <template #item2>
            <p>modelValue 里永远最多只有一个 key。</p>
          </template>
          <template #item3>
            <p>禁用项不参与折叠。</p>
          </template>
        </NeumorphismCollapse>
      </div>
      <div style="flex: 1 1 260px; min-width: 240px">
        <p class="demo-hint" style="margin: 0 0 6px">默认（可同时展开多项）</p>
        <NeumorphismCollapse v-model="plainAccordion" :items="items">
          <template #item1>
            <p>默认 <code>accordion=false</code>，可以多栏同开。</p>
          </template>
          <template #item2>
            <p>modelValue 是一个 key 数组，顺序无关。</p>
          </template>
          <template #item3>
            <p>禁用项不参与折叠。</p>
          </template>
        </NeumorphismCollapse>
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">配置组合一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <span style="font-size: 12px">{{ rowOf(item.key).label }}</span>
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      内容通过具名插槽 <code>#item1</code> / <code>#item2</code> /
      <code>#item3</code> 注入，插槽名就是 item 的 <code>key</code>；表头文案要自定义时用
      <code>#header-item1</code>。
    </p>
  </div>
</template>
