<script setup lang="ts">
import { ref, computed } from 'vue'

export interface ChatFoldProps {
  /** 受控展开态（传入则受控，配合 update:open 使用） */
  open?: boolean
  /** 非受控初始展开态（默认 false） */
  defaultOpen?: boolean
  /** 凹陷详情井（默认）或凸起卡片 */
  sunk?: boolean
  /** 是否有可展开内容；false 时头部渲染为静态行（无箭头、不可点击、无折叠体） */
  expandable?: boolean
}

const props = withDefaults(defineProps<ChatFoldProps>(), {
  open: undefined,
  defaultOpen: false,
  sunk: true,
  expandable: true,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'toggle', value: boolean): void
}>()

// 受控 / 非受控混合：open 未传入时内部自维护
const innerOpen = ref(props.defaultOpen)
const isOpen = computed(() => props.open ?? innerOpen.value)

function toggle(): void {
  if (!props.expandable) return
  const next = !isOpen.value
  if (props.open === undefined) innerOpen.value = next
  emit('update:open', next)
  emit('toggle', next)
}
</script>

<template>
  <div
    class="nm-chat-fold"
    :class="[
      sunk ? 'nm-chat-fold--sunk' : 'nm-chat-fold--raised',
      { 'nm-chat-fold--open': isOpen },
    ]"
  >
    <div class="nm-chat-fold__head">
      <button
        v-if="expandable"
        type="button"
        class="nm-chat-fold__trigger"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <span class="nm-chat-fold__caret" aria-hidden="true">{{ isOpen ? '▾' : '▸' }}</span>
        <slot name="head" :open="isOpen" />
      </button>
      <div v-else class="nm-chat-fold__head-static">
        <slot name="head" :open="isOpen" />
      </div>
      <!-- 独立交互元素（复制等）放 actions，不嵌进触发按钮 -->
      <slot name="actions" />
    </div>
    <div v-if="$slots.subhead" class="nm-chat-fold__subhead">
      <slot name="subhead" />
    </div>
    <div v-if="expandable && isOpen" class="nm-chat-fold__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chat-fold {
  border-radius: var(--nm-border-radius-md);
  padding: var(--nm-spacing-sm) var(--nm-spacing-md);

  &--sunk {
    background-color: var(--nm-chat-sunk-bg);
    @include nm-inset(2px, 5px);
  }

  &--raised {
    background-color: var(--nm-surface-color);
    @include nm-raised(2px, 5px);
  }
}

.nm-chat-fold__head {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
}

.nm-chat-fold__trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--nm-spacing-sm);
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nm-chat-fold__head-static {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--nm-spacing-sm);
}

.nm-chat-fold__caret {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
}

.nm-chat-fold__body {
  margin-top: var(--nm-spacing-sm);
}
</style>
