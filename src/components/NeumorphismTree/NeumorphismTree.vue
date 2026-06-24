<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useTree } from '@/composables/useTree'
import { useNeumorphismSetup } from '@/extensions/createComponent'
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

const { config, resolveProp } = useNeumorphismSetup()

const resolvedShowSearch = computed(() =>
  resolveProp(props.showSearch, config.value.tree?.showSearch, false)
)
const resolvedMultiple = computed(() =>
  resolveProp(props.multiple, config.value.tree?.multiple, false)
)
const resolvedSearchPlaceholder = computed(() =>
  resolveProp(props.searchPlaceholder, config.value.tree?.searchPlaceholder, '搜索...')
)

const emit = defineEmits<{
  (e: 'update:selectedKeys', value: string[]): void
  (e: 'update:expandedKeys', value: string[]): void
  (e: 'node-click', node: TreeNodeData): void
  (e: 'node-select', key: string): void
}>()

// Use headless tree composable for all behavioral logic
const selectedKeysRef = computed({
  get: () => props.selectedKeys,
  set: val => emit('update:selectedKeys', val),
})

const expandedKeysRef = computed({
  get: () => props.expandedKeys,
  set: val => emit('update:expandedKeys', val),
})

const {
  localExpandedKeys,
  localSelectedKeys,
  searchText: searchTextRef,
  focusedKey,
  toggleExpand,
  select,
  findNode,
  expandAll,
  collapseAll,
  onSearchInput,
  handleKeydown,
} = useTree({
  data: computed(() => props.data),
  selectedKeys: selectedKeysRef,
  expandedKeys: expandedKeysRef,
  multiple: computed(() => resolvedMultiple.value),
})

// Expose searchText ref directly for template binding
const searchText = searchTextRef

// Wrap select to emit events
function handleSelect(key: string) {
  select(key)
  emit('node-select', key)
  const node = findNode(props.data, key)
  if (node) emit('node-click', node)
}

const { t } = useLocale()

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

const activeDescendant = computed(() =>
  focusedKey.value ? `nm-tree-node-${focusedKey.value}` : undefined
)

const classList = computed(() => ['nm-tree'])
</script>

<template>
  <div
    :class="classList"
    role="tree"
    tabindex="0"
    :aria-label="t('treeLabel')"
    :aria-activedescendant="activeDescendant"
    @keydown="handleKeydown"
  >
    <!-- Search bar -->
    <div v-if="resolvedShowSearch" class="nm-tree__search">
      <svg
        class="nm-tree__search-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input
        type="text"
        class="nm-tree__search-input"
        :placeholder="resolvedSearchPlaceholder"
        :value="searchText"
        @input="onSearchInput(($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="searchText"
        type="button"
        class="nm-tree__search-clear"
        :aria-label="t('treeClearSearch')"
        @click="onSearchInput('')"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <!-- Expand/Collapse all -->
    <div v-if="data.length > 0" class="nm-tree__actions">
      <button type="button" class="nm-tree__action-btn" @click="handleExpandAll">
        {{ t('treeExpandAll') }}
      </button>
      <button type="button" class="nm-tree__action-btn" @click="handleCollapseAll">
        {{ t('treeCollapseAll') }}
      </button>
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
        :focused-key="focusedKey"
        :level="0"
        @toggle-expand="handleToggleExpand"
        @select="handleSelect"
      />
    </ul>

    <!-- Empty state -->
    <div v-if="data.length === 0" class="nm-tree__empty">{{ t('treeEmpty') }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tree {
  @include nm-theme-transition;
  overflow-x: auto;
}

// Search
.nm-tree__search {
  position: relative;
  margin-bottom: var(--nm-spacing-sm);
}

.nm-tree__search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: var(--nm-spacing-md);
  height: var(--nm-spacing-md);
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
  font-size: var(--nm-font-md);
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
  border-radius: var(--nm-border-radius-full);
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
  gap: var(--nm-spacing-xs);
  margin-bottom: 6px;
  padding: 0 4px;
}

.nm-tree__action-btn {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--nm-border-radius-xs);
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
  min-width: max-content;
}

// Empty
.nm-tree__empty {
  text-align: center;
  padding: var(--nm-spacing-lg) 12px;
  font-size: var(--nm-font-md);
  color: var(--nm-text-placeholder);
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
