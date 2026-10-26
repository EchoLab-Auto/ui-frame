<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import { DocTocNav, type TocNode } from '../../../src/composites/doc'

type TocDepth = '2' | '3'

// ---- 目录数据：2 层与 3 层各一份（3 层是 2 层的超集，切换时同 id 仍能命中） ----
const tocItems2: TocNode[] = [
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

const tocItems3: TocNode[] = [
  {
    level: 1,
    text: '指南',
    id: 'toc-demo-guide',
    children: [
      { level: 2, text: '快速开始', id: 'toc-demo-start', children: [] },
      {
        level: 2,
        text: '进阶用法',
        id: 'toc-demo-adv',
        children: [
          { level: 3, text: '主题变量', id: 'toc-demo-theme', children: [] },
          { level: 3, text: '覆盖默认值', id: 'toc-demo-override', children: [] },
        ],
      },
    ],
  },
  {
    level: 1,
    text: 'API 参考',
    id: 'toc-demo-api',
    children: [
      { level: 2, text: 'Props', id: 'toc-demo-props', children: [] },
      { level: 2, text: '插槽', id: 'toc-demo-slots', children: [] },
    ],
  },
]

// ---- 配置台状态 ----
const tocDepth = ref<TocDepth>('3')
const tocActiveId = ref('toc-demo-adv')
/** 第二个演示（固定 3 层）的激活项：落在三级节点上，用来展示"自动展开祖先" */
const tocDeepActiveId = ref('toc-demo-theme')

const tocDepthOptions = [
  { label: '2 层', value: '2' },
  { label: '3 层', value: '3' },
]

const tocItems = computed(() => (tocDepth.value === '3' ? tocItems3 : tocItems2))

/** 把树拍平成「带缩进的下拉选项」，这样配置台能直接选到任意一层节点 */
const tocActiveOptions = computed(() => flattenToc(tocItems.value))

function flattenToc(nodes: TocNode[], depth = 1): { label: string; value: string }[] {
  return nodes.flatMap(node => [
    { label: `${'　'.repeat(depth - 1)}${node.text}`, value: node.id },
    ...flattenToc(node.children, depth + 1),
  ])
}

/** 目录树里第一个可点击的叶子——层数切换后做兜底用 */
function firstLeafId(nodes: TocNode[]): string {
  const [head] = nodes
  if (!head) return ''
  return head.children.length ? firstLeafId(head.children) : head.id
}

watch(tocDepth, () => {
  // 从 3 层切到 2 层时，三级节点的 id 已经不在树里了：activeId 悬空会导致整棵树都没有高亮
  if (!tocActiveOptions.value.some(option => option.value === tocActiveId.value)) {
    tocActiveId.value = firstLeafId(tocItems.value)
  }
})

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const frame = tocDepth.value === '3' ? '3 层' : '2 层'
  return `<DocTocNav :items="items" :active-id="activeId" @select="id => (activeId = id)" />

<!-- items 是 TocNode[]：{ level, text, id, children }，当前示例 ${frame} -->
<!-- activeId 通常由 useScrollSpy() 观测正文标题后回写，这里用点击模拟 -->`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（点击目录项模拟 scroll-spy 激活）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!-- 目录本体固定 220px 宽（组件自带），外侧用 flex 居中对齐，避免预览台里偏在左边 -->
      <div style="display: flex; justify-content: center; width: 100%">
        <DocTocNav :items="tocItems" :active-id="tocActiveId" @select="id => (tocActiveId = id)" />
      </div>

      <template #spec>
        depth=<b>{{ tocDepth }}</b> · activeId=<b>{{ tocActiveId }}</b>
      </template>

      <template #hint>
        <code>activeId</code> 由宿主持有：真实文档里它来自
        <code>useScrollSpy()</code>（滚动时回写），这里用 <code>@select</code>
        点击模拟。激活项若藏在折叠的父节点里，组件会自动把祖先展开——切到 3 层再看三级节点。
      </template>

      <template #config>
        <DemoField label="层级 items">
          <NeumorphismSegmented v-model="tocDepth" :options="tocDepthOptions" size="small" />
        </DemoField>

        <DemoField label="激活项" label-width="78px">
          <NeumorphismSelect
            v-model="tocActiveId"
            :options="tocActiveOptions"
            size="small"
            style="width: 168px"
          />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton
            variant="raised"
            size="small"
            @click="tocActiveId = firstLeafId(tocItems)"
            >回到首个节点</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="tocActiveId = 'toc-demo-api'">
            激活 API 参考
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">卡片边框 / 裸列表（framed）+ 自动展开祖先</h4>
    <div class="demo-row" style="gap: 24px; align-items: flex-start">
      <div style="flex: 0 1 320px; min-width: 260px">
        <h4 class="demo-label">framed（默认）：带卡片边框</h4>
        <!-- 激活项是三级节点：挂载时组件会自动展开「指南 › 进阶用法」这条祖先链 -->
        <DocTocNav
          :items="tocItems3"
          :active-id="tocDeepActiveId"
          @select="id => (tocDeepActiveId = id)"
        />
      </div>

      <div style="flex: 0 1 320px; min-width: 260px">
        <h4 class="demo-label">framed=false：只渲染列表</h4>
        <DocTocNav
          :items="tocItems3"
          :active-id="tocDeepActiveId"
          :framed="false"
          @select="id => (tocDeepActiveId = id)"
        />
        <p class="demo-hint">
          当前 activeId：<code>{{ tocDeepActiveId }}</code>
        </p>
      </div>
    </div>

    <p class="demo-hint">
      <code>framed=false</code> 时组件不画卡片、也不接管滚动定位（不再
      sticky），适合塞进移动端抽屉或已有的 侧栏容器里。两边共享同一个
      <code>activeId</code>——这就是「桌面侧栏 + 移动端抽屉」共享同一份 scroll-spy 状态的写法。
    </p>
  </div>
</template>
