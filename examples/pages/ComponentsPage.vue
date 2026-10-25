<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTheme } from '../../src/composables/useTheme'
import { ChatFold, ChatComposer, ChatCopyButton } from '../../src/composites/chat'
import { DocCodeBlock, DocTocNav, type TocNode } from '../../src/composites/doc'
import type { GraphLink, GraphNode } from '../../src/components/NeumorphismGraphView'
import artImage from '../assets/images.jpeg'

// ---- 注入全局主题（由 App.vue provide） ----
const themeContext = useTheme()
const isDark = themeContext.isDark

// ==========================================
// 补齐组件演示状态
// ==========================================

// --- 数据录入扩展 ---
const demoInputNumber = ref(3)
const demoSlider = ref(40)
const demoDate = ref<Date | null>(null)
const demoAutoComplete = ref<string | number>('')

// --- 数据展示扩展 ---
const demoTableData = ref([
  { key: '1', name: 'Vue 3', category: '框架', stars: 207 },
  { key: '2', name: 'React 18', category: '框架', stars: 203 },
  { key: '3', name: 'Vite 5', category: '构建', stars: 67 },
])
const demoTableColumns = [
  { key: 'name', label: '名称' },
  { key: 'category', label: '分类' },
  { key: 'stars', label: 'Stars (k)', sortable: true },
]
const demoListItems = ref([
  '支持键盘导航与 roving tabindex',
  '亮暗双主题 Token 驱动',
  '级联配置全库生效',
])

// --- 反馈组件 ---
const demoDrawerOpen = ref(false)

// --- 导航组件 ---
const demoMenuItems = ref([
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'components', label: '组件', icon: '🧩', children: [{ key: 'button', label: 'Button' }] },
  { key: 'docs', label: '文档', icon: '📖', divided: true },
])
const demoNavItems = ref([
  { key: 'home', label: '首页' },
  { key: 'guide', label: '指南' },
  { key: 'api', label: 'API' },
])
const demoStepsActive = ref(1)
const demoStepsItems = [
  { key: 'cart', title: '购物车' },
  { key: 'address', title: '收货地址' },
  { key: 'pay', title: '支付' },
  { key: 'done', title: '完成' },
]

// --- 上传 ---
const demoUploadFiles = ref([])

// --- 分段选择 ---
const demoSegmented = ref<string | number>('allowlist')
const demoSegmentedOptions = [
  { label: '无约束', value: 'none' },
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist' },
]

// --- 聊天原子组件 ---
const composerDemoValue = ref('')
const composerDemoSent = ref('')
function composerDemoSend(content: string) {
  composerDemoSent.value = content
}

// --- 文档元组件 ---
const tocDemoActiveId = ref('toc-demo-start')
const tocDemoItems: TocNode[] = [
  {
    level: 1,
    text: '指南',
    id: 'toc-demo-guide',
    children: [
      { level: 2, text: '快速开始', id: 'toc-demo-start', children: [] },
      { level: 2, text: '进阶用法', id: 'toc-demo-adv', children: [] },
    ],
  },
  { level: 1, text: 'API 参考', id: 'toc-demo-api', children: [] },
]

const codeDemoTs = `// 快速开始
import { createApp } from 'vue'
import NeumorphismUI from '@echolab-auto/ui-frame'

const app = createApp(App)
app.use(NeumorphismUI)`

// --- 虚拟列表 ---
const demoVirtualItems = computed(() =>
  Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `虚拟列表项 #${i + 1}` }))
)

// ---- 组件分类导航 ----
const navCategories = [
  {
    title: '基础输入',
    items: [
      { id: 'buttons', label: '按钮 Button' },
      { id: 'switch', label: '开关 Switch' },
      { id: 'checkbox', label: '复选框 Checkbox' },
      { id: 'radio', label: '单选框 Radio' },
      { id: 'input', label: '输入框 Input' },
      { id: 'textarea', label: '文本域 Textarea' },
      { id: 'select', label: '选择器 Select' },
    ],
  },
  {
    title: '表单',
    items: [{ id: 'form', label: '表单 Form' }],
  },
  {
    title: '数据展示',
    items: [
      { id: 'card', label: '卡片 Card' },
      { id: 'avatar', label: '头像 Avatar' },
      { id: 'badge', label: '徽标 Badge' },
      { id: 'tag', label: '标签 Tag' },
      { id: 'progress', label: '进度条 Progress' },
      { id: 'skeleton', label: '骨架屏 Skeleton' },
      { id: 'divider', label: '分割线 Divider' },
      { id: 'scrollbar', label: '滚动条 Scrollbar' },
      { id: 'chart', label: '图表 Chart' },
    ],
  },
  {
    title: '导航',
    items: [
      { id: 'tabs', label: '选项卡 Tabs' },
      { id: 'breadcrumb', label: '面包屑 Breadcrumb' },
      { id: 'pagination', label: '分页 Pagination' },
    ],
  },
  {
    title: '反馈',
    items: [
      { id: 'modal', label: '模态框 Modal' },
      { id: 'toast', label: '消息提示 Toast' },
      { id: 'tooltip', label: '文字提示 Tooltip' },
      { id: 'collapse', label: '折叠面板 Collapse' },
      { id: 'status-feedback', label: '状态点 · 加载 · 分段' },
    ],
  },
  {
    title: '聊天原子组件',
    items: [
      { id: 'chat-fold', label: '折叠块 ChatFold' },
      { id: 'chat-composer', label: '输入器 ChatComposer' },
    ],
  },
  {
    title: '文档元组件',
    items: [
      { id: 'doc-code-block', label: '代码块 DocCodeBlock' },
      { id: 'doc-toc-nav', label: '目录导航 DocTocNav' },
    ],
  },
  {
    title: '布局',
    items: [
      { id: 'container', label: '容器 Container' },
      { id: 'grid', label: '栅格 Grid' },
      { id: 'layout', label: '布局 Layout' },
    ],
  },
  {
    title: '扩展',
    items: [
      { id: 'themetoggle', label: '主题切换 ThemeToggle' },
      { id: 'tree', label: '树形导航 Tree' },
      { id: 'canvas', label: '画布 Canvas' },
      { id: 'logo', label: 'Logo 动效 Logo' },
      { id: 'art', label: '试验效果 Art' },
      { id: 'ascii-art', label: '字符画 AsciiArt' },
      { id: 'pixel-font', label: '像素字体 PixelFont' },
      { id: 'graph', label: '节点图 GraphView' },
    ],
  },
]

// ---- 导航滚动 ----
let clickScrollToken = 0
let clickScrollTimer: ReturnType<typeof setTimeout> | null = null

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  activeSection.value = id
  clickScrollToken++
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const token = clickScrollToken
  clickScrollTimer = setTimeout(() => {
    clickScrollTimer = null
    if (token === clickScrollToken) {
      clickScrollToken = 0
      updateActiveSection()
    }
  }, 600)
}

// ---- 滚动监听（scroll-spy） ----
const HEADER_OFFSET = 120
const activeSection = ref('buttons')
const allSectionIds = computed(() => navCategories.flatMap(c => c.items.map(i => i.id)))

let scrollTicking = false

function updateActiveSection() {
  let current = allSectionIds.value[0]
  for (const id of allSectionIds.value) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= HEADER_OFFSET + 10) {
      current = id
    }
  }
  activeSection.value = current
}

function onScroll() {
  if (clickScrollToken > 0) return
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateActiveSection()
      scrollTicking = false
    })
    scrollTicking = true
  }
}

// Resolve the actual scroll container (.nm-layout__content) for accurate scroll-spy
function getScrollContainer(): Element | null {
  return document.querySelector('.showcase .nm-layout__content')
}

onMounted(() => {
  nextTick(() => {
    const container = getScrollContainer()
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true })
    }
    updateActiveSection()
  })
})

onBeforeUnmount(() => {
  if (clickScrollTimer) clearTimeout(clickScrollTimer)
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', onScroll)
  }
})

// ---- 尺寸调参演示：滑动条 + 数值直调（px） ----
// 组件几何由 CSS 变量驱动：可直接覆盖 Token 的走 Token；
// 内部几何硬编码的（开关 / 勾选 / 单选框 / 标签 / 分页 / 主题切换 / 环形进度）
// 由本页样式桥接（见 <style> 末尾「尺寸调参演示」段）。
const buttonHeight = ref(44)

// ---- Button 展示 + 配置 ----
type ButtonPresetVariant = 'raised' | 'pressed' | 'primary' | 'glow'
type ButtonPresetGlass = 'none' | 'float' | 'raised' | 'pressed'

const buttonVariant = ref<ButtonPresetVariant>('raised')
const buttonGlass = ref<ButtonPresetGlass>('none')
const buttonSize = ref<'small' | 'medium' | 'large'>('medium')
const buttonShape = ref<'rounded' | 'pill' | 'circle'>('rounded')
const buttonText = ref('按钮')
const buttonLoading = ref(false)
const buttonDisabled = ref(false)
/** 预览台背景：平面 = 新拟态本色，彩色 = 衬托玻璃档位 */
const buttonStage = ref<'plane' | 'gradient'>('gradient')

const buttonVariantOptions = [
  { label: '凸起', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
  { label: '主色', value: 'primary' },
  { label: '辉光', value: 'glow' },
]
const buttonGlassOptions = [
  { label: '关闭', value: 'none' },
  { label: '悬浮', value: 'float' },
  { label: '凸面', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
]
const buttonSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const buttonShapeOptions = [
  { label: '圆角', value: 'rounded' },
  { label: '胶囊', value: 'pill' },
  { label: '圆形', value: 'circle' },
]

/**
 * 预览用的高度样式。
 *
 * 组件的尺寸档位分别消费 `--nm-button-*-sm/md/lg`，所以滑块必须写到**当前档位**
 * 对应的那组 token 上——否则选 small / large 时滑块会静默失效。
 */
const buttonPreviewStyle = computed(() => {
  const h = buttonHeight.value
  const suffix = buttonSize.value === 'small' ? 'sm' : buttonSize.value === 'large' ? 'lg' : 'md'
  // 以 md 档为基准按比例缩放内边距与字号，保持视觉比例不变
  const k = h / 44
  return {
    [`--nm-button-min-height-${suffix}`]: `${h}px`,
    [`--nm-button-padding-y-${suffix}`]: `${Math.round(12 * k)}px`,
    [`--nm-button-padding-x-${suffix}`]: `${Math.round(24 * k)}px`,
    [`--nm-button-font-${suffix}`]: `${Math.max(11, Math.round(14 * k))}px`,
  }
})

/** 传给组件的 glass：'none' 必须显式传 false，否则会走全局配置/旧 variant 语义 */
const buttonGlassValue = computed<false | Exclude<ButtonPresetGlass, 'none'>>(() =>
  buttonGlass.value === 'none' ? false : buttonGlass.value
)

/** 变体一览：点击即载入到上方预览（含玻璃旧写法对照） */
const buttonPresetList: {
  key: string
  label: string
  code: string
  variant: ButtonPresetVariant | 'glass' | 'glass-raised'
  glass: false | 'float' | 'raised' | 'pressed'
  /** 点击后载入的状态；旧写法格与 float 档等价，故不参与选中态比对 */
  target: { variant: ButtonPresetVariant; glass: ButtonPresetGlass }
  match?: false
}[] = [
  {
    key: 'raised',
    label: '凸起',
    code: 'variant="raised"',
    variant: 'raised',
    glass: false,
    target: { variant: 'raised', glass: 'none' },
  },
  {
    key: 'pressed',
    label: '凹陷',
    code: 'variant="pressed"',
    variant: 'pressed',
    glass: false,
    target: { variant: 'pressed', glass: 'none' },
  },
  {
    key: 'primary',
    label: '主色',
    code: 'variant="primary"',
    variant: 'primary',
    glass: false,
    target: { variant: 'primary', glass: 'none' },
  },
  {
    key: 'glow',
    label: '辉光',
    code: 'variant="glow"',
    variant: 'glow',
    glass: false,
    target: { variant: 'glow', glass: 'none' },
  },
  {
    key: 'glass-float',
    label: '悬浮玻璃',
    code: 'glass="float"',
    variant: 'raised',
    glass: 'float',
    target: { variant: 'raised', glass: 'float' },
  },
  {
    key: 'glass-raised',
    label: '凸面玻璃',
    code: 'glass="raised"',
    variant: 'raised',
    glass: 'raised',
    target: { variant: 'raised', glass: 'raised' },
  },
  {
    key: 'glass-pressed',
    label: '凹陷玻璃',
    code: 'glass="pressed"',
    variant: 'raised',
    glass: 'pressed',
    target: { variant: 'raised', glass: 'pressed' },
  },
  {
    key: 'legacy-glass',
    label: '旧写法',
    code: 'variant="glass"',
    variant: 'glass',
    glass: false,
    target: { variant: 'raised', glass: 'float' },
    match: false,
  },
]

function isButtonPreset(item: (typeof buttonPresetList)[number]): boolean {
  if (item.match === false) return false
  return item.target.variant === buttonVariant.value && item.target.glass === buttonGlass.value
}

function applyButtonPreset(item: (typeof buttonPresetList)[number]): void {
  buttonVariant.value = item.target.variant
  buttonGlass.value = item.target.glass
  buttonStage.value = item.target.glass === 'none' ? buttonStage.value : 'gradient'
}

function resetButtonDemo(): void {
  buttonVariant.value = 'raised'
  buttonGlass.value = 'none'
  buttonSize.value = 'medium'
  buttonShape.value = 'rounded'
  buttonText.value = '按钮'
  buttonLoading.value = false
  buttonDisabled.value = false
  buttonHeight.value = 44
}

/** 实时代码片段：直接照抄即可复现当前预览 */
const buttonSnippet = computed(() => {
  const attrs: string[] = []
  if (buttonVariant.value !== 'raised') attrs.push(`variant="${buttonVariant.value}"`)
  if (buttonGlass.value !== 'none') attrs.push(`glass="${buttonGlass.value}"`)
  if (buttonSize.value !== 'medium') attrs.push(`size="${buttonSize.value}"`)
  if (buttonShape.value !== 'rounded') attrs.push(`shape="${buttonShape.value}"`)
  if (buttonLoading.value) attrs.push('loading')
  if (buttonDisabled.value) attrs.push('disabled')
  const open = attrs.length ? `<NeumorphismButton ${attrs.join(' ')}>` : '<NeumorphismButton>'
  const height =
    buttonHeight.value !== 44
      ? `\n  <!-- 高度经 --nm-button-* 变量调整：${buttonHeight.value}px -->`
      : ''
  return `${open}${buttonText.value || '按钮'}</NeumorphismButton>${height}`
})
const switchTrackHeight = ref(30)
const powerSwitchHeight = ref(32)
const checkboxBoxSize = ref(24)
const radioCircleSize = ref(24)
const inputHeight = ref(48)
const avatarDiameter = ref(44)
const tagFontSize = ref(12)
const progressBarHeight = ref(8)
const progressCircleDiameter = ref(120)
const paginationItemSize = ref(38)
const spinnerDiameter = ref(28)
const themeToggleHeight = ref(35)
const logoWidth = ref(220)

function inputSizeVars(h: number) {
  const k = h / 48
  return {
    '--nm-field-min-height-md': `${h}px`,
    '--nm-field-padding-y-md': `${Math.round(10 * k)}px`,
    '--nm-field-padding-x-md': `${Math.round(16 * k)}px`,
    '--nm-field-font-md': `${Math.max(11, Math.round(14 * k))}px`,
  }
}

function avatarSizeVars(d: number) {
  return {
    '--nm-avatar-size-md': `${d}px`,
    '--nm-avatar-font-md': `${Math.max(10, Math.round((16 * d) / 44))}px`,
  }
}

// ---- 开关示例 ----
const switch1 = ref(false)
const switch2 = ref(true)

// ---- 开关 · power 变体示例 ----
const powerSwitch1 = ref(false)
const powerSwitch2 = ref(true)
const powerSwitch3 = ref(false)

// ---- 复选框示例 ----
const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkboxIndeterminate = ref(true)

// ---- 单选框示例 ----
const radio1 = ref('a')
const radio2 = ref('a')

// ---- 选择器示例 ----
const select1 = ref('vue')
const select2 = ref('')

const selectOptions = [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular 16', value: 'angular' },
  { label: 'Svelte 4', value: 'svelte', disabled: true },
  { label: 'Solid.js', value: 'solid' },
]

// ---- Select 进阶示例：可搜索 / 多选 / 分组 / 加载 ----
const selectFilterable = ref('')
const selectMultiple = ref<(string | number)[]>(['vue', 'react'])
const selectGrouped = ref('')
const selectAsyncLoading = ref(false)
const selectAsyncValue = ref('')
// 双变体对比：default 与 outlined 共享同一份数据，唯一变量是 variant
const variantSingle = ref('vue')
const variantMulti = ref<(string | number)[]>(['vue', 'react'])

const selectGroupedOptions = [
  { label: 'Vue 3', value: 'vue', group: '渐进式框架' },
  { label: 'Nuxt', value: 'nuxt', group: '渐进式框架' },
  { label: 'React 18', value: 'react', group: '组件化生态' },
  { label: 'Preact', value: 'preact', group: '组件化生态' },
  { label: 'Svelte 4', value: 'svelte', group: '编译时框架' },
  { label: 'Solid.js', value: 'solid', group: '编译时框架' },
]

function simulateSelectAsync() {
  selectAsyncLoading.value = true
  setTimeout(() => {
    selectAsyncLoading.value = false
  }, 2000)
}

// ---- 输入框和文本域示例 ----
const inputName = ref('')
const inputEmail = ref('')
const textareaValue = ref('')

// ---- 模态框示例 ----
const modalVisible = ref(false)

// ---- 模态框内层叠联动测试 (Modal + Form + Select z-index 验证) ----
const layerTestVisible = ref(false)
const layerTestName = ref('')
const layerTestRole = ref('')
const layerTestType = ref('')
const layerTestStatus = ref('')

const layerTestInterfaceOptions = [
  { label: 'eth0 (默认网关)', value: 'eth0' },
  { label: 'eth1 (内网)', value: 'eth1' },
  { label: 'wlan0 (无线)', value: 'wlan0' },
  { label: 'br0 (桥接)', value: 'br0' },
  { label: 'lo (回环)', value: 'lo', disabled: true },
]

const layerTestRoleOptions = [
  { label: 'WAN', value: 'wan' },
  { label: 'LAN', value: 'lan' },
  { label: 'DMZ', value: 'dmz' },
  { label: 'Guest', value: 'guest' },
]

const layerTestTypeOptions = [
  { label: '静态 IP', value: 'static' },
  { label: 'DHCP', value: 'dhcp' },
  { label: 'PPPoE', value: 'pppoe' },
  { label: 'VPN', value: 'vpn', disabled: true },
]

const layerTestStatusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
  { label: '待配置', value: 'pending' },
]

// ---- 选项卡示例 ----
const activeTab = ref('tab1')
const tabItems = [
  { key: 'tab1', label: '标签页 1' },
  { key: 'tab2', label: '标签页 2' },
  { key: 'tab3', label: '标签页 3' },
  { key: 'tab4', label: '已禁用', disabled: true },
]

// ---- 面包屑示例 ----
const breadcrumbItems = [
  { label: '首页', to: '#' },
  { label: '组件列表', to: '#' },
  { label: '按钮' },
]

// ---- 分页示例 ----
const page = ref(1)
const page2 = ref(3)

// ---- 折叠面板示例 ----
const collapseActive = ref<string[]>(['item1'])
const collapseItems = [
  { key: 'item1', title: '什么是新拟态？' },
  { key: 'item2', title: '如何使用这个组件库？' },
  { key: 'item3', title: '已禁用项', disabled: true },
]

// ---- 消息提示示例 ----
const toastContainer = ref<{
  addToast: (opts: { message: string; type: string; duration?: number }) => string
}>()
let toastCounter = 0
function showToast(type: string) {
  toastCounter++
  toastContainer.value?.addToast({
    message: `${type} 通知 #${toastCounter} — 新拟态设计真漂亮！`,
    type: type as 'info' | 'success' | 'warning' | 'error',
    duration: 3000,
  })
}

// ---- 进度条示例 ----
const progressVal = ref(60)
const isSimulating = ref(false)
let simulateTimer: ReturnType<typeof setInterval> | null = null

const progressVariants = ['primary', 'success', 'warning', 'error'] as const
const progressEffects = ['default', 'pulse', 'flow', 'wave', 'stripes', 'sparkle'] as const

function simulateLoading() {
  if (isSimulating.value) return
  progressVal.value = 0
  isSimulating.value = true
  simulateTimer = setInterval(() => {
    progressVal.value = Math.min(100, progressVal.value + Math.ceil(Math.random() * 14))
    if (progressVal.value >= 100) {
      if (simulateTimer) clearInterval(simulateTimer)
      simulateTimer = null
      isSimulating.value = false
    }
  }, 240)
}

onBeforeUnmount(() => {
  if (simulateTimer) clearInterval(simulateTimer)
})

// ---- 标签示例 ----
const tagVisible = ref(true)

// ---- 表单示例 ----
const formModel = ref({
  username: '',
  email: '',
  password: '',
})
const formRef = ref()

const formRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '至少 3 个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '至少 6 个字符' },
  ],
}

