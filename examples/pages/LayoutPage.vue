<script setup lang="ts">
import { ref } from 'vue'

// ---- 仪表盘数据 ----
const stats = [
  { label: '总访问量', value: '128,430', change: '+12.5%', positive: true },
  { label: '活跃用户', value: '8,920', change: '+5.3%', positive: true },
  { label: '转化率', value: '3.24%', change: '-0.8%', positive: false },
  { label: '平均停留', value: '4m 32s', change: '+18.2%', positive: true },
]

// ---- 通知列表 ----
const notifications = [
  { type: 'success', title: '部署成功', desc: 'v2.4.0 已上线生产环境', time: '2分钟前' },
  { type: 'warning', title: '性能告警', desc: 'API 响应时间超过阈值', time: '15分钟前' },
  { type: 'info', title: '新用户注册', desc: '企业版试用用户 +3', time: '1小时前' },
  { type: 'error', title: '构建失败', desc: 'ui-frame 分支 #882', time: '3小时前' },
]

// ---- 任务列表 ----
const tasks = [
  { title: '更新设计 Token', progress: 78, variant: 'primary' as const },
  { title: '暗色模式适配', progress: 45, variant: 'success' as const },
  { title: '无障碍优化', progress: 92, variant: 'warning' as const },
  { title: '文档重构', progress: 30, variant: 'error' as const },
]

// ---- 标签页 ----
const activeTab = ref('overview')
const tabItems = [
  { key: 'overview', label: '概览' },
  { key: 'analytics', label: '分析' },
  { key: 'reports', label: '报告' },
  { key: 'settings', label: '设置' },
]

// ---- 面包屑 ----
const breadcrumbItems = [
  { label: '首页', to: '#' },
  { label: '排版系统', to: '#' },
  { label: '仪表盘布局' },
]

// ---- 开关状态 ----
const _widgetToggles = ref({
  stats: true,
  chart: true,
  tasks: true,
  notifications: true,
})

// ---- 响应式断点展示 ----
const breakpointDemo = ref('md')
const breakpoints = [
  { key: 'xs', label: '手机', desc: '< 576px', cols: 24 },
  { key: 'sm', label: '平板竖屏', desc: '≥ 576px', cols: 12 },
  { key: 'md', label: '平板横屏', desc: '≥ 768px', cols: 8 },
  { key: 'lg', label: '桌面', desc: '≥ 1024px', cols: 6 },
  { key: 'xl', label: '大屏', desc: '≥ 1280px', cols: 4 },
]

// ---- 容器宽度展示 ----
const containerModes = [
  { label: 'Fluid（流式）', desc: '内容区占满可用宽度', key: 'fluid' },
  { label: 'Fixed（固定）', desc: '内容区最大宽度 1200px', key: 'fixed' },
]
</script>

