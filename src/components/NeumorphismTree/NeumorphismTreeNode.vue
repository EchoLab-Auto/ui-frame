<script setup lang="ts">
import { computed } from 'vue'
// Self-import for recursive component reference in <script setup>
import NeumorphismTreeNode from './NeumorphismTreeNode.vue'

export interface TreeNodeData {
  key: string
  label: string
  children?: TreeNodeData[]
  disabled?: boolean
  icon?: string
}

export interface NeumorphismTreeNodeProps {
  node: TreeNodeData
  selectedKeys: string[]
  expandedKeys: string[]
  searchText: string
  level: number
}

const props = withDefaults(defineProps<NeumorphismTreeNodeProps>(), {
  level: 0,
})

const emit = defineEmits<{
  (e: 'toggle-expand', key: string): void
  (e: 'select', key: string): void
}>()

const isExpanded = computed(() => props.expandedKeys.includes(props.node.key))
const isSelected = computed(() => props.selectedKeys.includes(props.node.key))
const hasChildren = computed(() => !!props.node.children?.length)

const matchesSearch = computed(() => {
  if (!props.searchText.trim()) return true
  const lower = props.searchText.toLowerCase()
  if (props.node.label.toLowerCase().includes(lower)) return true
  if (props.node.children?.some((c) => matchesNodeSearch(c, lower))) return true
  return false
})

function matchesNodeSearch(node: TreeNodeData, search: string): boolean {
  if (node.label.toLowerCase().includes(search)) return true
  return node.children?.some((c) => matchesNodeSearch(c, search)) ?? false
}

function handleToggle() {
  if (hasChildren.value) {
    emit('toggle-expand', props.node.key)
  }
}

function handleSelect() {
  if (!props.node.disabled) {
    emit('select', props.node.key)
  }
}

const collapseStyle = computed(() => {
  if (!isExpanded.value) {
    return { height: '0px', opacity: '0' }
  }
  return {}
})
</script>

<template>
  <li
    v-if="matchesSearch"
    class="nm-tree-node"
    :class="{
      'nm-tree-node--selected': isSelected,
      'nm-tree-node--disabled': node.disabled,
      'nm-tree-node--leaf': !hasChildren,
      'nm-tree-node--expanded': isExpanded,
    }"
    :style="{ paddingLeft: `${level * 20 + 4}px` }"
    role="treeitem"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-selected="isSelected"
    :aria-disabled="node.disabled"
  >
    <div
      class="nm-tree-node__row"
      :class="{ 'nm-tree-node__row--clickable': !node.disabled }"
      @click="handleSelect"
    >
      <!-- Expand/collapse toggle -->
      <button
        v-if="hasChildren"
        type="button"
        class="nm-tree-node__toggle"
        :class="{ 'nm-tree-node__toggle--expanded': isExpanded }"
        :aria-label="isExpanded ? '折叠' : '展开'"
        @click.stop="handleToggle"
      >
        <svg
          class="nm-tree-node__chevron"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- Placeholder when no children (keeps alignment) -->
      <span v-else class="nm-tree-node__toggle-placeholder" />

      <!-- Icon -->
      <span v-if="node.icon" class="nm-tree-node__icon">{{ node.icon }}</span>

      <!-- @slot Custom node label rendering. Bind: node, selected, expanded, level -->
      <slot
        name="node-label"
        :node="node"
        :selected="isSelected"
        :expanded="isExpanded"
        :level="level"
      >
        <!-- Label with search highlight -->
        <span class="nm-tree-node__label">
          <template v-if="searchText.trim()">
            <span
              v-for="(part, i) in node.label.split(new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))"
              :key="i"
              :class="{ 'nm-tree-node__label--highlight': part.toLowerCase() === searchText.toLowerCase() }"
            >{{ part }}</span>
          </template>
          <template v-else>{{ node.label }}</template>
        </span>
      </slot>
    </div>

    <!-- Children -->
    <ul v-if="hasChildren" class="nm-tree-node__children" :style="collapseStyle">
      <NeumorphismTreeNode
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :selected-keys="selectedKeys"
        :expanded-keys="expandedKeys"
        :search-text="searchText"
        :level="level + 1"
        @toggle-expand="(k) => emit('toggle-expand', k)"
        @select="(k) => emit('select', k)"
      />
    </ul>
  </li>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tree-node {
  list-style: none;
  margin: 0;
  @include nm-theme-transition;

  &--disabled {
    opacity: 0.45;
  }
}

.nm-tree-node__row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: var(--nm-border-radius-sm);
  transition: background-color var(--nm-transition-fast), color var(--nm-transition-fast);
  cursor: default;

  &--clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--nm-surface-raised);
    }
  }
}

.nm-tree-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  border-radius: 4px;
  padding: 0;
  flex-shrink: 0;
  transition: color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-text-primary);
  }
}

.nm-tree-node__toggle-placeholder {
  width: 20px;
  flex-shrink: 0;
}

.nm-tree-node__chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1.0);
  transform: rotate(0deg);
}

.nm-tree-node__toggle--expanded .nm-tree-node__chevron {
  transform: rotate(90deg);
}

.nm-tree-node__icon {
  font-size: 14px;
  flex-shrink: 0;
  line-height: 1;
}

.nm-tree-node__label {
  font-size: 13px;
  color: var(--nm-text-secondary);
  transition: color var(--nm-transition-fast);
  line-height: 1.5;
}

.nm-tree-node__label--highlight {
  color: var(--nm-primary-color);
  font-weight: 600;
  background-color: rgba(108, 122, 224, 0.12);
  border-radius: 2px;
  padding: 0 1px;
}

.nm-tree-node--selected > .nm-tree-node__row {
  .nm-tree-node__label {
    color: var(--nm-primary-color);
    font-weight: 600;
  }
}

.nm-tree-node--selected > .nm-tree-node__row {
  background-color: rgba(108, 122, 224, 0.08);
}

.nm-tree-node__children {
  overflow: hidden;
  transition: height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1.0), opacity 0.3s ease;
}
</style>