function handleFormSubmit(model: Record<string, unknown>) {
  showToast('success')
  console.log('表单已提交：', model)
}

// ---- 骨架屏示例 ----
const skeletonLoading = ref(true)

// ---- 主题切换组件示例 ----
const themeToggleValue = ref<Theme>('auto')

// ---- 树形导航示例 ----
const treeSelectedKeys = ref<string[]>(['getting-started'])
const treeExpandedKeys = ref<string[]>(['getting-started', 'components', 'components-basic'])
const treeData = [
  {
    key: 'getting-started',
    label: '快速开始',
    children: [
      { key: 'intro', label: '项目简介' },
      { key: 'install', label: '安装指南' },
      { key: 'usage', label: '基本用法' },
    ],
  },
  {
    key: 'components',
    label: '组件列表',
    children: [
      {
        key: 'components-basic',
        label: '基础组件',
        children: [
          { key: 'comp-button', label: 'Button 按钮' },
          { key: 'comp-input', label: 'Input 输入框' },
          { key: 'comp-switch', label: 'Switch 开关' },
        ],
      },
      {
        key: 'components-form',
        label: '表单组件',
        children: [
          { key: 'comp-form', label: 'Form 表单' },
          { key: 'comp-select', label: 'Select 选择器' },
        ],
      },
      {
        key: 'components-layout',
        label: '布局组件',
        children: [
          { key: 'comp-layout', label: 'Layout 布局' },
          { key: 'comp-grid', label: 'Grid 栅格' },
        ],
        disabled: true,
      },
    ],
  },
  {
    key: 'api',
    label: 'API 参考',
    children: [
      { key: 'api-theme', label: 'useTheme' },
      { key: 'api-props', label: 'Props 规范' },
    ],
  },
]

// ---- 画布示例 ----
const canvasZoom = ref(1)
const canvasShowGrid = ref(true)
const canvasGridVariant = ref<'dots' | 'lines'>('dots')

// ---- Logo 动效示例 ----
const logoMode = ref<'pulse' | 'liquid' | 'wave' | 'pointer'>('pulse')
const logoGoo = ref(true)
const logoModeOptions = [
  { label: '脉冲传导', value: 'pulse' },
  { label: '液态律动', value: 'liquid' },
  { label: '潮汐波纹', value: 'wave' },
  { label: '指针引力', value: 'pointer' },
]

// ---- AsciiArt 字符画调参面板 ----
const asciiDensity = ref(1.2)
const asciiSpeed = ref(1)
const asciiReactive = ref(true)
const asciiRadius = ref<'none' | 'small' | 'medium' | 'large' | 'xl'>('large')
const asciiSizeMode = ref<'auto' | 'fixed'>('auto')
const asciiWidth = ref(360)
const asciiHeight = ref(340)
const asciiPaletteName = ref<'theme' | 'warm' | 'cool'>('theme')
const asciiPalette = computed(() => {
  if (asciiPaletteName.value === 'warm') return ['#ff6b6b', '#feca57', '#ff9f43']
  if (asciiPaletteName.value === 'cool') return ['#48dbfb', '#54a0ff', '#5f27cd']
  return undefined
})
const asciiAriaLabel = ref('字符画')

// ---- PixelFont 像素字体展示面板 ----
const pixelTitle = ref('ASCII MOTION')
const pixelSubtitle = ref('CODE MEETS MOVEMENT')
const pixelScale = ref(3)
const pixelCursor = ref(true)
const pixelAlign = ref<'left' | 'center' | 'right'>('left')
const pixelAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]
/** 副题比标题小一档缩放（不低于 1 倍设计尺寸；原作副题约为标题高度的 60%） */
const pixelSubtitleScale = computed(() => Math.max(1, pixelScale.value - 1))

// ---- GraphView 节点图（实验性）----
// 模拟一个 Obsidian 风格的知识库：笔记 = 节点（按分组着色），双链 = 连线。
// 节点坐标留空 → 由黄金角螺旋播种后交给力学模拟铺开。
// —— 布局与视图（组件 props）——
const graphNodeRadius = ref(7)
const graphLinkDistance = ref(78)
const graphRepulsion = ref(900)
const graphHeight = ref(520)
const graphLabelMode = ref<'auto' | 'always' | 'hover'>('auto')
const graphLabelOptions = [
  { label: '自动', value: 'auto' },
  { label: '常显', value: 'always' },
  { label: '悬停', value: 'hover' },
]
const graphShowControls = ref(true)
const graphShowLegend = ref(true)
// —— 交互与行为 ——
const graphHighlight = ref(true)
const graphDraggable = ref(true)
const graphPannable = ref(true)
const graphZoomable = ref(true)
const graphAutoFit = ref(true)
const graphPreservePositions = ref(true)
// —— 力学动力学（经 forceSettings 下传，走的是 ForceLayout 的高级旋钮）——
const graphSpring = ref(0.008)
const graphGravity = ref(0.0004)
const graphVelocityDecay = ref(0.4)
const graphAlphaDecay = ref(0.0228)
const graphAlphaMin = ref(0.001)
const graphMaxSpeed = ref(10)
const graphMaxRepulsionForce = ref(6)
const graphForceSettings = computed(() => ({
  spring: graphSpring.value,
  gravity: graphGravity.value,
  velocityDecay: graphVelocityDecay.value,
  alphaDecay: graphAlphaDecay.value,
  alphaMin: graphAlphaMin.value,
  maxSpeed: graphMaxSpeed.value,
  maxRepulsionForce: graphMaxRepulsionForce.value,
}))

const graphRef = ref<{
  resetLayout: () => void
  fit: () => void
  reheat: (strength?: number) => void
  getAlpha: () => number
} | null>(null)
const graphHovered = ref<GraphNode | null>(null)
const graphSelected = ref<GraphNode | null>(null)
const graphSettled = ref(false)

/** 退火系数读数：模拟运行期间轮询（静止后停表，不留下空转定时器） */
const graphAlpha = ref(0)
let graphAlphaTimer: ReturnType<typeof setInterval> | null = null

function startGraphAlphaPoll() {
  if (graphAlphaTimer) return
  graphAlphaTimer = setInterval(() => {
    graphAlpha.value = graphRef.value?.getAlpha() ?? 0
  }, 100)
}

function stopGraphAlphaPoll() {
  if (!graphAlphaTimer) return
  clearInterval(graphAlphaTimer)
  graphAlphaTimer = null
}

function onGraphLayoutStart() {
  graphSettled.value = false
  startGraphAlphaPoll()
}

function onGraphLayoutSettled() {
  graphSettled.value = true
  stopGraphAlphaPoll()
  graphAlpha.value = graphRef.value?.getAlpha() ?? 0
}

/** 数字读数统一保留固定小数位，避免 0.008000000000000002 之类浮点噪声 */
function fmt(value: number, digits: number): string {
  return value.toFixed(digits)
}

onBeforeUnmount(stopGraphAlphaPoll)

const graphNodes = ref<GraphNode[]>([
  // 核心
  { id: 'philosophy', label: '设计哲学', group: '核心', size: 11 },
  { id: 'tokens', label: '设计令牌', group: '核心', size: 10 },
  { id: 'theme', label: '主题切换', group: '核心' },
  { id: 'shadows', label: '阴影模型', group: '核心' },
  { id: 'easing', label: '缓动曲线', group: '核心' },
  { id: 'a11y', label: '无障碍', group: '核心' },
  // 表单
  { id: 'button', label: '按钮', group: '表单' },
  { id: 'input', label: '输入框', group: '表单' },
  { id: 'select', label: '选择器', group: '表单' },
  { id: 'switch', label: '开关', group: '表单' },
  { id: 'slider', label: '滑块', group: '表单' },
  { id: 'form', label: '表单校验', group: '表单' },
  { id: 'datepicker', label: '日期选择', group: '表单' },
  // 数据
  { id: 'table', label: '表格', group: '数据' },
  { id: 'chart', label: '图表', group: '数据' },
  { id: 'tree', label: '树形导航', group: '数据' },
  { id: 'list', label: '列表', group: '数据' },
  { id: 'pagination', label: '分页', group: '数据' },
  { id: 'steps', label: '步骤条', group: '数据' },
  // 文档
  { id: 'doc', label: '文档渲染', group: '文档' },
  { id: 'markdown', label: 'Markdown 解析', group: '文档' },
  { id: 'code-block', label: '代码块', group: '文档' },
  { id: 'toc', label: '目录导航', group: '文档' },
  { id: 'chat', label: '聊天面板', group: '文档' },
  // 实验
  { id: 'art', label: '试验效果', group: '实验' },
  { id: 'ascii', label: '字符画', group: '实验' },
  { id: 'pixel-font', label: '像素字体', group: '实验' },
  { id: 'canvas', label: '无限画布', group: '实验' },
  { id: 'graph', label: '节点图', group: '实验', size: 10 },
])

const graphLinks = ref<GraphLink[]>([
  // 核心骨架
  { source: 'philosophy', target: 'tokens', weight: 1.6 },
  { source: 'philosophy', target: 'shadows' },
  { source: 'philosophy', target: 'easing' },
  { source: 'philosophy', target: 'a11y' },
  { source: 'tokens', target: 'theme' },
  { source: 'tokens', target: 'shadows', weight: 1.4 },
  { source: 'tokens', target: 'button' },
  { source: 'tokens', target: 'input' },
  { source: 'theme', target: 'a11y' },
  { source: 'easing', target: 'button' },
  { source: 'shadows', target: 'button', weight: 1.3 },
  { source: 'shadows', target: 'switch' },
  // 表单簇
  { source: 'button', target: 'form' },
  { source: 'input', target: 'form', weight: 1.4 },
  { source: 'select', target: 'form' },
  { source: 'switch', target: 'form' },
  { source: 'slider', target: 'form' },
  { source: 'form', target: 'datepicker' },
  { source: 'input', target: 'select', weight: 1.2 },
  { source: 'button', target: 'switch' },
  { source: 'steps', target: 'form' },
  // 数据簇
  { source: 'table', target: 'pagination' },
  { source: 'table', target: 'list', weight: 1.4 },
  { source: 'chart', target: 'table' },
  { source: 'tree', target: 'list' },
  { source: 'chart', target: 'canvas' },
  { source: 'list', target: 'tree' },
  // 文档簇
  { source: 'doc', target: 'markdown', weight: 1.6 },
  { source: 'doc', target: 'code-block' },
  { source: 'doc', target: 'toc' },
  { source: 'markdown', target: 'code-block', weight: 1.3 },
  { source: 'chat', target: 'markdown' },
  { source: 'chat', target: 'code-block' },
  { source: 'toc', target: 'doc' },
  { source: 'tree', target: 'doc' },
  // 实验簇
  { source: 'art', target: 'canvas' },
  { source: 'ascii', target: 'art', weight: 1.4 },
  { source: 'pixel-font', target: 'art' },
  { source: 'graph', target: 'canvas', weight: 1.4 },
  { source: 'graph', target: 'pixel-font' },
  { source: 'graph', target: 'philosophy' },
  { source: 'graph', target: 'a11y' },
  { source: 'ascii', target: 'pixel-font' },
  { source: 'chart', target: 'doc' },
])

/** 节点度数——点击节点时展示"这篇笔记被引用了多少条双链" */
const graphDegree = computed(() => {
  const map = new Map<string, number>()
  for (const link of graphLinks.value) {
    map.set(link.source, (map.get(link.source) ?? 0) + 1)
    map.set(link.target, (map.get(link.target) ?? 0) + 1)
  }
  return map
})

/** 增量数据演示：加/减节点，直观对比 preservePositions（保留坐标）与 autoFit */
let graphProbeSeq = 0

function addGraphNode() {
  graphProbeSeq += 1
  const id = `probe-${graphProbeSeq}`
  graphNodes.value = [
    ...graphNodes.value,
    { id, label: `新增笔记 ${graphProbeSeq}`, group: '实验' },
  ]
  graphLinks.value = [...graphLinks.value, { source: id, target: 'graph', weight: 1.4 }]
}

function removeGraphNode() {
  const probes = graphNodes.value.filter(n => n.id.startsWith('probe-'))
  if (probes.length === 0) return
  const last = probes[probes.length - 1].id
  graphNodes.value = graphNodes.value.filter(n => n.id !== last)
  graphLinks.value = graphLinks.value.filter(l => l.source !== last && l.target !== last)
  graphProbeSeq -= 1
}

/** 把所有调参恢复到与组件内置默认一致 */
function resetGraphDefaults() {
  graphNodeRadius.value = 7
  graphLinkDistance.value = 78
  graphRepulsion.value = 900
  graphHeight.value = 520
  graphLabelMode.value = 'auto'
  graphShowControls.value = true
  graphShowLegend.value = true
  graphHighlight.value = true
  graphDraggable.value = true
  graphPannable.value = true
  graphZoomable.value = true
  graphAutoFit.value = true
  graphPreservePositions.value = true
  graphSpring.value = 0.008
  graphGravity.value = 0.0004
  graphVelocityDecay.value = 0.4
  graphAlphaDecay.value = 0.0228
  graphAlphaMin.value = 0.001
  graphMaxSpeed.value = 10
  graphMaxRepulsionForce.value = 6
}

function onGraphNodeClick(node: GraphNode) {
  graphSelected.value = node
}

function onGraphNodeHover(node: GraphNode | null) {
  graphHovered.value = node
}

// ---- ChatComposer 玻璃 + 聚焦特效 ----
type ComposerGlass = 'none' | 'float' | 'raised' | 'pressed'
type ComposerFocus = 'ring' | 'glow' | 'inset' | 'none'

const composerGlass = ref<ComposerGlass>('raised')
const composerFocusEffect = ref<ComposerFocus>('glow')
const composerStage = ref<'plane' | 'gradient'>('gradient')
const composerGlassOptions = [
  { label: '关闭', value: 'none' },
  { label: '悬浮', value: 'float' },
  { label: '凸面', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
]
const composerFocusOptions = [
  { label: '外环', value: 'ring' },
  { label: '内辉光', value: 'glow' },
  { label: '深凹陷', value: 'inset' },
  { label: '无', value: 'none' },
]

// ---- Art 试验效果示例 ----
const artEffect = ref<'pixel-field' | 'particles' | 'waves' | 'goo' | 'ascii'>('pixel-field')
const artReactive = ref(true)
const artSpeed = ref(1)
const artDensity = ref(1)
const artEffectOptions = [
  { label: '像素脉冲场', value: 'pixel-field' },
  { label: '粒子连线', value: 'particles' },
  { label: '流动波浪', value: 'waves' },
  { label: '融合色团', value: 'goo' },
  { label: '字符画', value: 'ascii' },
]

// 流程图示例节点
const flowNodes = [
  { id: 'start', x: 180, y: 30, w: 100, h: 36, label: '开始', type: 'rounded' },
  { id: 'check', x: 180, y: 110, w: 100, h: 60, label: '条件判断?', type: 'diamond' },
  { id: 'action1', x: 50, y: 220, w: 120, h: 36, label: '处理分支 A', type: 'rect' },
  { id: 'action2', x: 260, y: 220, w: 120, h: 36, label: '处理分支 B', type: 'rect' },
  { id: 'merge', x: 180, y: 310, w: 100, h: 36, label: '合并', type: 'rect' },
  { id: 'end', x: 180, y: 400, w: 100, h: 36, label: '结束', type: 'rounded' },
]
const flowEdges = [
  { from: 'start', to: 'check' },
  { from: 'check', to: 'action1', label: '是' },
  { from: 'check', to: 'action2', label: '否' },
  { from: 'action1', to: 'merge' },
  { from: 'action2', to: 'merge' },
  { from: 'merge', to: 'end' },
]

// Edge rendering helper
function calcEdgePath(
  from: (typeof flowNodes)[number],
  to: (typeof flowNodes)[number],
  _label?: string
) {
  const x1 = from.x + from.w / 2
  const y1 = from.y + from.h
  const x2 = to.x + to.w / 2
  const y2 = to.y
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

// ---- 图表示例数据 ----
const chartBarData = ref([
  {
    name: '产品A',
    data: [
      { label: 'Q1', value: 40 },
      { label: 'Q2', value: 70 },
      { label: 'Q3', value: 55 },
      { label: 'Q4', value: 90 },
    ],
  },
  {
    name: '产品B',
    data: [
      { label: 'Q1', value: 30 },
      { label: 'Q2', value: 50 },
      { label: 'Q3', value: 45 },
      { label: 'Q4', value: 65 },
    ],
  },
])

const chartBarDataStacked = ref([
  {
    name: '线上',
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 150 },
      { label: '3月', value: 180 },
      { label: '4月', value: 140 },
    ],
  },
  {
    name: '线下',
    data: [
      { label: '1月', value: 80 },
      { label: '2月', value: 90 },
      { label: '3月', value: 100 },
      { label: '4月', value: 110 },
    ],
  },
])

const chartLineData = ref([
  {
    name: '访问量',
    data: [
      { label: '1月', value: 400 },
      { label: '2月', value: 600 },
      { label: '3月', value: 550 },
      { label: '4月', value: 720 },
      { label: '5月', value: 680 },
      { label: '6月', value: 810 },
    ],
  },
  {
    name: '注册量',
    data: [
      { label: '1月', value: 100 },
      { label: '2月', value: 180 },
      { label: '3月', value: 150 },
      { label: '4月', value: 220 },
      { label: '5月', value: 200 },
      { label: '6月', value: 260 },
    ],
  },
])

const chartPieData = ref([
  { label: 'Vue 3', value: 45 },
  { label: 'React', value: 30 },
  { label: 'Angular', value: 15 },
  { label: '其他', value: 10 },
])

