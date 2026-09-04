<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import NeumorphismCard from '@/components/NeumorphismCard/NeumorphismCard.vue'
import { useLocale } from '@/composables/useLocale'
import TocNodeItem from './TocNodeItem.vue'
import { getScrollBehavior } from './useScrollSpy'
import type { TocNode } from './useMarkdownToc'

export interface DocTocNavProps {
  /** 层级目录树 */
  items: TocNode[]
  /** 当前激活的标题 id（scroll-spy 驱动） */
  activeId?: string
  /** 面板标题（默认取 locale markdownTocLabel） */
  title?: string
  /**
   * 是否带卡片边框（默认 true）。
   * false 时只渲染目录列表（用于嵌入移动端抽屉等自有容器）。
   */
  framed?: boolean
  /**
   * 受控的折叠组集合（配合 update:collapsedGroups 使用）。
   * 传入后多个实例（如桌面侧栏 + 移动端抽屉）共享同一份折叠状态；
   * 不传则组件内部自维护。
   */
  collapsedGroups?: Set<string>
}

const props = withDefaults(defineProps<DocTocNavProps>(), {
  activeId: '',
  title: '',
  framed: true,
  collapsedGroups: undefined,
})

const emit = defineEmits<{
  /** 点击目录项（宿主负责滚动到对应标题） */
  (e: 'select', id: string): void
  (e: 'update:collapsedGroups', value: Set<string>): void
}>()

const { t } = useLocale()
const resolvedTitle = computed(() => props.title || t('markdownTocLabel'))

const tocNavRef = ref<HTMLElement | null>(null)
const innerCollapsedGroups = ref<Set<string>>(new Set())
const collapsedGroups = computed(() => props.collapsedGroups ?? innerCollapsedGroups.value)

function setCollapsedGroups(next: Set<string>): void {
  if (props.collapsedGroups !== undefined) {
    emit('update:collapsedGroups', next)
  } else {
    innerCollapsedGroups.value = next
  }
}

/** 目录树更换（新文档）时重置折叠状态（仅非受控模式；受控模式由宿主重置），避免旧状态污染 */
watch(
  () => props.items,
  () => {
    if (props.collapsedGroups === undefined) {
      innerCollapsedGroups.value = new Set()
    }
  }
)

/** 切换 TOC 节点折叠状态，展开时自动滚动以显示子项 */
function toggleCollapse(id: string) {
  const next = new Set(collapsedGroups.value)
  const wasCollapsed = next.has(id)
  if (wasCollapsed) {
    next.delete(id)
  } else {
    next.add(id)
  }
  setCollapsedGroups(next)

  // 展开时自动滚动 TOC，确保新显示的子项可见
  if (wasCollapsed) {
    nextTick(() => scrollTocToNode(id))
  }
}

/** 将 TOC 侧边栏滚动到指定节点，确保展开后的子项可见 */
function scrollTocToNode(id: string) {
  if (!tocNavRef.value) return
  if (window.innerWidth <= 1100) return

  const container = tocNavRef.value
  const nodeEl = container.querySelector(`[data-toc-id="${CSS.escape(id)}"]`) as HTMLElement | null
  if (!nodeEl) return

  // 检查子列表是否已在 TOC 视口内完全可见
  const containerRect = container.getBoundingClientRect()
  const listItem = nodeEl.closest('.neumorphism-toc-item') as HTMLElement | null
  const childList = Array.from(listItem?.children ?? []).find(child =>
    child.classList.contains('neumorphism-toc-list')
  ) as HTMLElement | null

  if (childList) {
    const childRect = childList.getBoundingClientRect()
    // 如果子列表底部未超出 TOC 底部（+10px 容差），则无需滚动
    if (childRect.bottom <= containerRect.bottom + 10) {
      return
    }
  }

  // 直接操作容器 scrollTop，避免 scrollIntoView 在 sticky 容器中的浏览器兼容问题
  const elTop = nodeEl.getBoundingClientRect().top - containerRect.top + container.scrollTop
  container.scrollTo({
    top: Math.max(0, elTop),
    behavior: getScrollBehavior(),
  })
}

/** 将 TOC 侧边栏滚动到当前激活项（滞回区间：视口中间 50% 不滚动，减少抖动） */
function scrollTocToActive() {
  if (!tocNavRef.value) return
  // 桌面端 TOC 隐藏时（移动端），跳过滚动
  if (window.innerWidth <= 1100) return

  const container = tocNavRef.value
  const activeEl = container.querySelector('.neumorphism-toc-item.active') as HTMLElement | null
  if (!activeEl) return

  const containerRect = container.getBoundingClientRect()
  const elRect = activeEl.getBoundingClientRect()

  const upperThreshold = containerRect.top + containerRect.height * 0.25
  const lowerThreshold = containerRect.top + containerRect.height * 0.75

  if (elRect.top >= upperThreshold && elRect.bottom <= lowerThreshold) {
    return // 已在舒适区域，无需滚动
  }

  // 直接操作容器 scrollTop，避免 scrollIntoView 在 sticky 容器中触发祖先滚动
  const elCenter = elRect.top - containerRect.top + container.scrollTop - elRect.height / 2
  const targetScrollTop = elCenter - containerRect.height / 2
  container.scrollTo({
    top: Math.max(0, targetScrollTop),
    behavior: getScrollBehavior(),
  })
}

