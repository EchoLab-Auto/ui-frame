<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
// 只借类型：TreeNodeData 定义在 headless 的 useTree 里，组件本身由全局注册提供
import type { TreeNodeData } from '../../../src/composables/useTree'

// ---- 配置台状态 ----
const showSearch = ref(true)
const multiple = ref(false)
const searchPlaceholder = ref('搜索节点...')
/** 数据深度：3 = 原始三层（组件列表 → 基础组件 → Button），2 = 砍掉最内层 */
const treeDepth = ref(3)

const treeSelectedKeys = ref<string[]>(['getting-started'])
const treeExpandedKeys = ref<string[]>(['getting-started', 'components', 'components-basic'])

/**
 * 完整的三层数据（原演示数据原样保留）。
 *
 * `组件列表 → 布局组件` 带 disabled：用来验证「禁用节点不可选、但子节点搜索仍能命中」。
 */
const treeSource: TreeNodeData[] = [
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

/**
 * 按层裁剪数据。
 *
 * `children` 置为 undefined 而不是删键：TreeNode 用 `node.children?.length` 判断有没有孩子，
 * 两种写法等价，但保留键能让对象形状稳定，Vue 的响应式代理不必在换深度时重新收集依赖。
 */
function limitDepth(nodes: TreeNodeData[], depth: number): TreeNodeData[] {
  return nodes.map(node => ({
    ...node,
    children: depth > 1 && node.children ? limitDepth(node.children, depth - 1) : undefined,
  }))
}

const treeData = computed(() => limitDepth(treeSource, treeDepth.value))

const depthOptions = [
  { label: '2 层', value: 2 },
  { label: '3 层', value: 3 },
]

// 第二棵树：专门看「展开/折叠全部」与键盘导航，独立状态，互不干扰
const navTreeSelectedKeys = ref<string[]>(['comp-button'])
const navTreeExpandedKeys = ref<string[]>(['components'])

function reset() {
  showSearch.value = true
  multiple.value = false
  searchPlaceholder.value = '搜索节点...'
  treeDepth.value = 3
  treeSelectedKeys.value = ['getting-started']
  treeExpandedKeys.value = ['getting-started', 'components', 'components-basic']
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model:selected-keys="selectedKeys"', 'v-model:expanded-keys="expandedKeys"']
  attrs.push(':data="treeData"')
  if (showSearch.value) attrs.push('show-search')
  // search-placeholder 默认 '搜索...'，等于默认值不写
  if (searchPlaceholder.value !== '搜索...') {
    attrs.push(`search-placeholder="${searchPlaceholder.value}"`)
  }
  if (multiple.value) attrs.push('multiple')
  return ['<NeumorphismTree', ...attrs.map(attr => `  ${attr}`), '/>'].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（搜索 · 多选 · 数据深度）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <NeumorphismCard :elevation="-1" style="padding: 12px; width: 280px">
        <NeumorphismTree
          v-model:selected-keys="treeSelectedKeys"
          v-model:expanded-keys="treeExpandedKeys"
          :data="treeData"
          :show-search="showSearch"
          :search-placeholder="searchPlaceholder"
          :multiple="multiple"
        />
      </NeumorphismCard>

      <template #spec>
        showSearch=<b>{{ showSearch }}</b> · multiple=<b>{{ multiple }}</b> · 深度
        <b>{{ treeDepth }} 层</b> · 已选 Key：<b>{{ treeSelectedKeys.join(', ') || '无' }}</b>
      </template>

      <template #hint>
        搜索是<b>即时过滤 + 命中片段高亮</b>：父节点因为「有子节点命中」而保留，同时
        <code>useTree</code> 会把命中路径自动展开，所以搜完不用手点箭头。
        <code>multiple</code> 打开后点击是「切换」语义，再点一次取消选中。
      </template>

      <template #config>
        <DemoField label="搜索 showSearch" :value="String(showSearch)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="showSearch" size="small" />
            <span>显示搜索框</span>
          </label>
        </DemoField>

        <DemoField label="多选 multiple" :value="String(multiple)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="multiple" size="small" />
            <span>可多选</span>
          </label>
        </DemoField>

        <DemoField label="占位文案">
          <NeumorphismInput v-model="searchPlaceholder" size="small" placeholder="搜索节点..." />
        </DemoField>

        <DemoField label="数据深度 data">
          <NeumorphismSegmented v-model="treeDepth" :options="depthOptions" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">展开 / 折叠全部 · 键盘导航 · 禁用节点</h4>
    <div class="demo-row" style="gap: 28px; align-items: flex-start">
      <div style="width: 280px">
        <NeumorphismCard :elevation="-1" style="padding: 12px">
          <NeumorphismTree
            v-model:selected-keys="navTreeSelectedKeys"
            v-model:expanded-keys="navTreeExpandedKeys"
            :data="treeSource"
            show-search
            search-placeholder="搜索节点..."
          />
        </NeumorphismCard>
        <p class="demo-hint">
          已选 Key：<strong>{{ navTreeSelectedKeys.join(', ') || '无' }}</strong>
        </p>
      </div>

      <div style="flex: 1; min-width: 220px">
        <ul class="demo-hint" style="margin: 0; padding-left: 18px; line-height: 1.9">
          <li>
            树自带「展开全部 / 折叠全部」工具条，操作后会同步回
            <code>expanded-keys</code>（折叠全部时清空数组）
          </li>
          <li>
            <kbd>↑</kbd> <kbd>↓</kbd> 在<b>可见节点</b>间移动；<kbd>→</kbd> 展开或进第一层子节点、
            <kbd>←</kbd> 折叠或回父节点；<kbd>Home</kbd> / <kbd>End</kbd> 跳首尾
          </li>
          <li>连续按字母键（500ms 内）是 typeahead：跳到以该串开头的下一个节点（不改变展开态）</li>
          <li>
            <code>布局组件</code> 是 disabled：点击不选中、键盘仍可聚焦查看，子节点搜索依然能命中
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