const chartDonutData = ref([
  { label: '已完成', value: 65 },
  { label: '进行中', value: 25 },
  { label: '未开始', value: 10 },
])

// ---- K 线图示例数据 (模拟 60 个交易日) ----
const chartStockData = ref([
  { date: '2024-07-01', open: 102, high: 106, low: 101, close: 105, volume: 82000 },
  { date: '2024-07-02', open: 105, high: 108, low: 104, close: 106, volume: 95000 },
  { date: '2024-07-03', open: 106, high: 110, low: 105, close: 109, volume: 110000 },
  { date: '2024-07-04', open: 109, high: 111, low: 107, close: 108, volume: 78000 },
  { date: '2024-07-05', open: 108, high: 112, low: 107, close: 111, volume: 88000 },
  { date: '2024-07-08', open: 111, high: 114, low: 110, close: 113, volume: 92000 },
  { date: '2024-07-09', open: 113, high: 115, low: 109, close: 110, volume: 105000 },
  { date: '2024-07-10', open: 110, high: 112, low: 107, close: 108, volume: 120000 },
  { date: '2024-07-11', open: 108, high: 109, low: 103, close: 104, volume: 140000 },
  { date: '2024-07-12', open: 104, high: 108, low: 102, close: 107, volume: 115000 },
  { date: '2024-07-15', open: 107, high: 113, low: 106, close: 112, volume: 98000 },
  { date: '2024-07-16', open: 112, high: 116, low: 111, close: 115, volume: 130000 },
  { date: '2024-07-17', open: 115, high: 118, low: 113, close: 114, volume: 125000 },
  { date: '2024-07-18', open: 114, high: 117, low: 112, close: 116, volume: 108000 },
  { date: '2024-07-19', open: 116, high: 120, low: 115, close: 119, volume: 135000 },
  { date: '2024-07-22', open: 119, high: 122, low: 118, close: 121, volume: 142000 },
  { date: '2024-07-23', open: 121, high: 124, low: 119, close: 120, volume: 118000 },
  { date: '2024-07-24', open: 120, high: 121, low: 116, close: 117, volume: 155000 },
  { date: '2024-07-25', open: 117, high: 118, low: 113, close: 114, volume: 160000 },
  { date: '2024-07-26', open: 114, high: 117, low: 113, close: 116, volume: 128000 },
  { date: '2024-07-29', open: 116, high: 120, low: 115, close: 118, volume: 105000 },
  { date: '2024-07-30', open: 118, high: 121, low: 117, close: 120, volume: 112000 },
  { date: '2024-07-31', open: 120, high: 123, low: 119, close: 122, volume: 138000 },
  { date: '2024-08-01', open: 122, high: 125, low: 120, close: 121, volume: 145000 },
  { date: '2024-08-02', open: 121, high: 122, low: 117, close: 118, volume: 160000 },
  { date: '2024-08-05', open: 118, high: 119, low: 114, close: 115, volume: 180000 },
  { date: '2024-08-06', open: 115, high: 117, low: 112, close: 116, volume: 155000 },
  { date: '2024-08-07', open: 116, high: 120, low: 115, close: 119, volume: 142000 },
  { date: '2024-08-08', open: 119, high: 122, low: 118, close: 121, volume: 130000 },
  { date: '2024-08-09', open: 121, high: 124, low: 120, close: 123, volume: 148000 },
  { date: '2024-08-12', open: 123, high: 127, low: 122, close: 126, volume: 165000 },
  { date: '2024-08-13', open: 126, high: 128, low: 124, close: 125, volume: 138000 },
  { date: '2024-08-14', open: 125, high: 129, low: 124, close: 128, volume: 152000 },
  { date: '2024-08-15', open: 128, high: 130, low: 126, close: 129, volume: 170000 },
  { date: '2024-08-16', open: 129, high: 132, low: 128, close: 131, volume: 185000 },
  { date: '2024-08-19', open: 131, high: 134, low: 130, close: 133, volume: 175000 },
  { date: '2024-08-20', open: 133, high: 136, low: 132, close: 134, volume: 168000 },
  { date: '2024-08-21', open: 134, high: 135, low: 130, close: 131, volume: 155000 },
  { date: '2024-08-22', open: 131, high: 132, low: 127, close: 128, volume: 180000 },
  { date: '2024-08-23', open: 128, high: 131, low: 127, close: 130, volume: 162000 },
  { date: '2024-08-26', open: 130, high: 133, low: 129, close: 132, volume: 148000 },
  { date: '2024-08-27', open: 132, high: 135, low: 131, close: 134, volume: 158000 },
  { date: '2024-08-28', open: 134, high: 137, low: 133, close: 136, volume: 172000 },
  { date: '2024-08-29', open: 136, high: 138, low: 134, close: 135, volume: 145000 },
  { date: '2024-08-30', open: 135, high: 139, low: 134, close: 138, volume: 190000 },
  { date: '2024-09-02', open: 138, high: 141, low: 137, close: 140, volume: 178000 },
  { date: '2024-09-03', open: 140, high: 142, low: 138, close: 139, volume: 165000 },
  { date: '2024-09-04', open: 139, high: 140, low: 135, close: 136, volume: 168000 },
  { date: '2024-09-05', open: 136, high: 138, low: 134, close: 137, volume: 152000 },
  { date: '2024-09-06', open: 137, high: 138, low: 133, close: 134, volume: 170000 },
  { date: '2024-09-09', open: 134, high: 137, low: 132, close: 136, volume: 160000 },
  { date: '2024-09-10', open: 136, high: 139, low: 135, close: 138, volume: 155000 },
  { date: '2024-09-11', open: 138, high: 140, low: 136, close: 139, volume: 148000 },
  { date: '2024-09-12', open: 139, high: 142, low: 138, close: 141, volume: 175000 },
  { date: '2024-09-13', open: 141, high: 144, low: 140, close: 143, volume: 188000 },
  { date: '2024-09-16', open: 143, high: 145, low: 141, close: 142, volume: 165000 },
  { date: '2024-09-17', open: 142, high: 145, low: 141, close: 144, volume: 172000 },
  { date: '2024-09-18', open: 144, high: 147, low: 143, close: 146, volume: 195000 },
  { date: '2024-09-19', open: 146, high: 148, low: 144, close: 145, volume: 180000 },
  { date: '2024-09-20', open: 145, high: 148, low: 144, close: 147, volume: 188000 },
])
</script>

