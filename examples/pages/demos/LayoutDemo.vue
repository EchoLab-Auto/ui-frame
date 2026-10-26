<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

// ---- 配置台状态 ----
const siderWidth = ref(200)
const collapsible = ref(true)
const showHeader = ref(true)
/** 初始折叠：非受控，只在挂载时读一次（改它要靠 :key 换实例，见模板注释） */
const defaultCollapsed = ref(false)
/** 折叠后的固定宽度 */
const collapsedWidth = ref(64)

function reset() {
  siderWidth.value = 200
  collapsible.value = true
  showHeader.value = true
  defaultCollapsed.value = false
  collapsedWidth.value = 64
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  // showHeader 默认 true、collapsible 默认 false —— 只写非默认值
  if (!showHeader.value) attrs.push(':show-header="false"')
  attrs.push('show-sider')
  // siderWidth 默认 240，等于默认值时不写
  if (siderWidth.value !== 240) attrs.push(`:sider-width="${siderWidth.value}"`)
  if (collapsible.value) attrs.push('collapsible')
  if (defaultCollapsed.value) attrs.push('default-collapsed')
  if (collapsedWidth.value !== 64) attrs.push(`:collapsed-width="${collapsedWidth.value}"`)
  // 外层容器有确定高度时，height 必须从默认的 100vh 改成 100%，否则会撑出容器
  attrs.push('height="100%"')

  const lines = [
    '<div style="height: 400px">',
    '  <NeumorphismLayout',
    ...attrs.map(a => `    ${a}`),
    '  >',
  ]
  if (showHeader.value) {
    lines.push(
      '    <template #header-left><strong>My App</strong></template>',
      '    <template #header-right>',
      '      <NeumorphismAvatar initials="U" size="small" />',
      '    </template>'
    )
  }
  lines.push(
    '    <template #sider="{ collapsed }">',
    "      <p>{{ collapsed ? '📋' : '导航菜单 / 首页 / 组件 / 设置' }}</p>",
    '    </template>',
    '    <p>主内容区域</p>',
    '    <template #footer>© 2024 · MIT</template>',
    '  </NeumorphismLayout>',
    '</div>'
  )
  return lines.join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（完整框架 · 侧栏宽度 · 折叠）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <div
        style="
          width: 100%;
          border: 1px solid rgba(128, 128, 128, 0.1);
          border-radius: var(--nm-border-radius-lg);
          overflow: hidden;
          height: 400px;
        "
      >
        <!--
          `default-collapsed` 是非受控初始值，组件只在 setup 读一次；
          要让它变成可调参数必须换实例，受控场景请改用 v-model:collapsed。
        -->
        <NeumorphismLayout
          :key="`layout-${defaultCollapsed}`"
          :show-header="showHeader"
          show-sider
          :sider-width="siderWidth"
          :collapsed-width="collapsedWidth"
          :collapsible="collapsible"
          :default-collapsed="defaultCollapsed"
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
                <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px">
                  首页
                </p>
                <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px">
                  组件
                </p>
                <p style="font-size: 12px; color: var(--nm-text-placeholder); margin-left: 12px">
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

      <template #spec>
        header=<b>{{ showHeader }}</b> · siderWidth=<b>{{ siderWidth }}px</b> · collapsible=<b>{{
          collapsible
        }}</b>
        · defaultCollapsed=<b>{{ defaultCollapsed }}</b> · collapsedWidth=<b
          >{{ collapsedWidth }}px</b
        >
        · 台高 <b>400px</b>
      </template>

      <template #hint>
        嵌套使用时 <code>height</code> 必须显式传 <code>100%</code>：默认值是
        <code>100vh</code>，会把身在外层容器里的布局撑出 400px 的舞台。侧栏折叠后固定
        <code>collapsed-width</code>（默认 64px），移动端由
        <code>mobileAutoCollapse</code> 自动改成抽屉。<code>default-collapsed</code>
        决定初始是否折叠， <code>collapsed-width</code> 是折叠后的固定宽度；折叠按钮长在 Header
        左侧，只有 <code>show-sider</code> + <code>collapsible</code> 同时成立才渲染——所以
        <code>:show-header="false"</code> 的布局根本没法折叠。
      </template>

      <template #config>
        <DemoField label="侧栏宽 siderWidth" :value="`${siderWidth}px`" grow>
          <NeumorphismSlider v-model="siderWidth" :min="160" :max="280" :step="4" size="small" />
        </DemoField>

        <DemoField label="可折叠 collapsible" :value="String(collapsible)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="collapsible" size="small" />
            <span>显示折叠按钮</span>
          </label>
        </DemoField>

        <DemoField label="顶栏 showHeader" :value="String(showHeader)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="showHeader" size="small" />
            <span>Header 区域</span>
          </label>
        </DemoField>

        <DemoField label="初始折叠" :value="String(defaultCollapsed)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="defaultCollapsed" size="small" />
            <span>default-collapsed</span>
          </label>
        </DemoField>

        <DemoField label="折叠后宽" :value="`${collapsedWidth}px`" grow>
          <NeumorphismSlider v-model="collapsedWidth" :min="48" :max="120" :step="4" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
