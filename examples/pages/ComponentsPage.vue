<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTheme } from '../../src/composables/useTheme'
import { useSelect } from '../../src/composables/useSelect'
import { usePagination } from '../../src/composables/usePagination'
import { useToast } from '../../src/composables/useToast'

// ---- 注入全局主题（由 App.vue provide） ----
const themeContext = useTheme()
const themeValue = themeContext.theme
const isDark = themeContext.isDark

// ==========================================
// 解耦能力演示 — Headless Composables
// ==========================================

// --- useSelect demo: 自定义 UI 选择器 ---
const headlessSelectValue = ref('vue')
const headlessSelectOptions = computed(() => [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular 16', value: 'angular' },
  { label: 'Svelte 4（已禁用）', value: 'svelte', disabled: true },
  { label: 'Solid.js', value: 'solid' },
])

const {
  isOpen: hsOpen,
  selectedOption: hsSelected,
  toggleOpen: hsToggle,
  selectOption: hsSelect,
  handleKeydown: hsKeydown,
  handleBlur: hsBlur,
} = useSelect({
  modelValue: headlessSelectValue,
  options: headlessSelectOptions,
  disabled: ref(false),
})

// --- usePagination demo: 自定义分页 ---
const headlessPage = ref(1)
const {
  totalPages: hsTotalPages,
  currentPage: hsCurrentPage,
  visiblePages: hsVisiblePages,
  changePage: hsChangePage,
  prevPage: hsPrevPage,
  nextPage: hsNextPage,
  isPrevDisabled: hsPrevDisabled,
  isNextDisabled: hsNextDisabled,
} = usePagination({
  modelValue: headlessPage,
  total: computed(() => 100),
  pageSize: computed(() => 10),
})

// --- useToast demo: 自定义 Toast ---
const {
  toasts: hsToasts,
  addToast: hsAddToast,
  removeToast: hsRemoveToast,
} = useToast({ maxCount: 5 })

let hsToastCounter = 0
function showHeadlessToast(type: string) {
  hsToastCounter++
  hsAddToast({
    message: `Headless toast #${hsToastCounter} — ${type}`,
    type: type as 'info' | 'success' | 'warning' | 'error',
    duration: 3000,
  })
}

// ---- headlessSelect 的 blur 包装 ----
function onHsBlur(e: FocusEvent) {
  hsBlur(e.relatedTarget, e.currentTarget as HTMLElement)
}

// ---- 组件分类导航 ----
const navCategories = [
  {
    title: '解耦能力',
    items: [
      { id: 'headless-select', label: 'Headless Select' },
      { id: 'headless-pagination', label: 'Headless 分页' },
      { id: 'headless-toast', label: 'Headless Toast' },
      { id: 'slot-demo', label: 'Slot 自定义' },
      { id: 'config-demo', label: '全局配置' },
    ],
  },
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
    ],
  },
]

// ---- 导航滚动 ----
let clickScrollToken = 0

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  // 点击立即设 activeSection，不依赖任何 scroll 事件回调解算
  activeSection.value = id
  // 递增 token 使 scroll 处理函数跳过本次点击产生的滚动事件，
  // 只在 smooth scroll 结束后做一次确认结算
  clickScrollToken++
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const token = clickScrollToken
  setTimeout(() => {
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
  // 点击触发的 smooth scroll 进行中：所有中间帧的 scroll 事件都跳过，
  // 避免中间帧的 getBoundingClientRect 结算把 activeSection 覆盖回旧值
  if (clickScrollToken > 0) return
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateActiveSection()
      scrollTicking = false
    })
    scrollTicking = true
  }
}

