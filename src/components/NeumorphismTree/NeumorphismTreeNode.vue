<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
// Self-import for recursive component reference in <script setup>
import NeumorphismTreeNode from './NeumorphismTreeNode.vue'
import type { TreeNodeData } from '@/composables/useTree'

export interface NeumorphismTreeNodeProps {
  node: TreeNodeData
  selectedKeys: string[]
  expandedKeys: string[]
  searchText: string
  focusedKey?: string | null
  level?: number
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
const isFocused = computed(() => props.focusedKey === props.node.key)
const hasChildren = computed(() => !!props.node.children?.length)

const searchLower = computed(() => props.searchText.toLowerCase().trim())

function matchesNodeSearch(node: TreeNodeData, search: string): boolean {
  if (node.label.toLowerCase().includes(search)) return true
  return node.children?.some(c => matchesNodeSearch(c, search)) ?? false
}

const { t } = useLocale()

const matchesSearch = computed(() => {
  if (!searchLower.value) return true
  if (props.node.label.toLowerCase().includes(searchLower.value)) return true
  return props.node.children?.some(c => matchesNodeSearch(c, searchLower.value)) ?? false
})

const labelParts = computed(() => {
  if (!props.searchText.trim()) return null
  const escaped = props.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = props.node.label.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.filter(Boolean)
})

function handleToggle() {
  if (hasChildren.value) {
    emit('toggle-expand', props.node.key)
  }
}

function handleSlotToggle(event?: Event) {
  event?.stopPropagation()
  handleToggle()
}

function handleSelect() {
  if (!props.node.disabled) {
    emit('select', props.node.key)
  }
}
</script>

<template>
  <li
    v-if="matchesSearch"
    :id="`nm-tree-node-${node.key}`"
    class="nm-tree-node"
    :class="{
      'nm-tree-node--selected': isSelected,
      'nm-tree-node--disabled': node.disabled,
      'nm-tree-node--leaf': !hasChildren,
      'nm-tree-node--expanded': isExpanded,
      'nm-tree-node--focused': isFocused,
    }"
    :style="{ paddingLeft: `calc(${level} * var(--nm-tree-node-indent, 8px) + 4px)` }"
    role="treeitem"
    tabindex="-1"
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
        :aria-label="isExpanded ? t('treeCollapse') : t('treeExpand')"
        @click.stop="handleToggle"
      >
        <svg
          class="nm-tree-node__chevron"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <!-- Placeholder when no children (keeps alignment) -->
      <span v-else class="nm-tree-node__toggle-placeholder" />

      <!-- Icon -->
      <span v-if="node.icon" class="nm-tree-node__icon">{{ node.icon }}</span>

      <!-- @slot Custom node label rendering. Bind: node, selected, expanded, level, select, toggle -->
      <slot
        name="node-label"
        :node="node"
        :selected="isSelected"
        :expanded="isExpanded"
        :level="level"
        :select="handleSelect"
        :toggle="handleSlotToggle"
      >
        <!-- Label with search highlight -->
        <span class="nm-tree-node__label">
          <template v-if="labelParts">
            <span
              v-for="(part, i) in labelParts"
              :key="i"
              :class="{ 'nm-tree-node__label--highlight': part.toLowerCase() === searchLower }"
              >{{ part }}</span
            >
          </template>
          <template v-else>{{ node.label }}</template>
        </span>
      </slot>
    </div>

    <!-- Children -->
    <ul
      v-if="hasChildren"
      class="nm-tree-node__children"
      :class="{ 'nm-tree-node__children--collapsed': !isExpanded }"
    >
      <div class="nm-tree-node__children-wrapper">
        <NeumorphismTreeNode
          v-for="child in node.children"
          :key="child.key"
          :node="child"
          :selected-keys="selectedKeys"
          :expanded-keys="expandedKeys"
          :search-text="searchText"
          :focused-key="focusedKey"
          :level="level + 1"
          @toggle-expand="k => emit('toggle-expand', k)"
          @select="k => emit('select', k)"
        />
      </div>
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

  &--focused > .nm-tree-node__row {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 2px;
  }
}

.nm-tree-node__row {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  padding: 5px 8px;
  white-space: nowrap;
  border-radius: var(--nm-border-radius-sm);
  transition:
    background-color 0.25s $nm-ease-ambient,
    color 0.25s $nm-ease-ambient,
    box-shadow 0.3s $nm-ease-spring,
    transform 0.25s $nm-ease-spring;
  cursor: default;

  &--clickable {
    cursor: pointer;

    @media (hover: hover) {
      &:hover {
        background-color: var(--nm-surface-raised);
        transform: translateX(2px);
        box-shadow:
          2px 2px 4px var(--nm-shadow-dark),
          -1px -1px 3px var(--nm-shadow-light);
      }
    }

    &:active {
      transform: translateX(1px) scale(0.98);
      transition:
        transform 0.1s $nm-ease-compress,
        box-shadow 0.1s $nm-ease-compress;
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
  border-radius: var(--nm-border-radius-xs);
  padding: 0;
  flex-shrink: 0;
  transition:
    color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring,
    background-color 0.25s $nm-ease-ambient;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-text-primary);
      background-color: var(--nm-surface-raised);
      transform: scale(1.15);
    }
  }

  &:active {
    transform: scale(0.9);
    transition: transform 0.1s $nm-ease-compress;
  }
}

.nm-tree-node__toggle-placeholder {
  width: 20px;
  flex-shrink: 0;
}

.nm-tree-node__chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.3s $nm-ease-spring;
  transform: rotate(0deg);
}

.nm-tree-node__toggle--expanded .nm-tree-node__chevron {
  transform: rotate(90deg);
}

.nm-tree-node__icon {
  font-size: var(--nm-font-base);
  flex-shrink: 0;
  line-height: 1;
}

.nm-tree-node__label {
  font-size: var(--nm-font-md);
  color: var(--nm-text-secondary);
  transition: color 0.25s $nm-ease-ambient;
  line-height: 1.5;
  white-space: nowrap;
}

.nm-tree-node__label--highlight {
  color: var(--nm-primary-color);
  font-weight: 600;
  background-color: color-mix(in srgb, var(--nm-primary-color) 12%, transparent);
  border-radius: 2px;
  padding: 0 1px;
  animation: nm-tree-highlight-pop 0.35s $nm-ease-bounce;
}

@keyframes nm-tree-highlight-pop {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  60% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.nm-tree-node--selected > .nm-tree-node__row {
  .nm-tree-node__label {
    color: var(--nm-primary-color);
    font-weight: 600;
  }
}

.nm-tree-node--selected > .nm-tree-node__row {
  background-color: color-mix(in srgb, var(--nm-primary-color) 8%, transparent);
}

.nm-tree-node__children {
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 0.4s $nm-ease-spring,
    opacity 0.35s $nm-ease-ambient;

  &--collapsed {
    grid-template-rows: 0fr;
    opacity: 0;
  }
}

.nm-tree-node__children-wrapper {
  min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .nm-tree-node__row,
  .nm-tree-node__toggle,
  .nm-tree-node__chevron,
  .nm-tree-node__label,
  .nm-tree-node__children {
    transition: none;
  }
  .nm-tree-node__label--highlight {
    animation: none;
  }
}
</style>