<template>
  <div class="layout-page">
    <div class="content-inner">
      <!-- Hero -->
      <section class="hero">
        <h1 class="hero-title">排版系统展示</h1>
        <p class="hero-desc">
          以下页面模拟真实应用场景，展示 NeumorphismLayout、Container、Grid
          等排版组件在实际页面中的组合使用方式。
        </p>
      </section>

      <NeumorphismDivider />

      <!-- ============ 场景 1：仪表盘布局 ============ -->
      <section class="scenario-section">
        <h2 class="scenario-title">场景一：仪表盘布局</h2>
        <p class="scenario-desc">
          模拟数据仪表盘页面，展示 Card、Grid、Progress、Tag 等组件在密集信息场景下的排版效果。
        </p>

        <!-- 面包屑 -->
        <NeumorphismBreadcrumb :items="breadcrumbItems" separator="/" size="small" />

        <!-- 标签页 -->
        <div style="margin-top: 20px">
          <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="top" />
        </div>

        <!-- 统计卡片 —— 响应式栅格 -->
        <NeumorphismRow :gutter="16" style="margin-top: 20px">
          <NeumorphismCol
            v-for="stat in stats"
            :key="stat.label"
            :xs="24"
            :sm="12"
            :md="12"
            :lg="6"
          >
            <NeumorphismCard :elevation="1" hoverable="bulge">
              <div class="stat-card">
                <span class="stat-label">{{ stat.label }}</span>
                <span class="stat-value">{{ stat.value }}</span>
                <span
                  class="stat-change"
                  :class="stat.positive ? 'stat-change--up' : 'stat-change--down'"
                >
                  {{ stat.change }}
                </span>
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>

        <!-- 主内容区 —— 左右分栏 -->
        <NeumorphismRow :gutter="16" style="margin-top: 16px">
          <!-- 左侧：任务进度 -->
          <NeumorphismCol :xs="24" :lg="14">
            <NeumorphismCard :elevation="1">
              <template #header>
                <div class="panel-header">
                  <strong>项目进度</strong>
                  <NeumorphismTag size="small" variant="primary">进行中</NeumorphismTag>
                </div>
              </template>

              <div v-for="task in tasks" :key="task.title" class="task-item">
                <div class="task-meta">
                  <span class="task-title">{{ task.title }}</span>
                  <span class="task-percent">{{ task.progress }}%</span>
                </div>
                <NeumorphismProgress
                  :model-value="task.progress"
                  :variant="task.variant"
                  size="small"
                />
              </div>
            </NeumorphismCard>
          </NeumorphismCol>

          <!-- 右侧：通知列表 -->
          <NeumorphismCol :xs="24" :lg="10">
            <NeumorphismCard :elevation="1">
              <template #header>
                <div class="panel-header">
                  <strong>最近通知</strong>
                  <NeumorphismBadge :value="notifications.length">
                    <NeumorphismButton variant="flat" size="small">全部</NeumorphismButton>
                  </NeumorphismBadge>
                </div>
              </template>

              <div v-for="n in notifications" :key="n.title" class="notif-item">
                <span class="notif-dot" :class="`notif-dot--${n.type}`" />
                <div class="notif-body">
                  <span class="notif-title">{{ n.title }}</span>
                  <span class="notif-desc">{{ n.desc }}</span>
                </div>
                <span class="notif-time">{{ n.time }}</span>
              </div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </section>

      <NeumorphismDivider />

      <!-- ============ 场景 2：经典后台布局 ============ -->
      <section class="scenario-section">
        <h2 class="scenario-title">场景二：经典后台布局</h2>
        <p class="scenario-desc">
          使用 NeumorphismLayout 构建 Header + Sider + Content + Footer
          的经典后台框架，展示移动端抽屉式导航的适配效果。
        </p>

        <div class="layout-preview-frame">
          <NeumorphismLayout
            show-header
            show-sider
            show-footer
            :sider-width="180"
            collapsible
            style="height: 400px"
          >
            <template #header-left>
              <div style="display: flex; align-items: center; gap: 10px">
                <NeumorphismAvatar initials="A" size="small" />
                <strong style="font-size: 14px">Admin 后台</strong>
              </div>
            </template>

            <template #header-right>
              <div style="display: flex; align-items: center; gap: 10px">
                <NeumorphismBadge dot>
                  <NeumorphismButton variant="flat" size="small" aria-label="通知"
                    >🔔</NeumorphismButton
                  >
                </NeumorphismBadge>
                <NeumorphismAvatar src="https://i.pravatar.cc/32?img=5" size="small" />
              </div>
            </template>

            <template #sider="{ collapsed }">
              <div v-if="!collapsed" style="padding: 8px">
                <div
                  v-for="menu in ['仪表盘', '用户管理', '内容管理', '系统设置']"
                  :key="menu"
                  class="layout-demo-menu-item"
                  :class="{ 'layout-demo-menu-item--active': menu === '仪表盘' }"
                >
                  {{ menu }}
                </div>
              </div>
              <div v-else style="padding: 12px 0; text-align: center">
                <div v-for="c in ['📊', '👤', '📝', '⚙️']" :key="c" style="padding: 8px 0">
                  {{ c }}
                </div>
              </div>
            </template>

            <template #default>
              <div style="padding: 16px">
                <h3 style="margin: 0 0 12px; font-size: 15px">欢迎回来</h3>
                <p style="font-size: 13px; color: var(--nm-text-secondary); margin: 0 0 16px">
                  这是主内容区域。侧边栏支持折叠，移动端自动变为抽屉式导航。调整浏览器宽度可观察响应式行为。
                </p>
                <NeumorphismRow :gutter="12">
                  <NeumorphismCol :span="12">
                    <NeumorphismCard :elevation="-1" style="padding: 12px; text-align: center">
                      <strong style="font-size: 18px; color: var(--nm-primary-color)">1,234</strong>
                      <p style="margin: 4px 0 0; font-size: 12px; color: var(--nm-text-secondary)">
                        今日访问
                      </p>
                    </NeumorphismCard>
                  </NeumorphismCol>
                  <NeumorphismCol :span="12">
                    <NeumorphismCard :elevation="-1" style="padding: 12px; text-align: center">
                      <strong style="font-size: 18px; color: var(--nm-color-success)">98.2%</strong>
                      <p style="margin: 4px 0 0; font-size: 12px; color: var(--nm-text-secondary)">
                        可用率
                      </p>
                    </NeumorphismCard>
                  </NeumorphismCol>
                </NeumorphismRow>
              </div>
            </template>

            <template #footer>
              <span style="font-size: 12px; color: var(--nm-text-placeholder)"
                >© 2024 Admin System</span
              >
            </template>
          </NeumorphismLayout>
        </div>
      </section>

      <NeumorphismDivider />

      <!-- ============ 场景 3：响应式栅格断点 ============ -->
      <section class="scenario-section">
        <h2 class="scenario-title">场景三：响应式栅格断点</h2>
        <p class="scenario-desc">
          展示 NeumorphismRow / NeumorphismCol 在不同断点下的列数分配。调整浏览器宽度观察列数变化。
        </p>

        <div class="breakpoint-tabs">
          <NeumorphismButton
            v-for="bp in breakpoints"
            :key="bp.key"
            size="small"
            :variant="breakpointDemo === bp.key ? 'raised' : 'flat'"
            @click="breakpointDemo = bp.key"
          >
            {{ bp.label }}
          </NeumorphismButton>
        </div>

        <NeumorphismRow :gutter="12">
          <NeumorphismCol
            v-for="i in 4"
            :key="i"
            :xs="24"
            :sm="breakpointDemo === 'xs' ? 24 : 12"
            :md="
              breakpointDemo === 'xs' || breakpointDemo === 'sm'
                ? undefined
                : breakpointDemo === 'md'
                  ? 8
                  : undefined
            "
            :lg="
              breakpointDemo === 'lg' || breakpointDemo === 'xl'
                ? breakpointDemo === 'xl'
                  ? 6
                  : 6
                : undefined
            "
            :xl="breakpointDemo === 'xl' ? 6 : undefined"
          >
            <NeumorphismCard :elevation="1" style="text-align: center; padding: 20px">
              <strong style="font-size: 20px; color: var(--nm-primary-color)">col-{{ i }}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: var(--nm-text-secondary)">
                {{ breakpoints.find(b => b.key === breakpointDemo)?.label }}
              </p>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>

        <div class="breakpoint-info">
          <NeumorphismCard :elevation="-1" style="padding: 16px">
            <h4 style="margin: 0 0 10px; font-size: 13px; color: var(--nm-text-placeholder)">
              当前断点说明
            </h4>
            <div class="bp-table">
              <div
                v-for="bp in breakpoints"
                :key="bp.key"
                class="bp-row"
                :class="{ 'bp-row--active': breakpointDemo === bp.key }"
              >
                <span class="bp-key">{{ bp.key }}</span>
                <span class="bp-label">{{ bp.label }}</span>
                <span class="bp-desc">{{ bp.desc }}</span>
                <span class="bp-cols">每行 {{ Math.floor(24 / bp.cols) }} 列</span>
              </div>
            </div>
          </NeumorphismCard>
        </div>
      </section>

      <NeumorphismDivider />

      <!-- ============ 场景 4：容器宽度模式 ============ -->
      <section class="scenario-section">
        <h2 class="scenario-title">场景四：容器宽度模式</h2>
        <p class="scenario-desc">
          展示 NeumorphismContainer 的 Fluid（流式）和 Fixed（固定最大宽度）两种模式的区别。
        </p>

        <div class="container-demo">
          <div v-for="mode in containerModes" :key="mode.key" class="container-demo-item">
            <h4 class="demo-label">{{ mode.label }}</h4>
            <p class="demo-hint">{{ mode.desc }}</p>
            <div class="container-demo-frame">
              <NeumorphismContainer
                :fluid="mode.key === 'fluid'"
                style="
                  background: var(--nm-surface-raised);
                  border-radius: var(--nm-border-radius-md);
                  padding: 16px;
                "
              >
                <p style="margin: 0; font-size: 13px; color: var(--nm-text-secondary)">
                  容器内容区域 —
                  {{
                    mode.key === 'fluid' ? '随视口宽度自适应扩展' : '最大宽度限制在 1200px 并居中'
                  }}
                </p>
              </NeumorphismContainer>
            </div>
          </div>
        </div>
      </section>

      <NeumorphismDivider />

      <!-- ============ 场景 5：组件排版密度对比 ============ -->
      <section class="scenario-section">
        <h2 class="scenario-title">场景五：组件排版密度对比</h2>
        <p class="scenario-desc">同一组组件在不同间距（gutter）和卡片高度下的视觉密度表现。</p>

        <h4 class="demo-label">紧凑间距（gutter: 8）</h4>
        <NeumorphismRow :gutter="8">
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 12px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="80%" style="margin-top: 8px" />
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 12px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="60%" style="margin-top: 8px" />
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 12px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="70%" style="margin-top: 8px" />
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>

        <h4 class="demo-label" style="margin-top: 20px">宽松间距（gutter: 24）</h4>
        <NeumorphismRow :gutter="24">
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 24px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="80%" style="margin-top: 12px" />
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 24px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="60%" style="margin-top: 12px" />
            </NeumorphismCard>
          </NeumorphismCol>
          <NeumorphismCol :xs="24" :sm="8">
            <NeumorphismCard :elevation="1" style="padding: 24px">
              <NeumorphismSkeleton variant="text" width="40%" />
              <NeumorphismSkeleton variant="text" width="70%" style="margin-top: 12px" />
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </section>

      <!-- 页脚 -->
      <footer class="doc-footer">
        <NeumorphismDivider />
        <p>@echolab/ui-frame · 排版系统展示</p>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../src/styles/mixins.scss' as *;

