<script setup lang="ts">
import { computed } from 'vue'
import { useVirtualList } from '@/composables/useVirtualList'

export interface NeumorphismVirtualListProps {
  /** Data array to render virtually */
  items?: any[]
  /** Fixed item height in pixels */
  itemHeight?: number
  /** Number of extra items rendered above and below the viewport */
  overscan?: number
  /** Field name used as the `:key` in the v-for loop */
  keyField?: string
}

const props = withDefaults(defineProps<NeumorphismVirtualListProps>(), {
  items: () => [],
  itemHeight: 40,
  overscan: 5,
  keyField: 'id',
})

const { containerRef, visibleItems, totalHeight, offsetY, scrollTo, handleScroll, startIndex } =
  useVirtualList({
    items: computed(() => props.items),
    itemHeight: computed(() => props.itemHeight),
    overscan: computed(() => props.overscan),
  })

defineExpose({ scrollTo })
</script>

<template>
  <div ref="containerRef" class="nm-virtual-list" @scroll="handleScroll">
    <div class="nm-virtual-list__spacer" :style="{ height: totalHeight + 'px' }">
      <div class="nm-virtual-list__visible" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="(item, i) in visibleItems"
          :key="item[keyField] ?? startIndex + i"
          class="nm-virtual-list__item"
        >
          <!-- @slot Item rendering. Bind: item, index -->
          <slot name="default" :item="item" :index="startIndex + i" />
        </div>
      </div>
    </div>
    <div v-if="visibleItems.length === 0" class="nm-virtual-list__empty">
      <!-- @slot Empty state when items array is empty -->
      <slot name="empty" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-virtual-list {
  position: relative;
  overflow-y: auto;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 12px);
  @include nm-theme-transition;
}

.nm-virtual-list__spacer {
  position: relative;
  width: 100%;
}

.nm-virtual-list__visible {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.nm-virtual-list__item {
  box-sizing: border-box;
}

.nm-virtual-list__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-base);
}
</style>
