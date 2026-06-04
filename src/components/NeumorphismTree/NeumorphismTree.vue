<script setup lang="ts">
import { computed } from 'vue'
import { useTree } from '@/composables/useTree'
import type { TreeNodeData } from '@/composables/useTree'
import NeumorphismTreeNode from './NeumorphismTreeNode.vue'

export type { TreeNodeData }

export interface NeumorphismTreeProps {
  data: TreeNodeData[]
  selectedKeys?: string[]
  expandedKeys?: string[]
  searchPlaceholder?: string
  showSearch?: boolean
  multiple?: boolean
}

const props = withDefaults(defineProps<NeumorphismTreeProps>(), {
  selectedKeys: () => [],
  expandedKeys: () => [],
  searchPlaceholder: '搜索...',
  showSearch: false,
  multiple: false,
})

const emit = defineEmits<{
  (e: 'update:selectedKeys', value: string[]): void
  (e: 'update:expandedKeys', value: string[]): void
  (e: 'node-click', node: TreeNodeData): void
  (e: 'node-select', key: string): void
}>()

// Use headless tree composable for all behavioral logic
const selectedKeysRef = computed({
  get: () => props.selectedKeys,
  set: (val) => emit('update:selectedKeys', val),
})

const expandedKeysRef = computed({
  get: () => props.expandedKeys,
  set: (val) => emit('update:expandedKeys', val),
})

const {
  localExpandedKeys,
  localSelectedKeys,
  searchText: searchTextRef,
  toggleExpand,
  select,
  findNode,
  expandAll,
  collapseAll,
  onSearchInput,
} = useTree({
  data: computed(() => props.data),
  selectedKeys: selectedKeysRef,
  expandedKeys: expandedKeysRef,
  multiple: computed(() => props.multiple),
})

const searchText = computed({
  get: () => searchTextRef.value,
  set: (val) => { searchTextRef.value = val },
})

// Wrap select to emit events
function handleSelect(key: string) {
  select(key)
  emit('node-select', key)
  const node = findNode(props.data, key)
  if (node) emit('node-click', node)
}

// Wrap toggle to sync
function handleToggleExpand(key: string) {
  toggleExpand(key)
  emit('update:expandedKeys', [...localExpandedKeys.value])
}

// Sync expanded on expand/collapse all
function handleExpandAll() {
  expandAll()
  emit('update:expandedKeys', [...localExpandedKeys.value])
}

function handleCollapseAll() {
  collapseAll()
  emit('update:expandedKeys', [])
}

const classList = computed(() => ['nm-tree'])
</script>

<template>
  <div :class="classList" role="tree" aria-label="树形导航">
    <!-- Search bar -->
    <div v-if="showSearch" class="nm-tree__search">
      <svg class="nm-tree__search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input
        type="text"
        class="nm-tree__search-input"
        :placeholder="searchPlaceholder"
        :value="searchText"
        @input="onSearchInput(($event.target as HTMLInputElement).value)"
      >
      <button
        v-if="searchText"
        type="button"
        class="nm-tree__search-clear"
        aria-label="清除搜索"
        @click="searchText = ''"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- Expand/Collapse all -->
    <div v-if="data.length > 0" class="nm-tree__actions">
      <button type="button" class="nm-tree__action-btn" @click="handleExpandAll">全部展开</button>
      <button type="button" class="nm-tree__action-btn" @click="handleCollapseAll">全部折叠</button>
    </div>

    <!-- Tree nodes -->
    <!-- @slot Custom node rendering via NeumorphismTreeNode's node slot -->
    <ul class="nm-tree__list" role="group">
      <NeumorphismTreeNode
        v-for="node in data"
        :key="node.key"
        :node="node"
        :selected-keys="localSelectedKeys"
        :expanded-keys="localExpandedKeys"
        :search-text="searchText"
        :level="0"
        @toggle-expand="handleToggleExpand"
        @select="handleSelect"
      />
    </ul>

    <!-- Empty state -->
    <div v-if="data.length === 0" class="nm-tree__empty">
      暂无数据
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tree {
  @include nm-theme-transition;
}

// Search
.nm-tree__search {
  position: relative;
  margin-bottom: 8px;
}

.nm-tree__search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--nm-text-placeholder);
  pointer-events: none;
}

.nm-tree__search-input {
  width: 100%;
  padding: 7px 32px 7px 32px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  font-size: 13px;
  outline: none;
  @include nm-inset-strong(2px, 4px);
  @include nm-theme-transition;
  box-sizing: border-box;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:focus {
    @include nm-inset-deep(3px, 6px);
  }
}

.nm-tree__search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  border-radius: 50%;
  padding: 0;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: var(--nm-text-secondary);
  }
}

// Actions
.nm-tree__actions {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  padding: 0 4px;
}

.nm-tree__action-btn {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color var(--nm-transition-fast);

  &:hover {
    color: var(--nm-primary-color);
  }
}

// List
.nm-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

// Empty
.nm-tree__empty {
  text-align: center;
  padding: 24px 12px;
  font-size: 13px;
  color: var(--nm-text-placeholder);
}
</style>