<template>
  <div class="showcase" :data-theme="isDark ? 'dark' : undefined">
    <NeumorphismLayout
      :show-header="false"
      show-sider
      :sider-width="220"
      collapsible
      height="auto"
      style="flex: 1; min-height: 0"
    >
      <!-- ===== SIDER NAVIGATION ===== -->
      <template #sider="{ collapsed }">
        <nav v-if="!collapsed" class="sider-nav" aria-label="组件导航">
          <div v-for="category in navCategories" :key="category.title" class="nav-group">
            <span class="nav-group-title">{{ category.title }}</span>
            <a
              v-for="item in category.items"
              :key="item.id"
              :href="`#${item.id}`"
              class="nav-link"
              :class="{ 'nav-link--active': activeSection === item.id }"
              @click.prevent="scrollToSection(item.id)"
              >{{ item.label }}</a
            >
          </div>
        </nav>
      </template>

      <!-- ===== MAIN CONTENT ===== -->
      <template #default>
        <NeumorphismScrollbar variant="none" target=".showcase .nm-layout__sider-inner" />
        <NeumorphismScrollbar variant="dots" target=".showcase .nm-layout__content" />
        <div class="content-inner">
          <!-- Hero / 简介 -->
          <section class="hero">
            <h1 class="hero-title">@echolab-auto/ui-frame</h1>
            <p class="hero-desc">
              Vue 3 新拟态（Soft UI）UI 组件库，共
              <strong>50+</strong> 个组件。统一的台阶高度模型、300+ CSS 设计
              Token，暗色模式、移动端适配，全部视觉效果由 Token 驱动。
            </p>
            <div class="hero-links">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a>
              <span class="hero-links-sep">·</span>
              <a href="https://www.npmjs.com/package/@echolab-auto/ui-frame" target="_blank">npm</a>
            </div>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：基础输入                                    -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">基础输入</h2>
            <p class="category-desc">
              新拟态风格的输入类组件，包含按钮、开关、复选框、单选框、输入框、文本域和选择器。
            </p>

            <!-- 按钮 -->
            <NeumorphismCard id="buttons" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismButton 按钮</h3>
                  <span class="demo-badge">展示 + 配置 · 变体 / 玻璃档位 / 尺寸 / 形状 / 状态</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
                <div class="btn-playground">
                  <!-- 实时预览 -->
                  <div class="btn-stage" :class="`btn-stage--${buttonStage}`">
                    <NeumorphismButton
                      :variant="buttonVariant"
                      :glass="buttonGlassValue"
                      :size="buttonSize"
                      :shape="buttonShape"
                      :loading="buttonLoading"
                      :disabled="buttonDisabled"
                      :style="buttonPreviewStyle"
                      aria-label="预览按钮"
                    >
                      {{ buttonText || '按钮' }}
                    </NeumorphismButton>

                    <p class="btn-stage__spec">
                      variant=<b>{{ buttonVariant }}</b> · glass=<b>{{ buttonGlass }}</b> · size=<b
                        >{{ buttonSize }}</b
                      >
                      · shape=<b>{{ buttonShape }}</b> · height=<b>{{ buttonHeight }}px</b>
                      <template v-if="buttonLoading"> · loading</template>
                      <template v-if="buttonDisabled"> · disabled</template>
                    </p>

                    <div class="btn-stage__bg">
                      <span class="btn-stage__bg-label">预览背景</span>
                      <NeumorphismSegmented
                        v-model="buttonStage"
                        :options="[
                          { label: '平面', value: 'plane' },
                          { label: '彩色', value: 'gradient' },
                        ]"
                        size="small"
                      />
                    </div>

                    <p class="demo-hint btn-stage__hint">
                      玻璃档位需在彩色背景上才看得到磨砂半透明；<code>circle</code> 形状建议配 1–2
                      字内容。
                    </p>
                  </div>

                  <!-- 参数表单 -->
                  <div class="btn-config">
                    <div class="btn-config__row">
                      <span class="btn-config__label">内容文本</span>
                      <NeumorphismInput v-model="buttonText" size="small" placeholder="按钮" />
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">变体 variant</span>
                      <NeumorphismSegmented
                        v-model="buttonVariant"
                        :options="buttonVariantOptions"
                        size="small"
                      />
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">玻璃 glass</span>
                      <NeumorphismSegmented
                        v-model="buttonGlass"
                        :options="buttonGlassOptions"
                        size="small"
                      />
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">尺寸 size</span>
                      <NeumorphismSegmented
                        v-model="buttonSize"
                        :options="buttonSizeOptions"
                        size="small"
                      />
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">形状 shape</span>
                      <NeumorphismSegmented
                        v-model="buttonShape"
                        :options="buttonShapeOptions"
                        size="small"
                      />
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">高度 height</span>
                      <NeumorphismSlider
                        v-model="buttonHeight"
                        :min="28"
                        :max="64"
                        :step="2"
                        size="small"
                        style="flex: 1"
                      />
                      <code class="btn-config__value">{{ buttonHeight }}px</code>
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">状态</span>
                      <div class="btn-config__toggles">
                        <label class="btn-config__toggle">
                          <NeumorphismSwitch v-model="buttonLoading" size="small" />
                          <span>loading</span>
                        </label>
                        <label class="btn-config__toggle">
                          <NeumorphismSwitch v-model="buttonDisabled" size="small" />
                          <span>disabled</span>
                        </label>
                      </div>
                    </div>

                    <div class="btn-config__row">
                      <span class="btn-config__label">操作</span>
                      <div class="btn-config__actions">
                        <NeumorphismButton variant="raised" size="small" @click="resetButtonDemo()">
                          恢复默认
                        </NeumorphismButton>
                        <NeumorphismButton
                          variant="pressed"
                          size="small"
                          @click="buttonGlass = 'float'"
                        >
                          套用玻璃
                        </NeumorphismButton>
                      </div>
                    </div>

                    <pre class="btn-config__snippet">{{ buttonSnippet }}</pre>
                  </div>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">全部变体一览（点击载入到上方预览）</h4>
                <div class="btn-matrix">
                  <button
                    v-for="item in buttonPresetList"
                    :key="item.key"
                    type="button"
                    class="btn-matrix__cell"
                    :class="{ 'btn-matrix__cell--active': isButtonPreset(item) }"
                    :aria-pressed="isButtonPreset(item)"
                    @click="applyButtonPreset(item)"
                  >
                    <NeumorphismButton :variant="item.variant" :glass="item.glass" size="small">
                      {{ item.label }}
                    </NeumorphismButton>
                    <code class="btn-matrix__code">{{ item.code }}</code>
                  </button>
                </div>
                <p class="demo-hint" style="margin-top: 10px">
                  旧 <code>variant="glass"</code> / <code>variant="glass-raised"</code> 等价于
                  <code>glass="float"</code> /
                  <code>glass="raised"</code>，渲染结果不变（同样的类名与计算样式）。 玻璃与
                  <code>variant</code> 正交但会覆盖表面底色——要彩色玻璃请改
                  <code>--nm-glass-bg</code>，而不是叠 <code>variant="primary"</code>。
                </p>
              </div>
            </NeumorphismCard>

            <!-- 开关 -->
            <NeumorphismCard id="switch" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismSwitch 开关</h3>
                  <span class="demo-badge">尺寸可调 · 文本标签 · power 变体</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（轨道高度）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="switchTrackHeight"
                      :min="18"
                      :max="44"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ switchTrackHeight }}px</code>
                  </div>
                  <NeumorphismSwitch v-model="switch1" :size="switchTrackHeight" />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">文本标签与禁用</h4>
                <div class="demo-row">
                  <NeumorphismSwitch v-model="switch2" active-text="开" inactive-text="关" />
                  <NeumorphismSwitch :model-value="true" disabled />
                  <NeumorphismSwitch :model-value="false" disabled />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">power 变体（电力开关）· 器件高度可调（18–44px 紧凑档）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="powerSwitchHeight"
                      :min="18"
                      :max="44"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ powerSwitchHeight }}px</code>
                  </div>
                  <NeumorphismSwitch
                    v-model="powerSwitch1"
                    variant="power"
                    :size="powerSwitchHeight"
                  />
                </div>
                <p class="demo-hint">
                  数字直接传给 <code>size</code>（px 高度），器件整机等比缩放；器件高 &lt; 36px
                  时刻印文本自动隐藏（字号不可辨读）；圆钮拉丝纹理始终保留——低于 34px
                  后冻结缩放（图案周期恒定，不再加深亚像素摩尔纹）。
                </p>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">power · 通电色与禁用（44px 紧凑档）</h4>
                <div class="demo-row">
                  <NeumorphismSwitch
                    v-model="powerSwitch2"
                    variant="power"
                    :size="44"
                    active-color="#27ae60"
                  />
                  <NeumorphismSwitch variant="power" :size="44" :model-value="true" disabled />
                  <NeumorphismSwitch variant="power" :size="44" :model-value="false" disabled />
                </div>
                <div class="demo-row">
                  <NeumorphismSwitch
                    v-model="powerSwitch3"
                    variant="power"
                    :size="44"
                    active-text="通电"
                    inactive-text="断电"
                  />
                </div>
                <p class="demo-hint">
                  刻印文本为可选：不传时器件纯净无文字（上方三个）；传入
                  <code>active-text</code> / <code>inactive-text</code> 时显示自定义刻印（下方）。
                </p>
              </div>
            </NeumorphismCard>

            <!-- 复选框 -->
            <NeumorphismCard id="checkbox" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismCheckbox 复选框</h3>
                  <span class="demo-badge">半选 · 尺寸可调</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">基本与半选状态</h4>
                <div class="demo-row">
                  <NeumorphismCheckbox v-model="checkbox1" label="未选中" />
                  <NeumorphismCheckbox v-model="checkbox2" label="已选中" />
                  <NeumorphismCheckbox
                    v-model="checkboxIndeterminate"
                    :indeterminate="true"
                    label="半选状态"
                  />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（指示器尺寸）与禁用</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="checkboxBoxSize"
                      :min="16"
                      :max="36"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ checkboxBoxSize }}px</code>
                  </div>
                  <div class="demo-row">
                    <div
                      class="demo-size-checkbox"
                      :style="{ '--demo-checkbox-size': checkboxBoxSize + 'px' }"
                    >
                      <NeumorphismCheckbox v-model="checkbox1" label="复选框" />
                    </div>
                    <NeumorphismCheckbox :model-value="true" label="已选中禁用" disabled />
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 单选框 -->
            <NeumorphismCard id="radio" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismRadio 单选框</h3>
                  <span class="demo-badge">RadioGroup · 水平/垂直</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">RadioGroup 水平排列</h4>
                <NeumorphismRadioGroup v-model="radio1" direction="horizontal">
                  <NeumorphismRadio value="a" label="选项 A" />
                  <NeumorphismRadio value="b" label="选项 B" />
                  <NeumorphismRadio value="c" label="选项 C（已禁用）" :disabled="true" />
                </NeumorphismRadioGroup>
                <p class="demo-hint">
                  已选：<strong>{{ radio1 }}</strong>
                </p>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">垂直排列 · 圆环尺寸可调</h4>
                <div class="demo-row demo-row--stacked" style="gap: 14px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="radioCircleSize"
                      :min="16"
                      :max="36"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ radioCircleSize }}px</code>
                  </div>
                  <div
                    class="demo-size-radio"
                    :style="{ '--demo-radio-size': radioCircleSize + 'px' }"
                  >
                    <NeumorphismRadioGroup v-model="radio2" direction="vertical">
                      <NeumorphismRadio value="a" label="选项 A" />
                      <NeumorphismRadio value="b" label="选项 B" />
                      <NeumorphismRadio value="c" label="选项 C" />
                    </NeumorphismRadioGroup>
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 输入框 -->
            <NeumorphismCard id="input" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismInput 输入框</h3>
                  <span class="demo-badge">标签 · 前缀/后缀 · 验证状态</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（高度）</h4>
                <div class="demo-row demo-row--stacked form-demo-width">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="inputHeight"
                      :min="32"
                      :max="72"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ inputHeight }}px</code>
                  </div>
                  <NeumorphismInput
                    v-model="inputName"
                    :style="inputSizeVars(inputHeight)"
                    placeholder="请输入内容"
                  />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">标签、前缀与后缀</h4>
                <div class="demo-row demo-row--stacked form-demo-width">
                  <NeumorphismInput
                    v-model="inputName"
                    label="用户名"
                    placeholder="请输入用户名"
                    :required="true"
                  />
                  <NeumorphismInput v-model="inputEmail" placeholder="搜索...">
                    <template #prefix>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                    </template>
                    <template #suffix>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </template>
                  </NeumorphismInput>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">错误、禁用与只读</h4>
                <div class="demo-row demo-row--stacked form-demo-width">
                  <NeumorphismInput placeholder="错误状态" error="请输入有效的邮箱地址" />
                  <NeumorphismInput model-value="禁用的输入框" disabled />
                  <NeumorphismInput model-value="只读的内容" readonly />
                </div>
              </div>
            </NeumorphismCard>

            <!-- 文本域 -->
            <NeumorphismCard id="textarea" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismTextarea 文本域</h3>
                  <span class="demo-badge">字数统计 · 自动调整高度</span>
                </div>
              </template>

              <div class="form-demo-width">
                <NeumorphismTextarea
                  v-model="textareaValue"
                  label="项目描述"
                  placeholder="请描述您的项目..."
                  :maxlength="200"
                  :rows="3"
                  :show-count="true"
                />
              </div>
            </NeumorphismCard>

            <!-- 选择器 -->
            <NeumorphismCard id="select" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismSelect 选择器</h3>
                  <span class="demo-badge"
                    >键盘导航 · 可清空 · 可搜索 · 多选 · 分组 · 双变体 · ARIA</span
                  >
                </div>
              </template>

              <!-- 功能特性 -->
              <h4 class="select-section-title">功能特性</h4>
              <div class="select-grid">
                <div class="select-cell">
                  <h5 class="demo-label">基本选择器</h5>
                  <NeumorphismSelect
                    v-model="select1"
                    :options="selectOptions"
                    placeholder="请选择框架"
                  />
                  <p class="demo-hint">
                    已选：<strong>{{ select1 || '无' }}</strong>
                  </p>
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">带标签、可清空</h5>
                  <NeumorphismSelect
                    v-model="select2"
                    :options="selectOptions"
                    label="框架"
                    placeholder="请选择..."
                    clearable
                  />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">可搜索过滤</h5>
                  <NeumorphismSelect
                    v-model="selectFilterable"
                    :options="selectOptions"
                    placeholder="输入关键字过滤..."
                    filterable
                    clearable
                  />
                  <p class="demo-hint">
                    已选：<strong>{{ selectFilterable || '无' }}</strong>
                  </p>
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">多选 + 标签折叠</h5>
                  <NeumorphismSelect
                    v-model="selectMultiple"
                    :options="selectOptions"
                    placeholder="选择多个框架..."
                    multiple
                    collapse-tags
                    :max-collapse-tags="2"
                    clearable
                  />
                  <p class="demo-hint">
                    已选：<strong>{{ selectMultiple.join(', ') || '无' }}</strong>
                  </p>
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">选项分组</h5>
                  <NeumorphismSelect
                    v-model="selectGrouped"
                    :options="selectGroupedOptions"
                    placeholder="按生态分组..."
                  />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">远程加载</h5>
                  <NeumorphismSelect
                    v-model="selectAsyncValue"
                    :options="selectOptions"
                    placeholder="点击模拟远程加载..."
                    :loading="selectAsyncLoading"
                    @visible-change="(open: boolean) => open && simulateSelectAsync()"
                  />
                  <p class="demo-hint">展开触发 2 秒模拟加载</p>
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">禁用</h5>
                  <NeumorphismSelect :options="selectOptions" placeholder="已禁用" disabled />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">错误态</h5>
                  <NeumorphismSelect
                    :options="selectOptions"
                    label="必填字段"
                    placeholder="请选择..."
                    error="此字段为必填项"
                  />
                </div>
              </div>

              <NeumorphismDivider class="select-divider" />

              <!-- 两种视觉变体并排对比 -->
              <h4 class="select-section-title">两种视觉变体</h4>
              <p class="select-section-desc">
                同一份数据与逻辑，仅
                <code>variant</code> 不同 —— 左侧 <code>default</code> 新拟态凹陷，右侧
                <code>outlined</code> 主色描边 + 连体下拉。
              </p>
              <div class="select-variant">
                <div class="select-variant__col">
                  <span class="select-variant__tag">variant = "default"</span>
                  <div class="select-stack">
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
                <div class="select-variant__col">
                  <span class="select-variant__tag select-variant__tag--outlined"
                    >variant = "outlined"</span
                  >
                  <div class="select-stack">
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
                描边色、发光、圆角等均由 <code>--nm-select-outlined-*</code> Token
                控制，亮/暗主题均可覆盖。
              </p>
            </NeumorphismCard>

            <!-- 数据录入扩展 -->
            <NeumorphismCard id="input-extra" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">InputNumber · Slider · DatePicker · AutoComplete</h3>
                  <span class="demo-badge">步进 · 拖动 · 日历 · 联想</span>
                </div>
              </template>

              <div class="select-grid">
                <div class="select-cell">
                  <h5 class="demo-label">InputNumber 数字输入（{{ demoInputNumber }}）</h5>
                  <NeumorphismInputNumber v-model="demoInputNumber" :min="0" :max="10" :step="1" />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">Slider 滑块（{{ demoSlider }}）</h5>
                  <NeumorphismSlider v-model="demoSlider" :min="0" :max="100" show-tooltip />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">DatePicker 日期选择（键盘可达）</h5>
                  <NeumorphismDatePicker v-model="demoDate" clearable placeholder="选择日期" />
                </div>
                <div class="select-cell">
                  <h5 class="demo-label">AutoComplete 输入联想</h5>
                  <NeumorphismAutoComplete
                    v-model="demoAutoComplete"
                    :options="[
                      { label: 'Vue 3', value: 'vue' },
                      { label: 'Vite', value: 'vite' },
                      { label: 'Vitest', value: 'vitest' },
                      { label: 'Vue Router', value: 'router' },
                    ]"
                    placeholder="输入 v 试试"
                    clearable
                  />
                </div>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：表单                                       -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">表单</h2>
            <p class="category-desc">
              表单容器与表单项，内置验证规则引擎，支持必填、正则、长度限制和自定义校验器。
            </p>

            <NeumorphismCard id="form" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismForm 表单与 FormItem</h3>
                  <span class="demo-badge">验证 · 提交 · 错误清除</span>
                </div>
              </template>

              <div style="max-width: 480px">
                <NeumorphismForm
                  ref="formRef"
                  :model="formModel"
                  :rules="formRules"
                  @submit="handleFormSubmit"
                >
                  <NeumorphismFormItem
                    label="用户名"
                    name="username"
                    :required="true"
                    :rules="formRules.username"
                  >
                    <NeumorphismInput v-model="formModel.username" placeholder="至少 3 个字符" />
                  </NeumorphismFormItem>

                  <NeumorphismFormItem
                    label="邮箱"
                    name="email"
                    :required="true"
                    :rules="formRules.email"
                  >
                    <NeumorphismInput
                      v-model="formModel.email"
                      placeholder="例如 user@example.com"
                    />
                  </NeumorphismFormItem>

                  <NeumorphismFormItem
                    label="密码"
                    name="password"
                    :required="true"
                    :rules="formRules.password"
                  >
                    <NeumorphismInput
                      v-model="formModel.password"
                      type="password"
                      placeholder="至少 6 个字符"
                    />
                  </NeumorphismFormItem>

                  <div class="demo-row" style="margin-top: 12px">
                    <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
                    <NeumorphismButton type="button" @click="formRef?.clearErrors()"
                      >清除错误</NeumorphismButton
                    >
                  </div>
                </NeumorphismForm>
              </div>
            </NeumorphismCard>

            <!-- Field 字段辅助 -->
            <NeumorphismCard id="field" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismField 字段辅助</h3>
                  <span class="demo-badge">Label · Error · 关联</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">标签（required 显示 *）与错误提示（role=alert）</h4>
                <div class="form-demo-width">
                  <NeumorphismFieldLabel label="用户名" required for-id="demo-field-input" />
                  <NeumorphismInput id="demo-field-input" placeholder="请输入用户名" error />
                  <NeumorphismFieldError
                    id="demo-field-error"
                    message="该字段为必填项，请输入至少 2 个字符"
                  />
                </div>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：数据展示                                    -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">数据展示</h2>
            <p class="category-desc">
              用于展示数据和内容的组件，包括卡片、头像、徽标、标签、进度条、骨架屏和分割线。
            </p>

            <!-- 卡片 -->
            <NeumorphismCard id="card" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismCard 卡片</h3>
                  <span class="demo-badge">统一台阶高度模型 · 膨胀/下沉悬停 · 玻璃拟态</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">凸起（1 到 4 级）</h4>
                <div class="demo-row demo-row--cards">
                  <NeumorphismCard
                    v-for="e in 4"
                    :key="e"
                    :elevation="e"
                    style="width: 140px; text-align: center"
                  >
                    <strong>{{ e }}</strong>
                  </NeumorphismCard>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">凹陷（-1 到 -4 级）</h4>
                <div class="demo-row demo-row--cards">
                  <NeumorphismCard
                    v-for="e in 4"
                    :key="-e"
                    :elevation="-e"
                    style="width: 140px; text-align: center"
                  >
                    <strong>{{ -e }}</strong>
                  </NeumorphismCard>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">悬停膨胀（elevation += 2）</h4>
                <div class="demo-row demo-row--cards">
                  <NeumorphismCard
                    :elevation="1"
                    hoverable="bulge"
                    style="width: 140px; text-align: center"
                    >1 → 3</NeumorphismCard
                  >
                  <NeumorphismCard
                    :elevation="-2"
                    hoverable="bulge"
                    style="width: 140px; text-align: center"
                    >-2 → 0</NeumorphismCard
                  >
                  <NeumorphismCard
                    :elevation="0"
                    hoverable="bulge"
                    style="width: 140px; text-align: center"
                    >0 → 2</NeumorphismCard
                  >
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">带头部和底部</h4>
                <NeumorphismCard :elevation="2" style="max-width: 480px">
                  <template #header>
                    <strong>卡片标题</strong>
                  </template>
                  <p style="color: var(--nm-text-secondary); font-size: 13px">
                    这是卡片的主要内容区域。您可以在这里放置任意组件或文字。
                  </p>
                  <template #footer>
                    <span style="color: var(--nm-text-placeholder); font-size: 12px"
                      >底部信息 · 2024-01-01</span
                    >
                  </template>
                </NeumorphismCard>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">
                  玻璃拟态（磨砂玻璃：置于彩色背景上可见半透明与模糊，hover 抬升）
                </h4>
                <div class="demo-glass-backdrop demo-glass-backdrop--cards">
                  <NeumorphismCard glass style="width: 168px">
                    <div class="demo-glass-card-title">悬浮玻璃</div>
                    <code class="demo-glass-code">glass="float"</code>
                  </NeumorphismCard>
                  <NeumorphismCard glass="raised" :elevation="2" style="width: 168px">
                    <div class="demo-glass-card-title">凸面玻璃</div>
                    <code class="demo-glass-code">glass="raised"</code>
                  </NeumorphismCard>
                  <NeumorphismCard glass="pressed" :elevation="-2" style="width: 168px">
                    <div class="demo-glass-card-title">凹陷玻璃</div>
                    <code class="demo-glass-code">glass="pressed"</code>
                  </NeumorphismCard>
                  <NeumorphismCard glass hoverable style="width: 168px">
                    <div class="demo-glass-card-title">悬停抬升</div>
                    <code class="demo-glass-code">glass + hoverable</code>
                  </NeumorphismCard>
                </div>
                <p class="demo-hint" style="margin-top: 10px">
                  玻璃只替换<strong>表面材质</strong>（半透明底 + <code>backdrop-filter</code> 模糊
                  + 1px 高光边），台阶高度模型仍由 <code>elevation</code> 决定——
                  <code>raised</code> / <code>pressed</code> 的阴影强度跟随
                  <code>|elevation|</code>；<code>true</code> 等价于
                  <code>'float'</code>（旧布尔语义）。
                </p>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">玻璃档位与高度组合（1–4 级）</h4>
                <div class="demo-glass-backdrop demo-glass-backdrop--cards">
                  <NeumorphismCard
                    v-for="e in 4"
                    :key="`gr-${e}`"
                    glass="raised"
                    :elevation="e"
                    style="width: 96px; text-align: center"
                  >
                    <strong>{{ e }}</strong>
                  </NeumorphismCard>
                </div>
                <div
                  class="demo-glass-backdrop demo-glass-backdrop--cards"
                  style="margin-top: 12px"
                >
                  <NeumorphismCard
                    v-for="e in 4"
                    :key="`gp-${e}`"
                    glass="pressed"
                    :elevation="-e"
                    style="width: 96px; text-align: center"
                  >
                    <strong>{{ -e }}</strong>
                  </NeumorphismCard>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 头像 -->
            <NeumorphismCard id="avatar" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismAvatar 头像</h3>
                  <span class="demo-badge">图片 · 首字母回退 · 尺寸可调</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">尺寸与形状（直径可调）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="avatarDiameter"
                      :min="28"
                      :max="96"
                      :step="4"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ avatarDiameter }}px</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismAvatar initials="JD" :style="avatarSizeVars(avatarDiameter)" />
                    <NeumorphismAvatar
                      initials="JD"
                      shape="rounded"
                      :style="avatarSizeVars(avatarDiameter)"
                    />
                  </div>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">图片模式（加载失败时回退）</h4>
                <div class="demo-row">
                  <NeumorphismAvatar
                    src="https://i.pravatar.cc/64?img=1"
                    alt="用户"
                    size="medium"
                  />
                  <NeumorphismAvatar
                    src="https://invalid.url/img.jpg"
                    initials="ER"
                    size="medium"
                    alt="用户"
                  />
                </div>
              </div>
            </NeumorphismCard>

            <!-- 徽标 -->
            <NeumorphismCard id="badge" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismBadge 徽标</h3>
                  <span class="demo-badge">数字角标 · 圆点模式</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px">
                <NeumorphismBadge :value="5">
                  <NeumorphismButton variant="pressed" size="small">收件箱</NeumorphismButton>
                </NeumorphismBadge>
                <NeumorphismBadge :value="120" :max="99">
                  <NeumorphismButton variant="pressed" size="small">消息</NeumorphismButton>
                </NeumorphismBadge>
                <NeumorphismBadge dot>
                  <NeumorphismAvatar initials="AB" size="medium" />
                </NeumorphismBadge>
              </div>
            </NeumorphismCard>

            <!-- 标签 -->
            <NeumorphismCard id="tag" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismTag 标签</h3>
                  <span class="demo-badge">6 色 · 可关闭 · 圆角</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">颜色变体</h4>
                <div class="demo-row">
                  <NeumorphismTag>默认</NeumorphismTag>
                  <NeumorphismTag variant="primary">主要</NeumorphismTag>
                  <NeumorphismTag variant="success">成功</NeumorphismTag>
                  <NeumorphismTag variant="warning">警告</NeumorphismTag>
                  <NeumorphismTag variant="error">错误</NeumorphismTag>
                  <NeumorphismTag variant="info">信息</NeumorphismTag>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">可关闭与尺寸（字号可调）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="tagFontSize"
                      :min="10"
                      :max="16"
                      :step="1"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ tagFontSize }}px</code>
                  </div>
                  <div class="demo-row">
                    <div class="demo-size-tag" :style="{ '--demo-tag-f': tagFontSize + 'px' }">
                      <NeumorphismTag variant="success">标签</NeumorphismTag>
                    </div>
                    <NeumorphismDivider direction="vertical" />
                    <NeumorphismTag
                      v-if="tagVisible"
                      variant="primary"
                      :closable="true"
                      @close="tagVisible = false"
                      >可关闭</NeumorphismTag
                    >
                    <NeumorphismTag variant="error" rounded>圆角</NeumorphismTag>
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 进度条 -->
            <NeumorphismCard id="progress" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismProgress 进度条</h3>
                  <span class="demo-badge">环形 · 动效 · 不确定 · 动画数字</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">颜色变体与标签</h4>
                <div class="progress-rows form-demo-width">
                  <div v-for="variant in progressVariants" :key="variant" class="progress-row">
                    <span class="progress-row__tag">{{ variant }}</span>
                    <NeumorphismProgress
                      :model-value="progressVal"
                      :variant="variant"
                      :show-label="true"
                      class="progress-row__bar"
                    />
                  </div>
                </div>
                <div class="demo-row" style="margin-top: 12px">
                  <NeumorphismButton
                    size="small"
                    :disabled="isSimulating"
                    @click="progressVal = Math.max(0, progressVal - 10)"
                    >-10%</NeumorphismButton
                  >
                  <NeumorphismButton
                    size="small"
                    :disabled="isSimulating"
                    @click="progressVal = Math.min(100, progressVal + 10)"
                    >+10%</NeumorphismButton
                  >
                  <NeumorphismButton size="small" :disabled="isSimulating" @click="simulateLoading">
                    {{ isSimulating ? '加载中…' : '模拟加载' }}
                  </NeumorphismButton>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（条体高度）</h4>
                <div class="demo-row demo-row--stacked form-demo-width">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="progressBarHeight"
                      :min="4"
                      :max="24"
                      :step="1"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ progressBarHeight }}px</code>
                  </div>
                  <NeumorphismProgress
                    :model-value="progressVal"
                    :style="{ '--nm-progress-height-md': progressBarHeight + 'px' }"
                    class="progress-row__bar"
                  />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">视觉动效</h4>
                <div class="progress-rows form-demo-width">
                  <div v-for="effect in progressEffects" :key="effect" class="progress-row">
                    <span class="progress-row__tag">{{ effect }}</span>
                    <NeumorphismProgress
                      :model-value="progressVal"
                      variant="primary"
                      :effect="effect"
                      :show-label="true"
                      class="progress-row__bar"
                    />
                  </div>
                </div>
                <ul class="progress-effect-notes">
                  <li>
                    <strong>pulse 脉冲光束</strong>：一道能量光束——短尾迹渐隐，白热彗星头（核心 +
                    光晕 + 拖尾星火）呼吸明灭，偶有一道细闪掠过。
                  </li>
                  <li><strong>flow 流光</strong>：丝绸般的光带在条体上缓缓流动。</li>
                  <li><strong>wave 波光</strong>：两层液面波光相向滑过，如水光在条体内荡漾。</li>
                  <li><strong>stripes 斜纹</strong>：柔和的斜向光带持续向前流动（理发店条纹）。</li>
                  <li><strong>sparkle 星点</strong>：细小光点相向漂移、各自明灭，如慢速星野。</li>
                </ul>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">不确定模式</h4>
                <div class="progress-rows form-demo-width">
                  <div class="progress-row">
                    <span class="progress-row__tag">medium</span>
                    <NeumorphismProgress
                      :indeterminate="true"
                      variant="primary"
                      class="progress-row__bar"
                    />
                  </div>
                  <div class="progress-row">
                    <span class="progress-row__tag">small</span>
                    <NeumorphismProgress
                      :indeterminate="true"
                      variant="success"
                      size="small"
                      class="progress-row__bar"
                    />
                  </div>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">环形进度（直径可调）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="progressCircleDiameter"
                      :min="64"
                      :max="200"
                      :step="4"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>Ø {{ progressCircleDiameter }}px</code>
                  </div>
                  <div class="progress-rings">
                    <div class="progress-ring">
                      <div
                        class="demo-size-progress-circle"
                        :style="{ '--demo-circle-d': progressCircleDiameter + 'px' }"
                      >
                        <NeumorphismProgress
                          type="circle"
                          :model-value="progressVal"
                          variant="primary"
                          :show-label="true"
                        />
                      </div>
                      <span class="progress-ring__caption">determinate（直径可调）</span>
                    </div>
                    <div class="progress-ring">
                      <NeumorphismProgress type="circle" size="medium" :indeterminate="true" />
                      <span class="progress-ring__caption">indeterminate</span>
                    </div>
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 骨架屏 -->
            <NeumorphismCard id="skeleton" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismSkeleton 骨架屏</h3>
                  <span class="demo-badge">呼吸 · 波浪动画</span>
                </div>
              </template>

              <div class="demo-row" style="margin-bottom: 14px">
                <NeumorphismButton size="small" @click="skeletonLoading = !skeletonLoading">
                  {{ skeletonLoading ? '隐藏骨架屏' : '显示骨架屏' }}
                </NeumorphismButton>
              </div>

              <div v-if="skeletonLoading">
                <div class="demo-row" style="align-items: center; gap: 16px; margin-bottom: 16px">
                  <NeumorphismSkeleton variant="circle" :width="44" :height="44" />
                  <div style="flex: 1">
                    <NeumorphismSkeleton variant="text" width="60%" />
                    <NeumorphismSkeleton variant="text" width="40%" />
                  </div>
                </div>
                <NeumorphismSkeleton
                  variant="rect"
                  :height="120"
                  animation="wave"
                  style="margin-bottom: 12px"
                />
                <NeumorphismSkeleton variant="text" />
                <NeumorphismSkeleton variant="text" />
                <NeumorphismSkeleton variant="text" width="80%" />
              </div>

              <NeumorphismCard v-else :elevation="1" style="max-width: 480px">
                <p><strong>内容已加载！</strong></p>
                <p style="color: var(--nm-text-secondary); font-size: 13px">
                  此内容替代了上方的骨架屏占位。
                </p>
              </NeumorphismCard>
            </NeumorphismCard>

            <!-- 分割线 -->
            <NeumorphismCard id="divider" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismDivider 分割线</h3>
                  <span class="demo-badge">水平/垂直 · 文字 · 虚线</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">水平方向（带文字）</h4>
                <NeumorphismDivider>分区 A</NeumorphismDivider>
                <p class="demo-hint">分割线之间的内容</p>
                <NeumorphismDivider align="left">居左对齐</NeumorphismDivider>
                <p class="demo-hint">内容</p>
                <NeumorphismDivider align="right" dashed>居右对齐（虚线）</NeumorphismDivider>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">垂直方向</h4>
                <div class="demo-row">
                  <span>左侧</span>
                  <NeumorphismDivider direction="vertical" />
                  <span>中间</span>
                  <NeumorphismDivider direction="vertical" dashed />
                  <span>右侧</span>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 滚动条 -->
            <NeumorphismCard id="scrollbar" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">定制滚动条</h3>
                  <span class="demo-badge">5 种预设变体 · CSS 变量可调</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">预设变体一览</h4>
                <div class="demo-row" style="gap: 16px; flex-wrap: wrap">
                  <template
                    v-for="s in [
                      { cls: 'nm-scrollbar--standard', label: 'standard' },
                      { cls: 'nm-scrollbar--primary', label: 'primary' },
                      { cls: 'nm-scrollbar--none', label: 'none' },
                    ]"
                    :key="s.label"
                  >
                    <div
                      :class="s.cls"
                      style="
                        flex: 1;
                        min-width: 120px;
                        max-height: 160px;
                        overflow-y: auto;
                        background: var(--nm-surface-color);
                        border-radius: var(--nm-border-radius-md);
                        padding: 12px;
                        font-size: 13px;
                        color: var(--nm-text-secondary);
                        line-height: 1.8;
                      "
                    >
                      <div
                        style="font-weight: 600; color: var(--nm-text-primary); margin-bottom: 6px"
                      >
                        {{ s.label }}
                      </div>
                      <div v-for="i in 20" :key="i">占位行 {{ i }}</div>
                    </div>
                  </template>
                </div>
                <!-- JS 覆盖层变体：NeumorphismScrollbar 组件驱动 -->
                <div class="demo-row" style="gap: 16px; flex-wrap: wrap; margin-top: 16px">
                  <!-- dots: framework NeumorphismScrollbar with variant="dots" -->
                  <div
                    id="dots-demo-container"
                    style="
                      flex: 1;
                      min-width: 150px;
                      max-height: 160px;
                      overflow-y: auto;
                      background: var(--nm-surface-color);
                      border-radius: var(--nm-border-radius-md);
                      padding: 12px;
                      font-size: 13px;
                      color: var(--nm-text-secondary);
                      line-height: 1.8;
                    "
                  >
                    <div
                      style="font-weight: 600; color: var(--nm-text-primary); margin-bottom: 6px"
                    >
                      dots
                    </div>
                    <div v-for="i in 20" :key="i">占位行 {{ i }}</div>
                  </div>
                  <NeumorphismScrollbar
                    variant="dots"
                    target="#dots-demo-container"
                    dot-color="153,153,153"
                    accent-color="205,250,78"
                  />
                  <!-- glow: framework NeumorphismScrollbar with variant="glow" -->
                  <div
                    id="glow-demo-container"
                    style="
                      flex: 1;
                      min-width: 150px;
                      max-height: 160px;
                      overflow-y: auto;
                      background: var(--nm-surface-color);
                      border-radius: var(--nm-border-radius-md);
                      padding: 12px;
                      font-size: 13px;
                      color: var(--nm-text-secondary);
                      line-height: 1.8;
                    "
                  >
                    <div
                      style="font-weight: 600; color: var(--nm-text-primary); margin-bottom: 6px"
                    >
                      glow
                    </div>
                    <div v-for="i in 20" :key="i">占位行 {{ i }}</div>
                  </div>
                  <NeumorphismScrollbar
                    variant="glow"
                    target="#glow-demo-container"
                    accent-color="205,250,78"
                  />
                </div>
              </div>

              <div class="demo-block" style="margin-top: 20px">
                <h4 class="demo-label">CSS 变量定制度</h4>
                <div
                  class="nm-scrollbar--standard"
                  :style="{
                    '--nm-scrollbar-width': '8px',
                    '--nm-scrollbar-thumb-bg': 'var(--nm-primary-color)',
                    '--nm-scrollbar-thumb-radius': '4px',
                    '--nm-scrollbar-thumb-shadow':
                      '0 0 10px color-mix(in srgb, var(--nm-primary-color) 50%, transparent)',
                  }"
                  style="
                    max-height: 140px;
                    overflow-y: auto;
                    background: var(--nm-surface-color);
                    border-radius: var(--nm-border-radius-md);
                    padding: 12px 16px;
                    font-size: 13px;
                    color: var(--nm-text-secondary);
                    line-height: 1.8;
                  "
                >
                  <div style="font-weight: 600; color: var(--nm-text-primary); margin-bottom: 6px">
                    自定义宽度 8px · 主色 · 发光
                  </div>
                  <div v-for="i in 20" :key="i">通过覆盖 --nm-scrollbar-* 变量实现精确定制</div>
                </div>
                <pre
                  class="code-block"
                  style="margin-top: 12px; font-size: 11px"
                ><code>--nm-scrollbar-width: 8px;