onMounted(() => {
  nextTick(() => {
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    updateActiveSection()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('scroll', onScroll, { capture: true })
})

// ---- 开关示例 ----
const switch1 = ref(false)
const switch2 = ref(true)

// ---- 复选框示例 ----
const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkboxIndeterminate = ref(true)
const _checkboxGroup = ref<string[]>([])

// ---- 单选框示例 ----
const radio1 = ref('a')
const radio2 = ref('medium')

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

const _sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

// ---- 输入框和文本域示例 ----
const inputName = ref('')
const inputEmail = ref('')
const textareaValue = ref('')

// ---- 模态框示例 ----
const modalVisible = ref(false)

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
const toastContainer =
  ref<
    InstanceType<
      (typeof import('../../src/components/NeumorphismToast/NeumorphismToastProvider.vue'))['default']
    >
  >()
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
const indeterminate = ref(false)

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

function _flowNodeStyle(node: (typeof flowNodes)[number]) {
  const base = {
    position: 'absolute' as const,
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.w}px`,
    height: `${node.h}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'var(--nm-text-primary)',
    background: 'var(--nm-surface-raised)',
    border: '2px solid var(--nm-primary-color)',
    boxSizing: 'border-box' as const,
  }
  if (node.type === 'rounded') {
    return { ...base, borderRadius: '18px' }
  }
  if (node.type === 'diamond') {
    return { ...base, borderRadius: '8px', transform: 'rotate(0deg)' }
  }
  return { ...base, borderRadius: '8px' }
}

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
    <NeumorphismLayout show-header show-sider :sider-width="220" collapsible>
      <!-- ===== HEADER ===== -->
      <template #header-left>
        <span class="brand">@echolab-auto/ui-frame</span>
      </template>

      <template #header-right>
        <NeumorphismThemeToggle v-model="themeValue" size="small" />
      </template>

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
        <div class="content-inner">
          <!-- Hero / 简介 -->
          <section class="hero">
            <h1 class="hero-title">@echolab-auto/ui-frame</h1>
            <p class="hero-desc">
              Vue 3 新拟态（Soft UI）UI 组件库，共
              <strong>30</strong> 个组件。<strong>8 个 Headless Composables</strong> 支持业务逻辑与
              UI 完全解耦， 120+ CSS 设计
              Token、全局配置、命名插槽，统一的台阶高度模型、暗色模式、移动端适配。
            </p>
            <div class="hero-links">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a>
              <span class="hero-links-sep">·</span>
              <a href="https://www.npmjs.com/package/@echolab-auto/ui-frame" target="_blank">npm</a>
            </div>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：解耦能力 — Headless Composables & Slots   -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">解耦能力</h2>
            <p class="category-desc">
              以下示例展示如何将<strong>业务逻辑与 UI 完全解耦</strong>。Headless composables
              封装所有行为（键盘导航、ARIA、状态管理）， 开发者只需关心 UI 渲染。Named slots
              允许替换组件的任意视觉部分。全局配置一键修改所有组件默认值。
            </p>

            <!-- ===== Headless Select Demo ===== -->
            <NeumorphismCard id="headless-select" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Headless Select — 用 useSelect 构建自定义选择器</h3>
                  <span class="demo-badge">自定义 UI + 完整键盘导航</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <!-- 自定义 UI 选择器 -->
                <div style="width: 280px">
                  <h4 class="demo-label">自定义渲染的选择器（非 Neumorphism 样式）</h4>
                  <div
                    class="headless-select"
                    :class="{ 'headless-select--open': hsOpen }"
                    tabindex="0"
                    role="combobox"
                    :aria-expanded="hsOpen"
                    @click="hsToggle"
                    @keydown="hsKeydown"
                    @blur="onHsBlur"
                  >
                    <span class="headless-select__value">
                      {{ hsSelected?.label || '请选择...' }}
                    </span>
                    <span class="headless-select__arrow">▼</span>
                    <div v-if="hsOpen" class="headless-select__dropdown" role="listbox">
                      <div
                        v-for="opt in headlessSelectOptions"
                        :key="opt.value"
                        class="headless-select__option"
                        :class="{
                          'headless-select__option--selected': opt.value === headlessSelectValue,
                          'headless-select__option--disabled': opt.disabled,
                        }"
                        role="option"
                        :aria-selected="opt.value === headlessSelectValue"
                        @click.stop="hsSelect(opt)"
                      >
                        <span v-if="opt.value === headlessSelectValue" class="headless-select__dot"
                          >●</span
                        >
                        {{ opt.label }}
                      </div>
                    </div>
                  </div>
                  <p class="demo-hint">
                    已选：<strong>{{ headlessSelectValue }}</strong> — 完全自定义的 UI，键盘操作完整
                  </p>
                </div>

                <!-- 对比：标准 NeumorphismSelect -->
                <div style="width: 260px">
                  <h4 class="demo-label">标准 NeumorphismSelect（同逻辑）</h4>
                  <NeumorphismSelect
                    v-model="headlessSelectValue"
                    :options="headlessSelectOptions"
                    placeholder="请选择..."
                  />
                  <p class="demo-hint">同一套 useSelect 逻辑驱动</p>
                </div>

                <!-- 代码示意 -->
                <div style="flex: 1; min-width: 280px">
                  <h4 class="demo-label">使用方式</h4>
                  <pre class="code-block"><code>import { useSelect } from '@echolab-auto/ui-frame'

