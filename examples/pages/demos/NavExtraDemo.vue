<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

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

// ---- Steps 状态与描述（第 2 个 block）----
/** status 可以逐项覆盖自动推导的 wait/process/finish，用来表达「这一步卡住了」 */
const detailSteps: StepEntry[] = [
  { key: 'cart', title: '购物车', description: '已选 3 件商品' },
  { key: 'address', title: '收货地址', description: '共 2 个可用地址' },
  { key: 'pay', title: '支付', description: '微信支付失败', status: 'error' },
  { key: 'done', title: '完成', description: '生成订单' },
]

// ---- Menu 横向模式（第 3 个 block）----
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

// ---- 变体一览：Steps 方向 × Menu 折叠 ----
interface NavPresetRow extends DemoPreset {
  direction: StepDirection
  collapsed: boolean
  label: string
}

const presetRows: NavPresetRow[] = [
  {
    key: 'h-expanded',
    code: 'direction="horizontal"',
    direction: 'horizontal',
    collapsed: false,
    label: '横向 · Menu 展开',
  },
  {
    key: 'v-expanded',
    code: 'direction="vertical"',
    direction: 'vertical',
    collapsed: false,
    label: '竖直 · Menu 展开',
  },
  {
    key: 'h-collapsed',
    code: 'direction="horizontal" collapsed',
    direction: 'horizontal',
    collapsed: true,
    label: '横向 · Menu 折叠',
  },
  {
    key: 'v-collapsed',
    code: 'direction="vertical" collapsed',
    direction: 'vertical',
    collapsed: true,
    label: '竖直 · Menu 折叠',
  },
]

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active: row.direction === stepDirection.value && row.collapsed === menuCollapsed.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(item => item.key === key)
  if (!row) return
  stepDirection.value = row.direction
  menuCollapsed.value = row.collapsed
}

function rowOf(key: string) {
  return presetRows.find(item => item.key === key)!
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const menuAttrs = [':items="menuItems"']
  // collapsed 默认 false，非默认才写
  if (menuCollapsed.value) menuAttrs.push('collapsed')
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
            <h4 class="demo-label">Menu 纵向菜单</h4>
            <NeumorphismMenu
              :items="menuItems"
              :collapsed="menuCollapsed"
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

  <div class="demo-block">
    <h4 class="demo-label">Steps 竖直方向 + 描述 + 单步状态覆盖</h4>
    <div style="max-width: 420px">
      <NeumorphismSteps
        v-model:current="stepCurrent"
        :steps="detailSteps"
        direction="vertical"
        @step-click="onStepClick"
      />
    </div>
    <p class="demo-hint">
      第三项显式写了 <code>status: 'error'</code>，覆盖自动推导出来的状态；其余项仍按
      <code>current</code> 自动判为 finish / process / wait。<code>description</code>
      是副标题，竖直方向下才有足够横向空间展示。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Menu 横向模式 + 子菜单</h4>
    <NeumorphismMenu
      :items="horizontalMenuItems"
      mode="horizontal"
      default-active="home"
      @select="onMenuSelect"
    />
    <p class="demo-hint">
      <code>mode="horizontal"</code> 时子菜单改为悬停弹出（带 150ms 关闭延迟），键盘 ←/→
      在顶层项间移动、→/Enter 进入子菜单。最近交互：<strong>{{ lastAction }}</strong>
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Steps 方向 × Menu 折叠（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <span style="font-size: 12px">{{ rowOf(item.key).label }}</span>
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      <code>Steps</code> 的 <code>current</code> 是 0 基索引（0..3 对应第 1..4 步），
      <code>direction</code> 只影响排布，状态推导逻辑与方向无关。
    </p>
  </div>
</template>