--nm-scrollbar-thumb-bg: var(--nm-primary-color);
--nm-scrollbar-thumb-shadow: 0 0 10px ...;</code></pre>
              </div>
            </NeumorphismCard>

            <!-- 数据展示扩展 -->
            <NeumorphismCard id="display-extra" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Table · List · Empty · VirtualList</h3>
                  <span class="demo-badge">排序 · 空态 · 千行虚拟滚动</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">Table 表格（点列头排序）</h4>
                <NeumorphismTable :columns="demoTableColumns" :data="demoTableData" striped />
              </div>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 240px">
                  <h4 class="demo-label">List 列表</h4>
                  <NeumorphismList :items="demoListItems" />
                </div>
                <div style="flex: 1; min-width: 240px">
                  <h4 class="demo-label">Empty 空状态</h4>
                  <NeumorphismEmpty description="这里还没有任何内容" />
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">VirtualList 虚拟列表（1000 项，只渲染可视区）</h4>
                <NeumorphismVirtualList
                  :items="demoVirtualItems"
                  :item-height="36"
                  style="max-height: 240px"
                >
                  <template #default="{ item }">
                    <div style="padding: 8px 12px">{{ item.text }}</div>
                  </template>
                </NeumorphismVirtualList>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">导航</h2>
            <p class="category-desc">
              页面导航类组件，包括选项卡、面包屑和分页器，均支持键盘操作和无障碍访问。
            </p>

            <!-- 选项卡 -->
            <NeumorphismCard id="tabs" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismTabs 选项卡</h3>
                  <span class="demo-badge">顶部/左侧 · 键盘导航</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">顶部位置（默认）</h4>
                <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="top" />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">左侧位置</h4>
                <div style="max-width: 400px">
                  <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="left" />
                </div>
              </div>
            </NeumorphismCard>

            <!-- 面包屑 -->
            <NeumorphismCard id="breadcrumb" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismBreadcrumb 面包屑</h3>
                  <span class="demo-badge">链接/文本 · 自定义分隔符 · ARIA</span>
                </div>
              </template>

              <NeumorphismBreadcrumb :items="breadcrumbItems" separator="/" />
              <div style="margin-top: 10px">
                <NeumorphismBreadcrumb :items="breadcrumbItems" separator=">" size="small" />
              </div>
            </NeumorphismCard>

            <!-- 分页 -->
            <NeumorphismCard id="pagination" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismPagination 分页</h3>
                  <span class="demo-badge">省略号 · 总数 · 跳转 · 尺寸可调</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">基本（共 10 页）</h4>
                <NeumorphismPagination v-model="page" :total="100" :page-size="10" />
                <p class="demo-hint">
                  当前页：<strong>{{ page }}</strong>
                </p>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">显示总数与跳转</h4>
                <NeumorphismPagination
                  v-model="page2"
                  :total="500"
                  :page-size="20"
                  :show-total="true"
                  :show-jumper="true"
                />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（按钮尺寸）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 14px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="paginationItemSize"
                      :min="26"
                      :max="56"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ paginationItemSize }}px</code>
                  </div>
                  <div
                    class="demo-size-pagination"
                    :style="{ '--demo-pagination-size': paginationItemSize + 'px' }"
                  >
                    <NeumorphismPagination v-model="page" :total="50" :page-size="10" />
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 导航扩展 -->
            <NeumorphismCard id="nav-extra" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Menu · NavMenu · Dropdown · Steps</h3>
                  <span class="demo-badge">纵向菜单 · 指示条 · 下拉 · 步骤条</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="min-width: 200px">
                  <h4 class="demo-label">Menu 纵向菜单</h4>
                  <NeumorphismMenu :items="demoMenuItems" />
                </div>
                <div style="flex: 1; min-width: 280px">
                  <h4 class="demo-label">NavMenu 导航菜单（活动指示条）</h4>
                  <NeumorphismNavMenu :items="demoNavItems" default-active="guide" />
                  <h4 class="demo-label" style="margin-top: 16px">Dropdown 下拉菜单</h4>
                  <NeumorphismDropdown>
                    <NeumorphismButton>操作</NeumorphismButton>
                    <template #content>
                      <NeumorphismMenu :items="demoNavItems" />
                    </template>
                  </NeumorphismDropdown>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">Steps 步骤条（当前第 {{ demoStepsActive + 1 }} 步）</h4>
                <NeumorphismSteps v-model:current="demoStepsActive" :items="demoStepsItems" />
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：反馈                                       -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">反馈</h2>
            <p class="category-desc">用户反馈类组件，包括模态框、消息提示、文字提示和折叠面板。</p>

            <!-- 模态框 -->
            <NeumorphismCard id="modal" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismModal 模态框</h3>
                  <span class="demo-badge">背景模糊 · 焦点锁定 · Esc 关闭</span>
                </div>
              </template>

              <NeumorphismButton @click="modalVisible = true">打开模态框</NeumorphismButton>

              <NeumorphismModal
                v-model="modalVisible"
                title="示例模态框"
                size="small"
                @confirm="showToast('success')"
                @cancel="showToast('info')"
              >
                <p>这是一个新拟态风格的模态对话框。</p>
                <p style="color: var(--nm-text-secondary); font-size: 13px">
                  它支持焦点锁定、按 Esc 键关闭和背景模糊效果。
                </p>
                <div style="margin-top: 12px">
                  <NeumorphismInput placeholder="在模态框中输入内容..." />
                </div>
              </NeumorphismModal>
            </NeumorphismCard>

            <!-- ===== 层叠联动测试：Modal + Form + Select ===== -->
            <NeumorphismCard id="modal-layer-test" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">层叠联动验证 — Modal + Form + Select</h3>
                  <span class="demo-badge">z-index 复查 · Teleport 层级 · scroll 偏移</span>
                </div>
              </template>

              <p class="category-desc" style="margin-top: 0; margin-bottom: 12px">
                此 Demo 复现开发者反馈的典型场景：<strong>模态框内嵌表单 + 多个 Select</strong
                >，用于人工验证 Select 下拉框是否正常显示在遮罩之上（v1.0.5 已修复 z-index
                层叠公式）。 建议<strong>滚动页面后</strong>再打开，同时验证 Popover/AutoComplete 的
                position:fixed 定位是否受滚动影响。
              </p>

              <NeumorphismButton @click="layerTestVisible = true"
                >打开层叠测试模态框</NeumorphismButton
              >
              <span style="margin-left: 12px; font-size: 13px; color: var(--nm-text-secondary)">
                当前值 — 接口: <strong>{{ layerTestName || '未选择' }}</strong> · 角色:
                <strong>{{ layerTestRole || '未选择' }}</strong> · 类型:
                <strong>{{ layerTestType || '未选择' }}</strong> · 状态:
                <strong>{{ layerTestStatus || '未选择' }}</strong>
              </span>

              <NeumorphismModal
                v-model="layerTestVisible"
                title="网络接口配置（层叠联动验证）"
                size="medium"
              >
                <NeumorphismForm>
                  <NeumorphismFormItem label="接口名称" :required="true">
                    <NeumorphismSelect
                      v-model="layerTestName"
                      :options="layerTestInterfaceOptions"
                      placeholder="请选择网络接口"
                    />
                  </NeumorphismFormItem>

                  <NeumorphismFormItem label="角色">
                    <NeumorphismSelect
                      v-model="layerTestRole"
                      :options="layerTestRoleOptions"
                      placeholder="请选择角色"
                    />
                  </NeumorphismFormItem>

                  <NeumorphismFormItem label="地址类型">
                    <NeumorphismSelect
                      v-model="layerTestType"
                      :options="layerTestTypeOptions"
                      placeholder="请选择地址类型"
                    />
                  </NeumorphismFormItem>

                  <NeumorphismFormItem label="运行状态">
                    <NeumorphismSelect
                      v-model="layerTestStatus"
                      :options="layerTestStatusOptions"
                      placeholder="请选择状态"
                    />
                  </NeumorphismFormItem>

                  <!-- 内联提示：同时在 Modal 内放置 Tooltip 和 Popover 以验证多维层叠 -->
                  <div
                    style="
                      display: flex;
                      gap: 12px;
                      align-items: center;
                      margin-top: 8px;
                      padding: 10px 14px;
                      border-radius: var(--nm-border-radius-sm);
                      background: var(--nm-surface-raised);
                    "
                  >
                    <span style="font-size: 12px; color: var(--nm-text-secondary)">附加验证：</span>
                    <NeumorphismTooltip content="Tooltip 应在遮罩之上" position="top">
                      <NeumorphismButton variant="pressed" size="small"
                        >悬停 Tooltip</NeumorphismButton
                      >
                    </NeumorphismTooltip>
                    <NeumorphismPopover
                      trigger="click"
                      position="bottom"
                      content="Popover 应在遮罩之上"
                    >
                      <NeumorphismButton size="small">点击 Popover</NeumorphismButton>
                    </NeumorphismPopover>
                  </div>
                </NeumorphismForm>
              </NeumorphismModal>
            </NeumorphismCard>

            <!-- 消息提示 -->
            <NeumorphismCard id="toast" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismToast 消息提示</h3>
                  <span class="demo-badge">4 类型 · 6 位置 · 自动关闭</span>
                </div>
              </template>

              <div class="demo-row">
                <NeumorphismButton @click="showToast('info')">信息</NeumorphismButton>
                <NeumorphismButton @click="showToast('success')">成功</NeumorphismButton>
                <NeumorphismButton @click="showToast('warning')">警告</NeumorphismButton>
                <NeumorphismButton @click="showToast('error')">错误</NeumorphismButton>
              </div>

              <NeumorphismToastProvider ref="toastContainer" position="top-right" :max-count="5" />
            </NeumorphismCard>

            <!-- 文字提示 -->
            <NeumorphismCard id="tooltip" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismTooltip 文字提示</h3>
                  <span class="demo-badge">4 方向 · 悬停/点击/聚焦</span>
                </div>
              </template>

              <div class="demo-row" style="padding: 28px 0; gap: 16px">
                <NeumorphismTooltip content="上方提示" position="top">
                  <NeumorphismButton variant="pressed" size="small">悬停（上）</NeumorphismButton>
                </NeumorphismTooltip>
                <NeumorphismTooltip content="下方提示" position="bottom">
                  <NeumorphismButton variant="pressed" size="small">悬停（下）</NeumorphismButton>
                </NeumorphismTooltip>
                <NeumorphismTooltip content="左侧提示" position="left">
                  <NeumorphismButton variant="pressed" size="small">悬停（左）</NeumorphismButton>
                </NeumorphismTooltip>
                <NeumorphismTooltip content="右侧提示" position="right">
                  <NeumorphismButton variant="pressed" size="small">悬停（右）</NeumorphismButton>
                </NeumorphismTooltip>
                <NeumorphismTooltip position="top" trigger="click">
                  <NeumorphismButton size="small">点击触发</NeumorphismButton>
                  <template #content>
                    <span>自定义<strong>富文本</strong>内容</span>
                  </template>
                </NeumorphismTooltip>
              </div>
            </NeumorphismCard>

            <!-- 折叠面板 -->
            <NeumorphismCard id="collapse" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismCollapse 折叠面板</h3>
                  <span class="demo-badge">手风琴 · 弹簧动画</span>
                </div>
              </template>

              <NeumorphismCollapse v-model="collapseActive" :items="collapseItems">
                <template #item1>
                  <p>
                    新拟态（Soft
                    UI）是一种设计风格，通过阴影和高光营造柔和、挤压般的塑料质感。元素看起来像是从背景中凸起或凹陷下去。
                  </p>
                </template>
                <template #item2>
                  <p>
                    通过
                    <code>npm install @echolab-auto/ui-frame</code> 安装，然后按需引入组件或使用
                    <code>app.use(NeumorphismUI)</code> 全局注册。
                  </p>
                </template>
                <template #item3>
                  <p>此项已被禁用。</p>
                </template>
              </NeumorphismCollapse>

              <div style="margin-top: 14px">
                <NeumorphismButton
                  size="small"
                  @click="collapseActive = collapseActive.length ? [] : ['item1', 'item2']"
                >
                  {{ collapseActive.length ? '全部折叠' : '全部展开' }}
                </NeumorphismButton>
              </div>
            </NeumorphismCard>

            <!-- 反馈扩展 -->
            <NeumorphismCard id="feedback-extra" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Alert · Drawer · Upload</h3>
                  <span class="demo-badge">四种类型 · 抽屉 · 拖拽上传</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">Alert 四种类型</h4>
                <div style="display: flex; flex-direction: column; gap: 10px">
                  <NeumorphismAlert type="info" message="信息提示：文档已同步更新" />
                  <NeumorphismAlert type="success" message="成功：级联配置已生效" />
                  <NeumorphismAlert type="warning" message="警告：该操作需要确认" />
                  <NeumorphismAlert type="error" message="错误：提交失败，请重试" />
                </div>
              </div>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 260px">
                  <h4 class="demo-label">Drawer 抽屉</h4>
                  <NeumorphismButton @click="demoDrawerOpen = true">打开抽屉</NeumorphismButton>
                  <NeumorphismDrawer v-model="demoDrawerOpen" title="详情面板" position="right">
                    <div style="padding: 16px">
                      <p>抽屉内容区域 —— 支持 Esc 关闭、遮罩点击关闭与焦点陷阱。</p>
                    </div>
                  </NeumorphismDrawer>
                </div>
                <div style="flex: 1; min-width: 260px">
                  <h4 class="demo-label">Upload 文件上传</h4>
                  <NeumorphismUpload v-model="demoUploadFiles" drag />
                </div>
              </div>
            </NeumorphismCard>

            <!-- 状态反馈原件 -->
            <NeumorphismCard id="status-feedback" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">StatusDot · Spinner · Segmented</h3>
                  <span class="demo-badge">状态点呼吸脉冲 · 加载指示 · 分段单选</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 220px">
                  <h4 class="demo-label">StatusDot 状态点</h4>
                  <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap">
                    <span style="display: inline-flex; align-items: center; gap: 6px">
                      <NeumorphismStatusDot status="online" /> 在线
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 6px">
                      <NeumorphismStatusDot status="offline" /> 离线
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 6px">
                      <NeumorphismStatusDot status="busy" /> 忙碌
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 6px">
                      <NeumorphismStatusDot status="connecting" /> 连接中
                    </span>
                  </div>
                </div>
                <div style="flex: 1; min-width: 220px">
                  <h4 class="demo-label">Spinner 加载指示（直径可调）</h4>
                  <div class="demo-row demo-row--stacked" style="gap: 12px">
                    <div class="demo-row">
                      <NeumorphismSlider
                        v-model="spinnerDiameter"
                        :min="12"
                        :max="48"
                        :step="2"
                        style="width: 160px; flex: 0 0 160px"
                      />
                      <code>{{ spinnerDiameter }}px</code>
                    </div>
                    <NeumorphismSpinner :size="spinnerDiameter" />
                  </div>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">Segmented 分段选择（方向键可导航）</h4>
                <NeumorphismSegmented v-model="demoSegmented" :options="demoSegmentedOptions" />
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：聊天原子组件（chat 子路径模块）               -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">聊天原子组件</h2>
            <p class="category-desc">
              <code>@echolab-auto/ui-frame/chat</code> 子路径模块的原子组件 （输入器 / 折叠块 /
              复制按钮）：零领域类型、插槽驱动，可自由 组装任意聊天式
              UI。整体组装效果见顶部导航「聊天组件」页。
            </p>

            <!-- ChatFold -->
            <NeumorphismCard id="chat-fold" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">ChatFold 折叠块</h3>
                  <span class="demo-badge">凹陷 / 凸起 · 四插槽 · 受控可选</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 260px">
                  <h4 class="demo-label">凹陷详情井</h4>
                  <div style="display: flex; flex-direction: column; gap: 12px">
                    <ChatFold>
                      <template #head="{ open }">
                        <span style="font-size: var(--nm-font-sm)">
                          {{ open ? '收起工具详情' : '展开工具详情' }}
                        </span>
                      </template>
                      <p
                        style="
                          margin: 0;
                          font-size: var(--nm-font-sm);
                          color: var(--nm-text-secondary);
                        "
                      >
                        折叠体内容：参数、输出，或任意 DOM。
                      </p>
                    </ChatFold>
                    <ChatFold default-open>
                      <template #head>
                        <span style="font-size: var(--nm-font-sm)">推理过程（默认展开）</span>
                      </template>
                      <p
                        style="
                          margin: 0;
                          font-size: var(--nm-font-sm);
                          color: var(--nm-text-secondary);
                        "
                      >
                        先分析输入，再组织输出。
                      </p>
                    </ChatFold>
                  </div>
                </div>
                <div style="flex: 1; min-width: 260px">
                  <h4 class="demo-label">凸起卡片 + subhead 常显 + actions</h4>
                  <ChatFold :sunk="false">
                    <template #head="{ open }">
                      <strong style="font-size: var(--nm-font-sm)">分支合并</strong>
                      <span
                        style="
                          margin-left: auto;
                          font-size: var(--nm-font-xs);
                          color: var(--nm-text-placeholder);
                        "
                      >
                        {{ open ? '收起' : '2 工具 · 1 推理' }}
                      </span>
                    </template>
                    <template #actions>
                      <ChatCopyButton text="分支结果内容" />
                    </template>
                    <template #subhead>
                      <p style="margin: 0; font-size: var(--nm-font-sm)">
                        摘要区（subhead）始终可见，不受折叠影响。
                      </p>
                    </template>
                    <p
                      style="
                        margin: 0;
                        font-size: var(--nm-font-sm);
                        color: var(--nm-text-secondary);
                      "
                    >
                      折叠体：分支内的详细活动记录。actions 插槽的复制按钮独立于触发器。
                    </p>
                  </ChatFold>
                </div>
              </div>
            </NeumorphismCard>

            <NeumorphismCard id="chat-composer" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">ChatComposer 输入器</h3>
                  <span class="demo-badge">Enter 发送 · IME 安全 · 玻璃托盘 · 4 种聚焦特效</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">玻璃托盘 + 聚焦特效（点进输入框看效果）</h4>
                <div class="composer-stage" :class="`composer-stage--${composerStage}`">
                  <ChatComposer
                    v-model="composerDemoValue"
                    :glass="composerGlass"
                    :focus-effect="composerFocusEffect"
                    cancelable
                    placeholder="试试点进来，看看内辉光 / 外环 / 深凹陷的差别"
                    @send="composerDemoSend"
                    @cancel="composerDemoSent = '（已请求取消任务）'"
                  >
                    <template #meta>
                      <span
                        >glass=<b>{{ composerGlass }}</b> · focusEffect=<b>{{
                          composerFocusEffect
                        }}</b></span
                      >
                    </template>
                  </ChatComposer>
                </div>

                <div class="graph-controls" style="margin-top: 16px">
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">玻璃档位 glass</span>
                    <NeumorphismSegmented
                      v-model="composerGlass"
                      :options="composerGlassOptions"
                      size="small"
                    />
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">聚焦特效 focusEffect</span>
                    <NeumorphismSegmented
                      v-model="composerFocusEffect"
                      :options="composerFocusOptions"
                      size="small"
                    />
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">预览背景</span>
                    <NeumorphismSegmented
                      v-model="composerStage"
                      :options="[
                        { label: '平面', value: 'plane' },
                        { label: '彩色', value: 'gradient' },
                      ]"
                      size="small"
                    />
                  </div>
                </div>

                <p class="demo-hint" style="margin-top: 10px">
                  材质挂在<strong>外壳</strong>上（浮起的玻璃托盘），内部输入槽保持凹陷——层次是「玻璃托盘
                  › 凹陷输入槽」。四档聚焦特效：<code>ring</code> 外侧主色光环（历史默认）、
                  <code>glow</code>
                  <strong>内辉光</strong>（主色光从凹槽内部亮起，玻璃模式下托盘一并被点亮）、
                  <code>inset</code> 纯加深凹陷（无彩色）、<code>none</code>
                  交给宿主。玻璃需在彩色背景上才看得到磨砂；键入
                  <kbd>Enter</kbd> 发送、<kbd>Shift</kbd>+<kbd>Enter</kbd>
                  换行，IME 组字中不误发。
                </p>

                <p v-if="composerDemoSent" class="demo-hint" style="margin-top: 6px">
                  最近事件：<code>{{ composerDemoSent }}</code>
                </p>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：文档元组件（doc 子路径模块）                -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">文档元组件</h2>
            <p class="category-desc">
              <code>@echolab-auto/ui-frame/doc</code> 子路径模块拆出的纯 UI 原语：代码块、目录导航
              可脱离 MarkdownRenderer 单独使用。整体组合效果见顶部导航「文档组件」页。
            </p>

            <!-- DocCodeBlock -->
            <NeumorphismCard id="doc-code-block" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">DocCodeBlock 代码块</h3>
                  <span class="demo-badge">语法高亮 · 行号 · 一键复制</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 24px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 320px">
                  <h4 class="demo-label">TypeScript（带行号）</h4>
                  <DocCodeBlock :code="codeDemoTs" lang="ts" />
                </div>
                <div style="flex: 1; min-width: 320px">
                  <h4 class="demo-label">bash（无行号）</h4>
                  <DocCodeBlock
                    code="npm install @echolab-auto/ui-frame"
                    lang="bash"
                    :show-line-numbers="false"
                  />
                </div>
              </div>
            </NeumorphismCard>

            <!-- DocTocNav -->
            <NeumorphismCard id="doc-toc-nav" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">DocTocNav 目录导航</h3>
                  <span class="demo-badge">层级折叠 · 激活高亮 · 自动展开祖先</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">
                  点击目录项模拟 scroll-spy 激活（activeId 由宿主持有，配合 useScrollSpy 使用）
                </h4>
                <div style="max-width: 320px">
                  <DocTocNav
                    :items="tocDemoItems"
                    :active-id="tocDemoActiveId"
                    @select="id => (tocDemoActiveId = id)"
                  />
                </div>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：布局                                       -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">布局</h2>
            <p class="category-desc">
              页面布局类组件，包括响应式容器、24 栅格系统和经典页面框架（Header + Sider + Content +
              Footer）。
            </p>

            <!-- 容器 -->
            <NeumorphismCard id="container" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismContainer 容器</h3>
                  <span class="demo-badge">Fixed/Fluid · 响应式断点</span>
                </div>
              </template>

              <div
                style="
                  border: 1px dashed var(--nm-text-placeholder);
                  border-radius: var(--nm-border-radius-md);
                  overflow: hidden;
                "
              >
                <NeumorphismCard
                  :elevation="0"
                  style="text-align: center; padding: 28px; border-radius: 0"
                >
                  <p style="margin: 0; color: var(--nm-text-secondary); font-size: 13px">
                    内容自动居中，随断点变化最大宽度
                  </p>
                </NeumorphismCard>
              </div>
            </NeumorphismCard>

            <!-- 栅格 -->
            <NeumorphismCard id="grid" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismRow / NeumorphismCol 栅格</h3>
                  <span class="demo-badge">24 栅格 · 6 断点 · Gutter · 偏移</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">基本栅格</h4>
                <NeumorphismRow :gutter="12">
                  <NeumorphismCol v-for="i in 4" :key="i" :span="6">
                    <NeumorphismCard :elevation="1">
                      <div class="grid-cell">col-6</div>
                    </NeumorphismCard>
                  </NeumorphismCol>
                </NeumorphismRow>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">混合栅格与偏移</h4>
                <NeumorphismRow :gutter="12">
                  <NeumorphismCol :span="8">
                    <NeumorphismCard :elevation="1">
                      <div class="grid-cell">col-8</div>
                    </NeumorphismCard>
                  </NeumorphismCol>
                  <NeumorphismCol :span="8" :offset="8">
                    <NeumorphismCard :elevation="1">
                      <div class="grid-cell">col-8 offset-8</div>
                    </NeumorphismCard>
                  </NeumorphismCol>
                </NeumorphismRow>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">响应式栅格（调整浏览器宽度查看效果）</h4>
                <NeumorphismRow :gutter="12">
                  <NeumorphismCol v-for="n in 4" :key="n" :xs="24" :sm="12" :md="8" :lg="6">
                    <NeumorphismCard :elevation="1">
                      <div class="grid-cell">手机:24 / 平板:8 / 桌面:6</div>
                    </NeumorphismCard>
                  </NeumorphismCol>
                </NeumorphismRow>
              </div>
            </NeumorphismCard>

            <!-- 布局 -->
            <NeumorphismCard id="layout" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismLayout 页面布局</h3>
                  <span class="demo-badge">Header+Sider+Content+Footer · 移动端抽屉</span>
                </div>
              </template>

              <div
                style="
                  border: 1px solid rgba(128, 128, 128, 0.1);
                  border-radius: var(--nm-border-radius-lg);
                  overflow: hidden;
                  height: 400px;
                "
              >
                <NeumorphismLayout
                  show-header
                  show-sider
                  :sider-width="200"
                  collapsible
                  style="height: 100%"
                >
                  <template #header-left>
                    <strong style="font-size: 15px">My App</strong>
                  </template>

                  <template #header-right>
                    <NeumorphismAvatar initials="U" size="small" />
                  </template>

                  <template #sider="{ collapsed }">
                    <div style="padding: 12px">
                      <template v-if="!collapsed">
                        <p style="font-size: 12px; color: var(--nm-text-secondary)">导航菜单</p>
                        <p
                          style="
                            font-size: 12px;
                            color: var(--nm-text-placeholder);
                            margin-left: 12px;
                          "
                        >
                          首页
                        </p>
                        <p
                          style="
                            font-size: 12px;
                            color: var(--nm-text-placeholder);
                            margin-left: 12px;
                          "
                        >
                          组件
                        </p>
                        <p
                          style="
                            font-size: 12px;
                            color: var(--nm-text-placeholder);
                            margin-left: 12px;
                          "
                        >
                          设置
                        </p>
                      </template>
                      <p v-else style="text-align: center">📋</p>
                    </div>
                  </template>

                  <template #default>
                    <div style="padding: 24px">
                      <h3 style="margin: 0 0 8px; font-size: 16px">欢迎使用新拟态 UI</h3>
                      <p style="font-size: 13px; color: var(--nm-text-secondary); margin: 0">
                        这是主内容区域，侧边栏可折叠，移动端自动变为抽屉式导航。
                      </p>
                    </div>
                  </template>

                  <template #footer>
                    <span style="font-size: 12px">© 2024 · MIT</span>
                  </template>
                </NeumorphismLayout>
              </div>
            </NeumorphismCard>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：扩展                                       -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">扩展</h2>
            <p class="category-desc">
              补充组件，包括三态主题切换、树形导航和基础画布容器，用于满足文档和流程图等复杂交互场景。
            </p>

            <!-- 主题切换 -->
            <NeumorphismCard id="themetoggle" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismThemeToggle 主题切换</h3>
                  <span class="demo-badge">三态 · light / dark / auto</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">三态切换（默认 auto）</h4>
                <div class="demo-row">
                  <NeumorphismThemeToggle v-model="themeToggleValue" size="medium" />
                  <code style="font-size: 13px">当前值: {{ themeToggleValue }}</code>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸调参（整体比例）</h4>
                <div class="demo-row demo-row--stacked" style="gap: 12px">
                  <div class="demo-row">
                    <NeumorphismSlider
                      v-model="themeToggleHeight"
                      :min="30"
                      :max="56"
                      :step="2"
                      style="width: 200px; flex: 0 0 200px"
                    />
                    <code>{{ themeToggleHeight }}px</code>
                  </div>
                  <div
                    class="demo-size-theme-toggle"
                    :style="{ '--demo-theme-toggle-h': themeToggleHeight + 'px' }"
                  >
                    <NeumorphismThemeToggle v-model="themeToggleValue" />
                  </div>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">禁用自动模式</h4>
                <NeumorphismThemeToggle v-model="themeToggleValue" :disable-auto="true" />
              </div>
            </NeumorphismCard>

            <!-- 树形导航 -->
            <NeumorphismCard id="tree" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismTree 树形导航</h3>
                  <span class="demo-badge">展开/折叠 · 搜索高亮 · 选中高亮</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <div style="width: 280px">
                  <h4 class="demo-label">带搜索的树形导航</h4>
                  <NeumorphismCard :elevation="-1" style="padding: 12px">
                    <NeumorphismTree
                      v-model:selected-keys="treeSelectedKeys"
                      v-model:expanded-keys="treeExpandedKeys"
                      :data="treeData"
                      :show-search="true"
                      search-placeholder="搜索节点..."
                      :multiple="false"
                      @node-click="node => console.log('点击节点:', node.key, node.label)"
                    />
                  </NeumorphismCard>
                  <p class="demo-hint">
                    已选 Key：<strong>{{ treeSelectedKeys.join(', ') || '无' }}</strong>
                  </p>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 图表 -->
            <NeumorphismCard id="chart" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismChart 图表</h3>
                  <span class="demo-badge">柱状图 · 折线图 · 饼图 · K 线图</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">柱状图（分组）</h4>
                <NeumorphismChartBar :series="chartBarData" title="季度销售对比" height="280px" />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">柱状图（堆叠）</h4>
                <NeumorphismChartBar
                  :series="chartBarDataStacked"
                  title="月度渠道销售"
                  :stacked="true"
                  height="280px"
                />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">折线图（平滑曲线 + 面积填充）</h4>
                <NeumorphismChartLine
                  :series="chartLineData"
                  title="月度访客趋势"
                  :area="true"
                  :area-opacity="0.08"
                  curve="smooth"
                  height="280px"
                />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">饼图（带标签）</h4>
                <div class="demo-row">
                  <div style="width: 45%">
                    <NeumorphismChartPie
                      :data="chartPieData"
                      title="框架使用占比"
                      label-position="outside"
                      height="280px"
                    />
                  </div>
                  <div style="width: 45%">
                    <NeumorphismChartPie
                      :data="chartDonutData"
                      title="项目进度"
                      :inner-radius="50"
                      label-position="inside"
                      height="280px"
                    >
                      <template #center="{ total }">
                        <div style="text-align: center">
                          <div
                            style="font-size: 20px; font-weight: 700; color: var(--nm-text-primary)"
                          >
                            {{ total }}
                          </div>
                          <div style="font-size: 11px; color: var(--nm-text-secondary)">总任务</div>
                        </div>
                      </template>
                    </NeumorphismChartPie>
                  </div>
                </div>
              </div>
              <div class="demo-block">
                <h4 class="demo-label">K 线图（OHLC + 成交量 + MA 均线）</h4>
                <NeumorphismChartCandlestick
                  :data="chartStockData"
                  title="股价走势"
                  :show-volume="true"
                  :show-ma="true"
                  :ma-periods="[5, 10, 20]"
                  height="420px"
                />
              </div>
            </NeumorphismCard>

            <!-- 画布 -->
            <NeumorphismCard id="canvas" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismCanvas 画布</h3>
                  <span class="demo-badge">拖拽平移 · 滚轮缩放 · 适应屏幕 · 全屏</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">
                  SVG 流程图示例（拖拽平移、Ctrl/⌘+滚轮缩放，方向键平移，+/-/0 缩放）
                </h4>
                <div class="demo-row" style="margin-bottom: 10px">
                  <NeumorphismButton size="small" @click="canvasShowGrid = !canvasShowGrid">
                    {{ canvasShowGrid ? '隐藏网格' : '显示网格' }}
                  </NeumorphismButton>
                  <NeumorphismButton
                    size="small"
                    @click="canvasGridVariant = canvasGridVariant === 'dots' ? 'lines' : 'dots'"
                  >
                    {{ canvasGridVariant === 'dots' ? '线条网格' : '点状网格' }}
                  </NeumorphismButton>
                  <NeumorphismButton size="small" @click="canvasZoom = 1">
                    重置缩放
                  </NeumorphismButton>
                </div>

                <NeumorphismCanvas
                  v-model="canvasZoom"
                  :show-grid="canvasShowGrid"
                  :grid-variant="canvasGridVariant"
                  :grid-size="20"
                  :min-zoom="0.25"
                  :max-zoom="3"
                  :zoom-step="0.1"
                  height="480px"
                >
                  <!-- Simple SVG flowchart rendered inside canvas -->
                  <svg :width="440" :height="460" style="display: block">
                    <!-- Edges -->
                    <path
                      v-for="edge in flowEdges"
                      :key="`${edge.from}-${edge.to}`"
                      :d="
                        calcEdgePath(
                          flowNodes.find(n => n.id === edge.from)!,
                          flowNodes.find(n => n.id === edge.to)!,
                          edge.label
                        )
                      "
                      fill="none"
                      stroke="var(--nm-text-secondary)"
                      stroke-width="1.5"
                      marker-end="url(#arrowhead)"
                    />
                    <!-- Edge labels -->
                    <text
                      v-for="edge in flowEdges.filter(e => e.label)"
                      :key="`label-${edge.from}-${edge.to}`"
                      :x="
                        (flowNodes.find(n => n.id === edge.from)!.x +
                          flowNodes.find(n => n.id === edge.from)!.w / 2 +
                          flowNodes.find(n => n.id === edge.to)!.x +
                          flowNodes.find(n => n.id === edge.to)!.w / 2) /
                          2 +
                        14
                      "
                      :y="
                        (flowNodes.find(n => n.id === edge.from)!.y +
                          flowNodes.find(n => n.id === edge.from)!.h +
                          flowNodes.find(n => n.id === edge.to)!.y) /
                        2
                      "
                      fill="var(--nm-primary-color)"
                      font-size="11"
                    >
                      {{ edge.label }}
                    </text>

                    <!-- Arrow marker -->
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="8"
                        markerHeight="6"
                        refX="8"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 3, 0 6" fill="var(--nm-text-secondary)" />
                      </marker>
                    </defs>

                    <!-- Nodes -->
                    <g v-for="node in flowNodes" :key="node.id">
                      <rect
                        :x="node.x"
                        :y="node.y"
                        :width="node.w"
                        :height="node.h"
                        :rx="node.type === 'rounded' ? 18 : 8"
                        fill="var(--nm-surface-raised)"
                        stroke="var(--nm-primary-color)"
                        stroke-width="2"
                        filter="url(#nm-shadow)"
                      />
                      <text
                        :x="node.x + node.w / 2"
                        :y="node.y + node.h / 2"
                        text-anchor="middle"
                        dominant-baseline="central"
                        fill="var(--nm-text-primary)"
                        font-size="12"
                      >
                        {{ node.label }}
                      </text>
                    </g>

                    <!-- Drop shadow filter -->
                    <filter id="nm-shadow" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow
                        dx="2"
                        dy="2"
                        stdDeviation="3"
                        flood-color="var(--nm-shadow-dark)"
                      />
                    </filter>
                  </svg>
                </NeumorphismCanvas>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">空画布（展示网格）</h4>
                <NeumorphismCanvas v-model="canvasZoom" :show-grid="true" height="250px">
                  <div
                    style="
                      padding: 24px;
                      color: var(--nm-text-placeholder);
                      font-size: 13px;
                      white-space: nowrap;
                    "
                  >
                    在此区域放置任意 SVG / HTML 内容
                  </div>
                </NeumorphismCanvas>
              </div>
            </NeumorphismCard>

            <!-- Logo 动效 -->
            <NeumorphismCard id="logo" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismLogo 像素 Logo 动效</h3>
                  <span class="demo-badge">4 种模式 · 黏液滤镜 · 指针交互</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">模式切换</h4>
                <div class="demo-row" style="gap: 10px; flex-wrap: wrap">
                  <NeumorphismButton
                    v-for="opt in logoModeOptions"
                    :key="opt.value"
                    size="small"
                    :variant="logoMode === opt.value ? 'pressed' : 'raised'"
                    @click="logoMode = opt.value"
                  >
                    {{ opt.label }}
                  </NeumorphismButton>
                </div>
              </div>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <div class="demo-block">
                  <h4 class="demo-label">默认尺寸 + 自定义控制面板</h4>
                  <NeumorphismCard
                    :elevation="-1"
                    style="padding: 24px; display: inline-block; text-align: center"
                  >
                    <NeumorphismLogo v-model:mode="logoMode" :width="logoWidth" :goo="logoGoo">
                      <template #default="{ replay }">
                        <div style="margin-top: 12px">
                          <NeumorphismButton size="small" @click="replay"
                            >↻ 重播汇聚</NeumorphismButton
                          >
                        </div>
                      </template>
                    </NeumorphismLogo>
                  </NeumorphismCard>
                </div>

                <div class="demo-block" style="flex: 1; min-width: 260px; max-width: 420px">
                  <h4 class="demo-label">尺寸与滤镜（宽度可调）</h4>
                  <div class="demo-row demo-row--stacked" style="gap: 12px">
                    <div class="demo-row">
                      <NeumorphismSlider
                        v-model="logoWidth"
                        :min="80"
                        :max="360"
                        :step="10"
                        style="width: 200px; flex: 0 0 200px"
                      />
                      <code>{{ logoWidth }}px</code>
                    </div>
                    <div class="demo-row">
                      <NeumorphismSwitch v-model="logoGoo" />
                      <code style="font-size: 13px">goo 滤镜: {{ logoGoo ? '开' : '关' }}</code>
                    </div>
                  </div>
                  <p class="demo-hint">
                    当前模式：<strong>{{
                      logoModeOptions.find(o => o.value === logoMode)?.label
                    }}</strong>
                  </p>
                  <p class="demo-hint" style="margin-top: 4px">
                    提示：选择「指针引力」后将鼠标移入 Logo，方块会跟随光标移动。
                  </p>
                </div>
              </div>
            </NeumorphismCard>

            <!-- Art 试验效果 -->
            <NeumorphismCard id="art" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismArt 试验效果</h3>
                  <span class="demo-badge">5 效果 · 指针交互 · 速度/密度可调</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">效果选择（试验性动态效果孵化器）</h4>
                <div class="demo-row">
                  <NeumorphismSegmented v-model="artEffect" :options="artEffectOptions" />
                </div>
              </div>

              <NeumorphismArt
                :effect="artEffect"
                :reactive="artReactive"
                :speed="artSpeed"
                :density="artDensity"
                :height="280"
                :src="artImage"
              >
                <h3 v-if="artEffect !== 'ascii'" style="font-weight: 600; opacity: 0.85">
                  {{ artEffectOptions.find(o => o.value === artEffect)?.label }}
                </h3>
              </NeumorphismArt>

              <div class="demo-block" style="margin-top: 16px">
                <h4 class="demo-label">参数</h4>
                <div class="demo-row" style="flex-wrap: wrap; gap: 24px; align-items: center">
                  <div class="demo-row">
                    <NeumorphismSwitch v-model="artReactive" />
                    <code>reactive（指针交互）</code>
                  </div>
                  <div class="demo-row" style="min-width: 220px">
                    <NeumorphismSlider v-model="artSpeed" :min="0.2" :max="3" :step="0.1" />
                    <code>speed: {{ artSpeed.toFixed(1) }}</code>
                  </div>
                  <div class="demo-row" style="min-width: 220px">
                    <NeumorphismSlider v-model="artDensity" :min="0.5" :max="3" :step="0.1" />
                    <code>density: {{ artDensity.toFixed(1) }}</code>
                  </div>
                </div>
                <p class="demo-hint">
                  提示：开启 reactive
                  后将指针移入画布——像素场以指针为波源、粒子被吸附、波浪隆起、色团被排斥、字符画提亮。触屏与
                  prefers-reduced-motion 下自动降级为静态画面。
                </p>
              </div>
            </NeumorphismCard>

            <!-- 字符画（正式组件） -->
            <NeumorphismCard id="ascii-art" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismAsciiArt 字符画</h3>
                  <span class="demo-badge">图片 → ASCII · 调参面板 · 实时预览</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">调参面板（右侧面板实时调整全部参数）</h4>
                <div class="demo-row" style="align-items: flex-start; flex-wrap: wrap; gap: 24px">
                  <!-- 实时预览（限宽居中，避免自适应模式下竖图过高） -->
                  <div style="flex: 1; min-width: 300px; max-width: 480px; margin: 0 auto">
                    <NeumorphismAsciiArt
                      :src="artImage"
                      :density="asciiDensity"
                      :speed="asciiSpeed"
                      :reactive="asciiReactive"
                      :radius="asciiRadius"
                      :width="asciiSizeMode === 'fixed' ? asciiWidth : undefined"
                      :height="asciiSizeMode === 'fixed' ? asciiHeight : undefined"
                      :palette="asciiPalette"
                      :aria-label="asciiAriaLabel"
                    />
                    <p class="demo-hint" style="margin-top: 8px">
                      {{
                        asciiSizeMode === 'auto'
                          ? '当前为自适应：高度按原图宽高比自动定高'
                          : `当前固定 ${asciiWidth}×${asciiHeight}px`
                      }}
                    </p>
                  </div>

                  <!-- 参数表单 -->
                  <div style="width: 300px; flex-shrink: 0">
                    <div class="demo-row demo-row--stacked" style="gap: 14px">
                      <div class="demo-row">
                        <span class="demo-form-label">密度 density</span>
                        <NeumorphismSlider
                          v-model="asciiDensity"
                          :min="0.5"
                          :max="3"
                          :step="0.1"
                          style="flex: 1"
                        />
                        <code>{{ asciiDensity.toFixed(1) }}</code>
                      </div>
                      <div class="demo-row">
                        <span class="demo-form-label">速度 speed</span>
                        <NeumorphismSlider
                          v-model="asciiSpeed"
                          :min="0"
                          :max="3"
                          :step="0.1"
                          style="flex: 1"
                        />
                        <code>{{ asciiSpeed.toFixed(1) }}</code>
                      </div>
                      <div class="demo-row">
                        <span class="demo-form-label">指针交互 reactive</span>
                        <NeumorphismSwitch v-model="asciiReactive" />
                      </div>
                      <div class="demo-row" style="flex-wrap: wrap">
                        <span class="demo-form-label">圆角 radius</span>
                        <NeumorphismSegmented
                          v-model="asciiRadius"
                          :options="[
                            { label: '直角', value: 'none' },
                            { label: '小', value: 'small' },
                            { label: '中', value: 'medium' },
                            { label: '大', value: 'large' },
                            { label: '特大', value: 'xl' },
                          ]"
                          size="small"
                        />
                      </div>
                      <div class="demo-row">
                        <span class="demo-form-label">尺寸</span>
                        <NeumorphismSegmented
                          v-model="asciiSizeMode"
                          :options="[
                            { label: '自适应', value: 'auto' },
                            { label: '固定尺寸', value: 'fixed' },
                          ]"
                          size="small"
                        />
                      </div>
                      <template v-if="asciiSizeMode === 'fixed'">
                        <div class="demo-row">
                          <span class="demo-form-label">宽度 width</span>
                          <NeumorphismSlider
                            v-model="asciiWidth"
                            :min="240"
                            :max="720"
                            :step="10"
                            style="flex: 1"
                          />
                          <code>{{ asciiWidth }}px</code>
                        </div>
                        <div class="demo-row">
                          <span class="demo-form-label">高度 height</span>
                          <NeumorphismSlider
                            v-model="asciiHeight"
                            :min="200"
                            :max="600"
                            :step="10"
                            style="flex: 1"
                          />
                          <code>{{ asciiHeight }}px</code>
                        </div>
                      </template>
                      <div class="demo-row" style="flex-wrap: wrap">
                        <span class="demo-form-label">配色 palette</span>
                        <NeumorphismSegmented
                          v-model="asciiPaletteName"
                          :options="[
                            { label: '主题默认', value: 'theme' },
                            { label: '暖色', value: 'warm' },
                            { label: '冷色', value: 'cool' },
                          ]"
                          size="small"
                        />
                      </div>
                      <div class="demo-row">
                        <span class="demo-form-label">无障碍名 ariaLabel</span>
                        <NeumorphismInput v-model="asciiAriaLabel" size="small" style="flex: 1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 像素字体（termsyn 6x11 位图字体展示） -->
            <NeumorphismCard id="pixel-font" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismPixelFont 像素字体</h3>
                  <span class="demo-badge">termsyn 6x11 · 位图字体 · 整数倍缩放</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">展示（「ASCII MOTION」片头风格：标题 + 副题 + 闪烁光标）</h4>
                <div class="pixel-stage">
                  <NeumorphismPixelFont
                    :text="pixelTitle"
                    :scale="pixelScale"
                    :cursor="pixelCursor"
                    :align="pixelAlign"
                  />
                  <NeumorphismPixelFont
                    :text="pixelSubtitle"
                    :scale="pixelSubtitleScale"
                    :align="pixelAlign"
                  />
                  <div class="pixel-stage__specimen">
                    <NeumorphismPixelFont
                      text="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      :scale="2"
                      :align="pixelAlign"
                    />
                    <NeumorphismPixelFont
                      text="abcdefghijklmnopqrstuvwxyz"
                      :scale="2"
                      :align="pixelAlign"
                    />
                    <NeumorphismPixelFont
                      text="0123456789 !?@#$%&*()[]{}<>"
                      :scale="2"
                      :align="pixelAlign"
                    />
                  </div>
                </div>
                <p class="demo-hint" style="margin-top: 8px">
                  显示区字号 = 11px × scale——位图字体仅在整数倍设计尺寸下保持像素锐利（scale
                  自动取整）；光标随 reduced-motion 设置自动停闪。
                </p>
              </div>

              <div class="demo-block" style="margin-top: 16px">
                <h4 class="demo-label">参数</h4>
                <div class="demo-row" style="flex-wrap: wrap; gap: 24px; align-items: center">
                  <div class="demo-row" style="min-width: 240px; flex: 1">
                    <span class="demo-form-label">标题文本</span>
                    <NeumorphismInput v-model="pixelTitle" size="small" style="flex: 1" />
                  </div>
                  <div class="demo-row" style="min-width: 240px; flex: 1">
                    <span class="demo-form-label">副题文本</span>
                    <NeumorphismInput v-model="pixelSubtitle" size="small" style="flex: 1" />
                  </div>
                  <div class="demo-row" style="min-width: 220px">
                    <NeumorphismSlider v-model="pixelScale" :min="1" :max="6" :step="1" />
                    <code>scale: {{ pixelScale }}</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismSwitch v-model="pixelCursor" />
                    <code>cursor</code>
                  </div>
                  <NeumorphismSegmented v-model="pixelAlign" :options="pixelAlignOptions" />
                </div>
              </div>

              <div class="demo-block" style="margin-top: 16px">
                <p class="demo-hint">
                  字体出处：termsyn 6x11（stlarch 作；Terminus × Tamsyn 混合位图字体，GPL-2）——由
                  PCF 位图重建为 woff2 内嵌（字形逐像素一致），字母 I 的步进按片头样张收紧，
                  两侧字距与其余字母一致；含 400 / 700 双字重。
                </p>
              </div>
            </NeumorphismCard>

            <!-- 节点图（实验性）——Obsidian 风格力导向图 -->
            <NeumorphismCard id="graph" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismGraphView 节点图</h3>
                  <span class="demo-badge">实验性 · 力导向布局 · 自绘 canvas</span>
                </div>
              </template>

              <div class="demo-block">
                <div class="graph-stage">
                  <NeumorphismGraphView
                    ref="graphRef"
                    :nodes="graphNodes"
                    :links="graphLinks"
                    :height="graphHeight"
                    :node-radius="graphNodeRadius"
                    :link-distance="graphLinkDistance"
                    :repulsion="graphRepulsion"
                    :force-settings="graphForceSettings"
                    :show-labels="graphLabelMode"
                    :show-controls="graphShowControls"
                    :show-legend="graphShowLegend"
                    :highlight-neighbors="graphHighlight"
                    :draggable="graphDraggable"
                    :pannable="graphPannable"
                    :zoomable="graphZoomable"
                    :auto-fit="graphAutoFit"
                    :preserve-positions="graphPreservePositions"
                    aria-label="组件库知识库节点图"
                    @node-click="onGraphNodeClick"
                    @node-hover="onGraphNodeHover"
                    @layout-start="onGraphLayoutStart"
                    @layout-settled="onGraphLayoutSettled"
                  />
                </div>

                <div class="graph-readout">
                  <span class="graph-readout__item">
                    节点 <b>{{ graphNodes.length }}</b> · 连线 <b>{{ graphLinks.length }}</b>
                  </span>
                  <span class="graph-readout__item">
                    悬停
                    <b>{{ graphHovered ? graphHovered.label : '—' }}</b>
                  </span>
                  <span class="graph-readout__item">
                    选中
                    <b>{{ graphSelected ? graphSelected.label : '—' }}</b>
                    <template v-if="graphSelected">
                      （{{ graphSelected.group }} ·
                      {{ graphDegree.get(graphSelected.id) ?? 0 }} 条双链）
                    </template>
                  </span>
                  <span class="graph-readout__item">
                    状态
                    <b>{{ graphSettled ? '已静止' : '力学模拟中' }}</b>
                  </span>
                  <span class="graph-readout__item">
                    退火 alpha
                    <b class="graph-readout__num">{{ fmt(graphAlpha, 3) }}</b>
                  </span>
                </div>

                <p class="demo-hint" style="margin-top: 10px">
                  拖拽节点可临时钉住并牵引邻居，拖背景平移，滚轮以光标为锚点缩放，双击节点居中；
                  悬停高亮一度邻居、其余淡化。键盘：方向键切换节点、Enter 选中、<code>+</code> /
                  <code>-</code> 缩放、<code>0</code> 适应视图。
                </p>
              </div>

              <div class="demo-block" style="margin-top: 16px">
                <h4 class="demo-label">布局与视图（组件 props）</h4>
                <div class="graph-controls">
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">节点半径 nodeRadius</span>
                    <NeumorphismSlider
                      v-model="graphNodeRadius"
                      :min="2"
                      :max="20"
                      :step="1"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ graphNodeRadius }}px</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">理想边长 linkDistance</span>
                    <NeumorphismSlider
                      v-model="graphLinkDistance"
                      :min="40"
                      :max="200"
                      :step="2"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ graphLinkDistance }}px</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">排斥强度 repulsion</span>
                    <NeumorphismSlider
                      v-model="graphRepulsion"
                      :min="100"
                      :max="3000"
                      :step="50"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ graphRepulsion }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">容器高度 height</span>
                    <NeumorphismSlider
                      v-model="graphHeight"
                      :min="320"
                      :max="760"
                      :step="20"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ graphHeight }}px</code>
                  </div>
                </div>
              </div>

              <div class="demo-block" style="margin-top: 16px">
                <h4 class="demo-label">力学动力学（forceSettings → ForceLayout）</h4>
                <div class="graph-controls">
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">弹簧刚度 spring</span>
                    <NeumorphismSlider
                      v-model="graphSpring"
                      :min="0.001"
                      :max="0.03"
                      :step="0.001"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphSpring, 3) }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">向心引力 gravity</span>
                    <NeumorphismSlider
                      v-model="graphGravity"
                      :min="0"
                      :max="0.002"
                      :step="0.0001"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphGravity, 4) }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">速度衰减 velocityDecay</span>
                    <NeumorphismSlider
                      v-model="graphVelocityDecay"
                      :min="0"
                      :max="0.9"
                      :step="0.05"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphVelocityDecay, 2) }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">单帧限速 maxSpeed</span>
                    <NeumorphismSlider
                      v-model="graphMaxSpeed"
                      :min="2"
                      :max="40"
                      :step="1"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ graphMaxSpeed }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">退火速率 alphaDecay</span>
                    <NeumorphismSlider
                      v-model="graphAlphaDecay"
                      :min="0.004"
                      :max="0.12"
                      :step="0.002"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphAlphaDecay, 3) }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">退火下限 alphaMin</span>
                    <NeumorphismSlider
                      v-model="graphAlphaMin"
                      :min="0.0004"
                      :max="0.02"
                      :step="0.0001"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphAlphaMin, 4) }}</code>
                  </div>
                  <div class="graph-ctl">
                    <span class="graph-ctl__label">排斥上限 maxRepulsion</span>
                    <NeumorphismSlider
                      v-model="graphMaxRepulsionForce"
                      :min="1"
                      :max="20"
                      :step="0.5"
                      size="small"
                      style="flex: 1"
                    />
                    <code class="graph-ctl__value">{{ fmt(graphMaxRepulsionForce, 1) }}</code>
                  </div>
                </div>
                <p class="demo-hint" style="margin-top: 10px">
                  力学参数改动只更新引擎设置、不重建节点——位置得以保留，拖滑块时图不会整图重排。
                  想看"从零重排"点「重新布局」；想温和舒展点「重新唤醒」。
                </p>
              </div>

              <div class="demo-block" style="margin-top: 16px">
                <h4 class="demo-label">视图 / 交互 / 行为（开关类 props）</h4>
                <div class="graph-switches">
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphShowLegend" size="small" />
                    <span>图例 showLegend</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphShowControls" size="small" />
                    <span>缩放控件 showControls</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphHighlight" size="small" />
                    <span>高亮邻居 highlightNeighbors</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphDraggable" size="small" />
                    <span>拖拽节点 draggable</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphPannable" size="small" />
                    <span>拖背景平移 pannable</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphZoomable" size="small" />
                    <span>缩放 zoomable</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphAutoFit" size="small" />
                    <span>自动适应 autoFit</span>
                  </div>
                  <div class="graph-switch">
                    <NeumorphismSwitch v-model="graphPreservePositions" size="small" />
                    <span>保留坐标 preservePositions</span>
                  </div>
                </div>

                <div class="demo-row" style="flex-wrap: wrap; gap: 24px; align-items: center">
                  <div class="demo-row">
                    <span class="demo-form-label">标签 showLabels</span>
                    <NeumorphismSegmented v-model="graphLabelMode" :options="graphLabelOptions" />
                  </div>
                </div>

                <div class="graph-actions">
                  <NeumorphismButton variant="raised" size="small" @click="graphRef?.fit()">
                    适应视图
                  </NeumorphismButton>
                  <NeumorphismButton
                    variant="pressed"
                    size="small"
                    @click="graphRef?.resetLayout()"
                  >
                    重新布局
                  </NeumorphismButton>
                  <NeumorphismButton variant="raised" size="small" @click="graphRef?.reheat(0.6)">
                    重新唤醒
                  </NeumorphismButton>
                  <NeumorphismButton variant="raised" size="small" @click="addGraphNode()">
                    ＋ 新增节点
                  </NeumorphismButton>
                  <NeumorphismButton variant="raised" size="small" @click="removeGraphNode()">
                    － 移除节点
                  </NeumorphismButton>
                  <NeumorphismButton variant="raised" size="small" @click="resetGraphDefaults()">
                    恢复默认
                  </NeumorphismButton>
                </div>
                <p class="demo-hint" style="margin-top: 10px">
                  「新增 / 移除节点」会改动数据：<code>preservePositions</code>
                  打开时既有节点留在原位、只有新节点补位（配合
                  <code>autoFit</code> 自动收进视野）；关掉它整图会重新播种。节点少时可显著看到
                  <code>autoFit</code> 引起的视图变化。
                </p>
              </div>
            </NeumorphismCard>
          </section>

          <!-- ===== 页脚 ===== -->
          <footer class="doc-footer">
            <NeumorphismDivider />
            <p>@echolab-auto/ui-frame · MIT 许可证 · 共 50+ 个组件</p>
            <p style="margin-top: 4px">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a> ·
              <a href="https://www.npmjs.com/package/@echolab-auto/ui-frame" target="_blank">npm</a>
            </p>
          </footer>
        </div>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped lang="scss">
