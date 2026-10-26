<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type StepDirection = 'horizontal' | 'vertical'
type StepStatus = 'wait' | 'process' | 'finish' | 'error'

interface MenuEntry {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divided?: boolean
  children?: MenuEntry[]
}

interface DropdownEntry {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divided?: boolean
  danger?: boolean
}

interface StepEntry {
  key: string
  title: string
  description?: string
  status?: StepStatus
}

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
const stepCurrent = ref(1)
const stepDirection = ref<StepDirection>('horizontal')
const menuCollapsed = ref(false)
/** divided 是 item 级属性（不是 Menu 的 prop），所以这个开关改的是「第三项的 divided」 */
const menuDivided = ref(true)
const showIndicator = ref(true)

const directionOptions: DemoOption<StepDirection>[] = [
  { label: '横向', value: 'horizontal' },
  { label: '竖直', value: 'vertical' },
]

const menuItems = computed<MenuEntry[]>(() => [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'components', label: '组件', icon: '🧩', children: [{ key: 'button', label: 'Button' }] },
  { key: 'docs', label: '文档', icon: '📖', divided: menuDivided.value },
])

const navItems: MenuEntry[] = [
  { key: 'home', label: '首页' },
  { key: 'guide', label: '指南' },
  { key: 'api', label: 'API' },
]

const dropdownItems: DropdownEntry[] = [
  { key: 'edit', label: '编辑', icon: '✏️' },
  { key: 'duplicate', label: '复制', icon: '📄' },
  { key: 'delete', label: '删除', icon: '🗑️', divided: true, danger: true },
  { key: 'archive', label: '归档（不可用）', disabled: true },
]

/** 固定 4 步：数量不是参数，Steps 的看点是「当前步 + 方向」 */
const steps: StepEntry[] = [
  { key: 'cart', title: '购物车' },
  { key: 'address', title: '收货地址' },
  { key: 'pay', title: '支付' },
  { key: 'done', title: '完成' },
]

const currentStepTitle = computed(() => steps[stepCurrent.value]?.title ?? '—')

/** 交互回显：Menu / NavMenu / Dropdown / Steps 的事件都落到这一行，证明真的派发了 */
const lastAction = ref('—')

function onMenuSelect(item: MenuEntry) {
  lastAction.value = `Menu 选中：${item.label}`
}

function onNavSelect(item: MenuEntry) {
  lastAction.value = `NavMenu 选中：${item.label}`
}

function onDropdownSelect(item: DropdownEntry) {
  lastAction.value = `Dropdown 选中：${item.label}`
}

function onStepClick(step: StepEntry) {
  lastAction.value = `Steps 跳到：${step.title}`
}

function reset() {
  stepCurrent.value = 1
  stepDirection.value = 'horizontal'
  menuCollapsed.value = false
  menuDivided.value = true
  showIndicator.value = true
}

// ---- Menu 横向模式（第 3 个 block）----
/** 横向模式用带子菜单的 items——纵向模式下的子菜单是内联展开，横向是浮层 */
const horizontalMenuItems: MenuEntry[] = [
  { key: 'home', label: '首页' },
  {
    key: 'products',
    label: '产品',
    children: [
      { key: 'ui', label: 'UI 组件' },
      { key: 'charts', label: '图表' },
    ],
  },
  { key: 'docs', label: '文档', divided: true },
  { key: 'about', label: '关于' },
]