const { isOpen, selectedOption, toggleOpen,
  selectOption, handleKeydown } = useSelect({
  modelValue: myValue,
  options: myOptions,
})

// 用你自己的 UI 渲染！
// &lt;div @click="toggleOpen" @keydown="handleKeydown"&gt;
//   &lt;span&gt;{{ selectedOption?.label }}&lt;/span&gt;
//   &lt;div v-if="isOpen"&gt;...options...&lt;/div&gt;
// &lt;/div&gt;</code></pre>
                </div>
              </div>
            </NeumorphismCard>

            <!-- ===== Headless Pagination Demo ===== -->
            <NeumorphismCard id="headless-pagination" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Headless 分页 — 用 usePagination 构建自定义分页器</h3>
                  <span class="demo-badge">页码计算 + 省略号逻辑完全复用</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <!-- 自定义分页 UI -->
                <div>
                  <h4 class="demo-label">自定义简洁分页器</h4>
                  <div class="headless-pagination">
                    <button
                      class="headless-pagination__btn"
                      :disabled="hsPrevDisabled"
                      @click="hsPrevPage"
                    >
                      ← 上一页
                    </button>

                    <button
                      v-for="p in hsVisiblePages"
                      :key="String(p)"
                      class="headless-pagination__btn"
                      :class="{
                        'headless-pagination__btn--active': p === hsCurrentPage,
                        'headless-pagination__btn--dots': typeof p === 'string',
                      }"
                      :disabled="typeof p === 'string'"
                      @click="typeof p === 'number' && hsChangePage(p)"
                    >
                      {{ typeof p === 'string' ? '…' : p }}
                    </button>

                    <button
                      class="headless-pagination__btn"
                      :disabled="hsNextDisabled"
                      @click="hsNextPage"
                    >
                      下一页 →
                    </button>
                  </div>
                  <p class="demo-hint">
                    当前第 <strong>{{ hsCurrentPage }}</strong> / {{ hsTotalPages }} 页
                  </p>
                </div>

                <!-- 代码示意 -->
                <div style="flex: 1; min-width: 260px">
                  <h4 class="demo-label">使用方式</h4>
                  <pre
                    class="code-block"
                  ><code>import { usePagination } from '@echolab-auto/ui-frame'

const {
  currentPage, totalPages, visiblePages,
  changePage, prevPage, nextPage,
  isPrevDisabled, isNextDisabled,
} = usePagination({
  modelValue: page,
  total: computed(() => 100),
  pageSize: computed(() => 10),
})

// 完全自定义 UI，省略号逻辑自动处理</code></pre>
                </div>
              </div>
            </NeumorphismCard>

            <!-- ===== Headless Toast Demo ===== -->
            <NeumorphismCard id="headless-toast" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Headless Toast — 用 useToast 管理通知队列</h3>
                  <span class="demo-badge">队列管理 + 自动关闭 + 完全自定义外观</span>
                </div>
              </template>

              <div class="demo-row" style="margin-bottom: 14px">
                <NeumorphismButton size="small" variant="flat" @click="showHeadlessToast('success')"
                  >成功</NeumorphismButton
                >
                <NeumorphismButton size="small" variant="flat" @click="showHeadlessToast('error')"
                  >错误</NeumorphismButton
                >
                <NeumorphismButton size="small" variant="flat" @click="showHeadlessToast('info')"
                  >信息</NeumorphismButton
                >
                <NeumorphismButton size="small" variant="flat" @click="showHeadlessToast('warning')"
                  >警告</NeumorphismButton
                >
              </div>

              <!-- 自定义 Toast 渲染 -->
              <div class="headless-toast-area">
                <transition-group name="headless-toast">
                  <div
                    v-for="toast in hsToasts"
                    :key="toast.id"
                    class="headless-toast"
                    :class="[
                      `headless-toast--${toast.type}`,
                      { 'headless-toast--leaving': toast.leaving },
                    ]"
                  >
                    <span class="headless-toast__emoji">
                      {{
                        toast.type === 'success'
                          ? '✅'
                          : toast.type === 'error'
                            ? '❌'
                            : toast.type === 'warning'
                              ? '⚠️'
                              : 'ℹ️'
                      }}
                    </span>
                    <span class="headless-toast__msg">{{ toast.message }}</span>
                    <button class="headless-toast__close" @click="hsRemoveToast(toast.id)">
                      ✕
                    </button>
                  </div>
                </transition-group>
              </div>

              <pre
                class="code-block"
                style="margin-top: 14px"
              ><code>import { useToast } from '@echolab-auto/ui-frame'