@use '../../src/styles/variables.scss' as *;
@use '../../src/styles/mixins.scss' as *;

// 调参面板的表单标签
.demo-form-label {
  font-size: 13px;
  color: var(--nm-text-secondary);
  white-space: nowrap;
  min-width: 96px;
}

// 玻璃卡片舞台：彩色渐变 + 网格点，衬托磨砂半透明的层次感
.demo-glass-backdrop--cards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-lg);
  align-items: stretch;
}

.demo-glass-card-title {
  margin-bottom: var(--nm-spacing-xs);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 35%);
}

// 渐变背景上的代码标注：半透明深底 + 白字，双主题都可读
.demo-glass-code {
  padding: 2px 6px;
  border-radius: var(--nm-border-radius-sm);
  background: rgb(0 0 0 / 32%);
  color: #fff;
  font-size: 11px;
}

// 玻璃拟态演示背景：彩色渐变衬托 backdrop-filter 的磨砂半透明效果
.demo-glass-backdrop {
  padding: 24px;
  border-radius: var(--nm-border-radius-md);
  background: linear-gradient(
    135deg,
    var(--nm-color-primary-300),
    var(--nm-color-info, #5a8def),
    var(--nm-color-success, #3fb27f)
  );

  // 渐变背景上 code 标注用深色半透明底保证双主题可读
  code {
    padding: 2px 8px;
    border-radius: 6px;
    background: rgb(0 0 0 / 55%);
    color: #fff;
  }
}

// ---- Root ----
// flex: 1 fills .page-content. display:flex passes the flex context
// down to the inner Layout, avoiding percentage height fragility.
.showcase {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition:
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow);
}

// ---- Header ----
.brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

// ---- Sider Navigation ----
.sider-nav {
  padding: 12px 10px 24px;
}

.nav-group {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-group-title {
  display: block;
  padding: 8px 10px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--nm-text-placeholder);
}

.nav-link {
  display: block;
  padding: 6px 10px 6px 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);
  margin-bottom: 1px;
  position: relative;
  border-left: 2px solid transparent;

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
  }

  &--active {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-surface-raised);
    border-left-color: var(--nm-primary-color);
    border-radius: 0 var(--nm-border-radius-sm) var(--nm-border-radius-sm) 0;
  }
}