/** Menu 的排布模式：横向时换用带子菜单的那份 items，否则子菜单看不出差别 */
const menuMode = ref<'vertical' | 'horizontal'>('vertical')
const menuPreviewItems = computed(() =>
  menuMode.value === 'horizontal' ? horizontalMenuItems : menuItems.value
)

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const menuAttrs = [':items="items"']
  // collapsed 默认 false，非默认才写；横向时 collapsed 无意义
  if (menuMode.value === 'horizontal') menuAttrs.push('mode="horizontal"')
  else if (menuCollapsed.value) menuAttrs.push('collapsed')
  const navAttrs = [':items="navItems"', 'default-active="guide"']
  const stepAttrs = ['v-model:current="current"', ':steps="steps"']
  if (stepDirection.value !== 'horizontal') stepAttrs.push(`direction="${stepDirection.value}"`)
  return `<NeumorphismMenu ${menuAttrs.join(' ')} />
<NeumorphismNavMenu ${navAttrs.join(' ')} />
<NeumorphismDropdown :items="dropdownItems">
  <NeumorphismButton>操作</NeumorphismButton>
</NeumorphismDropdown>
<NeumorphismSteps ${stepAttrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: 100%">
        <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
          <div style="flex: 0 1 220px; min-width: 200px">
            <h4 class="demo-label">
              Menu 菜单（{{ menuMode === 'horizontal' ? '横向' : '纵向' }}）
            </h4>
            <NeumorphismMenu
              :items="menuPreviewItems"
              :mode="menuMode"
              :collapsed="menuCollapsed && menuMode === 'vertical'"
              default-active="dashboard"
              @select="onMenuSelect"
            />
          </div>
          <div style="flex: 1 1 280px; min-width: 260px">
            <h4 class="demo-label">NavMenu 导航菜单（活动指示条）</h4>
            <NeumorphismNavMenu
              :items="navItems"
              default-active="guide"
              :show-indicator="showIndicator"
              @select="onNavSelect"
            />
            <h4 class="demo-label" style="margin-top: 16px">Dropdown 下拉菜单</h4>
            <NeumorphismDropdown :items="dropdownItems" @select="onDropdownSelect">
              <NeumorphismButton size="small">操作</NeumorphismButton>
            </NeumorphismDropdown>
          </div>
        </div>

        <div style="margin-top: 18px">
          <h4 class="demo-label">
            Steps 步骤条（当前第 {{ stepCurrent + 1 }} 步：{{ currentStepTitle }}）
          </h4>
          <NeumorphismSteps
            v-model:current="stepCurrent"
            :steps="steps"
            :direction="stepDirection"
            @step-click="onStepClick"
          />
        </div>
      </div>

      <template #spec>
        Steps=<b>{{ stepCurrent + 1 }}/{{ steps.length }}</b> · direction=<b>{{ stepDirection }}</b>
        · Menu collapsed=<b>{{ menuCollapsed }}</b> · divided=<b>{{ menuDivided }}</b> ·
        indicator=<b>{{ showIndicator }}</b>
        <br />
        最近交互：<b>{{ lastAction }}</b>
      </template>

      <template #hint>
        Steps 的圆点可点（只允许跳到「已完成 / 待进行」的步，跳过 error 步）；
        <code>Menu</code> 折叠后只剩图标，<code>divided</code> 是 item 级分隔线；<code
          >NavMenu</code
        >
        的指示条由 <code>show-indicator</code> 控制。
      </template>

      <template #config>
        <DemoField label="当前步骤 current" :value="`第 ${stepCurrent + 1} 步`" grow>
          <NeumorphismSlider v-model="stepCurrent" :min="0" :max="3" :step="1" size="small" />
        </DemoField>

        <DemoField label="方向 direction">
          <NeumorphismSegmented v-model="stepDirection" :options="directionOptions" size="small" />
        </DemoField>

        <DemoField label="Menu 模式">
          <NeumorphismSegmented
            v-model="menuMode"
            :options="[
              { label: '纵向', value: 'vertical' },
              { label: '横向', value: 'horizontal' },
            ]"
            size="small"
          />
        </DemoField>

        <DemoField label="Menu">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="menuCollapsed" size="small" />
              <span>collapsed</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="menuDivided" size="small" />
              <span>divided</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="NavMenu">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showIndicator" size="small" />
              <span>showIndicator</span>
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