.layout-page {
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
}

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
  }
}

.hero-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  line-height: 1.7;
  margin: 0;
  max-width: 640px;

  @include nm-screen-lg {
    font-size: 15px;
  }
}

// ---- Scenario Section ----
.scenario-section {
  padding: 8px 0 4px;
}

.scenario-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;

  @include nm-screen-sm {
    font-size: 22px;
  }
}

.scenario-desc {
  font-size: 13px;
  color: var(--nm-text-secondary);
  line-height: 1.6;
  margin: 0 0 20px;
  max-width: 640px;
}

// ---- Demo labels ----
.demo-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--nm-text-placeholder);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--nm-text-secondary);
}

// ---- Stat Card ----
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--nm-text-placeholder);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--nm-text-primary);
  letter-spacing: -0.5px;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;

  &--up {
    color: var(--nm-color-success);
  }

  &--down {
    color: var(--nm-color-error);
  }
}

// ---- Panel Header ----
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

// ---- Task Item ----
.task-item {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-title {
  font-size: 13px;
  color: var(--nm-text-primary);
}

.task-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--nm-text-placeholder);
}

// ---- Notification Item ----
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.08);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;

  &--success {
    background: var(--nm-color-success);
  }

  &--warning {
    background: var(--nm-color-warning);
  }

  &--error {
    background: var(--nm-color-error);
  }

  &--info {
    background: var(--nm-primary-color);
  }
}