const { toasts, addToast, removeToast } = useToast({ maxCount: 5 })

addToast({ message: '已保存!', type: 'success', duration: 3000 })

// 完全自定义 Toast 外观 — emoji、颜色、动画都由你决定</code></pre>
            </NeumorphismCard>

            <!-- ===== Named Slot Demo ===== -->
            <NeumorphismCard id="slot-demo" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">Slot 自定义 — 替换组件内部视觉元素</h3>
                  <span class="demo-badge">#option · #tab · #page-item · #node-label</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <!-- Select with custom option slots -->
                <div style="width: 280px">
                  <h4 class="demo-label">Select #option 插槽：图标 + 描述</h4>
                  <NeumorphismSelect
                    v-model="headlessSelectValue"
                    :options="headlessSelectOptions"
                    placeholder="选择框架..."
                  >
                    <template #option="{ option, selected }">
                      <div style="display: flex; align-items: center; gap: 10px; width: 100%">
                        <span style="font-size: 18px">
                          {{
                            option.value === 'vue'
                              ? '💚'
                              : option.value === 'react'
                                ? '💙'
                                : option.value === 'angular'
                                  ? '❤️'
                                  : option.value === 'svelte'
                                    ? '🧡'
                                    : '💜'
                          }}
                        </span>
                        <span :style="{ fontWeight: selected ? 600 : 400 }">{{
                          option.label
                        }}</span>
                        <span v-if="selected" style="margin-left: auto">✓</span>
                      </div>
                    </template>
                  </NeumorphismSelect>
                </div>

                <!-- Pagination with custom page items -->
                <div>
                  <h4 class="demo-label">分页 #page-item 插槽：圆形按钮</h4>
                  <NeumorphismPagination v-model="headlessPage" :total="60" :page-size="10">
                    <template #page-item="{ page, active }">
                      <button
                        v-if="typeof page === 'number'"
                        class="headless-pagination__btn"
                        :class="{ 'headless-pagination__btn--active': active }"
                        :style="{
                          borderRadius: '50%',
                          minWidth: '36px',
                          width: '36px',
                          height: '36px',
                          padding: 0,
                        }"
                        @click="hsChangePage(page)"
                      >
                        {{ page }}
                      </button>
                      <span v-else style="padding: 0 4px; color: var(--nm-text-placeholder)"
                        >…</span
                      >
                    </template>
                  </NeumorphismPagination>
                </div>

                <!-- Tree with custom node labels -->
                <div style="width: 260px">
                  <h4 class="demo-label">Tree #node-label 插槽</h4>
                  <NeumorphismCard :elevation="-1" style="padding: 12px">
                    <NeumorphismTree
                      v-model:selected-keys="treeSelectedKeys"
                      v-model:expanded-keys="treeExpandedKeys"
                      :data="treeData.slice(0, 2)"
                      :multiple="false"
                    >
                      <!-- Node slot is handled by NeumorphismTreeNode internally -->
                    </NeumorphismTree>
                  </NeumorphismCard>
                </div>
              </div>
            </NeumorphismCard>

            <!-- ===== Global Config Demo ===== -->
            <NeumorphismCard id="config-demo" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">全局配置 — 一键修改所有组件默认值</h3>
                  <span class="demo-badge">app.use(NeumorphismUI, options)</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 32px; align-items: flex-start; flex-wrap: wrap">
                <div style="flex: 1; min-width: 300px">
                  <h4 class="demo-label">配置示例（examples/main.ts）</h4>
                  <pre class="code-block"><code>app.use(NeumorphismUI, {
  button: { size: 'medium' },
  input: { size: 'medium' },
  select: { size: 'medium', clearable: true },
  modal: { maskClosable: true },
  toast: { position: 'top-right', maxCount: 5 },
  pagination: { showTotal: false },
})</code></pre>
                  <p class="demo-hint" style="margin-top: 10px">
                    所有通过 <code>app.use</code> 传入的配置将作为全局默认值。组件自身的 props
                    仍可覆盖。
                  </p>
                </div>

                <div style="flex: 1; min-width: 280px">
                  <h4 class="demo-label">CSS 设计 Token 覆盖示例</h4>
                  <pre class="code-block"><code>/* 在项目中覆盖任意 Token */
