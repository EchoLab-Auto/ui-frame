<script setup lang="ts">
import { ref, computed } from 'vue'

// ---- 主题状态 ----
const isDark = ref(false)

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
    items: [
      { id: 'form', label: '表单 Form' },
    ],
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
]

// ---- 导航滚动 ----
function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

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
    <NeumorphismLayout show-header show-sider :sider-width="220" collapsible>
      <!-- ===== HEADER ===== -->
      <template #header-left>
        <span class="brand">@echolab/ui-frame</span>
      </template>

      <template #header-right>
        <NeumorphismSwitch v-model="isDark" size="small" />
        <span class="theme-label">{{ isDark ? '暗色' : '亮色' }}</span>
      </template>

      <!-- ===== SIDER NAVIGATION ===== -->
      <template #sider="{ collapsed }">
        <nav v-if="!collapsed" class="sider-nav" aria-label="组件导航">
          <div
            v-for="category in navCategories"
            :key="category.title"
            class="nav-group"
          >
            <span class="nav-group-title">{{ category.title }}</span>
            <a
              v-for="item in category.items"
              :key="item.id"
              :href="`#${item.id}`"
              class="nav-link"
              @click.prevent="scrollToSection(item.id)"
            >{{ item.label }}</a>
          </div>
        </nav>
      </template>

      <!-- ===== MAIN CONTENT ===== -->
      <template #default>
        <div class="content-inner">
          <!-- Hero / 简介 -->
          <section class="hero">
            <h1 class="hero-title">@echolab/ui-frame</h1>
            <p class="hero-desc">
              Vue 3 新拟态（Soft UI）UI 组件库，共
              <strong>{{ 27 }}</strong> 个组件。统一的台阶高度模型、完整的暗色模式支持、移动端与触屏适配。
            </p>
            <div class="hero-links">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a>
              <span class="hero-links-sep">·</span>
              <a href="https://www.npmjs.com/package/@echolab/ui-frame" target="_blank">npm</a>
            </div>
          </section>

          <NeumorphismDivider />

          <!-- ============================================= -->
          <!-- 分类：基础输入                                    -->
          <!-- ============================================= -->
          <section class="category-section">
            <h2 class="category-title">基础输入</h2>
            <p class="category-desc">新拟态风格的输入类组件，包含按钮、开关、复选框、单选框、输入框、文本域和选择器。</p>

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
                  <NeumorphismButton shape="circle" size="medium" aria-label="添加">+</NeumorphismButton>
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
                  <NeumorphismCheckbox v-model="checkboxIndeterminate" :indeterminate="true" label="半选状态" />
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
                <p class="demo-hint">已选：<strong>{{ radio1 }}</strong></p>
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

              <div class="demo-row" style="gap: 24px; flex-wrap: wrap; align-items: flex-start;">
                <div style="width: 260px;">
                  <h4 class="demo-label">基本选择器</h4>
                  <NeumorphismSelect v-model="select1" :options="selectOptions" placeholder="请选择框架" />
                  <p class="demo-hint">已选：<strong>{{ select1 || '无' }}</strong></p>
                </div>
                <div style="width: 260px;">
                  <h4 class="demo-label">带标签、可清空</h4>
                  <NeumorphismSelect v-model="select2" :options="selectOptions" label="框架" placeholder="请选择..." :clearable="true" />
                </div>
                <div style="width: 260px;">
                  <h4 class="demo-label">禁用与错误</h4>
                  <div class="demo-row demo-row--stacked" style="gap: 12px;">
                    <NeumorphismSelect :options="selectOptions" placeholder="已禁用" :disabled="true" />
                    <NeumorphismSelect :options="selectOptions" label="必填字段" placeholder="请选择..." error="此字段为必填项" />
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
            <p class="category-desc">表单容器与表单项，内置验证规则引擎，支持必填、正则、长度限制和自定义校验器。</p>

            <NeumorphismCard id="form" :elevation="1" class="demo-card demo-card--full">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismForm 表单与 FormItem</h3>
                  <span class="demo-badge">验证 · 提交 · 错误清除</span>
                </div>
              </template>

              <div style="max-width: 480px;">
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

                  <div class="demo-row" style="margin-top: 12px;">
                    <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
                    <NeumorphismButton type="button" variant="flat" @click="formRef?.clearErrors()">清除错误</NeumorphismButton>
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
            <p class="category-desc">用于展示数据和内容的组件，包括卡片、头像、徽标、标签、进度条、骨架屏和分割线。</p>

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
                  <NeumorphismCard v-for="e in 4" :key="e" :elevation="e" style="width: 140px; text-align: center;">
                    <strong>{{ e }}</strong>
                  </NeumorphismCard>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">凹陷（-1 到 -4 级）</h4>
                <div class="demo-row demo-row--cards">
                  <NeumorphismCard v-for="e in 4" :key="-e" :elevation="-e" style="width: 140px; text-align: center;">
                    <strong>{{ -e }}</strong>
                  </NeumorphismCard>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">悬停膨胀（elevation += 2）</h4>
                <div class="demo-row demo-row--cards">
                  <NeumorphismCard :elevation="1" hoverable="bulge" style="width: 140px; text-align: center;">1 → 3</NeumorphismCard>
                  <NeumorphismCard :elevation="-2" hoverable="bulge" style="width: 140px; text-align: center;">-2 → 0</NeumorphismCard>
                  <NeumorphismCard :elevation="0" hoverable="bulge" style="width: 140px; text-align: center;">0 → 2</NeumorphismCard>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">带头部和底部</h4>
                <NeumorphismCard :elevation="2" style="max-width: 480px;">
                  <template #header>
                    <strong>卡片标题</strong>
                  </template>
                  <p style="color: var(--nm-text-secondary); font-size: 13px;">这是卡片的主要内容区域。您可以在这里放置任意组件或文字。</p>
                  <template #footer>
                    <span style="color: var(--nm-text-placeholder); font-size: 12px;">底部信息 · 2024-01-01</span>
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
                  <NeumorphismAvatar src="https://i.pravatar.cc/64?img=1" alt="用户" size="medium" />
                  <NeumorphismAvatar src="https://invalid.url/img.jpg" initials="ER" size="medium" alt="用户" />
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
                  <NeumorphismTag v-if="tagVisible" variant="primary" :closable="true" @close="tagVisible = false">可关闭</NeumorphismTag>
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
                <div class="demo-row demo-row--stacked form-demo-width" style="gap: 14px;">
                  <NeumorphismProgress :model-value="progressVal" variant="primary" :show-label="true" />
                  <NeumorphismProgress :model-value="progressVal" variant="success" />
                  <NeumorphismProgress :model-value="progressVal" variant="warning" />
                  <NeumorphismProgress :model-value="progressVal" variant="error" :show-label="true" />
                </div>
                <div class="demo-row" style="margin-top: 12px;">
                  <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.max(0, progressVal - 10)">-10%</NeumorphismButton>
                  <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.min(100, progressVal + 10)">+10%</NeumorphismButton>
                  <NeumorphismButton size="small" variant="flat" @click="indeterminate = !indeterminate">
                    {{ indeterminate ? '停止' : '不确定模式' }}
                  </NeumorphismButton>
                </div>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">不确定模式与尺寸</h4>
                <div class="demo-row demo-row--stacked form-demo-width" style="gap: 14px;">
                  <NeumorphismProgress v-if="indeterminate" :indeterminate="true" variant="primary" />
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

              <div class="demo-row" style="margin-bottom: 14px;">
                <NeumorphismButton size="small" variant="flat" @click="skeletonLoading = !skeletonLoading">
                  {{ skeletonLoading ? '隐藏骨架屏' : '显示骨架屏' }}
                </NeumorphismButton>
              </div>

              <div v-if="skeletonLoading">
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

              <NeumorphismCard v-else :elevation="1" style="max-width: 480px;">
                <p><strong>内容已加载！</strong></p>
                <p style="color: var(--nm-text-secondary); font-size: 13px;">此内容替代了上方的骨架屏占位。</p>
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
            <p class="category-desc">页面导航类组件，包括选项卡、面包屑和分页器，均支持键盘操作和无障碍访问。</p>

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
                <div style="max-width: 400px;">
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
              <div style="margin-top: 10px;">
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
                <p class="demo-hint">当前页：<strong>{{ page }}</strong></p>
              </div>

              <div class="demo-block">
                <h4 class="demo-label">显示总数与跳转</h4>
                <NeumorphismPagination v-model="page2" :total="500" :page-size="20" :show-total="true" :show-jumper="true" />
              </div>

              <div class="demo-block">
                <h4 class="demo-label">尺寸</h4>
                <div class="demo-row demo-row--stacked" style="gap: 14px;">
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

              <NeumorphismModal v-model="modalVisible" title="示例模态框" size="small" @confirm="showToast('success')" @cancel="showToast('info')">
                <p>这是一个新拟态风格的模态对话框。</p>
                <p style="color: var(--nm-text-secondary); font-size: 13px;">它支持焦点锁定、按 Esc 键关闭和背景模糊效果。</p>
                <div style="margin-top: 12px;">
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
                <NeumorphismButton variant="flat" @click="showToast('info')">信息</NeumorphismButton>
                <NeumorphismButton variant="flat" @click="showToast('success')">成功</NeumorphismButton>
                <NeumorphismButton variant="flat" @click="showToast('warning')">警告</NeumorphismButton>
                <NeumorphismButton variant="flat" @click="showToast('error')">错误</NeumorphismButton>
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

              <div class="demo-row" style="padding: 28px 0; gap: 16px;">
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
                  <p>新拟态（Soft UI）是一种设计风格，通过阴影和高光营造柔和、挤压般的塑料质感。元素看起来像是从背景中凸起或凹陷下去。</p>
                </template>
                <template #item2>
                  <p>通过 <code>npm install @echolab/ui-frame</code> 安装，然后按需引入组件或使用 <code>app.use(NeumorphismUI)</code> 全局注册。</p>
                </template>
                <template #item3>
                  <p>此项已被禁用。</p>
                </template>
              </NeumorphismCollapse>

              <div style="margin-top: 14px;">
                <NeumorphismButton size="small" variant="flat" @click="collapseActive = collapseActive.length ? [] : ['item1', 'item2']">
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
            <p class="category-desc">页面布局类组件，包括响应式容器、24 栅格系统和经典页面框架（Header + Sider + Content + Footer）。</p>

            <!-- 容器 -->
            <NeumorphismCard id="container" :elevation="1" class="demo-card">
              <template #header>
                <div class="demo-header">
                  <h3 class="demo-title">NeumorphismContainer 容器</h3>
                  <span class="demo-badge">Fixed/Fluid · 响应式断点</span>
                </div>
              </template>

              <div style="border: 1px dashed var(--nm-text-placeholder); border-radius: var(--nm-border-radius-md); overflow: hidden;">
                <NeumorphismCard :elevation="0" style="text-align: center; padding: 28px; border-radius: 0;">
                  <p style="margin: 0; color: var(--nm-text-secondary); font-size: 13px;">内容自动居中，随断点变化最大宽度</p>
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

              <div style="border: 1px solid rgba(128,128,128,0.1); border-radius: var(--nm-border-radius-lg); overflow: hidden; height: 400px;">
                <NeumorphismLayout show-header show-sider :sider-width="200" collapsible>
                  <template #header-left>
                    <strong style="font-size: 15px;">My App</strong>
                  </template>

                  <template #header-right>
                    <NeumorphismAvatar initials="U" size="small" />
                  </template>

                  <template #sider="{ collapsed }">
                    <div style="padding: 12px;">
                      <template v-if="!collapsed">
                        <p style="font-size: 12px; color: var(--nm-text-secondary);">导航菜单</p>
                        <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px;">首页</p>
                        <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px;">组件</p>
                        <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px;">设置</p>
                      </template>
                      <p v-else style="text-align: center;">📋</p>
                    </div>
                  </template>

                  <template #default>
                    <div style="padding: 24px;">
                      <h3 style="margin: 0 0 8px; font-size: 16px;">欢迎使用新拟态 UI</h3>
                      <p style="font-size: 13px; color: var(--nm-text-secondary); margin: 0;">这是主内容区域，侧边栏可折叠，移动端自动变为抽屉式导航。</p>
                    </div>
                  </template>

                  <template #footer>
                    <span style="font-size: 12px;">© 2024 · MIT</span>
                  </template>
                </NeumorphismLayout>
              </div>
            </NeumorphismCard>
          </section>

          <!-- ===== 页脚 ===== -->
          <footer class="doc-footer">
            <NeumorphismDivider />
            <p>@echolab/ui-frame · MIT 许可证 · 共 {{ 27 }} 个组件</p>
            <p style="margin-top: 4px;">
              <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a> ·
              <a href="https://www.npmjs.com/package/@echolab/ui-frame" target="_blank">npm</a>
            </p>
          </footer>
        </div>
      </template>
    </NeumorphismLayout>
  </div>
</template>

<style scoped lang="scss">
@use '../src/styles/variables.scss' as *;
@use '../src/styles/mixins.scss' as *;

// ---- Root ----
.showcase {
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition: background-color var(--nm-transition-slow), color var(--nm-transition-slow);
}

// ---- Header ----
.brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.theme-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--nm-text-secondary);
  min-width: 28px;
}

// ---- Sider Navigation ----
.sider-nav {
  padding: 16px 12px 24px;
}

.nav-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-group-title {
  display: block;
  padding: 6px 10px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--nm-text-placeholder);
}

.nav-link {
  display: block;
  padding: 5px 10px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);
  margin-bottom: 1px;

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
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
    &:hover { text-decoration: underline; }
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
    &:hover { text-decoration: underline; }
  }
}
</style>
