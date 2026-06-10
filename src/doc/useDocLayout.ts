/**
 * DocViewer / DocEditor 共享布局逻辑
 *
 * 提取两个组件共用的状态管理：树节点选择、主题切换、节点查找等。
 */

import { ref, computed, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import type { ProDocNode } from './types.js'
import { nodeToTreeData } from './tree-utils.js'
import { createDocTree } from './doc-tree.js'
import type { TreeNodeData } from '@/components/NeumorphismTree'
import { useTheme } from '@/composables/useTheme'
import type { Theme } from '@/composables/useTheme'

export interface UseDocLayoutOptions {
  /** 文档树根节点 */
  root: ProDocNode
  /** 初始选中的文档路径 */
  initialPath?: string
}

export interface UseDocLayoutReturn {
  /** 当前选中的路径 */
  selectedPath: Ref<string>
  /** 选中的 keys（用于 Tree 组件 v-model） */
  selectedKeys: Ref<string[]>
  /** 展开的 keys */
  expandedKeys: Ref<string[]>
  /** 树形数据 */
  treeData: ComputedRef<TreeNodeData[]>
  /** 当前选中的节点 */
  selectedNode: ComputedRef<ProDocNode | undefined>
  /** 当前显示的节点（默认第一个子节点） */
  displayNode: ComputedRef<ProDocNode | undefined>
  /** 文档树索引 */
  docTree: ComputedRef<ReturnType<typeof createDocTree>>
  /** 主题双向绑定模型 */
  themeModel: WritableComputedRef<Theme>
  /** 处理树节点选择 */
  handleTreeSelect: (key: string) => void
  /** 处理文档链接点击 */
  handleDocLink: (emit: (e: 'docLink', path: string) => void, path: string) => void
}

/**
 * Doc 布局共享逻辑 — 管理树节点选择、主题、节点查找
 */
export function useDocLayout(options: UseDocLayoutOptions): UseDocLayoutReturn {
  const { root, initialPath } = options

  const selectedPath = ref(initialPath ?? root.children[0]?.path ?? '')
  const expandedKeys = ref<string[]>([])

  const { theme, setTheme } = useTheme()
  const themeModel = computed<Theme>({
    get: () => theme.value,
    set: val => setTheme(val),
  })

  const treeData = computed(() => root.children.map(nodeToTreeData) as TreeNodeData[])
  const selectedKeys = ref<string[]>(selectedPath.value ? [selectedPath.value] : [])

  watch(selectedPath, path => {
    selectedKeys.value = path ? [path] : []
  })

  /** 预构建文档树索引 — O(1) 查找 */
  const docTree = computed(() => createDocTree(root))

  const selectedNode = computed<ProDocNode | undefined>(() => {
    if (!selectedPath.value) return undefined
    return docTree.value.findByPath(selectedPath.value)
  })

  const displayNode = computed<ProDocNode | undefined>(
    () => selectedNode.value || root.children[0]
  )

  function handleTreeSelect(key: string) {
    selectedPath.value = key
  }

  function handleDocLink(emit: (e: 'docLink', path: string) => void, path: string) {
    selectedPath.value = path
    emit('docLink', path)
  }

  watch(
    () => initialPath,
    newPath => {
      if (newPath) selectedPath.value = newPath
    }
  )

  return {
    selectedPath,
    selectedKeys,
    expandedKeys,
    treeData,
    selectedNode,
    displayNode,
    docTree,
    themeModel,
    handleTreeSelect,
    handleDocLink,
  }
}