:root {
  --nm-button-padding-y-md: 16px;
  --nm-button-font-md: 16px;
  --nm-border-radius-md: 20px;
  --nm-modal-max-width-md: 640px;
  --nm-toast-min-width: 320px;
  --nm-pagination-btn-height-md: 44px;
}</code></pre>
                  <p class="demo-hint" style="margin-top: 10px">
                    120+ CSS 自定义属性覆盖组件每个尺寸细节，无需修改组件源码。
                  </p>
                </div>
              </div>

              <div style="margin-top: 20px">
                <h4 class="demo-label">Headless Composables 完整导出列表</h4>
                <div class="headless-export-grid">
                  <code
                    v-for="name in [
                      'useSelect',
                      'useTabs',
                      'usePagination',
                      'useTree',
                      'useCollapse',
                      'useModal',
                      'useToast',
                      'useTooltip',
                      'useTouchDevice',
                      'useCheckable',
                      'useFormField',
                      'validateFieldValue',
                    ]"
                    :key="name"
                    class="headless-export-tag"
                    >{{ name }}</code
                  >
                </div>
              </div>
            </NeumorphismCard>
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
            <NeumorphismCard id="buttons" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismButton 按钮</h3>
                  <span class="demo-badge">3 变体 · 3 尺寸 · 3 形状</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">变体类型</h4>
                <div class="demo-row">
                  <NeumorphismButton variant="raised">凸起</NeumorphismButton>
                  <NeumorphismButton variant="flat">扁平</NeumorphismButton>
                  <NeumorphismButton variant="pressed">凹陷</NeumorphismButton>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸与形状</h4>
                <div class="demo-row">
                  <NeumorphismButton size="small">小</NeumorphismButton>
                  <NeumorphismButton size="medium">中</NeumorphismButton>
                  <NeumorphismButton size="large">大</NeumorphismButton>
                  <NeumorphismDivider direction="vertical" />
                  <NeumorphismButton shape="rounded">圆角</NeumorphismButton>
                  <NeumorphismButton shape="pill">胶囊</NeumorphismButton>
                  <NeumorphismButton shape="circle" size="medium" aria-label="添加"
                    >+</NeumorphismButton
                  >
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">加载与禁用</h4>
                <div class="demo-row">
                  <NeumorphismButton loading>加载中...</NeumorphismButton>
                  <NeumorphismButton disabled>已禁用</NeumorphismButton>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 开关 -->
            <NeumorphismCard id="switch" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismSwitch 开关</h3>
                  <span class="demo-badge">3 尺寸 · 文本标签</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">尺寸</h4>
                <div class="demo-row demo-row--stacked">
                  <div class="demo-row">
                    <NeumorphismSwitch v-model="switch1" size="small" />
                    <code>small</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismSwitch v-model="switch1" size="medium" />
                    <code>medium</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismSwitch v-model="switch1" size="large" />
                    <code>large</code>
                  </div>
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
            </NeumorphismCard>

            <!-- 复选框 -->
            <NeumorphismCard id="checkbox" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismCheckbox 复选框</h3>
                  <span class="demo-badge">半选 · 3 尺寸</span>
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
                <h4 class="demo-label">尺寸与禁用</h4>
                <div class="demo-row">
                  <NeumorphismCheckbox v-model="checkbox1" label="小" size="small" />
                  <NeumorphismCheckbox v-model="checkbox1" label="中" size="medium" />
                  <NeumorphismCheckbox v-model="checkbox1" label="大" size="large" />
                  <NeumorphismCheckbox :model-value="true" label="已选中禁用" disabled />
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
                <h4 class="demo-label">垂直排列 · 小尺寸</h4>
                <NeumorphismRadioGroup v-model="radio2" direction="vertical" size="small">
                  <NeumorphismRadio value="small" label="小" />
                  <NeumorphismRadio value="medium" label="中" />
                  <NeumorphismRadio value="large" label="大" />
                </NeumorphismRadioGroup>
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
                <h4 class="demo-label">尺寸</h4>
                <div class="demo-row demo-row--stacked form-demo-width">
                  <NeumorphismInput v-model="inputName" size="small" placeholder="小尺寸输入框" />
                  <NeumorphismInput v-model="inputName" size="medium" placeholder="中尺寸输入框" />
                  <NeumorphismInput v-model="inputName" size="large" placeholder="大尺寸输入框" />
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
                  <span class="demo-badge">键盘导航 · 可清空 · ARIA</span>
                </div>
              </template>

              <div class="demo-row" style="gap: 24px; flex-wrap: wrap; align-items: flex-start">
                <div style="width: 260px">
                  <h4 class="demo-label">基本选择器</h4>
                  <NeumorphismSelect
                    v-model="select1"
                    :options="selectOptions"
                    placeholder="请选择框架"
                  />
                  <p class="demo-hint">
                    已选：<strong>{{ select1 || '无' }}</strong>
                  </p>
                </div>
                <div style="width: 260px">
                  <h4 class="demo-label">带标签、可清空</h4>
                  <NeumorphismSelect
                    v-model="select2"
                    :options="selectOptions"
                    label="框架"
                    placeholder="请选择..."
                    :clearable="true"
                  />
                </div>
                <div style="width: 260px">
                  <h4 class="demo-label">禁用与错误</h4>
                  <div class="demo-row demo-row--stacked" style="gap: 12px">
                    <NeumorphismSelect
                      :options="selectOptions"
                      placeholder="已禁用"
                      :disabled="true"
                    />
                    <NeumorphismSelect
                      :options="selectOptions"
                      label="必填字段"
                      placeholder="请选择..."
                      error="此字段为必填项"
                    />
                  </div>
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
                    <NeumorphismButton type="button" variant="flat" @click="formRef?.clearErrors()"
                      >清除错误</NeumorphismButton
                    >
                  </div>
                </NeumorphismForm>
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
                  <span class="demo-badge">统一台阶高度模型 · 膨胀/下沉悬停</span>
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
            </NeumorphismCard>

            <!-- 头像 -->
            <NeumorphismCard id="avatar" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismAvatar 头像</h3>
                  <span class="demo-badge">图片 · 首字母回退 · 3 尺寸</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">尺寸与形状</h4>
                <div class="demo-row">
                  <NeumorphismAvatar initials="JD" size="small" />
                  <NeumorphismAvatar initials="JD" size="medium" />
                  <NeumorphismAvatar initials="JD" size="large" />
                  <NeumorphismAvatar initials="JD" size="medium" shape="rounded" />
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
                <h4 class="demo-label">可关闭与尺寸</h4>
                <div class="demo-row">
                  <NeumorphismTag
                    v-if="tagVisible"
                    variant="primary"
                    :closable="true"
                    @close="tagVisible = false"
                    >可关闭</NeumorphismTag
                  >
                  <NeumorphismTag variant="success" size="small">小</NeumorphismTag>
                  <NeumorphismTag variant="warning" size="large">大</NeumorphismTag>
                  <NeumorphismTag variant="error" rounded>圆角</NeumorphismTag>
                </div>
              </div>
            </NeumorphismCard>

            <!-- 进度条 -->
            <NeumorphismCard id="progress" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismProgress 进度条</h3>
                  <span class="demo-badge">不确定 · 条纹 · 标签</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">颜色变体与标签</h4>
                <div class="demo-row demo-row--stacked form-demo-width" style="gap: 14px">
                  <NeumorphismProgress
                    :model-value="progressVal"
                    variant="primary"
                    :show-label="true"
                  />
                  <NeumorphismProgress :model-value="progressVal" variant="success" />
                  <NeumorphismProgress :model-value="progressVal" variant="warning" />
                  <NeumorphismProgress
                    :model-value="progressVal"
                    variant="error"
                    :show-label="true"
                  />
                </div>
                <div class="demo-row" style="margin-top: 12px">
                  <NeumorphismButton
                    size="small"
                    variant="flat"
                    @click="progressVal = Math.max(0, progressVal - 10)"
                    >-10%</NeumorphismButton
                  >
                  <NeumorphismButton
                    size="small"
                    variant="flat"
                    @click="progressVal = Math.min(100, progressVal + 10)"
                    >+10%</NeumorphismButton
                  >
                  <NeumorphismButton
                    size="small"
                    variant="flat"
                    @click="indeterminate = !indeterminate"
                  >
                    {{ indeterminate ? '停止' : '不确定模式' }}
                  </NeumorphismButton>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">不确定模式与尺寸</h4>
                <div class="demo-row demo-row--stacked form-demo-width" style="gap: 14px">
                  <NeumorphismProgress
                    v-if="indeterminate"
                    :indeterminate="true"
                    variant="primary"
                  />
                  <NeumorphismProgress :model-value="progressVal" size="small" />
                  <NeumorphismProgress :model-value="progressVal" size="medium" />
                  <NeumorphismProgress :model-value="progressVal" size="large" />
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
                <NeumorphismButton
                  size="small"
                  variant="flat"
                  @click="skeletonLoading = !skeletonLoading"
                >
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
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：导航                                       -->
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
                  <span class="demo-badge">省略号 · 总数 · 跳转 · 3 尺寸</span>
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
                <h4 class="demo-label">尺寸</h4>
                <div class="demo-row demo-row--stacked" style="gap: 14px">
                  <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="small" />
                  <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="medium" />
                  <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="large" />
                </div>
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

            <!-- 消息提示 -->
            <NeumorphismCard id="toast" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismToast 消息提示</h3>
                  <span class="demo-badge">4 类型 · 6 位置 · 自动关闭</span>
                </div>
              </template>

              <div class="demo-row">
                <NeumorphismButton variant="flat" @click="showToast('info')"
                  >信息</NeumorphismButton
                >
                <NeumorphismButton variant="flat" @click="showToast('success')"
                  >成功</NeumorphismButton
                >
                <NeumorphismButton variant="flat" @click="showToast('warning')"
                  >警告</NeumorphismButton
                >
                <NeumorphismButton variant="flat" @click="showToast('error')"
                  >错误</NeumorphismButton
                >
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
                  <NeumorphismButton variant="flat" size="small">点击触发</NeumorphismButton>
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
                  variant="flat"
                  @click="collapseActive = collapseActive.length ? [] : ['item1', 'item2']"
                >
                  {{ collapseActive.length ? '全部折叠' : '全部展开' }}
                </NeumorphismButton>
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
                <NeumorphismLayout show-header show-sider :sider-width="200" collapsible>
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
                <h4 class="demo-label">尺寸</h4>
                <div class="demo-row demo-row--stacked">
                  <div class="demo-row">
                    <NeumorphismThemeToggle v-model="themeToggleValue" size="small" />
                    <code>small</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismThemeToggle v-model="themeToggleValue" size="medium" />
                    <code>medium</code>
                  </div>
                  <div class="demo-row">
                    <NeumorphismThemeToggle v-model="themeToggleValue" size="large" />
                    <code>large</code>
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

                <div style="flex: 1; min-width: 280px; max-width: 400px">
                  <h4 class="demo-label">数据结构预览</h4>
                  <pre
                    style="
                      font-size: 11px;
                      color: var(--nm-text-secondary);
                      background: var(--nm-surface-color);
                      padding: 12px;
                      border-radius: var(--nm-border-radius-sm);
                      box-shadow:
                        inset 2px 2px 4px var(--nm-shadow-dark-strong),
                        inset -2px -2px 4px var(--nm-shadow-light-strong);
                      line-height: 1.7;
                      margin: 0;
                      overflow-x: auto;
                    "
                    >{{ JSON.stringify(treeData, null, 2) }}</pre
                  >
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
                  <span class="demo-badge">网格背景 · 缩放控制 · SVG 流程图</span>
                </div>
              </template>

              <div class="demo-block">
                <h4 class="demo-label">SVG 流程图示例（缩放与网格可切换）</h4>
                <div class="demo-row" style="margin-bottom: 10px">
                  <NeumorphismButton
                    size="small"
                    variant="flat"
                    @click="canvasShowGrid = !canvasShowGrid"
                  >
                    {{ canvasShowGrid ? '隐藏网格' : '显示网格' }}
                  </NeumorphismButton>
                  <NeumorphismButton size="small" variant="flat" @click="canvasZoom = 1">
                    重置缩放
                  </NeumorphismButton>
                </div>

                <NeumorphismCanvas
                  v-model="canvasZoom"
                  :show-grid="canvasShowGrid"
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

