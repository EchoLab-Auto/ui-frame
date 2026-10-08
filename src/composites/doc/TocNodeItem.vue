<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import type { TocNode } from './useMarkdownToc'

const props = defineProps<{
  node: TocNode
  activeHeading: string
  collapsedGroups: Set<string>
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'select', id: string): void
}>()

const { t } = useLocale()

const isActive = computed(() => props.activeHeading === props.node.id)
const hasChildren = computed(() => props.node.children.length > 0)
const isCollapsed = computed(() => props.collapsedGroups.has(props.node.id))

function handleToggle(e: Event) {
  e.stopPropagation()
  emit('toggle', props.node.id)
}

function handleSelect(e: Event) {
  e.preventDefault()
  emit('select', props.node.id)
}

// 自引用递归组件：通过 import 自身实现
import TocNodeItem from './TocNodeItem.vue'
</script>

<template>
  <li
    class="neumorphism-toc-item"
    :class="{ 'has-children': hasChildren, active: isActive }"
    role="listitem"
  >
    <div class="toc-item-row">
      <button
        v-if="hasChildren"
        type="button"
        class="toc-toggle"
        :aria-expanded="!isCollapsed"
        :aria-controls="`toc-list-${node.id}`"
        :aria-label="isCollapsed ? t('markdownTocExpand') : t('markdownTocCollapse')"
        @click="handleToggle"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="isCollapsed ? 'M9 6l6 6-6 6' : 'M6 9l6 6 6-6'" />
        </svg>
      </button>
      <a
        href="#"
        :data-toc-id="node.id"
        role="button"
        :aria-current="isActive ? 'location' : undefined"
        @click="handleSelect"
      >
        <span class="toc-text">{{ node.text }}</span>
      </a>
    </div>
    <ul
      v-if="hasChildren && !isCollapsed"
      :id="`toc-list-${node.id}`"
      class="neumorphism-toc-list"
      role="list"
    >
      <TocNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-heading="activeHeading"
        :collapsed-groups="collapsedGroups"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </ul>
  </li>
</template>