// ---- Content Area (fluid, no max-width) ----
.content-inner {
  margin: 0 auto;
  padding: 8px 20px 64px;

  @include nm-screen-sm {
    padding: 12px 28px 64px;
  }

  @include nm-screen-lg {
    padding: 16px 40px 72px;
  }

  @media (min-width: 1600px) {
    padding: 20px 56px 80px;
  }
}

// ---- Hero ----
.hero {
  padding: 0 0 24px;

  @include nm-screen-lg {
    padding: 4px 0 28px;
  }
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.5px;

  @include nm-screen-sm {
    font-size: 32px;
  }

  @include nm-screen-lg {
    font-size: 36px;
    letter-spacing: -0.8px;
  }
}

.hero-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
  max-width: 640px;

  @include nm-screen-lg {
    font-size: 15px;
  }
}

.hero-links {
  font-size: 14px;
  color: var(--nm-text-placeholder);

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.hero-links-sep {
  margin: 0 8px;
}

// ---- Category Section ----
.category-section {
  padding: 8px 0 4px;

  // Grid layout for demo cards on wider screens
  @include nm-screen-lg {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  // 2-column card grid at 1400px+
  @media (min-width: 1400px) {
    grid-template-columns: 1fr 1fr;
  }
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  padding-top: 8px;

  @include nm-screen-sm {
    font-size: 22px;
  }
}

.category-desc {
  font-size: 13px;
  color: var(--nm-text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 640px;

  @include nm-screen-lg {
    margin-bottom: 28px;
  }
}

// ---- Demo Card ----
.demo-card {
  margin-bottom: 20px;
  scroll-margin-top: 80px;

  &:last-child {
    margin-bottom: 0;
  }
}

// Full-width cards span all columns in grid
.demo-card--full {
  @include nm-screen-lg {
    grid-column: 1 / -1;
  }
}

// outlined Select 为单盒内联延展（盒体在文档流中长高），需要可见溢出
// 才能伸出卡片边界；卡片自身仅用 overflow 做防御性裁剪，解除不影响视觉
#select {
  overflow: visible;
}

.demo-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.demo-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;

  @include nm-screen-sm {
    font-size: 16px;
  }
}

.demo-badge {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  white-space: nowrap;
}

// ---- Demo Blocks ----
.demo-block {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.demo-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--nm-text-placeholder);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  &--stacked {
    flex-direction: column;
    align-items: flex-start;
  }

  &--cards {
    align-items: stretch;
  }
}