// ---- Root ----
.showcase {
  min-height: 100vh;
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
  padding: 24px 20px 64px;

  @include nm-screen-sm {
    padding: 28px 28px 64px;
  }

  @include nm-screen-lg {
    padding: 36px 40px 72px;
  }

  @media (min-width: 1600px) {
    padding: 40px 56px 80px;
  }
}

// ---- Hero ----
.hero {
  padding: 12px 0 24px;

  @include nm-screen-lg {
    padding: 20px 0 28px;
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

.form-demo-width {
  max-width: 420px;
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

// ==========================================
// Headless Composables Demo Styles
// ==========================================

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

// ---- Headless Select (custom UI demo) ----
.headless-select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border: 2px solid var(--nm-primary-color);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  outline: none;
  background: var(--nm-bg-color);
  color: var(--nm-text-primary);
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus {
    border-color: var(--nm-primary-light);
    box-shadow: 0 0 0 3px rgba(108, 122, 224, 0.25);
  }

  &--open {
    border-radius: 8px 8px 0 0;
    border-color: var(--nm-primary-light);
  }
}

.headless-select__value {
  flex: 1;
}

.headless-select__arrow {
  font-size: 10px;
  color: var(--nm-text-placeholder);
  transition: transform 0.2s;
  margin-left: 8px;

  .headless-select--open & {
    transform: rotate(180deg);
  }
}

.headless-select__dropdown {
  position: absolute;
  top: 100%;
  left: -2px;
  right: -2px;
  z-index: 100;
  background: var(--nm-bg-color);
  border: 2px solid var(--nm-primary-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.headless-select__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 14px;
  cursor: pointer;
  color: var(--nm-text-primary);
  transition: background 0.15s;

  &:hover:not(&--disabled) {
    background: var(--nm-surface-raised);
  }

  &--selected {
    color: var(--nm-primary-color);
    font-weight: 600;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.headless-select__dot {
  font-size: 8px;
}

// ---- Headless Pagination (custom UI demo) ----
.headless-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.headless-pagination__btn {
  padding: 6px 12px;
  border: 2px solid var(--nm-primary-color);
  border-radius: 6px;
  background: transparent;
  color: var(--nm-primary-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled):not(&--active):not(&--dots) {
    background: var(--nm-primary-color);
    color: #fff;
  }

  &--active {
    background: var(--nm-primary-color);
    color: #fff;
  }

  &--dots {
    border-color: transparent;
    cursor: default;
    color: var(--nm-text-placeholder);
    padding: 6px 4px;
  }

  &:disabled:not(&--dots) {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

// ---- Headless Toast (custom UI demo) ----
.headless-toast-area {
  position: relative;
  min-height: 60px;
}

.headless-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid;
  background: var(--nm-surface-color);
  box-shadow:
    2px 2px 8px var(--nm-shadow-dark),
    -2px -2px 8px var(--nm-shadow-light);

  &--success {
    border-color: var(--nm-color-success);
  }
  &--error {
    border-color: var(--nm-color-error);
  }
  &--warning {
    border-color: var(--nm-color-warning);
  }
  &--info {
    border-color: var(--nm-primary-color);
  }

  &--leaving {
    opacity: 0;
    transform: translateX(30px);
    transition: all 0.2s ease;
  }
}

.headless-toast__emoji {
  font-size: 16px;
  flex-shrink: 0;
}

.headless-toast__msg {
  flex: 1;
  font-size: 13px;
  color: var(--nm-text-primary);
}

.headless-toast__close {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;

  &:hover {
    color: var(--nm-text-primary);
  }
}

// Toast transition
.headless-toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.headless-toast-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  right: 0;
  left: 0;
}
.headless-toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.headless-toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

// ---- Headless export tags ----
.headless-export-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.headless-export-tag {
  display: inline-block;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--nm-primary-color);
  background: rgba(108, 122, 224, 0.08);
  border: 1px solid rgba(108, 122, 224, 0.2);
  border-radius: var(--nm-border-radius-sm);
  font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
}
</style>
