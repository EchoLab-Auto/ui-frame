<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import ChatFold from './ChatFold.vue'

export interface ChatReasoningBlockProps {
  /** 推理分段 */
  parts: string[]
  /** 已格式化的时间文本 */
  time?: string
  /** 初始是否展开（默认 true —— 流式进行中可见） */
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<ChatReasoningBlockProps>(), {
  time: '',
  defaultOpen: true,
})

const { t } = useLocale()

const title = computed(() => t('chatReasoning', { count: props.parts.length }))
</script>

<template>
  <ChatFold :default-open="defaultOpen" class="nm-chat-reasoning">
    <template #head>
      <span class="nm-chat-reasoning__title">{{ title }}</span>
      <span v-if="time" class="nm-chat-reasoning__time">· {{ time }}</span>
    </template>
    <p v-for="(part, index) in parts" :key="index" class="nm-chat-reasoning__part">{{ part }}</p>
  </ChatFold>
</template>

<style scoped lang="scss">
.nm-chat-reasoning__title {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
  transition: color 0.2s ease;

  :hover > & {
    color: var(--nm-text-secondary);
  }
}

.nm-chat-reasoning__time {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-disabled);
}

.nm-chat-reasoning__part {
  margin: var(--nm-spacing-xs) 0 0;
  color: var(--nm-text-secondary);
  font-size: var(--nm-font-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-reasoning__title {
    transition: none;
  }
}
</style>