.demo-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--nm-text-secondary);
}

// ---- PixelFont demo：终端「屏幕」舞台 ----
.pixel-stage {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-md);
  padding: var(--nm-spacing-20);
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-bg-color);
  @include nm-inset-strong(4px, 10px);
  overflow-x: auto;
}

.pixel-stage__specimen {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  opacity: 0.5;
}

.form-demo-width {
  max-width: 420px;
}

// ---- GraphView demo：节点图舞台 ----
.graph-stage {
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
}

.graph-readout {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);

  b {
    color: var(--nm-text-primary);
    font-weight: 600;
  }
}

// 退火系数读数：等宽数字，避免轮询刷新时抖动
.graph-readout__num {
  font-variant-numeric: tabular-nums;
  font-family: var(--nm-font-mono);
}

// ---- Button 展示 + 配置 ----
// 左侧预览台 + 右侧参数表单；窄屏自动收成一列
.btn-playground {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-xl);
  align-items: stretch;
}

.btn-stage {
  // box-sizing: 预览台有较宽内边距，content-box 会让它在窄屏溢出卡片
  box-sizing: border-box;
  flex: 1 1 320px;
  // 允许压缩到容器宽度（0 而非 300px，否则 390px 视口下会横向溢出）
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-md);
  padding: var(--nm-spacing-xl);
  border-radius: var(--nm-border-radius-lg);
  // 预览台本身也做成凹陷槽，衬托按钮的凸起关系
  @include nm-inset-strong(4px, 10px);
  transition: background var(--nm-transition-slow);

  &--plane {
    background-color: var(--nm-bg-color);
  }

  // 彩色台面：玻璃档位的半透明与模糊只有在这种背景上才看得出来
  &--gradient {
    background: linear-gradient(
      135deg,
      var(--nm-color-primary-300),
      var(--nm-color-info, #5a8def),
      var(--nm-color-success, #3fb27f)
    );
  }
}

.btn-stage__spec {
  margin: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--nm-text-secondary);
  text-align: center;
  word-break: break-word;

  b {
    color: var(--nm-text-primary);
    font-weight: 600;
  }
}

// 彩色台面下读数改用白字（深色渐变底上浅灰不可读）
.btn-stage--gradient .btn-stage__spec,
.btn-stage--gradient .btn-stage__bg-label,
.btn-stage--gradient .btn-stage__hint {
  color: rgb(255 255 255 / 88%);

  b {
    color: #fff;
  }
}

.btn-stage__bg {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
}

.btn-stage__bg-label {
  font-size: 12px;
  color: var(--nm-text-secondary);
}

.btn-stage__hint {
  margin: 0;
  text-align: center;
}

.btn-config {
  box-sizing: border-box;
  // 可收缩（0 1），窄屏时随容器变窄而不是溢出被裁
  flex: 0 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
}

.btn-config__row {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  flex-wrap: wrap;
  min-width: 0;
}

.btn-config__label {
  flex: 0 0 auto;
  min-width: 78px;
  font-size: 12px;
  color: var(--nm-text-secondary);
  white-space: nowrap;
}

.btn-config__value {
  flex: 0 0 auto;
  min-width: 48px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--nm-text-primary);
}

.btn-config__toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-md);
}

.btn-config__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-size: 12px;
  color: var(--nm-text-secondary);
  cursor: pointer;
}

.btn-config__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-sm);
}

// 实时代码片段：等宽 + 横向可滚，长属性不撑破面板
.btn-config__snippet {
  margin: var(--nm-spacing-2xs) 0 0;
  padding: var(--nm-spacing-sm) var(--nm-spacing-md);
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-bg-color);
  color: var(--nm-text-secondary);
  font-family: var(--nm-font-mono);
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  @include nm-inset(2px, 5px);
}

// 变体一览：网格铺排，点击载入到预览
.btn-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--nm-spacing-sm);
}

.btn-matrix__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--nm-spacing-xs);
  padding: var(--nm-spacing-sm) var(--nm-spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--nm-border-radius-md);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--nm-transition-fast),
    background-color var(--nm-transition-fast);

  &:hover {
    background-color: var(--nm-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 2px;
  }

  // 选中态：主色描边 + 淡主色底，一眼看出当前预览对应哪一格
  &--active {
    border-color: var(--nm-primary-color);
    background-color: color-mix(in srgb, var(--nm-primary-color) 10%, transparent);

    .btn-matrix__code {
      color: var(--nm-primary-color);
    }
  }
}

.btn-matrix__code {
  font-size: 10px;
  color: var(--nm-text-placeholder);
  text-align: center;
  word-break: break-all;
}

// ---- ChatComposer 演示：输入器舞台 ----
.composer-stage {
  padding: var(--nm-spacing-lg);
  border-radius: var(--nm-border-radius-lg);
  transition: background var(--nm-transition-slow);

  &--plane {
    background-color: var(--nm-bg-color);
  }

  // 彩色台面：玻璃托盘的磨砂半透明只有在这种背景上才看得出来
  &--gradient {
    background: linear-gradient(
      135deg,
      var(--nm-color-primary-300),
      var(--nm-color-info, #5a8def),
      var(--nm-color-success, #3fb27f)
    );
  }

  // 彩色台面下 meta 读数改白字（浅灰在渐变上不可读）
  &--gradient :deep(.nm-chat-composer__meta) {
    color: rgb(255 255 255 / 88%);

    b {
      color: #fff;
    }
  }
}

// 调参面板：两列自适应网格（窄屏自动收成一列）
.graph-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: var(--nm-spacing-sm) var(--nm-spacing-xl);
}

.graph-ctl {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  min-width: 0;
}

.graph-ctl__label {
  flex: 0 0 auto;
  min-width: 118px;
  font-size: 12px;
  color: var(--nm-text-secondary);
  white-space: nowrap;
}

.graph-ctl__value {
  flex: 0 0 auto;
  min-width: 52px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--nm-text-primary);
}

// 开关组：流式排布，每项 = 开关 + 说明
.graph-switches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-sm) var(--nm-spacing-lg);
  margin-bottom: var(--nm-spacing-md);
}

.graph-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  font-size: 12px;
  color: var(--nm-text-secondary);
  white-space: nowrap;
}

.graph-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-sm);
  margin-top: var(--nm-spacing-md);
}

// ---- Progress demo ----
.progress-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-row__tag {
  flex: 0 0 64px;
  font-size: 12px;
  color: var(--nm-text-secondary);
  text-align: right;
}

.progress-row__bar {
  flex: 1;
  min-width: 0;
}

.progress-rings {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 28px 32px;
}

.progress-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 192px;
}

.progress-ring__caption {
  font-size: 12px;
  color: var(--nm-text-secondary);
}

.progress-effect-notes {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  line-height: 1.9;

  strong {
    color: var(--nm-text-primary);
    font-weight: 600;
  }
}

.grid-cell {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);
}

// ---- Footer ----
.doc-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  color: var(--nm-text-secondary);
  font-size: 13px;

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

// ---- Code block ----
.code-block {
  font-size: 12px;
  line-height: 1.6;
  color: var(--nm-text-secondary);
  background: var(--nm-surface-color);
  padding: 14px 16px;
  border-radius: var(--nm-border-radius-sm);
  box-shadow:
    inset 2px 2px 4px var(--nm-shadow-dark-strong),
    inset -2px -2px 4px var(--nm-shadow-light-strong);
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;

  code {
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
    font-size: 12px;
  }
}

// ==========================================
// 尺寸调参演示 — 数字滑动条直调真实渲染尺寸
// 原生支持数值尺寸的组件（开关 size=px 高度 / 输入框、按钮、头像、进度条走 Token）
// 直接传数字；内部几何仍硬编码的组件在此以演示级 CSS 桥接（组件源码零改动）：
// 勾选框 / 单选框 / 标签 / 分页 / 主题切换 / 环形进度
// ==========================================

.demo-size-checkbox,
.demo-size-radio,
.demo-size-tag,
.demo-size-pagination,
.demo-size-theme-toggle,
.demo-size-progress-circle {
  display: inline-flex;
  align-items: center;
}

// 勾选框指示器
.demo-size-checkbox :deep(.nm-checkbox.nm-checkbox--medium .nm-checkbox__box) {
  width: var(--demo-checkbox-size);
  height: var(--demo-checkbox-size);
}

// 单选框圆环与圆点（点径 = 环径 / 2）
.demo-size-radio :deep(.nm-radio.nm-radio--medium .nm-radio__circle) {
  width: var(--demo-radio-size);
  height: var(--demo-radio-size);
}

.demo-size-radio :deep(.nm-radio.nm-radio--medium .nm-radio__dot) {
  width: calc(var(--demo-radio-size) / 2);
  height: calc(var(--demo-radio-size) / 2);
}

// 标签：高度 / 内边距 / 字号联动
.demo-size-tag :deep(.nm-tag.nm-tag--medium) {
  height: calc(var(--demo-tag-f) * 2.3333);
  padding: calc(var(--demo-tag-f) / 3) var(--demo-tag-f);
  font-size: var(--demo-tag-f);
}

// 分页按钮与省略号（字号 14/38 等比）
.demo-size-pagination :deep(.nm-pagination.nm-pagination--medium .nm-pagination__btn),
.demo-size-pagination :deep(.nm-pagination.nm-pagination--medium .nm-pagination__ellipsis) {
  min-width: var(--demo-pagination-size);
  height: var(--demo-pagination-size);
  font-size: calc(var(--demo-pagination-size) * 0.368);
}

// 主题切换：外边距 / 钮内边距 / 图标 / 文本联动
.demo-size-theme-toggle :deep(.nm-theme-toggle.nm-theme-toggle--medium) {
  padding: calc(var(--demo-theme-toggle-h) * 0.12);
}

.demo-size-theme-toggle :deep(.nm-theme-toggle.nm-theme-toggle--medium .nm-theme-toggle__btn) {
  padding: calc(var(--demo-theme-toggle-h) * 0.16) calc(var(--demo-theme-toggle-h) * 0.32);
}

.demo-size-theme-toggle :deep(.nm-theme-toggle.nm-theme-toggle--medium .nm-theme-toggle__icon) {
  width: calc(var(--demo-theme-toggle-h) * 0.44);
  height: calc(var(--demo-theme-toggle-h) * 0.44);
}

.demo-size-theme-toggle :deep(.nm-theme-toggle.nm-theme-toggle--medium .nm-theme-toggle__label) {
  font-size: calc(var(--demo-theme-toggle-h) * 0.315);
}

// 环形进度：直径 / 内部 SVG / 中央文字联动（覆盖组件行内尺寸）
.demo-size-progress-circle :deep(.nm-progress--circle) {
  width: var(--demo-circle-d) !important;
  height: var(--demo-circle-d) !important;
}

.demo-size-progress-circle :deep(.nm-progress--circle .nm-progress-circle__svg) {
  width: 100%;
  height: 100%;
}

.demo-size-progress-circle :deep(.nm-progress--circle .nm-progress-circle__label) {
  font-size: calc(var(--demo-circle-d) * 0.14);
}
</style>