.notif-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--nm-text-primary);
}

.notif-desc {
  font-size: 12px;
  color: var(--nm-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-time {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  flex-shrink: 0;
  white-space: nowrap;
}

// ---- Layout Preview Frame ----
.layout-preview-frame {
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
}

.layout-demo-menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  transition: all var(--nm-transition-fast);
  margin-bottom: 2px;

  &:hover {
    background: var(--nm-surface-raised);
    color: var(--nm-text-primary);
  }

  &--active {
    background: var(--nm-surface-raised);
    color: var(--nm-primary-color);
    font-weight: 600;
  }
}

// ---- Breakpoint Tabs ----
.breakpoint-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.breakpoint-info {
  margin-top: 20px;
}

.bp-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bp-row {
  display: grid;
  grid-template-columns: 50px 100px 120px 1fr;
  gap: 12px;
  padding: 6px 10px;
  border-radius: var(--nm-border-radius-sm);
  font-size: 13px;
  transition: background var(--nm-transition-fast);

  &--active {
    background: var(--nm-surface-raised);
  }
}

.bp-key {
  font-weight: 600;
  color: var(--nm-text-placeholder);
  font-family: 'SF Mono', monospace;
  font-size: 12px;
}

.bp-label {
  color: var(--nm-text-primary);
}

.bp-desc {
  color: var(--nm-text-secondary);
  font-size: 12px;
}

.bp-cols {
  color: var(--nm-primary-color);
  font-size: 12px;
  font-weight: 500;
}

// ---- Container Demo ----
.container-demo {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @include nm-screen-lg {
    grid-template-columns: 1fr 1fr;
  }
}

.container-demo-frame {
  border: 1px dashed var(--nm-text-placeholder);
  border-radius: var(--nm-border-radius-md);
  padding: 12px;
  margin-top: 8px;
}

// ---- Footer ----
.doc-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  color: var(--nm-text-secondary);
  font-size: 13px;
}
</style>
