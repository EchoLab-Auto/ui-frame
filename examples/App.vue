<script setup lang="ts">
import { ref, computed } from 'vue'

// ---- 主题状态 ----
const isDark = ref(false)

// ---- 开关示例 ----
const switch1 = ref(false)
const switch2 = ref(true)

// ---- 复选框示例 ----
const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkboxIndeterminate = ref(true)
const checkboxGroup = ref<string[]>([])

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

const sizeOptions = [
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
const toastContainer = ref<InstanceType<typeof import('../src/components/NeumorphismToast/NeumorphismToastProvider.vue')['default']>>()
let toastCounter = 0
function showToast(type: string) {
  toastCounter++
  toastContainer.value?.addToast({
    message: `${type} 通知 #${toastCounter} — 新拟态设计真漂亮！`,
    type: type as any,
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
</script>

<template>
  <div class="showcase" :data-theme="isDark ? 'dark' : undefined">
    <!-- ===== HEADER ===== -->
    <header class="showcase-header">
      <h1 class="showcase-title">@echolab/ui-frame</h1>
      <p class="showcase-subtitle">Vue 3 新拟态 UI 组件库 — 共 {{ 27 }} 个组件</p>
      <div class="showcase-theme-row">
        <NeumorphismSwitch v-model="isDark" size="medium" />
        <span class="showcase-theme-label">{{ isDark ? '暗色' : '亮色' }}</span>
      </div>
    </header>

    <!-- ===== 侧边导航 ===== -->
    <nav class="showcase-nav" aria-label="组件导航">
      <a href="#buttons">按钮</a>
      <a href="#switch">开关</a>
      <a href="#checkbox">复选框</a>
      <a href="#radio">单选框</a>
      <a href="#input">输入框</a>
      <a href="#textarea">文本域</a>
      <a href="#select">选择器</a>
      <a href="#form">表单</a>
      <a href="#card">卡片</a>
      <a href="#modal">模态框</a>
      <a href="#toast">消息提示</a>
      <a href="#tooltip">文字提示</a>
      <a href="#tabs">选项卡</a>
      <a href="#breadcrumb">面包屑</a>
      <a href="#pagination">分页</a>
      <a href="#collapse">折叠面板</a>
      <a href="#avatar">头像</a>
      <a href="#badge">徽标</a>
      <a href="#tag">标签</a>
      <a href="#progress">进度条</a>
      <a href="#skeleton">骨架屏</a>
      <a href="#divider">分割线</a>
      <a href="#container">容器</a>
      <a href="#grid">栅格</a>
      <a href="#layout">布局</a>
    </nav>

    <!-- ======================================================= -->
    <!-- 按钮 -->
    <!-- ======================================================= -->
    <section id="buttons" class="showcase-section">
      <h2 class="section-title">NeumorphismButton 按钮</h2>
      <p class="section-desc">柔和阴影按钮，支持凸起/扁平/凹陷三种变体、三种尺寸和加载状态。</p>

      <div class="subsection">
        <h3 class="subsection-title">变体类型</h3>
        <div class="demo-row">
          <NeumorphismButton variant="raised">凸起</NeumorphismButton>
          <NeumorphismButton variant="flat">扁平</NeumorphismButton>
          <NeumorphismButton variant="pressed">凹陷</NeumorphismButton>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">尺寸与形状</h3>
        <div class="demo-row">
          <NeumorphismButton size="small">小</NeumorphismButton>
          <NeumorphismButton size="medium">中</NeumorphismButton>
          <NeumorphismButton size="large">大</NeumorphismButton>
          <NeumorphismDivider direction="vertical" />
          <NeumorphismButton shape="rounded">圆角</NeumorphismButton>
          <NeumorphismButton shape="pill">胶囊</NeumorphismButton>
          <NeumorphismButton shape="circle" size="medium" aria-label="添加">+</NeumorphismButton>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">加载与禁用</h3>
        <div class="demo-row">
          <NeumorphismButton loading>加载中...</NeumorphismButton>
          <NeumorphismButton disabled>已禁用</NeumorphismButton>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 开关 -->
    <!-- ======================================================= -->
    <section id="switch" class="showcase-section">
      <h2 class="section-title">NeumorphismSwitch 开关</h2>
      <p class="section-desc">带太阳/月亮图标的切换开关，交叉淡入淡出动画，临界阻尼运动曲线。</p>

      <div class="subsection">
        <h3 class="subsection-title">尺寸</h3>
        <div class="demo-row demo-row--vertical">
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

      <div class="subsection">
        <h3 class="subsection-title">文本标签与禁用</h3>
        <div class="demo-row">
          <NeumorphismSwitch v-model="switch2" active-text="开" inactive-text="关" />
          <NeumorphismSwitch :model-value="true" disabled />
          <NeumorphismSwitch :model-value="false" disabled />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 复选框 -->
    <!-- ======================================================= -->
    <section id="checkbox" class="showcase-section">
      <h2 class="section-title">NeumorphismCheckbox 复选框</h2>
      <p class="section-desc">凹陷风格的复选框，带勾选 SVG 图标，支持半选状态和三种尺寸。</p>

      <div class="subsection">
        <h3 class="subsection-title">基本与半选状态</h3>
        <div class="demo-row">
          <NeumorphismCheckbox v-model="checkbox1" label="未选中" />
          <NeumorphismCheckbox v-model="checkbox2" label="已选中" />
          <NeumorphismCheckbox v-model="checkboxIndeterminate" :indeterminate="true" label="半选状态" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">尺寸</h3>
        <div class="demo-row">
          <NeumorphismCheckbox v-model="checkbox1" label="小" size="small" />
          <NeumorphismCheckbox v-model="checkbox1" label="中" size="medium" />
          <NeumorphismCheckbox v-model="checkbox1" label="大" size="large" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">禁用状态</h3>
        <div class="demo-row">
          <NeumorphismCheckbox :model-value="true" label="已选中禁用" disabled />
          <NeumorphismCheckbox :model-value="false" label="未选中禁用" disabled />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 单选框 -->
    <!-- ======================================================= -->
    <section id="radio" class="showcase-section">
      <h2 class="section-title">NeumorphismRadio 单选框</h2>
      <p class="section-desc">单选框，带弹簧缩放的圆点动画，RadioGroup 统一管理状态。</p>

      <div class="subsection">
        <h3 class="subsection-title">RadioGroup（水平排列）</h3>
        <NeumorphismRadioGroup v-model="radio1" direction="horizontal">
          <NeumorphismRadio value="a" label="选项 A" />
          <NeumorphismRadio value="b" label="选项 B" />
          <NeumorphismRadio value="c" label="选项 C（已禁用）" :disabled="true" />
        </NeumorphismRadioGroup>
        <p style="margin-top: 8px; color: var(--nm-text-secondary); font-size: 13px;">
          已选：<strong>{{ radio1 }}</strong>
        </p>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">RadioGroup（垂直排列）、尺寸</h3>
        <NeumorphismRadioGroup v-model="radio2" direction="vertical" size="small">
          <NeumorphismRadio value="small" label="小" />
          <NeumorphismRadio value="medium" label="中" />
          <NeumorphismRadio value="large" label="大" />
        </NeumorphismRadioGroup>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 输入框 -->
    <!-- ======================================================= -->
    <section id="input" class="showcase-section">
      <h2 class="section-title">NeumorphismInput 输入框</h2>
      <p class="section-desc">带凹陷阴影的文字输入框，支持聚焦发光环、错误状态和前缀/后缀插槽。</p>

      <div class="subsection">
        <h3 class="subsection-title">尺寸</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput v-model="inputName" size="small" placeholder="小尺寸输入框" />
          <NeumorphismInput v-model="inputName" size="medium" placeholder="中尺寸输入框" />
          <NeumorphismInput v-model="inputName" size="large" placeholder="大尺寸输入框" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">标签、前缀与后缀</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput v-model="inputName" label="用户名" placeholder="请输入用户名" :required="true" />
          <NeumorphismInput v-model="inputEmail" placeholder="搜索...">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </template>
            <template #suffix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            </template>
          </NeumorphismInput>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">错误、禁用与只读</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput placeholder="错误状态" error="请输入有效的邮箱地址" />
          <NeumorphismInput model-value="禁用的输入框" disabled />
          <NeumorphismInput model-value="只读的内容" readonly />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 文本域 -->
    <!-- ======================================================= -->
    <section id="textarea" class="showcase-section">
      <h2 class="section-title">NeumorphismTextarea 文本域</h2>
      <p class="section-desc">多行文本输入区域，支持字数统计、自动调整高度和错误状态。</p>

      <div class="demo-row demo-row--vertical form-demo-width">
        <NeumorphismTextarea
          v-model="textareaValue"
          label="项目描述"
          placeholder="请描述您的项目..."
          :maxlength="200"
          :rows="3"
          :show-count="true"
        />
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 选择器 -->
    <!-- ======================================================= -->
    <section id="select" class="showcase-section">
      <h2 class="section-title">NeumorphismSelect 选择器</h2>
      <p class="section-desc">下拉选择器，支持键盘导航（方向键/Home/End/Esc），可清空，带错误状态。</p>

      <div class="demo-row" style="gap: 24px; flex-wrap: wrap;">
        <div style="width: 280px;">
          <h3 class="subsection-title">基本选择器</h3>
          <NeumorphismSelect
            v-model="select1"
            :options="selectOptions"
            placeholder="请选择框架"
          />
          <p style="margin-top: 8px; font-size: 13px; color: var(--nm-text-secondary);">
            已选：<strong>{{ select1 || '无' }}</strong>
          </p>
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">带标签、可清空</h3>
          <NeumorphismSelect
            v-model="select2"
            :options="selectOptions"
            label="框架"
            placeholder="请选择..."
            :clearable="true"
          />
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">禁用</h3>
          <NeumorphismSelect
            :options="selectOptions"
            placeholder="已禁用"
            :disabled="true"
          />
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">错误状态</h3>
          <NeumorphismSelect
            :options="selectOptions"
            label="必填字段"
            placeholder="请选择..."
            error="此字段为必填项"
          />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 表单 -->
    <!-- ======================================================= -->
    <section id="form" class="showcase-section">
      <h2 class="section-title">NeumorphismForm 表单与 FormItem</h2>
      <p class="section-desc">表单容器，内置验证规则（必填、正则、最小长度、自定义校验器）。</p>

      <NeumorphismCard :elevation="2" style="max-width: 480px;">
        <NeumorphismForm ref="formRef" :model="formModel" :rules="formRules" @submit="handleFormSubmit">
          <NeumorphismFormItem label="用户名" name="username" :required="true" :rules="formRules.username">
            <NeumorphismInput v-model="formModel.username" placeholder="至少 3 个字符" />
          </NeumorphismFormItem>

          <NeumorphismFormItem label="邮箱" name="email" :required="true" :rules="formRules.email">
            <NeumorphismInput v-model="formModel.email" placeholder="例如 user@example.com" />
          </NeumorphismFormItem>

          <NeumorphismFormItem label="密码" name="password" :required="true" :rules="formRules.password">
            <NeumorphismInput v-model="formModel.password" type="password" placeholder="至少 6 个字符" />
          </NeumorphismFormItem>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
            <NeumorphismButton type="button" variant="flat" @click="formRef?.clearErrors()">清除错误</NeumorphismButton>
          </div>
        </NeumorphismForm>
      </NeumorphismCard>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 卡片 -->
    <!-- ======================================================= -->
    <section id="card" class="showcase-section">
      <h2 class="section-title">NeumorphismCard 卡片</h2>
      <p class="section-desc">统一台阶高度模型：elevation &gt; 0 = 凸起，&lt; 0 = 凹陷，悬停膨胀/下沉。</p>

      <div class="subsection">
        <h3 class="subsection-title">凸起（1 到 4 级）</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard v-for="e in 4" :key="e" :elevation="e" style="width: 160px">
            <strong>{{ e }}</strong>
          </NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">凹陷（-1 到 -4 级）</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard v-for="e in 4" :key="-e" :elevation="-e" style="width: 160px">
            <strong>{{ -e }}</strong>
          </NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">悬停膨胀（elevation += 2）</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard :elevation="1" hoverable="bulge" style="width: 160px">1 → 3</NeumorphismCard>
          <NeumorphismCard :elevation="-2" hoverable="bulge" style="width: 160px">-2 → 0</NeumorphismCard>
          <NeumorphismCard :elevation="0" hoverable="bulge" style="width: 160px">0 → 2</NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">带头部和底部</h3>
        <NeumorphismCard :elevation="2" style="max-width: 480px;">
          <template #header>
            <strong>卡片标题</strong>
          </template>
          <p>这是卡片的主要内容区域。您可以在这里放置任意组件或文字。</p>
          <template #footer>
            <span style="color: var(--nm-text-secondary); font-size: 12px;">底部信息 · 2024-01-01</span>
          </template>
        </NeumorphismCard>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 模态框 -->
    <!-- ======================================================= -->
    <section id="modal" class="showcase-section">
      <h2 class="section-title">NeumorphismModal 模态框</h2>
      <p class="section-desc">对话框，带背景模糊、焦点锁定、Esc 键关闭和缩放过渡动画。</p>

      <NeumorphismButton @click="modalVisible = true">打开模态框</NeumorphismButton>

      <NeumorphismModal v-model="modalVisible" title="示例模态框" size="small" @confirm="showToast('success')" @cancel="showToast('info')">
        <p>这是一个新拟态风格的模态对话框。</p>
        <p>它支持焦点锁定、按 Esc 键关闭和背景模糊效果。</p>
        <div style="margin-top: 12px;">
          <NeumorphismInput placeholder="在模态框中输入内容..." />
        </div>
      </NeumorphismModal>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 消息提示 -->
    <!-- ======================================================= -->
    <section id="toast" class="showcase-section">
      <h2 class="section-title">NeumorphismToast 消息提示</h2>
      <p class="section-desc">层叠式消息通知，带进出场过渡动画，可通过 prop 设置位置。</p>

      <div class="demo-row">
        <NeumorphismButton variant="flat" @click="showToast('info')">信息</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('success')">成功</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('warning')">警告</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('error')">错误</NeumorphismButton>
      </div>

      <NeumorphismToastProvider ref="toastContainer" position="top-right" :max-count="5" />
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 文字提示 -->
    <!-- ======================================================= -->
    <section id="tooltip" class="showcase-section">
      <h2 class="section-title">NeumorphismTooltip 文字提示</h2>
      <p class="section-desc">文字提示气泡，支持悬停/点击/聚焦触发和四个方向（上/下/左/右）。</p>

      <div class="demo-row" style="padding: 32px 0;">
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
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 选项卡 -->
    <!-- ======================================================= -->
    <section id="tabs" class="showcase-section">
      <h2 class="section-title">NeumorphismTabs 选项卡</h2>
      <p class="section-desc">选项卡导航，新拟态风格的选中状态，支持键盘导航（方向键）和水平/垂直布局。</p>

      <div class="subsection">
        <h3 class="subsection-title">顶部位置（默认）</h3>
        <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="top" />
      </div>

      <div class="subsection">
        <h3 class="subsection-title">左侧位置</h3>
        <div style="max-width: 400px;">
          <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="left" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 面包屑 -->
    <!-- ======================================================= -->
    <section id="breadcrumb" class="showcase-section">
      <h2 class="section-title">NeumorphismBreadcrumb 面包屑</h2>
      <p class="section-desc">面包屑导航，支持链接和纯文本项，可自定义分隔符，具备 ARIA 无障碍标记。</p>

      <NeumorphismBreadcrumb :items="breadcrumbItems" separator="/" />
        <div style="margin-top: 12px;">
          <NeumorphismBreadcrumb :items="breadcrumbItems" separator=">" size="small" />
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 分页 -->
    <!-- ======================================================= -->
    <section id="pagination" class="showcase-section">
      <h2 class="section-title">NeumorphismPagination 分页</h2>
      <p class="section-desc">分页组件，支持省略号、总数显示、跳转输入和新拟态风格页码按钮。</p>

      <div class="subsection">
        <h3 class="subsection-title">基本（共 10 页）</h3>
        <NeumorphismPagination v-model="page" :total="100" :page-size="10" />
        <p style="margin-top: 8px; font-size: 13px; color: var(--nm-text-secondary);">
          当前页：<strong>{{ page }}</strong>
        </p>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">显示总数与跳转</h3>
        <NeumorphismPagination
          v-model="page2"
          :total="500"
          :page-size="20"
          :show-total="true"
          :show-jumper="true"
        />
      </div>

      <div class="subsection">
        <h3 class="subsection-title">尺寸</h3>
        <div class="demo-row demo-row--vertical" style="gap: 16px;">
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="small" />
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="medium" />
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="large" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 折叠面板 -->
    <!-- ======================================================= -->
    <section id="collapse" class="showcase-section">
      <h2 class="section-title">NeumorphismCollapse 折叠面板</h2>
      <p class="section-desc">手风琴式折叠面板，带弹簧般的展开动画、手风琴模式和键盘操作支持。</p>

      <NeumorphismCollapse v-model="collapseActive" :items="collapseItems">
        <template #item1>
          <p>新拟态（Soft UI）是一种设计风格，通过阴影和高光营造柔和、挤压般的塑料质感。元素看起来像是从背景中凸起或凹陷下去。</p>
        </template>
        <template #item2>
          <p>通过 <code>npm install @echolab/ui-frame</code> 安装，然后按需引入组件或使用 <code>app.use(NeumorphismUI)</code> 全局注册。</p>
        </template>
        <template #item3>
          <p>此项已被禁用。</p>
        </template>
      </NeumorphismCollapse>

      <div style="margin-top: 16px;">
        <NeumorphismButton size="small" variant="flat" @click="collapseActive = collapseActive.length ? [] : ['item1', 'item2']">
          {{ collapseActive.length ? '全部折叠' : '全部展开' }}
        </NeumorphismButton>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 头像 -->
    <!-- ======================================================= -->
    <section id="avatar" class="showcase-section">
      <h2 class="section-title">NeumorphismAvatar 头像</h2>
      <p class="section-desc">头像组件，支持图片或首字母回退、圆形/圆角形状和三种尺寸。</p>

      <div class="subsection">
        <h3 class="subsection-title">尺寸与形状</h3>
        <div class="demo-row">
          <NeumorphismAvatar initials="JD" size="small" />
          <NeumorphismAvatar initials="JD" size="medium" />
          <NeumorphismAvatar initials="JD" size="large" />
          <NeumorphismAvatar initials="JD" size="medium" shape="rounded" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">图片模式（加载失败时回退）</h3>
        <div class="demo-row">
          <NeumorphismAvatar src="https://i.pravatar.cc/64?img=1" alt="用户" size="medium" />
          <NeumorphismAvatar src="https://invalid.url/img.jpg" initials="ER" size="medium" alt="用户" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 徽标 -->
    <!-- ======================================================= -->
    <section id="badge" class="showcase-section">
      <h2 class="section-title">NeumorphismBadge 徽标</h2>
      <p class="section-desc">角标组件，用于显示数量或状态圆点，定位在子元素上方。</p>

      <div class="subsection">
        <h3 class="subsection-title">数字徽标与圆点</h3>
        <div class="demo-row" style="gap: 32px;">
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
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 标签 -->
    <!-- ======================================================= -->
    <section id="tag" class="showcase-section">
      <h2 class="section-title">NeumorphismTag 标签</h2>
      <p class="section-desc">标签/芯片组件，支持多种颜色变体和可选的关闭按钮。</p>

      <div class="subsection">
        <h3 class="subsection-title">颜色变体</h3>
        <div class="demo-row">
          <NeumorphismTag>默认</NeumorphismTag>
          <NeumorphismTag variant="primary">主要</NeumorphismTag>
          <NeumorphismTag variant="success">成功</NeumorphismTag>
          <NeumorphismTag variant="warning">警告</NeumorphismTag>
          <NeumorphismTag variant="error">错误</NeumorphismTag>
          <NeumorphismTag variant="info">信息</NeumorphismTag>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">可关闭与尺寸</h3>
        <div class="demo-row">
          <NeumorphismTag
            v-if="tagVisible"
            variant="primary"
            :closable="true"
            @close="tagVisible = false"
          >可关闭</NeumorphismTag>
          <NeumorphismTag variant="success" size="small">小</NeumorphismTag>
          <NeumorphismTag variant="warning" size="large">大</NeumorphismTag>
          <NeumorphismTag variant="error" rounded>圆角</NeumorphismTag>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 进度条 -->
    <!-- ======================================================= -->
    <section id="progress" class="showcase-section">
      <h2 class="section-title">NeumorphismProgress 进度条</h2>
      <p class="section-desc">进度条，支持多种颜色变体、标签显示、不确定模式、条纹样式和弹簧缓动。</p>

      <div class="subsection">
        <h3 class="subsection-title">颜色变体与标签</h3>
        <div class="demo-row demo-row--vertical form-demo-width" style="gap: 16px;">
          <NeumorphismProgress :model-value="progressVal" variant="primary" :show-label="true" />
          <NeumorphismProgress :model-value="progressVal" variant="success" />
          <NeumorphismProgress :model-value="progressVal" variant="warning" />
          <NeumorphismProgress :model-value="progressVal" variant="error" :show-label="true" />
        </div>
        <div class="demo-row" style="margin-top: 12px; gap: 12px;">
          <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.max(0, progressVal - 10)">-10%</NeumorphismButton>
          <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.min(100, progressVal + 10)">+10%</NeumorphismButton>
          <NeumorphismButton size="small" variant="flat" @click="indeterminate = !indeterminate">
            {{ indeterminate ? '停止' : '不确定模式' }}
          </NeumorphismButton>
        </div>
      </div>

      <div class="subsection" style="margin-top: 16px;">
        <h3 class="subsection-title">不确定模式与尺寸</h3>
        <div class="demo-row demo-row--vertical form-demo-width" style="gap: 16px;">
          <NeumorphismProgress v-if="indeterminate" :indeterminate="true" variant="primary" />
          <NeumorphismProgress :model-value="progressVal" size="small" />
          <NeumorphismProgress :model-value="progressVal" size="medium" />
          <NeumorphismProgress :model-value="progressVal" size="large" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 骨架屏 -->
    <!-- ======================================================= -->
    <section id="skeleton" class="showcase-section">
      <h2 class="section-title">NeumorphismSkeleton 骨架屏</h2>
      <p class="section-desc">骨架屏加载占位，支持文字/圆形/矩形变体和呼吸/波浪动画。</p>

      <div class="demo-row" style="gap: 12px;">
        <NeumorphismButton size="small" variant="flat" @click="skeletonLoading = !skeletonLoading">
          {{ skeletonLoading ? '隐藏骨架屏' : '显示骨架屏' }}
        </NeumorphismButton>
      </div>

      <div v-if="skeletonLoading" style="margin-top: 16px;">
        <div class="demo-row" style="align-items: center; gap: 16px; margin-bottom: 16px;">
          <NeumorphismSkeleton variant="circle" :width="44" :height="44" />
          <div style="flex: 1;">
            <NeumorphismSkeleton variant="text" width="60%" />
            <NeumorphismSkeleton variant="text" width="40%" />
          </div>
        </div>
        <NeumorphismSkeleton variant="rect" :height="120" animation="wave" style="margin-bottom: 12px;" />
        <NeumorphismSkeleton variant="text" />
        <NeumorphismSkeleton variant="text" />
        <NeumorphismSkeleton variant="text" width="80%" />
      </div>

      <NeumorphismCard v-else :elevation="1" style="max-width: 480px; margin-top: 16px;">
        <p><strong>内容已加载！</strong></p>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">此内容替代了上方的骨架屏占位。</p>
      </NeumorphismCard>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- 分割线 -->
    <!-- ======================================================= -->
    <section id="divider" class="showcase-section">
      <h2 class="section-title">NeumorphismDivider 分割线</h2>
      <p class="section-desc">水平或垂直分隔线，支持可选的文字内容和虚线样式。</p>

      <div class="subsection">
        <h3 class="subsection-title">水平方向（带文字）</h3>
        <NeumorphismDivider>分区 A</NeumorphismDivider>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">分割线之间的内容</p>
        <NeumorphismDivider align="left">居左对齐</NeumorphismDivider>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">内容</p>
        <NeumorphismDivider align="right" dashed>居右对齐（虚线）</NeumorphismDivider>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">垂直方向</h3>
        <div class="demo-row">
          <span>左侧</span>
          <NeumorphismDivider direction="vertical" />
          <span>中间</span>
          <NeumorphismDivider direction="vertical" dashed />
          <span>右侧</span>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- CONTAINER -->
    <!-- ======================================================= -->
    <section id="container" class="showcase-section">
      <h2 class="section-title">NeumorphismContainer 容器</h2>
      <p class="section-desc">响应式页面容器，fixed 模式根据断点限制最大宽度并居中，fluid 模式全宽。</p>

      <div class="subsection">
        <h3 class="subsection-title">Fixed 模式（默认）</h3>
        <div style="border: 1px dashed var(--nm-text-placeholder); border-radius: var(--nm-border-radius-md); overflow: hidden;">
          <NeumorphismCard :elevation="0" style="text-align: center; padding: 32px; border-radius: 0;">
            <p style="margin: 0; color: var(--nm-text-secondary);">内容自动居中，随断点变化最大宽度</p>
          </NeumorphismCard>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- GRID -->
    <!-- ======================================================= -->
    <section id="grid" class="showcase-section">
      <h2 class="section-title">NeumorphismRow / NeumorphismCol 栅格</h2>
      <p class="section-desc">24 栅格系统，支持 gutter 间距、flex 对齐和 6 个响应式断点。</p>

      <div class="subsection">
        <h3 class="subsection-title">基本栅格</h3>
        <NeumorphismRow :gutter="12">
          <NeumorphismCol v-for="i in 4" :key="i" :span="6">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:13px;color:var(--nm-text-secondary)">col-6</div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">混合栅格与偏移</h3>
        <NeumorphismRow :gutter="12">
          <NeumorphismCol :span="8">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:13px;color:var(--nm-text-secondary)">col-8</div>
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :span="8" :offset="8">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:13px;color:var(--nm-text-secondary)">col-8 offset-8</div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">响应式栅格（调整浏览器宽度查看效果）</h3>
        <NeumorphismRow :gutter="12">
          <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:12px;color:var(--nm-text-secondary)">
                手机:24 / 平板:8 / 桌面:6
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:12px;color:var(--nm-text-secondary)">
                手机:24 / 平板:8 / 桌面:6
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="12" :md="8" :lg="6">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:12px;color:var(--nm-text-secondary)">
                手机:24 / 平板:8 / 桌面:6
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="24" :md="0" :lg="6">
            <NeumorphismCard :elevation="1">
              <div style="text-align:center;padding:12px;font-size:12px;color:var(--nm-text-secondary)">
                手机:24 / 平板:隐藏 / 桌面:6
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- LAYOUT -->
    <!-- ======================================================= -->
    <section id="layout" class="showcase-section">
      <h2 class="section-title">NeumorphismLayout 页面布局</h2>
      <p class="section-desc">经典页面框架，支持 Header + Sider + Content + Footer 布局，移动端自动折叠侧边栏。</p>

      <div style="border: 1px solid rgba(128,128,128,0.1); border-radius: var(--nm-border-radius-lg); overflow: hidden; height: 400px;">
        <NeumorphismLayout show-header show-sider :sider-width="200" collapsible>
          <template #header-left>
            <strong style="font-size:15px">My App</strong>
          </template>

          <template #header-right>
            <NeumorphismAvatar initials="U" size="small" />
          </template>

          <template #sider="{ collapsed }">
            <div style="padding:12px">
              <p v-if="!collapsed" style="font-size:12px;color:var(--nm-text-secondary)">导航菜单</p>
              <p v-if="!collapsed" style="font-size:12px;color:var(--nm-text-placeholder);margin-left:12px">首页</p>
              <p v-if="!collapsed" style="font-size:12px;color:var(--nm-text-placeholder);margin-left:12px">组件</p>
              <p v-if="!collapsed" style="font-size:12px;color:var(--nm-text-placeholder);margin-left:12px">设置</p>
              <p v-else style="text-align:center">📋</p>
            </div>
          </template>

          <template #default>
            <div style="padding:24px">
              <h3 style="margin:0 0 8px;font-size:16px">欢迎使用新拟态 UI</h3>
              <p style="font-size:13px;color:var(--nm-text-secondary);margin:0">这是主内容区域，侧边栏可折叠，移动端自动变为抽屉式导航。</p>
            </div>
          </template>

          <template #footer>
            <span style="font-size:12px">© 2024 · MIT</span>
          </template>
        </NeumorphismLayout>
      </div>
    </section>

    <!-- ===== 页脚 ===== -->
    <footer class="showcase-footer">
      <NeumorphismDivider />
      <p>@echolab/ui-frame · MIT 许可证 · 共 {{ 27 }} 个组件</p>
      <p style="margin-top: 4px;">
        <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a> ·
        <a href="https://www.npmjs.com/package/@echolab/ui-frame" target="_blank">npm</a>
      </p>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '../src/styles/variables.scss' as *;

.showcase {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition: background-color var(--nm-transition-slow), color var(--nm-transition-slow);
}

// ---- Header ----
.showcase-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}

.showcase-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -1px;
}

.showcase-subtitle {
  font-size: 16px;
  color: var(--nm-text-secondary);
  margin: 0 0 20px;
}

.showcase-theme-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.showcase-theme-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-secondary);
}

// ---- Navigation ----
.showcase-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 48px;
  padding: 12px 16px;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(2px, 5px);

  a {
    padding: 4px 12px;
    font-size: 13px;
    color: var(--nm-text-secondary);
    text-decoration: none;
    border-radius: var(--nm-border-radius-sm);
    transition: all var(--nm-transition-fast);

    &:hover {
      color: var(--nm-primary-color);
      background-color: var(--nm-surface-raised);
    }
  }
}

// ---- Sections ----
.showcase-section {
  margin-bottom: 20px;
  scroll-margin-top: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
}

.section-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.subsection {
  margin-bottom: 24px;
}

.subsection-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--nm-text-placeholder);
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

// ---- Demos ----
.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  &--vertical {
    flex-direction: column;
    align-items: flex-start;
  }

  &--cards {
    align-items: stretch;
  }
}

.form-demo-width {
  max-width: 420px;
}

// ---- Footer ----
.showcase-footer {
  text-align: center;
  margin-top: 48px;
  padding-top: 32px;
  color: var(--nm-text-secondary);
  font-size: 13px;

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
