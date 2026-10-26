<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

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

/** 恢复默认：配置台「恢复默认」按钮直接调它 */
function reset(): void {
  accordionModel.value = false
  disableThird.value = true
  active.value = ['item1']
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
          <NeumorphismButton variant="raised" size="small" @click="reset()">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