/** 激活项变化时：自动展开被折叠的祖先节点，并滚动到可见位置 */
watch(
  () => props.activeId,
  newId => {
    if (!newId) return

    function findAndExpand(nodes: TocNode[]): boolean {
      for (const node of nodes) {
        if (node.id === newId) return true
        if (findAndExpand(node.children)) {
          if (collapsedGroups.value.has(node.id)) {
            const next = new Set(collapsedGroups.value)
            next.delete(node.id)
            setCollapsedGroups(next)
          }
          return true
        }
      }
      return false
    }

    findAndExpand(props.items)
    nextTick(() => scrollTocToActive())
  }
)

defineExpose({ scrollTocToActive })
</script>

<template>
  <nav v-if="framed" ref="tocNavRef" class="neumorphism-toc" :aria-label="resolvedTitle">
    <NeumorphismCard :elevation="-2" no-padding class="neumorphism-toc-card">
      <div class="neumorphism-toc-header">
        <span>📑 {{ resolvedTitle }}</span>
      </div>
      <ul class="neumorphism-toc-list" role="list">
        <TocNodeItem
          v-for="node in items"
          :key="node.id"
          :node="node"
          :active-heading="activeId"
          :collapsed-groups="collapsedGroups"
          @toggle="toggleCollapse"
          @select="emit('select', $event)"
        />
      </ul>
    </NeumorphismCard>
  </nav>
  <ul v-else class="neumorphism-toc-list" role="list">
    <TocNodeItem
      v-for="node in items"
      :key="node.id"
      :node="node"
      :active-heading="activeId"
      :collapsed-groups="collapsedGroups"
      @toggle="toggleCollapse"
      @select="emit('select', $event)"
    />
  </ul>
</template>

<!-- 全局样式：TocNodeItem 递归子组件的类在此统一定义（与 v-html 无关但跨组件） -->
<style>
/* TOC — sticky sidebar that floats alongside content when scrolling */
.neumorphism-toc {
  width: 220px;
  min-width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 10;
  /* 防止 TOC 触顶/触底时滚轮事件链接到页面滚动 */
  overscroll-behavior-y: contain;
  /* Scrollbar styling for the TOC itself */
  scrollbar-width: thin;
  scrollbar-color: var(--nm-surface-raised) transparent;
}
.neumorphism-toc::-webkit-scrollbar {
  width: 5px;
}
.neumorphism-toc::-webkit-scrollbar-track {
  background: transparent;
}
.neumorphism-toc::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--nm-text-placeholder) 25%, transparent);
  border-radius: 3px;
}
.neumorphism-toc::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--nm-text-secondary) 40%, transparent);
}

.neumorphism-toc-card {
  background-color: var(--nm-surface-raised);
}

.neumorphism-toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 10px 16px;
  font-size: 10px;
  font-weight: 700;
  color: var(--nm-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--nm-border-subtle);
  margin-bottom: 8px;
}

.neumorphism-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.neumorphism-toc-item {
  margin: 0;
}

/* 嵌套列表缩进：每一级增加 16px */
.neumorphism-toc-list .neumorphism-toc-list {
  padding-left: 16px;
}

.toc-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.neumorphism-toc-item a {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px 5px 4px;
  font-size: 13px;
  color: var(--nm-text-secondary);
  text-decoration: none;
  border-right: 2px solid transparent;
  transition:
    color 0.2s ease,
    border-right-color 0.2s ease,
    background-color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 有子项的标题略微加粗 */
.neumorphism-toc-item.has-children > .toc-item-row > a .toc-text {
  font-weight: 500;
}

/* TOC 折叠/展开按钮 */
.toc-toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background: transparent;
  color: var(--nm-text-placeholder);
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
  font-family: monospace;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.toc-toggle:hover {
  color: var(--nm-primary-color);
  background-color: color-mix(in srgb, var(--nm-primary-color) 10%, transparent);
}

.toc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.neumorphism-toc-item a:hover {
  color: var(--nm-primary-color);
  border-right-color: color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
}

.neumorphism-toc-item.active a {
  color: var(--nm-primary-color);
  border-right-color: var(--nm-primary-color);
  background: color-mix(in srgb, var(--nm-primary-color) 12%, transparent);
}

.neumorphism-toc-item a:focus-visible {
  outline: 2px solid var(--nm-primary-color);
  outline-offset: 2px;
  border-radius: var(--nm-border-radius-sm);
}

@media (max-width: 1100px) {
  .neumorphism-toc {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .neumorphism-toc-item a,
  .toc-toggle {
    transition: none;
  }
}
</style>
